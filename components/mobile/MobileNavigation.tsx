'use client'

import { motion } from 'framer-motion'
import { 
  Code2, 
  MessageSquare, 
  FolderOpen, 
  Sparkles, 
  Command,
  Plus,
  Search,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'editor' | 'files' | 'chat' | 'composer' | 'command' | 'settings'

interface MobileNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  className?: string
}

interface NavTab {
  id: TabType
  label: string
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  badge?: number
  color: string
}

export function MobileNavigation({
  activeTab,
  onTabChange,
  className
}: MobileNavigationProps) {
  const tabs: NavTab[] = [
    {
      id: 'files',
      label: 'Files',
      icon: <FolderOpen size={20} />,
      color: 'text-blue-400'
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: <Code2 size={20} />,
      color: 'text-green-400'
    },
    {
      id: 'composer',
      label: 'AI',
      icon: <Sparkles size={20} />,
      color: 'text-purple-400'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare size={20} />,
      color: 'text-yellow-400'
    },
    {
      id: 'command',
      label: 'Search',
      icon: <Search size={20} />,
      color: 'text-cursor-accent'
    }
  ]

  const handleTabPress = (tabId: TabType) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onTabChange(tabId)
  }

  return (
    <nav className={cn(
      'mobile-nav flex items-center justify-around',
      'bg-cursor-sidebar/95 backdrop-blur-md border-t border-cursor-border',
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTabPress(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1',
              'touch-manipulation relative transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-cursor-accent focus:ring-opacity-50 rounded-lg'
            )}
            aria-label={tab.label}
            role="tab"
            aria-selected={isActive}
          >
            {/* Tab Content */}
            <div className="flex flex-col items-center space-y-1">
              {/* Icon with animation */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'relative transition-colors duration-200',
                  isActive ? tab.color : 'text-cursor-muted'
                )}
              >
                {tab.icon}
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-cursor-accent rounded-full"
                  />
                )}
                
                {/* Badge for notifications */}
                {tab.badge && tab.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </motion.div>
                )}
              </motion.div>
              
              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200 truncate max-w-full',
                  isActive ? 'text-cursor-text' : 'text-cursor-muted'
                )}
              >
                {tab.label}
              </span>
            </div>
            
            {/* Active tab background */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-cursor-hover rounded-lg opacity-50"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
      
      {/* Quick Action Button (FAB-style) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleTabPress('composer')}
        className={cn(
          'absolute right-4 -top-6 w-12 h-12 rounded-full',
          'bg-cursor-accent text-white shadow-lg',
          'flex items-center justify-center',
          'touch-manipulation focus:outline-none focus:ring-2 focus:ring-cursor-accent focus:ring-opacity-50',
          'transition-all duration-200 hover:scale-105'
        )}
        aria-label="Quick AI Composer"
      >
        <motion.div
          animate={{ rotate: activeTab === 'composer' ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus size={24} />
        </motion.div>
      </motion.button>
    </nav>
  )
}

// Hook for programmatic navigation
export function useMobileNavigation() {
  const handleNavigate = (tab: TabType) => {
    // You can add analytics, state updates, etc. here
    console.log(`Navigating to: ${tab}`)
  }
  
  return { handleNavigate }
}