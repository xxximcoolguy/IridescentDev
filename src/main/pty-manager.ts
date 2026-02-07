import * as pty from 'node-pty'
import { DEFAULT_TERMINAL_OPTIONS } from '../shared/constants'
import type { TerminalSpawnOptions, TerminalResizeOptions } from '../shared/types'

/** PTY 进程管理器 */
export class PtyManager {
  private process: pty.IPty | null = null
  private onDataCallback: ((data: string) => void) | null = null
  private onExitCallback: ((exitCode: number) => void) | null = null

  /** 启动 claude CLI */
  spawn(options: TerminalSpawnOptions): void {
    this.kill()

    // Windows 上使用 cmd.exe 交互式 shell 启动 claude
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
    const args: string[] = []
    const cols = options.cols ?? DEFAULT_TERMINAL_OPTIONS.cols
    const rows = options.rows ?? DEFAULT_TERMINAL_OPTIONS.rows

    this.process = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: options.cwd,
      env: process.env as Record<string, string>,
      useConpty: true
    })

    console.log('[PTY] spawned', shell, 'pid:', this.process.pid)

    this.process.onData((data) => {
      this.onDataCallback?.(data)
    })

    this.process.onExit(({ exitCode }) => {
      this.onExitCallback?.(exitCode)
      this.process = null
    })

    // cmd.exe 启动后自动执行 claude 命令
    if (process.platform === 'win32') {
      setTimeout(() => {
        this.process?.write('claude\r')
      }, 500)
    }
  }

  /** 向终端写入数据 */
  write(data: string): void {
    this.process?.write(data)
  }

  /** 调整终端大小 */
  resize(options: TerminalResizeOptions): void {
    if (this.process) {
      try {
        this.process.resize(options.cols, options.rows)
      } catch {
        // resize 可能在进程退出后调用，忽略错误
      }
    }
  }

  /** 终止进程 */
  kill(): void {
    if (this.process) {
      try {
        this.process.kill()
      } catch {
        // 进程可能已退出
      }
      this.process = null
    }
  }

  /** 设置数据回调 */
  onData(callback: (data: string) => void): void {
    this.onDataCallback = callback
  }

  /** 设置退出回调 */
  onExit(callback: (exitCode: number) => void): void {
    this.onExitCallback = callback
  }

  /** 进程是否在运行 */
  get isRunning(): boolean {
    return this.process !== null
  }
}
