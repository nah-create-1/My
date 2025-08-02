import React, { useState, useEffect, useRef } from 'react'
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Send, 
  FileText, 
  GitBranch,
  Sparkles,
  Plus,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { AIService } from '../services/AIService'
import { FileService } from '../services/FileService'

interface ComposerProps {
  isOpen: boolean
  onClose: () => void
  initialPrompt?: string
  selectedFiles?: string[]
}

interface ComposerTask {
  id: string
  type: 'edit' | 'create' | 'delete' | 'move'
  filePath: string
  description: string
  changes?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  originalContent?: string
  newContent?: string
}

interface ComposerSession {
  id: string
  prompt: string
  tasks: ComposerTask[]
  status: 'planning' | 'executing' | 'completed' | 'failed'
  createdAt: Date
}

export const Composer: React.FC<ComposerProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  selectedFiles = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<ComposerSession | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    
    try {
      // Create new composer session
      const session: ComposerSession = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        tasks: [],
        status: 'planning',
        createdAt: new Date()
      }

      setCurrentSession(session)
      setShowPreview(true)

      // Get AI planning for the changes
      const planningResponse = await AIService.planComposerChanges({
        prompt: prompt.trim(),
        selectedFiles,
        codebaseContext: await getCodebaseContext()
      })

      // Update session with planned tasks
      const updatedSession = {
        ...session,
        tasks: planningResponse.tasks,
        status: 'executing' as const
      }
      setCurrentSession(updatedSession)

      // Execute tasks one by one
      await executeTasks(updatedSession)

    } catch (error) {
      console.error('Composer error:', error)
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          status: 'failed'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const executeTasks = async (session: ComposerSession) => {
    for (let i = 0; i < session.tasks.length; i++) {
      const task = session.tasks[i]
      
      // Update task status to in_progress
      const updatedTasks = [...session.tasks]
      updatedTasks[i] = { ...task, status: 'in_progress' }
      setCurrentSession({ ...session, tasks: updatedTasks })

      try {
        await executeTask(task)
        
        // Mark as completed
        updatedTasks[i] = { ...task, status: 'completed' }
        setCurrentSession({ ...session, tasks: updatedTasks })
        
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error)
        updatedTasks[i] = { ...task, status: 'failed' }
        setCurrentSession({ ...session, tasks: updatedTasks })
      }
    }

    // Update overall session status
    const allCompleted = session.tasks.every(task => task.status === 'completed')
    setCurrentSession({
      ...session,
      status: allCompleted ? 'completed' : 'failed'
    })
  }

  const executeTask = async (task: ComposerTask) => {
    switch (task.type) {
      case 'edit':
        if (task.newContent) {
          await FileService.saveFileContent(task.filePath, task.newContent)
        }
        break
      case 'create':
        if (task.newContent) {
          await FileService.createFile(task.filePath, task.newContent)
        }
        break
      case 'delete':
        await FileService.deleteFile(task.filePath)
        break
      case 'move':
        // Implement file move logic
        break
    }
  }

  const getCodebaseContext = async () => {
    // Get relevant codebase context for the AI
    const context = {
      selectedFiles,
      projectStructure: await FileService.getFileTree(),
      // Add more context as needed
    }
    return context
  }

  const handleAcceptChanges = async () => {
    if (!currentSession) return

    setIsLoading(true)
    try {
      for (const task of currentSession.tasks) {
        if (task.status === 'pending') {
          await executeTask(task)
        }
      }
      onClose()
    } catch (error) {
      console.error('Error applying changes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectChanges = () => {
    setCurrentSession(null)
    setShowPreview(false)
    setPrompt('')
  }

  const TaskItem: React.FC<{ task: ComposerTask }> = ({ task }) => {
    const getStatusIcon = () => {
      switch (task.status) {
        case 'completed':
          return <Check size={16} className="text-green-500" />
        case 'in_progress':
          return <Loader2 size={16} className="text-blue-500 animate-spin" />
        case 'failed':
          return <AlertCircle size={16} className="text-red-500" />
        default:
          return <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
      }
    }

    const getTypeIcon = () => {
      switch (task.type) {
        case 'create':
          return <Plus size={14} className="text-green-500" />
        case 'delete':
          return <X size={14} className="text-red-500" />
        default:
          return <FileText size={14} className="text-blue-500" />
      }
    }

    return (
      <div className="flex items-start space-x-3 p-3 border-b border-editor-border">
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <span className="text-sm font-medium text-editor-text">
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)} {task.filePath}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{task.description}</p>
          {task.changes && (
            <div className="mt-2 text-xs bg-editor-bg p-2 rounded font-mono">
              {task.changes}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      isExpanded ? 'p-4' : 'p-8'
    }`}>
      <div className={`bg-editor-sidebar border border-editor-border rounded-lg ${
        isExpanded ? 'w-full h-full' : 'w-full max-w-4xl max-h-[80vh]'
      } flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-editor-border">
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-editor-text">Composer</h2>
            {currentSession && (
              <span className={`px-2 py-1 rounded text-xs ${
                currentSession.status === 'completed' ? 'bg-green-600 text-white' :
                currentSession.status === 'failed' ? 'bg-red-600 text-white' :
                currentSession.status === 'executing' ? 'bg-blue-600 text-white' :
                'bg-yellow-600 text-white'
              }`}>
                {currentSession.status}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-editor-border rounded"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-editor-border rounded"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Input Section */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r border-editor-border`}>
            <div className="p-4 border-b border-editor-border">
              <h3 className="text-sm font-medium text-editor-text mb-2">
                Describe the changes you want to make
              </h3>
              {selectedFiles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Selected files:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFiles.map(file => (
                      <span key={file} className="px-2 py-1 bg-editor-bg rounded text-xs">
                        {file.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Add error handling to all API calls', 'Refactor the user service to use TypeScript', 'Create a new component for displaying user profiles'"
                className="w-full h-full bg-editor-bg border border-editor-border rounded text-editor-text text-sm p-3 resize-none focus:outline-none focus:border-editor-accent"
                disabled={isLoading}
              />
            </div>

            <div className="p-4 border-t border-editor-border">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  {prompt.length} characters
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-editor-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>{isLoading ? 'Planning...' : 'Generate Plan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && currentSession && (
            <div className="w-1/2 flex flex-col">
              <div className="p-4 border-b border-editor-border">
                <h3 className="text-sm font-medium text-editor-text">Planned Changes</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {currentSession.tasks.length} tasks planned
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {currentSession.tasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>

              <div className="p-4 border-t border-editor-border">
                <div className="flex space-x-2">
                  <button
                    onClick={handleAcceptChanges}
                    disabled={isLoading || currentSession.status === 'executing'}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={handleRejectChanges}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}