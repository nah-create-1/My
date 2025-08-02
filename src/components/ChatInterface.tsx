import React, { useState, useEffect, useRef } from 'react'
import { Send, X, Settings, Bot, User, Loader2 } from 'lucide-react'
import { AIService } from '../services/AIService'
import { ChatMessage } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface ChatInterfaceProps {
  currentFile: string | null
  onClose: () => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentFile,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const history = await AIService.getChatHistory()
      setMessages(history)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      fileContext: currentFile || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const aiResponse = await AIService.sendChatMessage(
        inputValue, 
        currentFile || undefined
      )
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessage = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .split('\n').map((line, i) => 
        line.startsWith('```') ? `<pre class="bg-gray-800 p-2 rounded mt-2">${line.slice(3)}</pre>` : line
      ).join('<br>')
  }

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`p-2 rounded-full ${
            isUser ? 'bg-editor-accent' : isSystem ? 'bg-red-600' : 'bg-green-600'
          }`}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
          <div className={`p-3 rounded-lg ${
            isUser 
              ? 'bg-editor-accent text-white' 
              : isSystem 
                ? 'bg-red-600 text-white'
                : 'bg-editor-border text-editor-text'
          }`}>
            <div 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
            />
            {message.fileContext && (
              <div className="text-xs opacity-70 mt-1">
                Context: {message.fileContext}
              </div>
            )}
            <div className="text-xs opacity-70 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-editor-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-editor-border">
        <div className="flex items-center space-x-2">
          <Bot size={18} className="text-green-400" />
          <h3 className="text-sm font-semibold text-editor-text">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-editor-border rounded"
            title="Settings"
          >
            <Settings size={14} className="text-editor-text" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-editor-border rounded"
            title="Close Chat"
          >
            <X size={14} className="text-editor-text" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-editor-border bg-editor-bg">
          <div className="text-xs text-editor-text space-y-2">
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="text-green-400">Qwen Coder v3</span>
            </div>
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="text-yellow-400">Sensorless</span>
            </div>
            <div className="flex justify-between">
              <span>Context:</span>
              <span className="text-blue-400">
                {currentFile ? currentFile.split('/').pop() : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-editor-text opacity-60 mt-8">
            <Bot size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Start a conversation with the AI assistant</p>
            <p className="text-xs mt-2">Ask questions about your code or request help with programming tasks</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-green-600">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-lg bg-editor-border text-editor-text">
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-editor-border">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI assistant..."
            className="flex-1 p-2 bg-editor-bg border border-editor-border rounded text-editor-text text-sm resize-none focus:outline-none focus:border-editor-accent"
            rows={1}
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-editor-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
        
        {currentFile && (
          <div className="text-xs text-editor-text opacity-60 mt-2">
            Context: {currentFile}
          </div>
        )}
      </div>
    </div>
  )
}