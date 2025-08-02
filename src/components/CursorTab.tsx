import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AIService } from '../services/AIService'
import { FileService } from '../services/FileService'

interface CursorTabProps {
  editor: any
  monaco: any
  currentFile: string | null
  onSuggestionAccepted?: (suggestion: string) => void
}

interface InlineSuggestion {
  id: string
  text: string
  range: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
  confidence: number
  type: 'completion' | 'line' | 'block'
}

interface GhostTextWidget {
  dispose: () => void
  setGhostText: (text: string, range: any) => void
  hide: () => void
}

export const CursorTab: React.FC<CursorTabProps> = ({
  editor,
  monaco,
  currentFile,
  onSuggestionAccepted
}) => {
  const [currentSuggestion, setCurrentSuggestion] = useState<InlineSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastTriggerTime, setLastTriggerTime] = useState(0)
  const ghostTextWidgetRef = useRef<GhostTextWidget | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastPositionRef = useRef<{ line: number; column: number } | null>(null)

  // Debounce delay for triggering suggestions
  const DEBOUNCE_DELAY = 300
  const MIN_TRIGGER_INTERVAL = 100

  useEffect(() => {
    if (!editor || !monaco) return

    // Create ghost text widget for inline suggestions
    createGhostTextWidget()

    // Set up event listeners
    const disposables = [
      editor.onDidChangeCursorPosition(handleCursorPositionChange),
      editor.onDidChangeModelContent(handleContentChange),
      editor.onKeyDown(handleKeyDown),
      editor.onDidFocusEditorText(() => triggerSuggestion()),
    ]

    // Add custom commands
    editor.addCommand(monaco.KeyCode.Tab, () => {
      if (currentSuggestion) {
        acceptSuggestion()
      } else {
        // Default tab behavior
        editor.trigger('keyboard', 'tab', null)
      }
    })

    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (currentSuggestion) {
        dismissSuggestion()
      }
    })

    // Add context menu actions
    editor.addAction({
      id: 'cursor-tab-trigger',
      label: 'Trigger AI Suggestion',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ],
      run: () => {
        triggerSuggestion(true)
      }
    })

    return () => {
      disposables.forEach(d => d.dispose())
      if (ghostTextWidgetRef.current) {
        ghostTextWidgetRef.current.dispose()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [editor, monaco])

  const createGhostTextWidget = () => {
    if (!editor || !monaco) return

    let ghostDecorations: string[] = []
    let isVisible = false

    const widget: GhostTextWidget = {
      setGhostText: (text: string, range: any) => {
        // Remove existing decorations
        if (ghostDecorations.length > 0) {
          editor.deltaDecorations(ghostDecorations, [])
        }

        if (!text || !range) return

        // Create ghost text decoration
        const decoration = {
          range: new monaco.Range(
            range.startLineNumber,
            range.startColumn,
            range.endLineNumber,
            range.endColumn
          ),
          options: {
            after: {
              content: text,
              inlineClassName: 'cursor-tab-ghost-text'
            },
            showIfCollapsed: true,
          }
        }

        ghostDecorations = editor.deltaDecorations([], [decoration])
        isVisible = true

        // Add custom CSS for ghost text if not already added
        addGhostTextStyles()
      },

      hide: () => {
        if (ghostDecorations.length > 0) {
          editor.deltaDecorations(ghostDecorations, [])
          ghostDecorations = []
        }
        isVisible = false
      },

      dispose: () => {
        widget.hide()
      }
    }

    ghostTextWidgetRef.current = widget
  }

  const addGhostTextStyles = () => {
    const styleId = 'cursor-tab-ghost-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .cursor-tab-ghost-text {
        color: #666666 !important;
        font-style: italic;
        opacity: 0.6;
      }
      .cursor-tab-ghost-text::before {
        content: '';
        border-left: 1px solid #666666;
        margin-right: 2px;
        opacity: 0.5;
      }
    `
    document.head.appendChild(style)
  }

  const handleCursorPositionChange = useCallback((e: any) => {
    const position = editor.getPosition()
    if (!position) return

    // Check if cursor moved significantly
    if (lastPositionRef.current) {
      const lastPos = lastPositionRef.current
      const lineDiff = Math.abs(position.lineNumber - lastPos.line)
      const colDiff = Math.abs(position.column - lastPos.column)
      
      if (lineDiff > 0 || colDiff > 2) {
        dismissSuggestion()
      }
    }

    lastPositionRef.current = { line: position.lineNumber, column: position.column }
    
    // Debounce suggestion trigger
    debouncedTriggerSuggestion()
  }, [editor])

  const handleContentChange = useCallback((e: any) => {
    const now = Date.now()
    setLastTriggerTime(now)

    // If user is actively typing, dismiss current suggestion
    if (currentSuggestion) {
      dismissSuggestion()
    }

    // Trigger new suggestion after a delay
    debouncedTriggerSuggestion()
  }, [currentSuggestion])

  const handleKeyDown = useCallback((e: any) => {
    if (!currentSuggestion) return

    switch (e.keyCode) {
      case monaco.KeyCode.Tab:
        e.preventDefault()
        e.stopPropagation()
        acceptSuggestion()
        break
      case monaco.KeyCode.Escape:
        e.preventDefault()
        dismissSuggestion()
        break
      case monaco.KeyCode.RightArrow:
        // Accept word by word with right arrow
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          acceptPartialSuggestion()
        }
        break
    }
  }, [currentSuggestion, monaco])

  const debouncedTriggerSuggestion = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const now = Date.now()
      if (now - lastTriggerTime >= MIN_TRIGGER_INTERVAL) {
        triggerSuggestion()
      }
    }, DEBOUNCE_DELAY)
  }, [lastTriggerTime])

  const triggerSuggestion = async (force = false) => {
    if (!editor || !monaco || !currentFile) return
    if (isLoading && !force) return

    const position = editor.getPosition()
    if (!position) return

    const model = editor.getModel()
    if (!model) return

    setIsLoading(true)

    try {
      // Get current context
      const code = model.getValue()
      const lineContent = model.getLineContent(position.lineNumber)
      const beforeCursor = lineContent.substring(0, position.column - 1)
      const afterCursor = lineContent.substring(position.column - 1)

      // Check if we should trigger suggestion
      if (!shouldTriggerSuggestion(beforeCursor, afterCursor) && !force) {
        setIsLoading(false)
        return
      }

      // Get language from file extension
      const language = FileService.getLanguageFromExtension(currentFile)

      // Request AI suggestion
      const suggestion = await AIService.getInlineSuggestion({
        code,
        language,
        position: {
          line: position.lineNumber,
          character: position.column
        },
        context: {
          beforeCursor,
          afterCursor,
          fileName: currentFile
        }
      })

      if (suggestion && suggestion.text) {
        const newSuggestion: InlineSuggestion = {
          id: Date.now().toString(),
          text: suggestion.text,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          },
          confidence: suggestion.confidence || 0.8,
          type: detectSuggestionType(suggestion.text)
        }

        setCurrentSuggestion(newSuggestion)
        showGhostText(newSuggestion)
      }
    } catch (error) {
      console.error('Error getting inline suggestion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const shouldTriggerSuggestion = (beforeCursor: string, afterCursor: string): boolean => {
    // Don't trigger in comments
    if (beforeCursor.trim().startsWith('//') || beforeCursor.trim().startsWith('/*')) {
      return false
    }

    // Don't trigger in strings
    const quotes = ['"', "'", '`']
    for (const quote of quotes) {
      const beforeQuotes = beforeCursor.split(quote).length - 1
      if (beforeQuotes % 2 === 1) return false
    }

    // Trigger after certain characters/patterns
    const triggerPatterns = [
      /\w+\s*$/, // After words
      /\.\s*$/, // After dot
      /\(\s*$/, // After opening parenthesis
      /{\s*$/, // After opening brace
      /=\s*$/, // After equals
      /:\s*$/, // After colon
      /,\s*$/, // After comma
    ]

    return triggerPatterns.some(pattern => pattern.test(beforeCursor))
  }

  const detectSuggestionType = (text: string): 'completion' | 'line' | 'block' => {
    if (text.includes('\n')) {
      return text.split('\n').length > 3 ? 'block' : 'line'
    }
    return 'completion'
  }

  const showGhostText = (suggestion: InlineSuggestion) => {
    if (!ghostTextWidgetRef.current) return

    ghostTextWidgetRef.current.setGhostText(suggestion.text, suggestion.range)
  }

  const acceptSuggestion = () => {
    if (!currentSuggestion || !editor) return

    const position = editor.getPosition()
    if (!position) return

    // Insert the suggestion
    editor.executeEdits('cursor-tab', [{
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ),
      text: currentSuggestion.text
    }])

    // Move cursor to end of inserted text
    const lines = currentSuggestion.text.split('\n')
    const newPosition = {
      lineNumber: position.lineNumber + lines.length - 1,
      column: lines.length === 1 
        ? position.column + currentSuggestion.text.length
        : lines[lines.length - 1].length + 1
    }
    editor.setPosition(newPosition)

    // Notify parent component
    onSuggestionAccepted?.(currentSuggestion.text)

    // Clean up
    dismissSuggestion()
  }

  const acceptPartialSuggestion = () => {
    if (!currentSuggestion || !editor) return

    // Accept one word at a time
    const words = currentSuggestion.text.split(/(\s+)/)
    if (words.length > 0) {
      const firstWord = words[0]
      
      const position = editor.getPosition()
      if (!position) return

      editor.executeEdits('cursor-tab-partial', [{
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        text: firstWord
      }])

      // Update suggestion with remaining text
      const remainingText = currentSuggestion.text.substring(firstWord.length)
      if (remainingText.trim()) {
        const updatedSuggestion = {
          ...currentSuggestion,
          text: remainingText,
          range: {
            ...currentSuggestion.range,
            startColumn: currentSuggestion.range.startColumn + firstWord.length
          }
        }
        setCurrentSuggestion(updatedSuggestion)
        showGhostText(updatedSuggestion)
      } else {
        dismissSuggestion()
      }
    }
  }

  const dismissSuggestion = () => {
    setCurrentSuggestion(null)
    if (ghostTextWidgetRef.current) {
      ghostTextWidgetRef.current.hide()
    }
  }

  // This component doesn't render anything visible - it's a service component
  return null
}