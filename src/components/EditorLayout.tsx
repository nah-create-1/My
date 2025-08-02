import React from 'react'
import { MessageSquare } from 'lucide-react'

interface EditorLayoutProps {
  sidebar: React.ReactNode
  editor: React.ReactNode
  chat?: React.ReactNode
  onToggleChat: () => void
  isChatOpen: boolean
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  sidebar,
  editor,
  chat,
  onToggleChat,
  isChatOpen
}) => {
  return (
    <div className="h-screen flex bg-editor-bg">
      {/* Sidebar */}
      <div className="w-64 bg-editor-sidebar border-r border-editor-border flex-shrink-0">
        {sidebar}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1 relative">
          {editor}
          
          {/* Chat Toggle Button */}
          <button
            onClick={onToggleChat}
            className={`absolute top-4 right-4 p-2 rounded-md transition-colors z-10 ${
              isChatOpen 
                ? 'bg-editor-accent text-white' 
                : 'bg-editor-sidebar hover:bg-editor-border text-editor-text'
            }`}
            title="Toggle AI Chat"
          >
            <MessageSquare size={20} />
          </button>
        </div>

        {/* Chat Panel */}
        {chat && (
          <div className="w-80 bg-editor-sidebar border-l border-editor-border flex-shrink-0">
            {chat}
          </div>
        )}
      </div>
    </div>
  )
}