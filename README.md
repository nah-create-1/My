# AI Cursor Clone

A powerful AI-powered code editor built with React and FastAPI, featuring the Qwen Coder v3 model with sensorless capabilities.

## 🚀 Features

- **AI Code Completions**: Real-time code suggestions powered by Qwen Coder v3
- **Intelligent Chat Assistant**: Context-aware AI assistant for coding help
- **Advanced Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **File Explorer**: Full-featured file management system
- **Sensorless AI Mode**: Custom-trained model for privacy-focused coding
- **Real-time Collaboration**: WebSocket-based live updates
- **Custom Training**: Train the model on your own datasets
- **Docker Support**: Easy deployment and development setup

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Monaco Editor** for code editing
- **Tailwind CSS** for styling
- **Vite** for fast development
- **WebSocket** for real-time communication

### Backend
- **FastAPI** with Python 3.10+
- **Qwen Coder v3** (7B parameters)
- **PyTorch** with CUDA support
- **Transformers** library
- **LoRA/PEFT** for efficient fine-tuning
- **WebSocket** for real-time features

### Infrastructure
- **Docker** & Docker Compose
- **Redis** for caching (optional)
- **MongoDB** for persistence (optional)
- **Nginx** for reverse proxy (optional)

## 📋 Prerequisites

- **Docker** and **Docker Compose**
- **NVIDIA GPU** with CUDA support (recommended)
- **8GB+ RAM** for model inference
- **Node.js 18+** (for local development)
- **Python 3.10+** (for local development)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-cursor-clone.git
   cd ai-cursor-clone
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Open your browser to `http://localhost:8000`
   - The AI model will download automatically on first run

### Local Development

1. **Install frontend dependencies**
   ```bash
   npm install
   ```

2. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the backend server**
   ```bash
   cd backend
   python main.py
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

## 🤖 AI Model Configuration

### Sensorless Mode

The application includes a unique "sensorless" mode that makes the AI model more privacy-focused by:

- Reducing model parameters through LoRA fine-tuning
- Eliminating potential data leakage pathways
- Maintaining high code generation quality
- Enabling local inference without external API calls

To enable sensorless mode:

```bash
curl -X POST http://localhost:8000/api/model/make-sensorless
```

### Custom Training

Train the model on your own datasets:

1. **Prepare your dataset** (JSON format):
   ```json
   [
     {"text": "def example_function():\n    return 'Hello, World!'"},
     {"text": "import numpy as np\n\ndef calculate_mean(data):\n    return np.mean(data)"}
   ]
   ```

2. **Start training**:
   ```bash
   curl -X POST http://localhost:8000/api/training/start \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_path": "path/to/your/dataset.json",
       "output_dir": "./trained_models",
       "epochs": 3,
       "batch_size": 4,
       "learning_rate": 5e-5,
       "sensorless_mode": true
     }'
   ```

3. **Monitor progress**:
   ```bash
   curl http://localhost:8000/api/training/status/{job_id}
   ```

## 📁 Project Structure

```
ai-cursor-clone/
├── src/                          # React frontend source
│   ├── components/               # React components
│   │   ├── EditorLayout.tsx     # Main layout component
│   │   ├── CodeEditor.tsx       # Monaco editor wrapper
│   │   ├── FileExplorer.tsx     # File tree component
│   │   └── ChatInterface.tsx    # AI chat component
│   ├── services/                # API service layers
│   │   ├── AIService.ts         # AI model communication
│   │   └── FileService.ts       # File operations
│   ├── types/                   # TypeScript definitions
│   └── App.tsx                  # Main app component
├── backend/                     # FastAPI backend
│   ├── models/                  # AI model implementations
│   │   └── qwen_model.py        # Qwen Coder v3 integration
│   ├── services/                # Business logic
│   │   ├── file_service.py      # File management
│   │   ├── chat_service.py      # Chat handling
│   │   └── training_service.py  # Model training
│   ├── schemas/                 # Pydantic schemas
│   │   └── api_schemas.py       # API request/response models
│   └── main.py                  # FastAPI application
├── docker-compose.yml           # Docker services configuration
├── Dockerfile                   # Multi-stage Docker build
├── requirements.txt             # Python dependencies
└── package.json                 # Node.js dependencies
```

## 🎯 API Endpoints

### Code Completion
- `POST /api/completions` - Get AI code completions
- `GET /api/model/config` - Get model configuration
- `PUT /api/model/config` - Update model settings

### Chat Assistant
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history` - Get conversation history
- `DELETE /api/chat/history` - Clear chat history

### File Management
- `GET /api/files/tree` - Get project file structure
- `GET /api/files/content` - Get file content
- `POST /api/files/save` - Save file content
- `POST /api/files/create` - Create new file
- `DELETE /api/files/delete` - Delete file

### Model Training
- `POST /api/training/start` - Start training job
- `GET /api/training/status/{job_id}` - Get training status
- `DELETE /api/training/stop/{job_id}` - Stop training

### Sensorless Features
- `POST /api/model/make-sensorless` - Convert to sensorless mode
- `GET /api/model/performance` - Get performance metrics

## 🔧 Configuration

### Environment Variables

```bash
# Development/Production mode
ENVIRONMENT=development

# Model cache directory
TRANSFORMERS_CACHE=/app/models
HF_HOME=/app/models

# GPU configuration
CUDA_VISIBLE_DEVICES=0

# Optional: External services
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017
```

### Model Configuration

```json
{
  "model_name": "Qwen/Qwen2.5-Coder-7B-Instruct",
  "temperature": 0.7,
  "max_tokens": 256,
  "top_p": 0.9,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

## 🚀 Deployment

### Production Deployment

1. **Build and deploy with Docker**:
   ```bash
   docker-compose -f docker-compose.yml --profile production up -d
   ```

2. **Configure reverse proxy** (optional):
   ```bash
   # Edit nginx.conf for SSL and domain configuration
   docker-compose restart nginx
   ```

### Cloud Deployment

The application can be deployed on various cloud platforms:

- **AWS**: Use ECS with GPU instances
- **Google Cloud**: Use GKE with GPU node pools
- **Azure**: Use AKS with GPU-enabled nodes
- **DigitalOcean**: Use Droplets with GPU support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Qwen Team** for the amazing Qwen Coder v3 model
- **Cursor Team** for inspiration and UI/UX ideas
- **Hugging Face** for the Transformers library
- **Microsoft** for Monaco Editor
- **FastAPI** and **React** communities

## 📞 Support

For support, email support@example.com or join our Discord server.

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Plugin system
- [ ] Advanced debugging features
- [ ] Collaborative editing
- [ ] Mobile support
- [ ] Voice coding assistance
- [ ] Integration with popular IDEs

---

**Built with ❤️ by the AI Cursor Clone team**