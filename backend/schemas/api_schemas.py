from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class LanguageEnum(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"
    GO = "go"
    RUST = "rust"
    HTML = "html"
    CSS = "css"
    SCSS = "scss"
    JSON = "json"
    XML = "xml"
    YAML = "yaml"
    MARKDOWN = "markdown"
    SQL = "sql"
    SHELL = "shell"
    PLAINTEXT = "plaintext"

class FileTypeEnum(str, Enum):
    FILE = "file"
    DIRECTORY = "directory"

class Position(BaseModel):
    line: int = Field(..., description="Line number (1-based)")
    character: int = Field(..., description="Character position in line (0-based)")

class Range(BaseModel):
    start_line_number: int = Field(..., description="Start line number")
    start_column: int = Field(..., description="Start column number")
    end_line_number: int = Field(..., description="End line number")
    end_column: int = Field(..., description="End column number")

class CodeCompletion(BaseModel):
    text: str = Field(..., description="Completion text")
    range: Range = Field(..., description="Range to replace")
    kind: str = Field(..., description="Completion kind")
    detail: Optional[str] = Field(None, description="Additional detail")
    documentation: Optional[str] = Field(None, description="Documentation")
    score: Optional[float] = Field(None, description="Confidence score")

class CompletionRequest(BaseModel):
    code: str = Field(..., description="Current code content")
    language: LanguageEnum = Field(..., description="Programming language")
    position: Position = Field(..., description="Cursor position")
    context: Optional[str] = Field(None, description="Additional context")
    max_completions: Optional[int] = Field(10, description="Maximum number of completions")

class CompletionResponse(BaseModel):
    completions: List[CodeCompletion] = Field(..., description="List of code completions")
    processing_time: float = Field(..., description="Processing time in milliseconds")

class ChatMessageType(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    id: str = Field(..., description="Message ID")
    type: ChatMessageType = Field(..., description="Message type")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")
    file_context: Optional[str] = Field(None, description="File context")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    context: Optional[str] = Field(None, description="Additional context")
    file_path: Optional[str] = Field(None, description="Current file path")

class ChatResponse(BaseModel):
    id: str = Field(..., description="Response ID")
    type: ChatMessageType = Field(..., description="Response type")
    content: str = Field(..., description="Response content")
    timestamp: datetime = Field(..., description="Response timestamp")
    file_context: Optional[str] = Field(None, description="File context")

class FileNode(BaseModel):
    name: str = Field(..., description="File/directory name")
    path: str = Field(..., description="Full path")
    type: FileTypeEnum = Field(..., description="File or directory")
    children: Optional[List['FileNode']] = Field(None, description="Child nodes")
    size: Optional[int] = Field(None, description="File size in bytes")
    modified: Optional[datetime] = Field(None, description="Last modified time")

FileNode.model_rebuild()

class FileCreateRequest(BaseModel):
    path: str = Field(..., description="File path")
    content: Optional[str] = Field("", description="File content")

class FileContentResponse(BaseModel):
    path: str = Field(..., description="File path")
    content: str = Field(..., description="File content")
    language: LanguageEnum = Field(..., description="Programming language")
    last_modified: datetime = Field(..., description="Last modified time")
    size: int = Field(..., description="File size in bytes")

class ModelConfigRequest(BaseModel):
    model_name: Optional[str] = Field(None, description="Model name")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Temperature")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens")
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Top-p sampling")
    frequency_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0, description="Frequency penalty")
    presence_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0, description="Presence penalty")

class ModelConfigResponse(BaseModel):
    model_name: str = Field(..., description="Model name")
    temperature: float = Field(..., description="Temperature")
    max_tokens: int = Field(..., description="Maximum tokens")
    top_p: float = Field(..., description="Top-p sampling")
    frequency_penalty: float = Field(..., description="Frequency penalty")
    presence_penalty: float = Field(..., description="Presence penalty")
    is_sensorless: bool = Field(..., description="Whether model is in sensorless mode")

class TrainingStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TrainingConfigRequest(BaseModel):
    dataset_path: str = Field(..., description="Path to training dataset")
    output_dir: str = Field(..., description="Output directory for trained model")
    epochs: int = Field(3, ge=1, le=50, description="Number of training epochs")
    batch_size: int = Field(4, ge=1, le=32, description="Training batch size")
    learning_rate: float = Field(5e-5, ge=1e-6, le=1e-3, description="Learning rate")
    max_length: int = Field(512, ge=128, le=2048, description="Maximum sequence length")
    warmup_steps: int = Field(100, ge=0, description="Warmup steps")
    logging_steps: int = Field(10, ge=1, description="Logging steps")
    save_steps: int = Field(500, ge=1, description="Save steps")
    evaluation_strategy: str = Field("steps", description="Evaluation strategy")
    sensorless_mode: bool = Field(True, description="Train in sensorless mode")

class TrainingStatusResponse(BaseModel):
    job_id: str = Field(..., description="Training job ID")
    status: TrainingStatus = Field(..., description="Training status")
    progress: float = Field(..., ge=0.0, le=100.0, description="Training progress percentage")
    current_epoch: Optional[int] = Field(None, description="Current epoch")
    total_epochs: Optional[int] = Field(None, description="Total epochs")
    current_step: Optional[int] = Field(None, description="Current step")
    total_steps: Optional[int] = Field(None, description="Total steps")
    loss: Optional[float] = Field(None, description="Current loss")
    eval_loss: Optional[float] = Field(None, description="Evaluation loss")
    start_time: Optional[datetime] = Field(None, description="Training start time")
    end_time: Optional[datetime] = Field(None, description="Training end time")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class ModelPerformance(BaseModel):
    perplexity: float = Field(..., description="Model perplexity")
    accuracy: float = Field(..., description="Model accuracy")
    bleu_score: float = Field(..., description="BLEU score for code generation")
    code_execution_success: float = Field(..., description="Code execution success rate")
    latency_ms: float = Field(..., description="Average response latency in milliseconds")
    throughput_tokens_per_second: float = Field(..., description="Throughput in tokens per second")

class SensorlessConversionResponse(BaseModel):
    success: bool = Field(..., description="Whether conversion was successful")
    message: str = Field(..., description="Status message")
    original_parameters: Optional[int] = Field(None, description="Original model parameters")
    new_parameters: Optional[int] = Field(None, description="New model parameters after conversion")
    compression_ratio: Optional[float] = Field(None, description="Compression ratio achieved")
    performance_impact: Optional[float] = Field(None, description="Performance impact percentage")

class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    model_status: bool = Field(..., description="Model availability status")
    version: str = Field(..., description="API version")
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(..., description="Error timestamp")