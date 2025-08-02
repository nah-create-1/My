import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json
import aiofiles
from pathlib import Path

from schemas.api_schemas import ChatMessage, ChatResponse, ChatMessageType
from models.qwen_model import QwenCodeModel

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, qwen_model: QwenCodeModel, history_file: str = "chat_history.json"):
        self.qwen_model = qwen_model
        self.history_file = Path(history_file)
        self.chat_history: List[ChatMessage] = []
        self.max_history_length = 100

    async def process_message(
        self,
        message: str,
        context: Optional[str] = None,
        file_path: Optional[str] = None
    ) -> ChatResponse:
        """Process a user message and generate AI response"""
        try:
            # Create user message
            user_message = ChatMessage(
                id=str(uuid.uuid4()),
                type=ChatMessageType.USER,
                content=message,
                timestamp=datetime.now(),
                file_context=file_path
            )
            
            # Add to history
            self.chat_history.append(user_message)
            
            # Generate AI response
            ai_response_content = await self.qwen_model.generate_chat_response(
                message=message,
                context=context,
                file_path=file_path
            )
            
            # Create AI response message
            ai_response = ChatResponse(
                id=str(uuid.uuid4()),
                type=ChatMessageType.ASSISTANT,
                content=ai_response_content,
                timestamp=datetime.now(),
                file_context=file_path
            )
            
            # Add AI response to history
            ai_message = ChatMessage(
                id=ai_response.id,
                type=ai_response.type,
                content=ai_response.content,
                timestamp=ai_response.timestamp,
                file_context=ai_response.file_context
            )
            self.chat_history.append(ai_message)
            
            # Trim history if too long
            if len(self.chat_history) > self.max_history_length:
                self.chat_history = self.chat_history[-self.max_history_length:]
            
            # Save history
            await self._save_history()
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}")
            
            # Return error response
            error_response = ChatResponse(
                id=str(uuid.uuid4()),
                type=ChatMessageType.SYSTEM,
                content=f"Sorry, I encountered an error: {str(e)}",
                timestamp=datetime.now(),
                file_context=file_path
            )
            
            return error_response

    async def get_history(self) -> List[ChatMessage]:
        """Get chat history"""
        try:
            # Load history from file if not already loaded
            if not self.chat_history:
                await self._load_history()
            
            return self.chat_history
            
        except Exception as e:
            logger.error(f"Error getting chat history: {str(e)}")
            return []

    async def clear_history(self):
        """Clear chat history"""
        try:
            self.chat_history = []
            await self._save_history()
            logger.info("Chat history cleared")
            
        except Exception as e:
            logger.error(f"Error clearing chat history: {str(e)}")
            raise

    async def get_conversation_summary(self) -> str:
        """Get a summary of the current conversation"""
        try:
            if not self.chat_history:
                return "No conversation history"
            
            # Take last 10 messages for summary
            recent_messages = self.chat_history[-10:]
            
            conversation_text = ""
            for msg in recent_messages:
                role = "User" if msg.type == ChatMessageType.USER else "Assistant"
                conversation_text += f"{role}: {msg.content[:100]}...\n"
            
            # Generate summary using the AI model
            summary_prompt = f"""Please provide a brief summary of this conversation:

{conversation_text}

Summary (2-3 sentences):"""
            
            summary = await self.qwen_model.generate_chat_response(
                message=summary_prompt,
                context="conversation_summary"
            )
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating conversation summary: {str(e)}")
            return "Unable to generate summary"

    async def get_code_suggestions(self, code_context: str, query: str) -> str:
        """Get AI suggestions for code improvements"""
        try:
            prompt = f"""Given this code context:

```
{code_context}
```

User question: {query}

Please provide specific, actionable suggestions for improving this code. Focus on:
- Code quality and best practices
- Performance optimizations
- Bug fixes
- Readability improvements
- Architecture suggestions

Suggestions:"""

            suggestions = await self.qwen_model.generate_chat_response(
                message=prompt,
                context="code_suggestions"
            )
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error getting code suggestions: {str(e)}")
            return "Unable to generate code suggestions"

    async def explain_code(self, code: str, language: str = "auto") -> str:
        """Explain what a piece of code does"""
        try:
            prompt = f"""Please explain what this {language} code does:

```{language}
{code}
```

Provide a clear, step-by-step explanation that covers:
- Overall purpose
- Key components and their roles
- Important logic or algorithms
- Potential improvements

Explanation:"""

            explanation = await self.qwen_model.generate_chat_response(
                message=prompt,
                context="code_explanation"
            )
            
            return explanation
            
        except Exception as e:
            logger.error(f"Error explaining code: {str(e)}")
            return "Unable to explain code"

    async def debug_code(self, code: str, error_message: str, language: str = "auto") -> str:
        """Help debug code with error message"""
        try:
            prompt = f"""Help debug this {language} code that's producing an error:

Code:
```{language}
{code}
```

Error message:
```
{error_message}
```

Please:
1. Identify the likely cause of the error
2. Suggest specific fixes
3. Provide corrected code if possible
4. Explain how to prevent similar errors

Debug analysis:"""

            debug_help = await self.qwen_model.generate_chat_response(
                message=prompt,
                context="code_debugging"
            )
            
            return debug_help
            
        except Exception as e:
            logger.error(f"Error debugging code: {str(e)}")
            return "Unable to provide debugging help"

    async def _load_history(self):
        """Load chat history from file"""
        try:
            if self.history_file.exists():
                async with aiofiles.open(self.history_file, 'r', encoding='utf-8') as f:
                    content = await f.read()
                    if content.strip():
                        data = json.loads(content)
                        self.chat_history = [
                            ChatMessage(
                                id=item['id'],
                                type=ChatMessageType(item['type']),
                                content=item['content'],
                                timestamp=datetime.fromisoformat(item['timestamp']),
                                file_context=item.get('file_context')
                            )
                            for item in data
                        ]
                        logger.info(f"Loaded {len(self.chat_history)} messages from history")
                        
        except Exception as e:
            logger.error(f"Error loading chat history: {str(e)}")
            self.chat_history = []

    async def _save_history(self):
        """Save chat history to file"""
        try:
            data = [
                {
                    'id': msg.id,
                    'type': msg.type.value,
                    'content': msg.content,
                    'timestamp': msg.timestamp.isoformat(),
                    'file_context': msg.file_context
                }
                for msg in self.chat_history
            ]
            
            async with aiofiles.open(self.history_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(data, indent=2))
                
        except Exception as e:
            logger.error(f"Error saving chat history: {str(e)}")

    def _get_context_for_message(self, message: str, file_path: Optional[str] = None) -> str:
        """Get relevant context for a message"""
        context_parts = []
        
        # Add recent conversation context
        if self.chat_history:
            recent_messages = self.chat_history[-5:]  # Last 5 messages
            for msg in recent_messages:
                if msg.type == ChatMessageType.USER:
                    context_parts.append(f"Previous user query: {msg.content[:100]}")
                elif msg.type == ChatMessageType.ASSISTANT:
                    context_parts.append(f"Previous assistant response: {msg.content[:100]}")
        
        # Add file context
        if file_path:
            context_parts.append(f"Current file: {file_path}")
        
        return " | ".join(context_parts) if context_parts else ""