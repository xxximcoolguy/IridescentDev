import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../stores/app-store'
import './TitleBar.css'

/** 自定义标题栏组件 */
export function TitleBar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)
  const workingDirectory = useAppStore((s) => s.workingDirectory)

  // 初始化最大化状态并监听变化
  useEffect(() => {
    window.api.window.isMaximized().then(setIsMaximized)
    const cleanup = window.api.window.onMaximizedChanged(setIsMaximized)
    return cleanup
  }, [])

  const handleMinimize = useCallback(() => {
    window.api.window.minimize()
  }, [])

  const handleMaximize = useCallback(() => {
    window.api.window.maximize()
  }, [])

  const handleClose = useCallback(() => {
    window.api.window.close()
  }, [])

  return (
    <div className="title-bar">
      {/* 左侧：应用图标 + 标题 */}
      <div className="title-bar-left">
        <span className="title-bar-icon">{'>'}_</span>
        <span className="title-bar-title">Claude Code UI</span>
      </div>

      {/* 中间：工作目录路径 */}
      <div className="title-bar-center">
        {workingDirectory ?? ''}
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div className="title-bar-controls">
        <button className="title-bar-btn" onClick={handleMinimize} title="最小化">
          <svg viewBox="0 0 10 1">
            <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>

        <button className="title-bar-btn" onClick={handleMaximize} title={isMaximized ? '还原' : '最大化'}>
          {isMaximized ? (
            // 还原图标：两个重叠的矩形
            <svg viewBox="0 0 10 10">
              <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="0" y="2" width="8" height="8" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            // 最大化图标：单个矩形
            <svg viewBox="0 0 10 10">
              <rect x="0" y="0" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>

        <button className="title-bar-btn close" onClick={handleClose} title="关闭">
          <svg viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
