import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useAppStore } from '../../stores/app-store'
import '@xterm/xterm/css/xterm.css'
import './TerminalView.css'

interface TerminalViewProps {
  workingDirectory: string
}

/** xterm.js 终端封装组件 */
export function TerminalView({ workingDirectory }: TerminalViewProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const setClaudeStatus = useAppStore((state) => state.setClaudeStatus)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // 创建终端实例
    const terminal = new Terminal({
      theme: {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        selectionBackground: '#45475a',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#f5c2e7',
        cyan: '#94e2d5',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#f5c2e7',
        brightCyan: '#94e2d5',
        brightWhite: '#a6adc8'
      },
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new WebLinksAddon())
    terminal.open(container)
    terminalRef.current = terminal

    // 首次 fit + 聚焦 + 启动 claude
    requestAnimationFrame(() => {
      fitAddon.fit()
      terminal.focus()
      setClaudeStatus('running')
      window.api.terminal.spawn({
        cwd: workingDirectory,
        cols: terminal.cols,
        rows: terminal.rows
      })
    })

    // 终端输入 → PTY
    const dataDisposable = terminal.onData((data) => {
      window.api.terminal.write(data)
    })

    // PTY 输出 → 终端
    const removeOnData = window.api.terminal.onData((data) => {
      terminal.write(data)
    })

    // PTY 退出
    const removeOnExit = window.api.terminal.onExit((exitCode) => {
      setClaudeStatus('stopped')
      terminal.writeln(`\r\n\x1b[33m[Claude 进程已退出，退出码: ${exitCode}]\x1b[0m`)
    })

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit()
          window.api.terminal.resize({
            cols: terminal.cols,
            rows: terminal.rows
          })
        } catch {
          // 忽略
        }
      })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      dataDisposable.dispose()
      removeOnData()
      removeOnExit()
      window.api.terminal.kill()
      terminal.dispose()
      terminalRef.current = null
    }
  }, [workingDirectory, setClaudeStatus])

  return (
    <div
      ref={containerRef}
      className="terminal-view"
      onClick={() => terminalRef.current?.focus()}
    />
  )
}
