import { ipcMain, dialog, BrowserWindow } from 'electron'
import { PtyManager } from './pty-manager'
import { ClaudeProcess } from './claude-process'
import { SessionManager } from './session-manager'
import { IPC_CHANNELS, MAX_RECENT_FOLDERS } from '../shared/constants'
import type { TerminalSpawnOptions, TerminalResizeOptions } from '../shared/types'
import Store from 'electron-store'
import { readDirectory, readFile, writeFile, getFileInfo } from './file-system'

const store = new Store()

/** 注册所有 IPC 处理器 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  const ptyManager = new PtyManager()

  // 终端数据 → 渲染进程
  ptyManager.onData((data) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.TERMINAL_DATA, data)
    }
  })

  // 终端退出 → 渲染进程
  ptyManager.onExit((exitCode) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.TERMINAL_EXIT, exitCode)
    }
  })

  // 启动终端
  ipcMain.handle(IPC_CHANNELS.TERMINAL_SPAWN, (_event, options: TerminalSpawnOptions) => {
    ptyManager.spawn(options)
    return true
  })

  // 写入终端
  ipcMain.on(IPC_CHANNELS.TERMINAL_WRITE, (_event, data: string) => {
    ptyManager.write(data)
  })

  // 调整终端大小
  ipcMain.on(IPC_CHANNELS.TERMINAL_RESIZE, (_event, options: TerminalResizeOptions) => {
    ptyManager.resize(options)
  })

  // 终止终端
  ipcMain.handle(IPC_CHANNELS.TERMINAL_KILL, () => {
    ptyManager.kill()
    return true
  })

  // 打开文件夹选择对话框
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择工作目录'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // 获取最近文件夹列表
  ipcMain.handle(IPC_CHANNELS.APP_GET_RECENT_FOLDERS, () => {
    return store.get('recentFolders', []) as string[]
  })

  // 添加最近文件夹
  ipcMain.handle(IPC_CHANNELS.APP_ADD_RECENT_FOLDER, (_event, folder: string) => {
    const recent = store.get('recentFolders', []) as string[]
    const filtered = recent.filter((f) => f !== folder)
    filtered.unshift(folder)
    const trimmed = filtered.slice(0, MAX_RECENT_FOLDERS)
    store.set('recentFolders', trimmed)
    return trimmed
  })

  // Claude 非交互模式进程管理
  const claudeProcess = new ClaudeProcess()
  const sessionManager = new SessionManager()
  let currentTempSessionId: string | null = null

  // 注册聊天流事件回调
  claudeProcess.onStream((event) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.CHAT_STREAM, event)
    }
  })

  claudeProcess.onError((error) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.CHAT_ERROR, error)
    }
  })

  claudeProcess.onDone(() => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.CHAT_DONE)
    }
  })

  // 注册 session_id 回调，将 Claude CLI 返回的 session_id 发送到渲染进程，并更新持久化存储
  claudeProcess.onSessionId((sessionId) => {
    // 更新持久化存储中的临时 ID 为真实 session_id
    if (currentTempSessionId) {
      sessionManager.updateSessionId(currentTempSessionId, sessionId)
      currentTempSessionId = null
    }
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.SESSION_ID_UPDATE, sessionId)
    }
  })

  // 发送聊天消息（支持 sessionId 参数用于恢复会话）
  ipcMain.handle(IPC_CHANNELS.CHAT_SEND, (_event, message: string, cwd: string, sessionId?: string) => {
    console.log('[IPC CHAT_SEND]', { message: message?.substring(0, 50), cwd, sessionId })
    claudeProcess.setCwd(cwd)
    if (sessionId) {
      claudeProcess.setSessionId(sessionId)
    } else {
      claudeProcess.setSessionId(null)
      // 记录当前临时 session ID（从最新创建的会话中获取）
      const sessions = sessionManager.getSessions()
      const tempSession = sessions.find(s => s.id.startsWith('temp-'))
      if (tempSession) {
        currentTempSessionId = tempSession.id
      }
    }
    claudeProcess.sendMessage(message)
    return true
  })

  // 中止聊天
  ipcMain.handle(IPC_CHANNELS.CHAT_ABORT, () => {
    claudeProcess.abort()
    return true
  })

  // 会话管理
  // 获取所有会话
  ipcMain.handle(IPC_CHANNELS.SESSION_GET_ALL, () => {
    return sessionManager.getSessions()
  })

  // 创建新会话
  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, (_event, workingDirectory: string) => {
    return sessionManager.createSession(workingDirectory)
  })

  // 获取单个会话
  ipcMain.handle(IPC_CHANNELS.SESSION_GET, (_event, sessionId: string) => {
    return sessionManager.getSession(sessionId)
  })

  // 删除会话
  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, (_event, sessionId: string) => {
    sessionManager.deleteSession(sessionId)
    return true
  })

  // 添加消息到会话
  ipcMain.handle(IPC_CHANNELS.SESSION_ADD_MESSAGE, (_event, sessionId: string, message: any) => {
    sessionManager.addMessage(sessionId, message)
    return true
  })

  // 更新会话标题
  ipcMain.handle(IPC_CHANNELS.SESSION_UPDATE_TITLE, (_event, sessionId: string, title: string) => {
    sessionManager.updateTitle(sessionId, title)
    return true
  })

  // 更新最后一条助手消息
  ipcMain.handle(IPC_CHANNELS.SESSION_UPDATE_ASSISTANT, (_event, sessionId: string, content: string) => {
    sessionManager.updateLastAssistantMessage(sessionId, content)
    return true
  })

  // 文件系统操作
  ipcMain.handle(IPC_CHANNELS.FS_READ_DIR, (_event, dirPath: string) => {
    return readDirectory(dirPath)
  })

  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE, (_event, filePath: string) => {
    return readFile(filePath)
  })

  ipcMain.handle(IPC_CHANNELS.FS_WRITE_FILE, (_event, filePath: string, content: string) => {
    return writeFile(filePath, content)
  })

  ipcMain.handle(IPC_CHANNELS.FS_GET_FILE_INFO, (_event, filePath: string) => {
    return getFileInfo(filePath)
  })

  // 窗口关闭时清理 PTY 和 Claude 进程
  mainWindow.on('close', () => {
    ptyManager.kill()
    claudeProcess.abort()
  })
}
