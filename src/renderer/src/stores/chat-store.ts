import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  workingDirectory: string
}

interface ChatState {
  /** 历史会话列表 */
  sessions: ChatSession[]
  /** 当前活动的会话 ID */
  activeSessionId: string | null
  /** 当前会话的消息列表 */
  messages: ChatMessage[]
  /** 是否正在等待回复 */
  isLoading: boolean

  /** 加载所有历史会话 */
  loadSessions: () => Promise<void>
  /** 创建新会话 */
  createNewSession: () => Promise<void>
  /** 切换到指定会话（加载历史消息） */
  switchSession: (sessionId: string) => Promise<void>
  /** 删除会话 */
  deleteSession: (sessionId: string) => Promise<void>
  /** 重命名会话 */
  renameSession: (sessionId: string, title: string) => Promise<void>
  /** 更新活动会话的真实 session_id */
  updateActiveSessionId: (realSessionId: string) => void

  /** 添加用户消息 */
  addUserMessage: (content: string) => void
  /** 开始助手回复 */
  startAssistantMessage: () => void
  /** 追加流式文本 */
  appendToLastMessage: (text: string) => void
  /** 替换最后一条助手消息的全部内容（用于累积式事件） */
  replaceLastMessage: (content: string) => void
  /** 完成流式消息 */
  finishLastMessage: () => void
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void
  /** 清空当前消息 */
  clearMessages: () => void
}

let messageId = 0
function generateId(): string {
  return `msg-${Date.now()}-${++messageId}`
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isLoading: false,

  loadSessions: async () => {
    const sessions = await window.api.session.getAll()
    set({ sessions })
  },

  createNewSession: async () => {
    // 清空当前消息，等发送第一条消息时再真正创建会话
    set({
      activeSessionId: null,
      messages: [],
      isLoading: false
    })
  },

  switchSession: async (sessionId) => {
    const session = await window.api.session.get(sessionId)
    if (session) {
      const messages: ChatMessage[] = session.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp
      }))
      set({
        activeSessionId: sessionId,
        messages,
        isLoading: false
      })
    }
  },

  deleteSession: async (sessionId) => {
    await window.api.session.delete(sessionId)
    const { activeSessionId } = get()
    if (activeSessionId === sessionId) {
      set({ activeSessionId: null, messages: [] })
    }
    // 重新加载会话列表
    const sessions = await window.api.session.getAll()
    set({ sessions })
  },

  renameSession: async (sessionId, title) => {
    await window.api.session.updateTitle(sessionId, title)
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      )
    }))
  },

  updateActiveSessionId: (realSessionId) => {
    set((state) => {
      // 更新 sessions 列表中的临时 ID
      const sessions = state.sessions.map((s) =>
        s.id === state.activeSessionId ? { ...s, id: realSessionId } : s
      )
      return { activeSessionId: realSessionId, sessions }
    })
  },

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: generateId(), role: 'user', content, timestamp: Date.now() }
      ]
    })),

  startAssistantMessage: () =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true
        }
      ]
    })),

  appendToLastMessage: (text) =>
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + text }
      }
      return { messages }
    }),

  replaceLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content }
      }
      return { messages }
    }),

  finishLastMessage: () =>
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, isStreaming: false }
      }
      return { messages }
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [], activeSessionId: null })
}))
