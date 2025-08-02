'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  Search, 
  MoreVertical, 
  Wifi, 
  WifiOff,
  Battery,
  Signal,
  Sparkles,
  Save,
  Settings
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/app-store'
import { cn, isOnline, truncateText } from '@/lib/utils'

interface MobileHeaderProps {
  title: string
  onMenuClick: () => void
  onSearchClick: () => void
  showSaveButton?: boolean
  showSettings?: boolean
  className?: string
}

export function MobileHeader({
  title,
  onMenuClick,
  onSearchClick,
  showSaveButton = false,
  showSettings = false,
  className
}: MobileHeaderProps) {
  const [isNetworkOnline, setIsNetworkOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  
  const { 
    currentFile,
    fileContents,
    setFileContent,
    aiEnabled 
  } = useAppStore()

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Monitor network status
  useEffect(() => {
    setIsNetworkOnline(isOnline())
    
    const handleOnline = () => setIsNetworkOnline(true)
    const handleOffline = () => setIsNetworkOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get battery info if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100))
        }
        
        battery.addEventListener('levelchange', updateBattery)
        return () => battery.removeEventListener('levelchange', updateBattery)
      })
    }
  }, [])

  const handleSave = async () => {
    if (!currentFile) return
    
    try {
      const content = fileContents[currentFile] || ''
      // Here you would typically save to a backend or local storage
      setFileContent(currentFile, content)
      
      // Show save feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const truncatedTitle = truncateText(title, 25)

  return (
    <header className={cn(
      'mobile-header flex items-center justify-between px-4 py-2',
      'bg-cursor-bg/95 backdrop-blur-md border-b border-cursor-border',
      className
    )}>
      {/* Left Section */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className="touch-button p-2 rounded-lg hover:bg-cursor-hover"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-cursor-text" />
        </motion.button>

        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-sm font-semibold text-cursor-text truncate">
            {truncatedTitle}
          </h1>
          {currentFile && (
            <p className="text-xs text-cursor-muted truncate">
              {currentFile}
            </p>
          )}
        </div>
      </div>

      {/* Center Section - Status Indicators */}
      <div className="flex items-center space-x-2 px-2">
        {/* AI Status */}
        {aiEnabled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center"
          >
            <Sparkles size={14} className="text-cursor-accent" />
          </motion.div>
        )}

        {/* Network Status */}
        <div className="flex items-center">
          {isNetworkOnline ? (
            <Wifi size={14} className="text-cursor-text" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
        </div>

        {/* Battery (if available) */}
        {batteryLevel !== null && (
          <div className="flex items-center space-x-1">
            <Battery 
              size={14} 
              className={cn(
                batteryLevel > 20 ? 'text-cursor-text' : 'text-red-400'
              )}
            />
            <span className="text-xs text-cursor-muted">
              {batteryLevel}%
            </span>
          </div>
        )}

        {/* Time */}
        <div className="text-xs text-cursor-muted font-mono">
          {currentTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {showSaveButton && currentFile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="touch-button p-2 rounded-lg bg-cursor-accent text-white hover:bg-cursor-accent/90"
            aria-label="Save file"
          >
            <Save size={16} />
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSearchClick}
          className="touch-button p-2 rounded-lg hover:bg-cursor-hover"
          aria-label="Search"
        >
          <Search size={20} className="text-cursor-text" />
        </motion.button>

        {showSettings && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {/* Handle settings */}}
            className="touch-button p-2 rounded-lg hover:bg-cursor-hover"
            aria-label="Settings"
          >
            <Settings size={20} className="text-cursor-text" />
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {/* Handle more options */}}
          className="touch-button p-2 rounded-lg hover:bg-cursor-hover"
          aria-label="More options"
        >
          <MoreVertical size={20} className="text-cursor-text" />
        </motion.button>
      </div>
    </header>
  )
}