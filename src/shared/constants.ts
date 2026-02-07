/** IPC 通道名称常量 */
export const IPC_CHANNELS = {
  // 终端相关
  TERMINAL_SPAWN: 'terminal:spawn',
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_KILL: 'terminal:kill',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_EXIT: 'terminal:exit',

  // 对话框
  DIALOG_OPEN_FOLDER: 'dialog:openFolder',

  // 应用
  APP_GET_RECENT_FOLDERS: 'app:getRecentFolders',
  APP_ADD_RECENT_FOLDER: 'app:addRecentFolder',

  // 聊天相关
  CHAT_SEND: 'chat:send',
  CHAT_STREAM: 'chat:stream',
  CHAT_ERROR: 'chat:error',
  CHAT_DONE: 'chat:done',
  CHAT_ABORT: 'chat:abort',

  // 文件系统
  FS_READ_DIR: 'fs:readDir',
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_GET_FILE_INFO: 'fs:getFileInfo',

  // 会话管理
  SESSION_GET_ALL: 'session:getAll',
  SESSION_CREATE: 'session:create',
  SESSION_GET: 'session:get',
  SESSION_DELETE: 'session:delete',
  SESSION_ID_UPDATE: 'session:idUpdate',
  SESSION_ADD_MESSAGE: 'session:addMessage',
  SESSION_UPDATE_TITLE: 'session:updateTitle',
  SESSION_UPDATE_ASSISTANT: 'session:updateAssistant'
} as const

/** 最大最近文件夹数量 */
export const MAX_RECENT_FOLDERS = 10

/** 默认终端配置 */
export const DEFAULT_TERMINAL_OPTIONS = {
  cols: 120,
  rows: 30
} as const
