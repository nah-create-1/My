import axios from 'axios'
import { FileNode, FileContent } from '../types'

class FileServiceClass {
  private baseURL = '/api/files'

  async getFileTree(): Promise<FileNode[]> {
    try {
      const response = await axios.get(`${this.baseURL}/tree`)
      return response.data
    } catch (error) {
      console.error('Failed to get file tree:', error)
      // Return mock data for development
      return this.getMockFileTree()
    }
  }

  async getFileContent(filePath: string): Promise<FileContent> {
    try {
      const response = await axios.get(`${this.baseURL}/content`, {
        params: { path: filePath }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get file content:', error)
      // Return mock content for development
      return this.getMockFileContent(filePath)
    }
  }

  async saveFileContent(filePath: string, content: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseURL}/save`, {
        path: filePath,
        content
      })
      return true
    } catch (error) {
      console.error('Failed to save file content:', error)
      return false
    }
  }

  async createFile(filePath: string, content = ''): Promise<boolean> {
    try {
      await axios.post(`${this.baseURL}/create`, {
        path: filePath,
        content
      })
      return true
    } catch (error) {
      console.error('Failed to create file:', error)
      return false
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseURL}/delete`, {
        params: { path: filePath }
      })
      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseURL}/rename`, {
        oldPath,
        newPath
      })
      return true
    } catch (error) {
      console.error('Failed to rename file:', error)
      return false
    }
  }

  async createDirectory(dirPath: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseURL}/mkdir`, {
        path: dirPath
      })
      return true
    } catch (error) {
      console.error('Failed to create directory:', error)
      return false
    }
  }

  getLanguageFromExtension(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yml': 'yaml',
      'yaml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell'
    }
    return languageMap[extension || ''] || 'plaintext'
  }

  private getMockFileTree(): FileNode[] {
    return [
      {
        name: 'src',
        path: 'src',
        type: 'directory',
        children: [
          {
            name: 'components',
            path: 'src/components',
            type: 'directory',
            children: [
              { name: 'App.tsx', path: 'src/components/App.tsx', type: 'file' },
              { name: 'Editor.tsx', path: 'src/components/Editor.tsx', type: 'file' }
            ]
          },
          { name: 'main.tsx', path: 'src/main.tsx', type: 'file' },
          { name: 'index.css', path: 'src/index.css', type: 'file' }
        ]
      },
      { name: 'package.json', path: 'package.json', type: 'file' },
      { name: 'README.md', path: 'README.md', type: 'file' }
    ]
  }

  private getMockFileContent(filePath: string): FileContent {
    const mockContent = filePath.endsWith('.tsx') || filePath.endsWith('.ts')
      ? `// ${filePath}\nimport React from 'react'\n\nfunction Component() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  )\n}\n\nexport default Component`
      : `// Mock content for ${filePath}\n// This is placeholder content while the backend is not available`

    return {
      path: filePath,
      content: mockContent,
      language: this.getLanguageFromExtension(filePath),
      lastModified: new Date()
    }
  }
}

export const FileService = new FileServiceClass()