/** 终端 spawn 参数 */
export interface TerminalSpawnOptions {
  cwd: string
  cols?: number
  rows?: number
}

/** 终端 resize 参数 */
export interface TerminalResizeOptions {
  cols: number
  rows: number
}

/** 应用视图模式 */
export type ViewMode = 'terminal' | 'chat'

/** Claude 进程状态 */
export type ClaudeStatus = 'idle' | 'running' | 'error' | 'stopped'

/** 聊天消息 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/** 流式事件 */
export interface StreamEvent {
  type: string
  message?: { role: string; content: Array<{ type: string; text?: string }> }
  result?: { role: string; content: Array<{ type: string; text?: string }>; stop_reason: string }
}

/** 文件树节点 */
export interface FileTreeNode {
  id: string
  name: string
  isDirectory: boolean
  children?: FileTreeNode[]
}
