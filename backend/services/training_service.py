import asyncio
import logging
import uuid
import json
import torch
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
import shutil
from concurrent.futures import ThreadPoolExecutor

from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset, load_dataset
from peft import LoraConfig, get_peft_model, TaskType

from schemas.api_schemas import TrainingStatus, TrainingStatusResponse

logger = logging.getLogger(__name__)

class TrainingService:
    def __init__(self):
        self.training_jobs: Dict[str, Dict[str, Any]] = {}
        self.executor = ThreadPoolExecutor(max_workers=1)  # Limit to 1 training job at a time
        self.jobs_file = Path("training_jobs.json")
        
    async def initialize(self):
        """Initialize the training service"""
        try:
            # Load existing training jobs
            await self._load_jobs()
            logger.info("Training service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize training service: {str(e)}")
            raise

    async def start_training(self, config: Dict[str, Any]) -> str:
        """Start a new training job"""
        try:
            job_id = str(uuid.uuid4())
            
            training_job = {
                "job_id": job_id,
                "status": TrainingStatus.PENDING,
                "config": config,
                "progress": 0.0,
                "start_time": datetime.now().isoformat(),
                "current_epoch": 0,
                "total_epochs": config.get("epochs", 3),
                "current_step": 0,
                "total_steps": None,
                "loss": None,
                "eval_loss": None,
                "error_message": None
            }
            
            self.training_jobs[job_id] = training_job
            await self._save_jobs()
            
            # Start training in background
            asyncio.create_task(self._run_training(job_id))
            
            logger.info(f"Started training job: {job_id}")
            return job_id
            
        except Exception as e:
            logger.error(f"Error starting training: {str(e)}")
            raise

    async def get_training_status(self, job_id: str) -> TrainingStatusResponse:
        """Get the status of a training job"""
        try:
            if job_id not in self.training_jobs:
                raise ValueError(f"Training job not found: {job_id}")
            
            job = self.training_jobs[job_id]
            
            return TrainingStatusResponse(
                job_id=job_id,
                status=TrainingStatus(job["status"]),
                progress=job["progress"],
                current_epoch=job.get("current_epoch"),
                total_epochs=job.get("total_epochs"),
                current_step=job.get("current_step"),
                total_steps=job.get("total_steps"),
                loss=job.get("loss"),
                eval_loss=job.get("eval_loss"),
                start_time=datetime.fromisoformat(job["start_time"]) if job.get("start_time") else None,
                end_time=datetime.fromisoformat(job["end_time"]) if job.get("end_time") else None,
                error_message=job.get("error_message")
            )
            
        except Exception as e:
            logger.error(f"Error getting training status: {str(e)}")
            raise

    async def stop_training(self, job_id: str) -> bool:
        """Stop a running training job"""
        try:
            if job_id not in self.training_jobs:
                return False
            
            job = self.training_jobs[job_id]
            
            if job["status"] in [TrainingStatus.PENDING, TrainingStatus.RUNNING]:
                job["status"] = TrainingStatus.CANCELLED
                job["end_time"] = datetime.now().isoformat()
                await self._save_jobs()
                
                logger.info(f"Training job cancelled: {job_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error stopping training: {str(e)}")
            return False

    async def list_training_jobs(self) -> List[TrainingStatusResponse]:
        """List all training jobs"""
        try:
            jobs = []
            for job_id in self.training_jobs:
                job_status = await self.get_training_status(job_id)
                jobs.append(job_status)
            
            return sorted(jobs, key=lambda x: x.start_time or datetime.min, reverse=True)
            
        except Exception as e:
            logger.error(f"Error listing training jobs: {str(e)}")
            return []

    async def cleanup_old_jobs(self, days: int = 7):
        """Cleanup old training jobs"""
        try:
            cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
            jobs_to_remove = []
            
            for job_id, job in self.training_jobs.items():
                start_time = datetime.fromisoformat(job["start_time"]).timestamp()
                if start_time < cutoff_date and job["status"] in [
                    TrainingStatus.COMPLETED, 
                    TrainingStatus.FAILED, 
                    TrainingStatus.CANCELLED
                ]:
                    jobs_to_remove.append(job_id)
            
            for job_id in jobs_to_remove:
                del self.training_jobs[job_id]
                
                # Remove output directory if exists
                output_dir = Path(f"training_outputs/{job_id}")
                if output_dir.exists():
                    shutil.rmtree(output_dir)
            
            if jobs_to_remove:
                await self._save_jobs()
                logger.info(f"Cleaned up {len(jobs_to_remove)} old training jobs")
                
        except Exception as e:
            logger.error(f"Error cleaning up old jobs: {str(e)}")

    async def _run_training(self, job_id: str):
        """Run the actual training process"""
        try:
            job = self.training_jobs[job_id]
            config = job["config"]
            
            # Update status to running
            job["status"] = TrainingStatus.RUNNING
            await self._save_jobs()
            
            # Run training in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor,
                self._train_model,
                job_id,
                config
            )
            
        except Exception as e:
            logger.error(f"Training job {job_id} failed: {str(e)}")
            job = self.training_jobs[job_id]
            job["status"] = TrainingStatus.FAILED
            job["error_message"] = str(e)
            job["end_time"] = datetime.now().isoformat()
            await self._save_jobs()

    def _train_model(self, job_id: str, config: Dict[str, Any]):
        """Actual model training logic (runs in thread)"""
        try:
            job = self.training_jobs[job_id]
            
            # Initialize model and tokenizer
            model_name = "Qwen/Qwen2.5-Coder-7B-Instruct"
            tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Load base model
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            # Configure LoRA for efficient training
            if config.get("sensorless_mode", True):
                lora_config = LoraConfig(
                    task_type=TaskType.CAUSAL_LM,
                    inference_mode=False,
                    r=16,
                    lora_alpha=32,
                    lora_dropout=0.1,
                    target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
                )
                model = get_peft_model(model, lora_config)
            
            # Load and prepare dataset
            dataset_path = config["dataset_path"]
            dataset = self._prepare_dataset(dataset_path, tokenizer, config)
            
            # Calculate total steps
            total_steps = len(dataset) // config.get("batch_size", 4) * config.get("epochs", 3)
            job["total_steps"] = total_steps
            
            # Setup training arguments
            output_dir = Path(config["output_dir"]) / job_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            training_args = TrainingArguments(
                output_dir=str(output_dir),
                num_train_epochs=config.get("epochs", 3),
                per_device_train_batch_size=config.get("batch_size", 4),
                gradient_accumulation_steps=2,
                learning_rate=config.get("learning_rate", 5e-5),
                warmup_steps=config.get("warmup_steps", 100),
                logging_steps=config.get("logging_steps", 10),
                save_steps=config.get("save_steps", 500),
                eval_steps=config.get("save_steps", 500),
                evaluation_strategy=config.get("evaluation_strategy", "steps"),
                save_total_limit=3,
                load_best_model_at_end=True,
                metric_for_best_model="eval_loss",
                greater_is_better=False,
                report_to=[],  # Disable wandb/tensorboard
                remove_unused_columns=False,
                dataloader_pin_memory=False
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=tokenizer,
                mlm=False
            )
            
            # Custom trainer with progress tracking
            trainer = CustomTrainer(
                model=model,
                args=training_args,
                train_dataset=dataset,
                eval_dataset=dataset,  # Using same dataset for eval (should be separate in production)
                data_collator=data_collator,
                job_tracking={"job_id": job_id, "jobs": self.training_jobs}
            )
            
            # Start training
            trainer.train()
            
            # Save final model
            trainer.save_model()
            tokenizer.save_pretrained(output_dir)
            
            # Update job status
            job["status"] = TrainingStatus.COMPLETED
            job["progress"] = 100.0
            job["end_time"] = datetime.now().isoformat()
            
            logger.info(f"Training job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error in training job {job_id}: {str(e)}")
            job = self.training_jobs[job_id]
            job["status"] = TrainingStatus.FAILED
            job["error_message"] = str(e)
            job["end_time"] = datetime.now().isoformat()
            raise

    def _prepare_dataset(self, dataset_path: str, tokenizer, config: Dict[str, Any]) -> Dataset:
        """Prepare dataset for training"""
        try:
            # Load dataset
            if dataset_path.endswith('.json'):
                with open(dataset_path, 'r') as f:
                    data = json.load(f)
                dataset = Dataset.from_list(data)
            else:
                # Try to load as HuggingFace dataset
                dataset = load_dataset(dataset_path, split='train')
            
            # Tokenize dataset
            def tokenize_function(examples):
                # Assuming the dataset has 'text' field
                text_field = 'text' if 'text' in examples else list(examples.keys())[0]
                
                # Tokenize with truncation and padding
                result = tokenizer(
                    examples[text_field],
                    truncation=True,
                    padding=True,
                    max_length=config.get("max_length", 512),
                    return_tensors="pt"
                )
                
                # For causal LM, labels are the same as input_ids
                result["labels"] = result["input_ids"].clone()
                
                return result
            
            # Apply tokenization
            tokenized_dataset = dataset.map(
                tokenize_function,
                batched=True,
                remove_columns=dataset.column_names
            )
            
            return tokenized_dataset
            
        except Exception as e:
            logger.error(f"Error preparing dataset: {str(e)}")
            # Create a dummy dataset for testing
            dummy_data = [
                {"text": "def hello_world():\n    print('Hello, World!')"},
                {"text": "import numpy as np\n\ndef calculate_mean(arr):\n    return np.mean(arr)"},
                {"text": "class Calculator:\n    def add(self, a, b):\n        return a + b"}
            ]
            
            dataset = Dataset.from_list(dummy_data)
            
            def tokenize_function(examples):
                result = tokenizer(
                    examples["text"],
                    truncation=True,
                    padding=True,
                    max_length=config.get("max_length", 512),
                    return_tensors="pt"
                )
                result["labels"] = result["input_ids"].clone()
                return result
            
            return dataset.map(tokenize_function, batched=True, remove_columns=["text"])

    async def _save_jobs(self):
        """Save training jobs to file"""
        try:
            with open(self.jobs_file, 'w') as f:
                json.dump(self.training_jobs, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving training jobs: {str(e)}")

    async def _load_jobs(self):
        """Load training jobs from file"""
        try:
            if self.jobs_file.exists():
                with open(self.jobs_file, 'r') as f:
                    self.training_jobs = json.load(f)
                logger.info(f"Loaded {len(self.training_jobs)} training jobs")
        except Exception as e:
            logger.error(f"Error loading training jobs: {str(e)}")
            self.training_jobs = {}


class CustomTrainer(Trainer):
    """Custom trainer with progress tracking"""
    
    def __init__(self, *args, job_tracking=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.job_tracking = job_tracking

    def log(self, logs: Dict[str, float]) -> None:
        """Override log method to track progress"""
        super().log(logs)
        
        if self.job_tracking:
            job_id = self.job_tracking["job_id"]
            jobs = self.job_tracking["jobs"]
            
            if job_id in jobs:
                job = jobs[job_id]
                
                # Update progress
                if "epoch" in logs:
                    job["current_epoch"] = int(logs["epoch"])
                    progress = (logs["epoch"] / job["total_epochs"]) * 100
                    job["progress"] = min(progress, 100.0)
                
                if "step" in logs:
                    job["current_step"] = int(logs["step"])
                
                if "train_loss" in logs:
                    job["loss"] = logs["train_loss"]
                
                if "eval_loss" in logs:
                    job["eval_loss"] = logs["eval_loss"]