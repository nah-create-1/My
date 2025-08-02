# Multi-stage build for AI Cursor Clone
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY index.html ./
COPY public ./public

# Build the application
RUN npm run build

# Stage 2: Python backend with model
FROM python:3.10-slim AS backend

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    wget \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .

# Create virtual environment and install Python dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install PyTorch with CUDA support (adjust based on your needs)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./backend/dist

# Create necessary directories
RUN mkdir -p /app/workspace /app/models /app/training_outputs

# Set up model cache directory
ENV TRANSFORMERS_CACHE=/app/models
ENV HF_HOME=/app/models

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set working directory to backend
WORKDIR /app/backend

# Run the application
CMD ["python", "main.py"]