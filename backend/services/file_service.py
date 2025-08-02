import os
import asyncio
import aiofiles
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from schemas.api_schemas import FileNode, FileContentResponse, LanguageEnum

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self, workspace_root: str = "./workspace"):
        self.workspace_root = Path(workspace_root)
        self.language_map = {
            '.py': LanguageEnum.PYTHON,
            '.js': LanguageEnum.JAVASCRIPT,
            '.jsx': LanguageEnum.JAVASCRIPT,
            '.ts': LanguageEnum.TYPESCRIPT,
            '.tsx': LanguageEnum.TYPESCRIPT,
            '.java': LanguageEnum.JAVA,
            '.cpp': LanguageEnum.CPP,
            '.cc': LanguageEnum.CPP,
            '.cxx': LanguageEnum.CPP,
            '.c': LanguageEnum.C,
            '.cs': LanguageEnum.CSHARP,
            '.php': LanguageEnum.PHP,
            '.rb': LanguageEnum.RUBY,
            '.go': LanguageEnum.GO,
            '.rs': LanguageEnum.RUST,
            '.html': LanguageEnum.HTML,
            '.htm': LanguageEnum.HTML,
            '.css': LanguageEnum.CSS,
            '.scss': LanguageEnum.SCSS,
            '.sass': LanguageEnum.SCSS,
            '.json': LanguageEnum.JSON,
            '.xml': LanguageEnum.XML,
            '.yml': LanguageEnum.YAML,
            '.yaml': LanguageEnum.YAML,
            '.md': LanguageEnum.MARKDOWN,
            '.markdown': LanguageEnum.MARKDOWN,
            '.sql': LanguageEnum.SQL,
            '.sh': LanguageEnum.SHELL,
            '.bash': LanguageEnum.SHELL,
            '.zsh': LanguageEnum.SHELL,
        }

    async def initialize(self):
        """Initialize the file service"""
        try:
            # Create workspace directory if it doesn't exist
            self.workspace_root.mkdir(parents=True, exist_ok=True)
            
            # Create some initial demo files if workspace is empty
            if not any(self.workspace_root.iterdir()):
                await self._create_demo_project()
            
            logger.info(f"File service initialized with workspace: {self.workspace_root}")
            
        except Exception as e:
            logger.error(f"Failed to initialize file service: {str(e)}")
            raise

    async def get_file_tree(self, path: Optional[str] = None) -> List[FileNode]:
        """Get the file tree structure"""
        try:
            root_path = self.workspace_root if path is None else self.workspace_root / path
            
            if not root_path.exists():
                return []
            
            return await self._build_file_tree(root_path)
            
        except Exception as e:
            logger.error(f"Error getting file tree: {str(e)}")
            raise

    async def get_file_content(self, file_path: str) -> FileContentResponse:
        """Get the content of a specific file"""
        try:
            full_path = self.workspace_root / file_path
            
            if not full_path.exists() or not full_path.is_file():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            async with aiofiles.open(full_path, 'r', encoding='utf-8') as file:
                content = await file.read()
            
            stat = full_path.stat()
            language = self._get_language_from_extension(full_path.suffix)
            
            return FileContentResponse(
                path=file_path,
                content=content,
                language=language,
                last_modified=datetime.fromtimestamp(stat.st_mtime),
                size=stat.st_size
            )
            
        except Exception as e:
            logger.error(f"Error getting file content for {file_path}: {str(e)}")
            raise

    async def save_file_content(self, file_path: str, content: str) -> bool:
        """Save content to a file"""
        try:
            full_path = self.workspace_root / file_path
            
            # Create parent directories if they don't exist
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            async with aiofiles.open(full_path, 'w', encoding='utf-8') as file:
                await file.write(content)
            
            logger.info(f"File saved: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving file {file_path}: {str(e)}")
            return False

    async def create_file(self, file_path: str, content: str = "") -> bool:
        """Create a new file"""
        try:
            full_path = self.workspace_root / file_path
            
            if full_path.exists():
                raise FileExistsError(f"File already exists: {file_path}")
            
            # Create parent directories if they don't exist
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            async with aiofiles.open(full_path, 'w', encoding='utf-8') as file:
                await file.write(content)
            
            logger.info(f"File created: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating file {file_path}: {str(e)}")
            return False

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            full_path = self.workspace_root / file_path
            
            if not full_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            if full_path.is_file():
                full_path.unlink()
            elif full_path.is_dir():
                # Remove directory and all contents
                import shutil
                shutil.rmtree(full_path)
            
            logger.info(f"File deleted: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False

    async def create_directory(self, dir_path: str) -> bool:
        """Create a new directory"""
        try:
            full_path = self.workspace_root / dir_path
            
            if full_path.exists():
                raise FileExistsError(f"Directory already exists: {dir_path}")
            
            full_path.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Directory created: {dir_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating directory {dir_path}: {str(e)}")
            return False

    async def rename_file(self, old_path: str, new_path: str) -> bool:
        """Rename/move a file"""
        try:
            old_full_path = self.workspace_root / old_path
            new_full_path = self.workspace_root / new_path
            
            if not old_full_path.exists():
                raise FileNotFoundError(f"File not found: {old_path}")
            
            if new_full_path.exists():
                raise FileExistsError(f"Target already exists: {new_path}")
            
            # Create parent directories if they don't exist
            new_full_path.parent.mkdir(parents=True, exist_ok=True)
            
            old_full_path.rename(new_full_path)
            
            logger.info(f"File renamed: {old_path} -> {new_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error renaming file {old_path} to {new_path}: {str(e)}")
            return False

    def _get_language_from_extension(self, extension: str) -> LanguageEnum:
        """Get language enum from file extension"""
        return self.language_map.get(extension.lower(), LanguageEnum.PLAINTEXT)

    async def _build_file_tree(self, path: Path, relative_to: Optional[Path] = None) -> List[FileNode]:
        """Recursively build file tree"""
        if relative_to is None:
            relative_to = self.workspace_root
        
        nodes = []
        
        try:
            # Get all items in directory
            items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
            
            for item in items:
                # Skip hidden files and common build/cache directories
                if item.name.startswith('.') or item.name in ['node_modules', '__pycache__', '.git', 'dist', 'build']:
                    continue
                
                relative_path = item.relative_to(relative_to)
                stat = item.stat()
                
                if item.is_dir():
                    # Recursively get children for directories
                    children = await self._build_file_tree(item, relative_to)
                    
                    node = FileNode(
                        name=item.name,
                        path=str(relative_path),
                        type="directory",
                        children=children if children else None,
                        modified=datetime.fromtimestamp(stat.st_mtime)
                    )
                else:
                    node = FileNode(
                        name=item.name,
                        path=str(relative_path),
                        type="file",
                        size=stat.st_size,
                        modified=datetime.fromtimestamp(stat.st_mtime)
                    )
                
                nodes.append(node)
                
        except PermissionError:
            logger.warning(f"Permission denied accessing: {path}")
        except Exception as e:
            logger.error(f"Error building file tree for {path}: {str(e)}")
        
        return nodes

    async def _create_demo_project(self):
        """Create a demo project structure"""
        try:
            # Create demo files
            demo_files = {
                "README.md": """# AI Cursor Clone Demo Project

This is a demo project to showcase the AI-powered code editor.

## Features

- AI code completions with Qwen Coder v3
- Real-time chat assistance
- File explorer and editor
- Sensorless AI mode
""",
                "src/main.py": """#!/usr/bin/env python3
\"\"\"
Main application entry point
\"\"\"

def main():
    print("Hello, AI Cursor!")
    
    # TODO: Add your code here
    
if __name__ == "__main__":
    main()
""",
                "src/utils.py": """\"\"\"
Utility functions
\"\"\"

def calculate_fibonacci(n):
    \"\"\"Calculate the nth Fibonacci number\"\"\"
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

def is_prime(num):
    \"\"\"Check if a number is prime\"\"\"
    if num < 2:
        return False
    for i in range(2, int(num ** 0.5) + 1):
        if num % i == 0:
            return False
    return True
""",
                "package.json": """{
  "name": "ai-cursor-demo",
  "version": "1.0.0",
  "description": "Demo project for AI Cursor Clone",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"No tests specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}""",
                "index.js": """const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from AI Cursor Demo!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
""",
                "styles.css": """/* Demo CSS file */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}
"""
            }
            
            for file_path, content in demo_files.items():
                full_path = self.workspace_root / file_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                
                async with aiofiles.open(full_path, 'w', encoding='utf-8') as f:
                    await f.write(content)
            
            logger.info("Demo project created successfully")
            
        except Exception as e:
            logger.error(f"Error creating demo project: {str(e)}")
            raise