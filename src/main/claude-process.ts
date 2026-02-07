import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as os from 'os'

/** 流式事件类型 */
export interface StreamEvent {
  type: string
  subtype?: string
  session_id?: string
  message?: { role: string; content: Array<{ type: string; text?: string }> }
  result?: string
  is_error?: boolean
  total_cost_usd?: number
}

/** 聊天消息类型 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Claude CLI 非交互模式进程管理器
 *
 * 直接 spawn claude.exe（全路径），通过 stdin pipe 传入消息，
 * 以 stream-json 格式接收流式输出并逐行解析事件。
 */
export class ClaudeProcess {
  private process: ChildProcess | null = null
  private cwd: string = ''
  private sessionId: string | null = null
  private onStreamCallback: ((event: StreamEvent) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private onDoneCallback: (() => void) | null = null
  private onSessionIdCallback: ((sessionId: string) => void) | null = null

  /** 获取 claude.exe 的完整路径 */
  private getClaudePath(): string {
    const home = os.homedir()
    return path.join(home, '.local', 'bin', 'claude.exe')
  }

  /** 设置工作目录 */
  setCwd(cwd: string): void {
    this.cwd = cwd
  }

  /** 设置会话 ID（用于 --resume 恢复会话） */
  setSessionId(id: string | null): void {
    this.sessionId = id
  }

  /** 注册 session_id 回调（从 Claude CLI system 事件获取） */
  onSessionId(callback: (sessionId: string) => void): void {
    this.onSessionIdCallback = callback
  }

  /** 发送消息给 Claude (非���互模式) */
  sendMessage(message: string): void {
    // 如果已有进程在运行，先终止
    this.abort()

    const args = ['-p', '--output-format', 'stream-json', '--verbose']

    // 如果有 sessionId，添加 --resume 参数恢复会话
    if (this.sessionId) {
      args.push('--resume', this.sessionId)
    }

    // 直接 spawn claude.exe 全路径，不经过 cmd /c 包装，确保 stdin pipe 正常
    const claudePath = this.getClaudePath()
    this.process = spawn(claudePath, args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    })

    console.log('[Claude] spawned pid:', this.process.pid, 'path:', claudePath, 'args:', args.join(' '))

    // stdin 错误处理
    this.process.stdin?.on('error', (err) => {
      console.error('[Claude stdin error]', err.message)
    })

    // 写入消息后关闭 stdin
    this.process.stdin?.write(message, 'utf-8', () => {
      this.process?.stdin?.end()
    })

    let buffer = ''

    this.process.stdout?.setEncoding('utf-8')
    this.process.stdout?.on('data', (chunk: string) => {
      console.log('[Claude stdout]', chunk.substring(0, 100))
      buffer += chunk
      // 按行解析
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 最后一个可能不完整，保留
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const event = JSON.parse(trimmed) as StreamEvent
          this.onStreamCallback?.(event)
          // 从 system 事件中提取 session_id
          if (event.type === 'system' && event.session_id) {
            this.onSessionIdCallback?.(event.session_id)
          }
        } catch {
          // 忽略非 JSON 行
        }
      }
    })

    this.process.stderr?.setEncoding('utf-8')
    this.process.stderr?.on('data', (chunk: string) => {
      console.log('[Claude stderr]', chunk.substring(0, 200))
      this.onErrorCallback?.(chunk)
    })

    this.process.on('error', (err) => {
      console.error('[Claude spawn error]', err.message)
    })

    this.process.on('close', (code) => {
      console.log('[Claude close] exit code:', code)
      // 处理 buffer 中剩余数据
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer.trim()) as StreamEvent
          this.onStreamCallback?.(event)
        } catch {
          /* 忽略 */
        }
      }
      this.process = null
      this.onDoneCallback?.()
    })
  }

  /** 中止当前进程 */
  abort(): void {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }

  /** 注册流式事件回调 */
  onStream(callback: (event: StreamEvent) => void): void {
    this.onStreamCallback = callback
  }

  /** 注册错误回调 */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback
  }

  /** 注册完成回调 */
  onDone(callback: () => void): void {
    this.onDoneCallback = callback
  }

  /** 当前是否有进程在运行 */
  get isRunning(): boolean {
    return this.process !== null
  }
}
