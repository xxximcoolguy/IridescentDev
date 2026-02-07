import Store from 'electron-store'

/** 会话数据结构 */
export interface ChatSession {
  id: string           // session_id（来自 Claude CLI stream-json 输出的 session_id）
  title: string        // 会话标题（取第一条用户消息的前 30 字符）
  createdAt: number
  updatedAt: number
  messages: SessionMessage[]
  workingDirectory: string
}

/** 会话消息数据结构 */
export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const store = new Store({ name: 'chat-sessions' })

/**
 * 会话持久化管理器
 *
 * 使用 electron-store 将聊天会话保存到本地文件，
 * 支持创建、查询、更新、删除会话，以及 session_id 映射。
 */
export class SessionManager {
  /** 获取所有会话（最近30天，按更新时间倒序） */
  getSessions(): ChatSession[] {
    const sessions = store.get('sessions', []) as ChatSession[]
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    return sessions
      .filter(s => s.updatedAt > thirtyDaysAgo)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /** 创建新会话（id 暂时用临时 ID，后续从 Claude CLI 获取真正的 session_id） */
  createSession(workingDirectory: string): ChatSession {
    const session: ChatSession = {
      id: `temp-${Date.now()}`,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      workingDirectory
    }
    const sessions = store.get('sessions', []) as ChatSession[]
    sessions.unshift(session)
    store.set('sessions', sessions)
    return session
  }

  /** 更新会话的 session_id（从 Claude CLI system 事件获取真正的 session_id） */
  updateSessionId(tempId: string, realSessionId: string): void {
    const sessions = store.get('sessions', []) as ChatSession[]
    const session = sessions.find(s => s.id === tempId)
    if (session) {
      session.id = realSessionId
      store.set('sessions', sessions)
    }
  }

  /** 添加消息到会话 */
  addMessage(sessionId: string, message: SessionMessage): void {
    const sessions = store.get('sessions', []) as ChatSession[]
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = Date.now()
      // 第一条用户消息作为标题
      if (message.role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
        session.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      }
      store.set('sessions', sessions)
    }
  }

  /** 更新最后一条助手消息的内容 */
  updateLastAssistantMessage(sessionId: string, content: string): void {
    const sessions = store.get('sessions', []) as ChatSession[]
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      const lastAssistant = [...session.messages].reverse().find(m => m.role === 'assistant')
      if (lastAssistant) {
        lastAssistant.content = content
        session.updatedAt = Date.now()
        store.set('sessions', sessions)
      }
    }
  }

  /** 更新会话标题 */
  updateTitle(sessionId: string, title: string): void {
    const sessions = store.get('sessions', []) as ChatSession[]
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.title = title
      session.updatedAt = Date.now()
      store.set('sessions', sessions)
    }
  }

  /** 获取单个会话 */
  getSession(sessionId: string): ChatSession | null {
    const sessions = store.get('sessions', []) as ChatSession[]
    return sessions.find(s => s.id === sessionId) || null
  }

  /** 删除会话 */
  deleteSession(sessionId: string): void {
    const sessions = store.get('sessions', []) as ChatSession[]
    store.set('sessions', sessions.filter(s => s.id !== sessionId))
  }
}
