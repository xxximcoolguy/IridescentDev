import { useAppStore } from '../../stores/app-store'
import type { ClaudeStatus } from '../../../../shared/types'
import './StatusBar.css'

/** 状态文字映射 */
const STATUS_LABELS: Record<ClaudeStatus, string> = {
  idle: '就绪',
  running: '运行中',
  error: '出错',
  stopped: '已停止'
}

/** 底部状态栏组件 */
export function StatusBar(): JSX.Element {
  const claudeStatus = useAppStore((s) => s.claudeStatus)
  const workingDirectory = useAppStore((s) => s.workingDirectory)

  return (
    <div className="status-bar">
      {/* 左侧：运行状态 */}
      <div className="status-bar-left">
        <span className={`status-dot ${claudeStatus}`} />
        <span className="status-text">{STATUS_LABELS[claudeStatus]}</span>
      </div>

      {/* 中间：工作目录路径 */}
      <div className="status-bar-center">
        {workingDirectory ?? ''}
      </div>
    </div>
  )
}
