import { useEffect } from 'react'
import { useAppStore } from '../../stores/app-store'
import type { ViewMode } from '../../../../shared/types'
import './ViewToggle.css'

const VIEW_OPTIONS: { mode: ViewMode; label: string; shortcut: string }[] = [
  { mode: 'terminal', label: 'Terminal', shortcut: 'Ctrl+1' },
  { mode: 'chat', label: 'Chat', shortcut: 'Ctrl+2' }
]

export function ViewToggle(): JSX.Element {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        setViewMode('terminal')
      } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        setViewMode('chat')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setViewMode])

  return (
    <div className="view-toggle">
      {VIEW_OPTIONS.map(({ mode, label, shortcut }) => (
        <button
          key={mode}
          className={`view-toggle-btn ${viewMode === mode ? 'active' : ''}`}
          onClick={() => setViewMode(mode)}
          title={shortcut}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
