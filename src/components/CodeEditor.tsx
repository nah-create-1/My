import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { X, Sparkles, Command } from 'lucide-react'
import { FileService } from '../services/FileService'
import { AIService } from '../services/AIService'
import { FileContent, CompletionRequest } from '../types'
import { CursorTab } from './CursorTab'
import { CommandPalette } from './CommandPalette'
import { Composer } from './Composer'

interface CodeEditorProps {
  currentFile: string | null
  openFiles: string[]
  onFileSelect: (filePath: string) => void
  onCloseFile: (filePath: string) => void
}

interface EditorTab {
  path: string
  name: string
  content: string
  isDirty: boolean
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  currentFile,
  openFiles,
  onFileSelect,
  onCloseFile
}) => {
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [editorContent, setEditorContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  // Load file content when currentFile changes
  useEffect(() => {
    if (currentFile) {
      loadFileContent(currentFile)
    }
  }, [currentFile])

  // Sync tabs with openFiles
  useEffect(() => {
    const newTabs = openFiles.map(filePath => {
      const existingTab = tabs.find(tab => tab.path === filePath)
      if (existingTab) {
        return existingTab
      }
      return {
        path: filePath,
        name: filePath.split('/').pop() || filePath,
        content: '',
        isDirty: false
      }
    })
    setTabs(newTabs)
  }, [openFiles])

  const loadFileContent = async (filePath: string) => {
    setIsLoading(true)
    try {
      const fileContent = await FileService.getFileContent(filePath)
      setEditorContent(fileContent.content)
      
      // Update tab content
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.path === filePath 
            ? { ...tab, content: fileContent.content, isDirty: false }
            : tab
        )
      )
    } catch (error) {
      console.error('Failed to load file content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && currentFile) {
      setEditorContent(value)
      
      // Mark tab as dirty
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.path === currentFile 
            ? { ...tab, content: value, isDirty: true }
            : tab
        )
      )
    }
  }

  const handleSave = async () => {
    if (currentFile && editorContent) {
      try {
        await FileService.saveFileContent(currentFile, editorContent)
        
        // Mark tab as clean
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.path === currentFile 
              ? { ...tab, isDirty: false }
              : tab
          )
        )
      } catch (error) {
        console.error('Failed to save file:', error)
      }
    }
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure editor
    editor.updateOptions({
      fontFamily: 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, monospace',
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: true },
      wordWrap: 'on',
      automaticLayout: true,
      suggest: {
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showKeywords: true,
        showWords: true,
        showColoredWords: true,
      }
    })

    // Register AI completion provider
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: async (model: any, position: any) => {
        try {
          const code = model.getValue()
          const language = FileService.getLanguageFromExtension(currentFile || '')
          
          const request: CompletionRequest = {
            code,
            language,
            position: {
              line: position.lineNumber,
              character: position.column
            },
            context: currentFile || undefined
          }

          const response = await AIService.getCodeCompletions(request)
          
          return {
            suggestions: response.completions.map(completion => ({
              label: completion.text,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: completion.text,
              detail: completion.detail,
              documentation: completion.documentation,
              range: completion.range
            }))
          }
        } catch (error) {
          console.error('Failed to get AI completions:', error)
          return { suggestions: [] }
        }
      }
    })

    // Cursor-specific keyboard shortcuts
    
    // Ctrl+S for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })

    // Ctrl+Shift+P for command palette
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      setIsCommandPaletteOpen(true)
    })

    // Ctrl+K for Composer
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        setSelectedFiles([currentFile || ''])
      }
      setIsComposerOpen(true)
    })

    // Ctrl+I for inline editing
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      // Trigger inline AI edit mode
      triggerInlineEdit()
    })

    // Setup WebSocket for real-time AI assistance
    AIService.connectWebSocket((data) => {
      if (data.type === 'suggestion' && data.filePath === currentFile) {
        // Handle real-time suggestions
        console.log('Received AI suggestion:', data)
      }
    })
  }

  const triggerInlineEdit = () => {
    if (!editorRef.current || !currentFile) return

    const selection = editorRef.current.getSelection()
    if (selection && !selection.isEmpty()) {
      // Show inline edit interface
      console.log('Triggering inline edit for selection')
      // This would open an inline AI edit interface
    }
  }

  const getLanguageFromFile = (filePath: string) => {
    return FileService.getLanguageFromExtension(filePath)
  }

  const getCurrentTab = () => {
    return tabs.find(tab => tab.path === currentFile)
  }

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center text-editor-text">
        <div className="text-center">
          <h3 className="text-lg mb-2">Welcome to AI Cursor</h3>
          <p className="text-sm opacity-70">Select a file to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Tabs */}
      <div className="flex bg-editor-sidebar border-b border-editor-border overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.path}
            className={`flex items-center px-3 py-2 border-r border-editor-border cursor-pointer min-w-0 ${
              currentFile === tab.path 
                ? 'bg-editor-bg text-editor-text' 
                : 'bg-editor-sidebar text-editor-text opacity-70 hover:opacity-100'
            }`}
            onClick={() => onFileSelect(tab.path)}
          >
            <span className="text-sm truncate mr-2">
              {tab.name}
              {tab.isDirty && ' •'}
            </span>
            <button
              className="p-0.5 hover:bg-editor-border rounded"
              onClick={(e) => {
                e.stopPropagation()
                onCloseFile(tab.path)
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-editor-text">Loading...</div>
          </div>
        ) : (
          <>
            <Editor
              height="100%"
              language={getLanguageFromFile(currentFile)}
              value={editorContent}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontFamily: 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, monospace',
                fontSize: 14,
                lineHeight: 20,
                minimap: { enabled: true },
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
            />
            
            {/* Cursor Tab Integration */}
            <CursorTab
              editor={editorRef.current}
              monaco={monacoRef.current}
              currentFile={currentFile}
              onSuggestionAccepted={(suggestion) => {
                console.log('Suggestion accepted:', suggestion)
              }}
            />
          </>
        )}
        
        {/* AI Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <button
            onClick={() => setIsComposerOpen(true)}
            className="p-2 bg-editor-sidebar hover:bg-editor-border rounded-md border border-editor-border"
            title="Open Composer (Ctrl+K)"
          >
            <Sparkles size={16} className="text-blue-400" />
          </button>
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="p-2 bg-editor-sidebar hover:bg-editor-border rounded-md border border-editor-border"
            title="Command Palette (Ctrl+Shift+P)"
          >
            <Command size={16} className="text-editor-text" />
          </button>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCommand={(command) => {
          console.log('Command executed:', command)
        }}
        currentFile={currentFile}
        editor={editorRef.current}
      />

      {/* Composer */}
      <Composer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        selectedFiles={selectedFiles}
        initialPrompt=""
      />

      {/* Status Bar */}
      <div className="h-6 bg-editor-accent flex items-center justify-between px-3 text-xs text-white">
        <div className="flex items-center space-x-4">
          <span>{getLanguageFromFile(currentFile)}</span>
          {getCurrentTab()?.isDirty && <span>• Unsaved changes</span>}
        </div>
        <div className="flex items-center space-x-4">
          <span>AI: Qwen Coder v3</span>
          <span>Sensorless Mode</span>
        </div>
      </div>
    </div>
  )
}