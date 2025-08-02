import React, { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import { FileNode } from '../types'

interface FileExplorerProps {
  fileTree: FileNode[]
  onFileSelect: (filePath: string) => void
  currentFile: string | null
}

interface FileTreeItemProps {
  node: FileNode
  level: number
  onFileSelect: (filePath: string) => void
  currentFile: string | null
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level,
  onFileSelect,
  currentFile,
  expandedDirs,
  onToggleDir
}) => {
  const isExpanded = expandedDirs.has(node.path)
  const isSelected = currentFile === node.path
  const paddingLeft = level * 16 + 8

  const handleClick = () => {
    if (node.type === 'directory') {
      onToggleDir(node.path)
    } else {
      onFileSelect(node.path)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    // You could extend this with more specific icons based on file types
    return <File size={16} className="text-editor-text opacity-70" />
  }

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-editor-border cursor-pointer ${
          isSelected ? 'bg-editor-accent text-white' : 'text-editor-text'
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            {isExpanded ? (
              <FolderOpen size={16} className="mr-2 text-blue-400" />
            ) : (
              <Folder size={16} className="mr-2 text-blue-400" />
            )}
          </>
        ) : (
          <>
            <span className="w-4 mr-1" />
            <span className="mr-2">{getFileIcon(node.name)}</span>
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              currentFile={currentFile}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  fileTree,
  onFileSelect,
  currentFile
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src']))

  const handleToggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-editor-border">
        <h2 className="text-sm font-semibold text-editor-text">EXPLORER</h2>
        <div className="flex items-center space-x-2">
          <button
            className="p-1 hover:bg-editor-border rounded"
            title="New File"
          >
            <Plus size={14} className="text-editor-text" />
          </button>
          <button
            className="p-1 hover:bg-editor-border rounded"
            title="More Actions"
          >
            <MoreHorizontal size={14} className="text-editor-text" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {fileTree.length > 0 ? (
          fileTree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              level={0}
              onFileSelect={onFileSelect}
              currentFile={currentFile}
              expandedDirs={expandedDirs}
              onToggleDir={handleToggleDir}
            />
          ))
        ) : (
          <div className="p-4 text-sm text-editor-text opacity-60">
            No files found
          </div>
        )}
      </div>
    </div>
  )
}