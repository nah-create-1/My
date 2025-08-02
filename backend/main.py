from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging

from models.qwen_model import QwenCodeModel
from services.file_service import FileService
from services.chat_service import ChatService
from services.training_service import TrainingService
from schemas.api_schemas import (
    CompletionRequest,
    CompletionResponse,
    ChatRequest,
    ChatResponse,
    FileCreateRequest,
    FileContentResponse,
    TrainingConfigRequest,
    ModelConfigRequest,
    ModelConfigResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Cursor Clone API",
    description="FastAPI backend for AI-powered code editor with Qwen Coder v3",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
qwen_model = QwenCodeModel()
file_service = FileService()
chat_service = ChatService(qwen_model)
training_service = TrainingService()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    logger.info("Starting AI Cursor Clone API...")
    
    # Initialize Qwen model
    await qwen_model.initialize()
    logger.info("Qwen model initialized")
    
    # Initialize file service
    await file_service.initialize()
    logger.info("File service initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Cursor Clone API...")
    await qwen_model.cleanup()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_status": qwen_model.is_ready(),
        "version": "1.0.0"
    }

# Code completion endpoints
@app.post("/api/completions", response_model=CompletionResponse)
async def get_code_completions(request: CompletionRequest):
    """Get AI code completions for the given context"""
    try:
        start_time = datetime.now()
        
        completions = await qwen_model.get_completions(
            code=request.code,
            language=request.language,
            position=request.position,
            context=request.context
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return CompletionResponse(
            completions=completions,
            processing_time=processing_time
        )
    except Exception as e:
        logger.error(f"Error getting completions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Chat endpoints
@app.post("/api/chat", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    """Send a message to the AI assistant"""
    try:
        response = await chat_service.process_message(
            message=request.message,
            context=request.context,
            file_path=request.file_path
        )
        return response
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history")
async def get_chat_history():
    """Get chat history"""
    try:
        history = await chat_service.get_history()
        return history
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/history")
async def clear_chat_history():
    """Clear chat history"""
    try:
        await chat_service.clear_history()
        return {"message": "Chat history cleared"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# File management endpoints
@app.get("/api/files/tree")
async def get_file_tree():
    """Get the project file tree"""
    try:
        tree = await file_service.get_file_tree()
        return tree
    except Exception as e:
        logger.error(f"Error getting file tree: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/content", response_model=FileContentResponse)
async def get_file_content(path: str):
    """Get file content"""
    try:
        content = await file_service.get_file_content(path)
        return content
    except Exception as e:
        logger.error(f"Error getting file content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/save")
async def save_file_content(request: FileCreateRequest):
    """Save file content"""
    try:
        success = await file_service.save_file_content(request.path, request.content)
        if success:
            return {"message": "File saved successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save file")
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/create")
async def create_file(request: FileCreateRequest):
    """Create a new file"""
    try:
        success = await file_service.create_file(request.path, request.content or "")
        if success:
            return {"message": "File created successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create file")
    except Exception as e:
        logger.error(f"Error creating file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/delete")
async def delete_file(path: str):
    """Delete a file"""
    try:
        success = await file_service.delete_file(path)
        if success:
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete file")
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/mkdir")
async def create_directory(request: dict):
    """Create a new directory"""
    try:
        path = request.get("path")
        if not path:
            raise HTTPException(status_code=400, detail="Path is required")
        
        success = await file_service.create_directory(path)
        if success:
            return {"message": "Directory created successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create directory")
    except Exception as e:
        logger.error(f"Error creating directory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Model configuration endpoints
@app.get("/api/model/config", response_model=ModelConfigResponse)
async def get_model_config():
    """Get current model configuration"""
    try:
        config = await qwen_model.get_config()
        return config
    except Exception as e:
        logger.error(f"Error getting model config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/model/config", response_model=ModelConfigResponse)
async def update_model_config(request: ModelConfigRequest):
    """Update model configuration"""
    try:
        config = await qwen_model.update_config(request.dict())
        return config
    except Exception as e:
        logger.error(f"Error updating model config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model/performance")
async def get_model_performance():
    """Get model performance metrics"""
    try:
        performance = await qwen_model.get_performance_metrics()
        return performance
    except Exception as e:
        logger.error(f"Error getting model performance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/model/make-sensorless")
async def make_model_sensorless():
    """Convert the model to sensorless mode"""
    try:
        result = await qwen_model.make_sensorless()
        return result
    except Exception as e:
        logger.error(f"Error making model sensorless: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Training endpoints
@app.post("/api/training/start")
async def start_training(request: TrainingConfigRequest):
    """Start custom training of the model"""
    try:
        job_id = await training_service.start_training(request.dict())
        return {"job_id": job_id, "message": "Training started successfully"}
    except Exception as e:
        logger.error(f"Error starting training: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/training/status/{job_id}")
async def get_training_status(job_id: str):
    """Get training job status"""
    try:
        status = await training_service.get_training_status(job_id)
        return status
    except Exception as e:
        logger.error(f"Error getting training status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/training/stop/{job_id}")
async def stop_training(job_id: str):
    """Stop a training job"""
    try:
        success = await training_service.stop_training(job_id)
        if success:
            return {"message": "Training stopped successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to stop training")
    except Exception as e:
        logger.error(f"Error stopping training: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "completion_request":
                # Handle real-time completion requests
                try:
                    completions = await qwen_model.get_completions(
                        code=message.get("code", ""),
                        language=message.get("language", ""),
                        position=message.get("position", {}),
                        context=message.get("context")
                    )
                    
                    response = {
                        "type": "completion_response",
                        "completions": [comp.dict() for comp in completions],
                        "request_id": message.get("request_id")
                    }
                    
                    await manager.send_personal_message(response, websocket)
                except Exception as e:
                    error_response = {
                        "type": "error",
                        "message": str(e),
                        "request_id": message.get("request_id")
                    }
                    await manager.send_personal_message(error_response, websocket)
                    
            elif message.get("type") == "chat_message":
                # Handle real-time chat messages
                try:
                    chat_response = await chat_service.process_message(
                        message=message.get("message", ""),
                        context=message.get("context"),
                        file_path=message.get("file_path")
                    )
                    
                    response = {
                        "type": "chat_response",
                        "message": chat_response.dict(),
                        "request_id": message.get("request_id")
                    }
                    
                    await manager.send_personal_message(response, websocket)
                except Exception as e:
                    error_response = {
                        "type": "error",
                        "message": str(e),
                        "request_id": message.get("request_id")
                    }
                    await manager.send_personal_message(error_response, websocket)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Serve static files (for production)
if not os.getenv("DEVELOPMENT"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )