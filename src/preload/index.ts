import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'
import type { TerminalSpawnOptions, TerminalResizeOptions } from '../shared/types'

/** 暴露给渲染进程的安全 API */
const api = {
  terminal: {
    spawn: (options: TerminalSpawnOptions): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_SPAWN, options),
    write: (data: string): void =>
      ipcRenderer.send(IPC_CHANNELS.TERMINAL_WRITE, data),
    resize: (options: TerminalResizeOptions): void =>
      ipcRenderer.send(IPC_CHANNELS.TERMINAL_RESIZE, options),
    kill: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_KILL),
    onData: (callback: (data: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: string): void => {
        callback(data)
      }
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_DATA, handler)
    },
    onExit: (callback: (exitCode: number) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, exitCode: number): void => {
        callback(exitCode)
      }
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_EXIT, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_EXIT, handler)
    }
  },
  dialog: {
    openFolder: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FOLDER)
  },
  app: {
    getRecentFolders: (): Promise<string[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_GET_RECENT_FOLDERS),
    addRecentFolder: (folder: string): Promise<string[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_ADD_RECENT_FOLDER, folder)
  },
  fs: {
    readDir: (dirPath: string): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_READ_DIR, dirPath),
    readFile: (filePath: string): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE, filePath),
    writeFile: (filePath: string, content: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_WRITE_FILE, filePath, content),
    getFileInfo: (filePath: string): Promise<{ size: number; modified: number }> =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_GET_FILE_INFO, filePath)
  },
  session: {
    getAll: (): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_ALL),
    create: (workingDirectory: string): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, workingDirectory),
    get: (sessionId: string): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET, sessionId),
    delete: (sessionId: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, sessionId),
    addMessage: (sessionId: string, message: any): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_ADD_MESSAGE, sessionId, message),
    updateTitle: (sessionId: string, title: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_UPDATE_TITLE, sessionId, title),
    updateAssistant: (sessionId: string, content: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_UPDATE_ASSISTANT, sessionId, content),
    onIdUpdate: (callback: (sessionId: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, sessionId: string): void => {
        callback(sessionId)
      }
      ipcRenderer.on(IPC_CHANNELS.SESSION_ID_UPDATE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SESSION_ID_UPDATE, handler)
    }
  },
  chat: {
    send: (message: string, cwd: string, sessionId?: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, message, cwd, sessionId),
    abort: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_ABORT),
    onStream: (callback: (event: any) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: any): void => {
        callback(data)
      }
      ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM, handler)
    },
    onError: (callback: (error: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: string): void => {
        callback(error)
      }
      ipcRenderer.on(IPC_CHANNELS.CHAT_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_ERROR, handler)
    },
    onDone: (callback: () => void): (() => void) => {
      const handler = (): void => {
        callback()
      }
      ipcRenderer.on(IPC_CHANNELS.CHAT_DONE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_DONE, handler)
    }
  },
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
    onMaximizedChanged: (callback: (isMaximized: boolean) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean): void => {
        callback(isMaximized)
      }
      ipcRenderer.on('window:maximized-changed', handler)
      return () => ipcRenderer.removeListener('window:maximized-changed', handler)
    }
  }
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
