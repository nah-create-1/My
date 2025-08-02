# 🚀 Quick Start Guide

Get AI Cursor Clone running in less than 5 minutes!

## Prerequisites

- **Docker** and **Docker Compose** installed
- **8GB+ RAM** available
- **NVIDIA GPU** (recommended for best performance)

## Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/ai-cursor-clone.git
cd ai-cursor-clone

# Run the setup script
./setup.sh
```

The setup script will:
- Check prerequisites
- Set up environment variables
- Build Docker containers
- Optionally download the AI model
- Create startup scripts

## Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ai-cursor-clone.git
cd ai-cursor-clone

# Copy environment file
cp .env.example .env

# Start with Docker
docker-compose up --build
```

## Access the Application

Once running, open your browser to:
- **Main Application**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## First Steps

1. **Explore the Interface**
   - File explorer on the left
   - Code editor in the center
   - AI chat toggle button (top-right)

2. **Try AI Features**
   - Open a file and start typing
   - Press `Ctrl+Space` for completions
   - Click the chat button to ask AI questions

3. **Enable Sensorless Mode**
   ```bash
   curl -X POST http://localhost:8000/api/model/make-sensorless
   ```

## Common Issues

### Model Download Slow?
The AI model (7GB) downloads on first use. Be patient or pre-download with:
```bash
./setup.sh  # Choose option to pre-download
```

### Out of Memory?
Reduce model precision in `.env`:
```bash
MODEL_PRECISION=4bit
TORCH_DTYPE=float16
```

### No GPU Detected?
The app works on CPU but will be slower. For GPU support:
```bash
# Install NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the [API Documentation](http://localhost:8000/docs)
- Explore custom training features
- Contribute to the project!

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/your-username/ai-cursor-clone/issues)
- 💬 [Join Community](https://discord.gg/your-discord)

---

**Happy Coding with AI! 🤖✨**