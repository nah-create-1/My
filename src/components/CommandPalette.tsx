import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Search, 
  Command, 
  File, 
  Folder, 
  Settings, 
  Terminal, 
  GitBranch,
  Sparkles,
  Play,
  Bug,
  Palette,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react'
import { AIService } from '../services/AIService'
import { FileService } from '../services/FileService'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onCommand: (command: Command) => void
  currentFile?: string | null
  editor?: any
}

interface Command {
  id: string
  title: string
  description?: string
  category: 'file' | 'edit' | 'ai' | 'git' | 'view' | 'debug' | 'recent'
  icon: React.ReactNode
  action: () => void | Promise<void>
  shortcut?: string
  recent?: boolean
}

interface AICommand {
  prompt: string
  action: 'generate' | 'refactor' | 'explain' | 'fix' | 'optimize' | 'test'
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onCommand,
  currentFile,
  editor
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mode, setMode] = useState<'commands' | 'ai' | 'files'>('commands')
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
      setMode('commands')
    }
  }, [isOpen])

  useEffect(() => {
    // Load recent commands from localStorage
    const recent = localStorage.getItem('cursor-recent-commands')
    if (recent) {
      try {
        setRecentCommands(JSON.parse(recent))
      } catch (error) {
        console.error('Failed to parse recent commands:', error)
      }
    }
  }, [])

  const addToRecent = (commandId: string) => {
    const updated = [commandId, ...recentCommands.filter(id => id !== commandId)].slice(0, 10)
    setRecentCommands(updated)
    localStorage.setItem('cursor-recent-commands', JSON.stringify(updated))
  }

  const baseCommands: Command[] = useMemo(() => [
    // File Operations
    {
      id: 'file.new',
      title: 'New File',
      description: 'Create a new file',
      category: 'file',
      icon: <File size={16} />,
      action: () => console.log('New file'),
      shortcut: 'Ctrl+N'
    },
    {
      id: 'file.open',
      title: 'Open File',
      description: 'Open an existing file',
      category: 'file',
      icon: <Folder size={16} />,
      action: () => console.log('Open file'),
      shortcut: 'Ctrl+O'
    },
    {
      id: 'file.save',
      title: 'Save File',
      description: 'Save the current file',
      category: 'file',
      icon: <File size={16} />,
      action: () => console.log('Save file'),
      shortcut: 'Ctrl+S'
    },

    // AI-Powered Commands
    {
      id: 'ai.generate',
      title: 'Generate Code',
      description: 'Generate code with AI',
      category: 'ai',
      icon: <Sparkles size={16} />,
      action: () => setMode('ai'),
      shortcut: 'Ctrl+G'
    },
    {
      id: 'ai.explain',
      title: 'Explain Code',
      description: 'Get AI explanation of selected code',
      category: 'ai',
      icon: <Sparkles size={16} />,
      action: () => handleAICommand('explain'),
    },
    {
      id: 'ai.refactor',
      title: 'Refactor Code',
      description: 'Refactor selected code with AI',
      category: 'ai',
      icon: <Sparkles size={16} />,
      action: () => handleAICommand('refactor'),
    },
    {
      id: 'ai.fix',
      title: 'Fix Code',
      description: 'Fix issues in selected code',
      category: 'ai',
      icon: <Bug size={16} />,
      action: () => handleAICommand('fix'),
    },
    {
      id: 'ai.optimize',
      title: 'Optimize Code',
      description: 'Optimize selected code for performance',
      category: 'ai',
      icon: <Zap size={16} />,
      action: () => handleAICommand('optimize'),
    },
    {
      id: 'ai.test',
      title: 'Generate Tests',
      description: 'Generate unit tests for selected code',
      category: 'ai',
      icon: <Play size={16} />,
      action: () => handleAICommand('test'),
    },

    // Edit Commands
    {
      id: 'edit.find',
      title: 'Find in File',
      description: 'Search in current file',
      category: 'edit',
      icon: <Search size={16} />,
      action: () => console.log('Find'),
      shortcut: 'Ctrl+F'
    },
    {
      id: 'edit.replace',
      title: 'Find and Replace',
      description: 'Find and replace in current file',
      category: 'edit',
      icon: <Search size={16} />,
      action: () => console.log('Replace'),
      shortcut: 'Ctrl+H'
    },

    // View Commands
    {
      id: 'view.command-palette',
      title: 'Command Palette',
      description: 'Show command palette',
      category: 'view',
      icon: <Command size={16} />,
      action: () => console.log('Command palette'),
      shortcut: 'Ctrl+Shift+P'
    },
    {
      id: 'view.terminal',
      title: 'Toggle Terminal',
      description: 'Show/hide integrated terminal',
      category: 'view',
      icon: <Terminal size={16} />,
      action: () => console.log('Toggle terminal'),
      shortcut: 'Ctrl+`'
    },

    // Git Commands
    {
      id: 'git.commit',
      title: 'Git Commit',
      description: 'Commit changes',
      category: 'git',
      icon: <GitBranch size={16} />,
      action: () => console.log('Git commit'),
    },
    {
      id: 'git.push',
      title: 'Git Push',
      description: 'Push changes to remote',
      category: 'git',
      icon: <GitBranch size={16} />,
      action: () => console.log('Git push'),
    },

    // Settings
    {
      id: 'settings.open',
      title: 'Open Settings',
      description: 'Open application settings',
      category: 'view',
      icon: <Settings size={16} />,
      action: () => console.log('Open settings'),
      shortcut: 'Ctrl+,'
    },
    {
      id: 'settings.theme',
      title: 'Change Theme',
      description: 'Switch color theme',
      category: 'view',
      icon: <Palette size={16} />,
      action: () => console.log('Change theme'),
    },
  ], [])

  const handleAICommand = async (action: string) => {
    if (!editor || !currentFile) return

    setIsLoading(true)
    onClose()

    try {
      const selection = editor.getSelection()
      const model = editor.getModel()
      
      let selectedText = ''
      let context = ''

      if (selection && !selection.isEmpty()) {
        selectedText = model.getValueInRange(selection)
      } else {
        // Use entire file if no selection
        selectedText = model.getValue()
      }

      context = `File: ${currentFile}\nLanguage: ${FileService.getLanguageFromExtension(currentFile)}`

      let prompt = ''
      switch (action) {
        case 'explain':
          prompt = `Explain what this code does:\n\n${selectedText}`
          break
        case 'refactor':
          prompt = `Refactor this code to improve readability and maintainability:\n\n${selectedText}`
          break
        case 'fix':
          prompt = `Find and fix any issues in this code:\n\n${selectedText}`
          break
        case 'optimize':
          prompt = `Optimize this code for better performance:\n\n${selectedText}`
          break
        case 'test':
          prompt = `Generate comprehensive unit tests for this code:\n\n${selectedText}`
          break
      }

      const response = await AIService.sendChatMessage(prompt, context)
      // Handle response (show in chat, apply changes, etc.)
      console.log('AI Response:', response)

    } catch (error) {
      console.error('AI command error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCommands = useMemo(() => {
    if (mode === 'ai') {
      return baseCommands.filter(cmd => cmd.category === 'ai')
    }

    if (!query) {
      // Show recent commands first
      const recent = recentCommands
        .map(id => baseCommands.find(cmd => cmd.id === id))
        .filter(Boolean)
        .map(cmd => ({ ...cmd!, recent: true }))
      
      const others = baseCommands.filter(cmd => !recentCommands.includes(cmd.id))
      
      return [...recent, ...others]
    }

    const searchTerm = query.toLowerCase()
    return baseCommands.filter(cmd => 
      cmd.title.toLowerCase().includes(searchTerm) ||
      cmd.description?.toLowerCase().includes(searchTerm) ||
      cmd.category.toLowerCase().includes(searchTerm)
    )
  }, [query, mode, baseCommands, recentCommands])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
      case '>':
        if (query === '') {
          setMode('commands')
          setQuery('>')
        }
        break
      case '@':
        if (query === '') {
          setMode('files')
          setQuery('@')
        }
        break
    }
  }

  const executeCommand = async (command: Command) => {
    addToRecent(command.id)
    onCommand(command)
    
    try {
      await command.action()
    } catch (error) {
      console.error('Command execution error:', error)
    }
    
    onClose()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'file': return <File size={14} />
      case 'edit': return <Search size={14} />
      case 'ai': return <Sparkles size={14} />
      case 'git': return <GitBranch size={14} />
      case 'view': return <Palette size={14} />
      case 'debug': return <Bug size={14} />
      case 'recent': return <Clock size={14} />
      default: return <Command size={14} />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[20vh] z-50">
      <div className="bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-editor-border">
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'ai' ? 'Describe what you want to generate...' :
              mode === 'files' ? 'Search files...' :
              'Type a command or search...'
            }
            className="flex-1 bg-transparent text-editor-text text-lg outline-none placeholder-gray-400"
          />
          {mode !== 'commands' && (
            <button
              onClick={() => {
                setMode('commands')
                setQuery('')
              }}
              className="text-gray-400 hover:text-editor-text ml-2"
            >
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Mode Indicators */}
        <div className="flex items-center justify-between px-4 py-2 bg-editor-bg border-b border-editor-border text-xs">
          <div className="flex space-x-4 text-gray-400">
            <span className={mode === 'commands' ? 'text-editor-accent' : ''}>
              Commands
            </span>
            <span className={mode === 'ai' ? 'text-editor-accent' : ''}>
              > AI Generate
            </span>
            <span className={mode === 'files' ? 'text-editor-accent' : ''}>
              @ Files
            </span>
          </div>
          <div className="text-gray-500">
            {filteredCommands.length} results
          </div>
        </div>

        {/* Commands List */}
        <div 
          ref={listRef}
          className="max-h-96 overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={command.id}
                className={`flex items-center justify-between p-3 hover:bg-editor-border cursor-pointer ${
                  index === selectedIndex ? 'bg-editor-border' : ''
                }`}
                onClick={() => executeCommand(command)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {command.icon}
                    {command.recent && (
                      <Clock size={12} className="text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-editor-text font-medium">
                        {command.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-editor-bg rounded text-gray-400">
                        {getCategoryIcon(command.category)}
                        <span className="ml-1">{command.category}</span>
                      </span>
                    </div>
                    {command.description && (
                      <div className="text-sm text-gray-400 truncate">
                        {command.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {command.shortcut && (
                  <div className="text-xs text-gray-400 bg-editor-bg px-2 py-1 rounded">
                    {command.shortcut}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-editor-border text-xs text-gray-400">
          <div>
            ↑↓ navigate • ⏎ select • esc close
          </div>
          <div>
            > AI generate • @ files
          </div>
        </div>
      </div>
    </div>
  )
}