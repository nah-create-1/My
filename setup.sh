#!/bin/bash

# AI Cursor Clone Setup Script
# This script helps set up the development environment

set -e

echo "🚀 AI Cursor Clone Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_status "Checking operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_success "macOS detected"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        print_success "Windows detected"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js (optional for local development)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_warning "Node.js is not installed (optional for local development)"
    fi
    
    # Check Python (optional for local development)
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python 3 is installed: $PYTHON_VERSION"
    else
        print_warning "Python 3 is not installed (optional for local development)"
    fi
    
    # Check NVIDIA GPU
    if command -v nvidia-smi &> /dev/null; then
        print_success "NVIDIA GPU detected"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
    else
        print_warning "NVIDIA GPU not detected. CPU inference will be used (slower)."
    fi
}

# Create environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please review and modify .env file with your specific configuration"
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p models
    mkdir -p workspace
    mkdir -p training_outputs
    mkdir -p logs
    
    print_success "Directories created successfully"
}

# Setup Docker development environment
setup_docker() {
    print_status "Setting up Docker environment..."
    
    # Build the Docker image
    print_status "Building Docker image (this may take a while)..."
    docker-compose build
    
    print_success "Docker image built successfully"
}

# Setup local development environment
setup_local() {
    print_status "Setting up local development environment..."
    
    # Install Node.js dependencies
    if command -v npm &> /dev/null; then
        print_status "Installing Node.js dependencies..."
        npm install
        print_success "Node.js dependencies installed"
    else
        print_warning "npm not found. Skipping Node.js setup."
    fi
    
    # Setup Python virtual environment
    if command -v python3 &> /dev/null; then
        print_status "Setting up Python virtual environment..."
        
        if [ ! -d "venv" ]; then
            python3 -m venv venv
            print_success "Python virtual environment created"
        fi
        
        # Activate virtual environment and install dependencies
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "Python 3 not found. Skipping Python setup."
    fi
}

# Download model (optional)
download_model() {
    print_status "Would you like to pre-download the AI model? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Downloading Qwen Coder v3 model..."
        
        # Create a simple Python script to download the model
        cat > download_model.py << EOF
import os
from transformers import AutoTokenizer, AutoModelForCausalLM

print("Downloading Qwen Coder v3 model...")
model_name = "Qwen/Qwen2.5-Coder-7B-Instruct"

# Set cache directory
os.environ["TRANSFORMERS_CACHE"] = "./models"
os.environ["HF_HOME"] = "./models"

# Download tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    trust_remote_code=True,
    torch_dtype="auto",
    device_map="auto"
)

print("Model downloaded successfully!")
EOF
        
        if command -v python3 &> /dev/null; then
            python3 download_model.py
            rm download_model.py
            print_success "Model downloaded successfully"
        else
            print_error "Python 3 not found. Cannot download model."
            rm download_model.py
        fi
    else
        print_status "Skipping model download. Model will be downloaded on first run."
    fi
}

# Generate startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Docker startup script
    cat > start-docker.sh << 'EOF'
#!/bin/bash
echo "Starting AI Cursor Clone with Docker..."
docker-compose up --build
EOF
    chmod +x start-docker.sh
    
    # Local development startup script
    cat > start-local.sh << 'EOF'
#!/bin/bash
echo "Starting AI Cursor Clone in local development mode..."

# Start backend
echo "Starting backend server..."
cd backend
source ../venv/bin/activate 2>/dev/null || true
python main.py &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers..."

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
EOF
    chmod +x start-local.sh
    
    print_success "Startup scripts created"
}

# Main setup function
main() {
    print_status "Starting AI Cursor Clone setup..."
    
    check_os
    check_prerequisites
    setup_environment
    create_directories
    
    # Ask user for setup preference
    echo ""
    print_status "Choose setup option:"
    echo "1) Docker only (recommended)"
    echo "2) Local development environment"
    echo "3) Both Docker and local"
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            setup_docker
            ;;
        2)
            setup_local
            ;;
        3)
            setup_docker
            setup_local
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    download_model
    create_startup_scripts
    
    echo ""
    print_success "Setup completed successfully! 🎉"
    echo ""
    print_status "Next steps:"
    echo "1. Review the .env file and adjust settings as needed"
    echo "2. To start with Docker: ./start-docker.sh"
    echo "3. To start locally: ./start-local.sh"
    echo "4. Access the application at http://localhost:8000"
    echo ""
    print_status "For more information, see the README.md file"
}

# Run main function
main "$@"