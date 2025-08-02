import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { EditorLayout } from './components/EditorLayout'
import { FileExplorer } from './components/FileExplorer'
import { CodeEditor } from './components/CodeEditor'
import { ChatInterface } from './components/ChatInterface'
import { AIService } from './services/AIService'
import { FileService } from './services/FileService'
import { FileNode } from './types'

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize the application
    const initApp = async () => {
      try {
        // Load initial file tree
        const tree = await FileService.getFileTree()
        setFileTree(tree)
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initApp()
  }, [])

  const handleFileSelect = (filePath: string) => {
    setCurrentFile(filePath)
    if (!openFiles.includes(filePath)) {
      setOpenFiles(prev => [...prev, filePath])
    }
  }

  const handleCloseFile = (filePath: string) => {
    setOpenFiles(prev => prev.filter(f => f !== filePath))
    if (currentFile === filePath) {
      const remainingFiles = openFiles.filter(f => f !== filePath)
      setCurrentFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-editor-text">Loading AI Cursor...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="h-screen bg-editor-bg text-editor-text overflow-hidden">
        <Routes>
          <Route 
            path="/*" 
            element={
              <EditorLayout
                sidebar={
                  <FileExplorer
                    fileTree={fileTree}
                    onFileSelect={handleFileSelect}
                    currentFile={currentFile}
                  />
                }
                editor={
                  <CodeEditor
                    currentFile={currentFile}
                    openFiles={openFiles}
                    onFileSelect={setCurrentFile}
                    onCloseFile={handleCloseFile}
                  />
                }
                chat={
                  isChatOpen && (
                    <ChatInterface
                      currentFile={currentFile}
                      onClose={() => setIsChatOpen(false)}
                    />
                  )
                }
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                isChatOpen={isChatOpen}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App