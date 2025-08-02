'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGesture } from 'react-use-gesture'
import { 
  Code2, 
  MessageSquare, 
  Settings, 
  Menu, 
  Search,
  Sparkles,
  Play,
  FileText,
  Smartphone,
  Zap
} from 'lucide-react'

import { MobileHeader } from '@/components/mobile/MobileHeader'
import { MobileNavigation } from '@/components/mobile/MobileNavigation'
import { MobileEditor } from '@/components/mobile/MobileEditor'
import { MobileChat } from '@/components/mobile/MobileChat'
import { MobileFileExplorer } from '@/components/mobile/MobileFileExplorer'
import { MobileComposer } from '@/components/mobile/MobileComposer'
import { MobileCommandPalette } from '@/components/mobile/MobileCommandPalette'
import { WelcomeScreen } from '@/components/mobile/WelcomeScreen'
import { LoadingScreen } from '@/components/mobile/LoadingScreen'
import { useAppStore } from '@/lib/stores/app-store'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome')
  
  const {
    isChatOpen,
    isFileExplorerOpen,
    isComposerOpen,
    isCommandPaletteOpen,
    currentFile,
    openFiles,
    setIsChatOpen,
    setIsFileExplorerOpen,
    setIsComposerOpen,
    setIsCommandPaletteOpen,
  } = useAppStore()

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if user has used the app before
        const hasVisited = localStorage.getItem('cursor-mobile-visited')
        if (hasVisited) {
          setCurrentView('editor')
        } else {
          localStorage.setItem('cursor-mobile-visited', 'true')
          setCurrentView('welcome')
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  // Handle swipe gestures for mobile navigation
  const bind = useGesture({
    onDrag: ({ movement: [mx, my], direction: [xDir], velocity, last }) => {
      // Swipe right to open file explorer
      if (xDir > 0 && mx > 100 && Math.abs(my) < 100 && last) {
        if (!isFileExplorerOpen && !isChatOpen) {
          setIsFileExplorerOpen(true)
        }
      }
      
      // Swipe left to open chat
      if (xDir < 0 && mx < -100 && Math.abs(my) < 100 && last) {
        if (!isChatOpen && !isFileExplorerOpen) {
          setIsChatOpen(true)
        }
      }

      // Swipe up to open composer
      if (my < -150 && Math.abs(mx) < 100 && last) {
        if (!isComposerOpen) {
          setIsComposerOpen(true)
        }
      }
    }
  })

  const handleGetStarted = () => {
    setCurrentView('editor')
  }

  const handleOpenFile = (filePath: string) => {
    // Implementation for opening files
    console.log('Opening file:', filePath)
  }

  const handleCreateFile = () => {
    // Implementation for creating new files
    console.log('Creating new file')
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (currentView === 'welcome') {
    return <WelcomeScreen onGetStarted={handleGetStarted} />
  }

  return (
    <div className="h-screen bg-cursor-bg text-cursor-text overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader 
        title={currentFile ? currentFile.split('/').pop() || 'Untitled' : 'Cursor Mobile AI'}
        onMenuClick={() => setIsFileExplorerOpen(true)}
        onSearchClick={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <main 
        {...bind()}
        className="h-full pt-mobile-header pb-mobile-nav touch-manipulation will-change-transform"
      >
        <div className="relative h-full">
          {/* Editor Area */}
          <div className="h-full">
            {currentFile ? (
              <MobileEditor 
                filePath={currentFile}
                onFileChange={(content) => {
                  // Handle file content changes
                  console.log('File changed:', content)
                }}
              />
            ) : (
              <EmptyEditorState 
                onCreateFile={handleCreateFile}
                onOpenFile={() => setIsFileExplorerOpen(true)}
              />
            )}
          </div>

          {/* Gesture Indicators */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Swipe indicators */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-20">
              <div className="flex items-center text-xs text-cursor-muted">
                <Menu size={16} />
                <span className="ml-1">Swipe →</span>
              </div>
            </div>
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-20">
              <div className="flex items-center text-xs text-cursor-muted">
                <span className="mr-1">← Swipe</span>
                <MessageSquare size={16} />
              </div>
            </div>

            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 opacity-20">
              <div className="flex flex-col items-center text-xs text-cursor-muted">
                <span>Swipe ↑</span>
                <Sparkles size={16} className="mt-1" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation 
        activeTab={isChatOpen ? 'chat' : isFileExplorerOpen ? 'files' : 'editor'}
        onTabChange={(tab) => {
          setIsChatOpen(false)
          setIsFileExplorerOpen(false)
          
          switch (tab) {
            case 'chat':
              setIsChatOpen(true)
              break
            case 'files':
              setIsFileExplorerOpen(true)
              break
            case 'composer':
              setIsComposerOpen(true)
              break
            case 'command':
              setIsCommandPaletteOpen(true)
              break
          }
        }}
      />

      {/* Overlays and Modals */}
      <AnimatePresence>
        {/* File Explorer Drawer */}
        {isFileExplorerOpen && (
          <MobileFileExplorer
            isOpen={isFileExplorerOpen}
            onClose={() => setIsFileExplorerOpen(false)}
            onFileSelect={handleOpenFile}
          />
        )}

        {/* Chat Drawer */}
        {isChatOpen && (
          <MobileChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            currentFile={currentFile}
          />
        )}

        {/* Composer Modal */}
        {isComposerOpen && (
          <MobileComposer
            isOpen={isComposerOpen}
            onClose={() => setIsComposerOpen(false)}
            selectedFiles={openFiles}
          />
        )}

        {/* Command Palette */}
        {isCommandPaletteOpen && (
          <MobileCommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            currentFile={currentFile}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Empty state when no file is open
function EmptyEditorState({ 
  onCreateFile, 
  onOpenFile 
}: { 
  onCreateFile: () => void
  onOpenFile: () => void 
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm"
      >
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-cursor-accent/10 rounded-full flex items-center justify-center">
            <Code2 size={32} className="text-cursor-accent" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Cursor Mobile AI</h2>
          <p className="text-cursor-muted text-sm leading-relaxed">
            Start coding with AI assistance. Create a new file or open an existing project to begin.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onCreateFile}
            className="w-full touch-button bg-cursor-accent text-white hover:bg-cursor-accent/90 text-sm font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <div className="flex items-center justify-center">
              <FileText size={18} className="mr-2" />
              Create New File
            </div>
          </button>

          <button
            onClick={onOpenFile}
            className="w-full touch-button bg-cursor-hover text-cursor-text hover:bg-cursor-border text-sm font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <div className="flex items-center justify-center">
              <Menu size={18} className="mr-2" />
              Browse Files
            </div>
          </button>
        </div>

        <div className="mt-8 space-y-2 text-xs text-cursor-muted">
          <div className="flex items-center justify-center">
            <Smartphone size={14} className="mr-1" />
            Optimized for mobile
          </div>
          <div className="flex items-center justify-center">
            <Zap size={14} className="mr-1" />
            AI-powered coding assistance
          </div>
        </div>
      </motion.div>
    </div>
  )
}