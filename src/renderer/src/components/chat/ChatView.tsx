import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { useAppStore } from '../../stores/app-store'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import './ChatView.css'

/** 打字机效果：每次输出的字符数 */
const TYPEWRITER_CHUNK = 3
/** 打字机效果���每次输出的间隔（毫秒） */
const TYPEWRITER_INTERVAL = 20

export function ChatView(): JSX.Element {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const addUserMessage = useChatStore((s) => s.addUserMessage)
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage)
  const replaceLastMessage = useChatStore((s) => s.replaceLastMessage)
  const finishLastMessage = useChatStore((s) => s.finishLastMessage)
  const setLoading = useChatStore((s) => s.setLoading)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const updateActiveSessionId = useChatStore((s) => s.updateActiveSessionId)
  const loadSessions = useChatStore((s) => s.loadSessions)
  const workingDirectory = useAppStore((s) => s.workingDirectory)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 打字机状态
  const fullTextRef = useRef('') // Claude 返回的完整文本
  const displayedLenRef = useRef(0) // 当前已显示的字符数
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(false) // Claude 进程是否已完成

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 清理打字机定时器
  const clearTypewriter = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // 启动打字机定时器
  const startTypewriter = useCallback(() => {
    if (timerRef.current) return // 已在运行
    timerRef.current = setInterval(() => {
      const full = fullTextRef.current
      const current = displayedLenRef.current
      if (current < full.length) {
        // 逐步显示更多字符
        const next = Math.min(current + TYPEWRITER_CHUNK, full.length)
        displayedLenRef.current = next
        replaceLastMessage(full.substring(0, next))
      } else if (doneRef.current) {
        // 所有文本已显示且 Claude 已完成
        clearTypewriter()
        replaceLastMessage(full)
        finishLastMessage()
        setLoading(false)
        // 持久化完整回复
        const sid = useChatStore.getState().activeSessionId
        if (sid && full) {
          window.api.session.updateAssistant(sid, full)
        }
        // 刷新侧边栏
        loadSessions()
      }
    }, TYPEWRITER_INTERVAL)
  }, [replaceLastMessage, finishLastMessage, setLoading, clearTypewriter, loadSessions])

  // 监听 session_id 更新
  useEffect(() => {
    const cleanup = window.api.session.onIdUpdate((realSessionId: string) => {
      updateActiveSessionId(realSessionId)
    })
    return cleanup
  }, [updateActiveSessionId])

  // 监听 Claude 流式事件
  useEffect(() => {
    const cleanupStream = window.api.chat.onStream((event: any) => {
      if (event.type === 'assistant') {
        // assistant 事件包含累积的完整消息内容
        const content = event.message?.content
        if (Array.isArray(content)) {
          const text = content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text || '')
            .join('')
          if (text) {
            fullTextRef.current = text
            // 启动打字机效果
            startTypewriter()
          }
        }
      } else if (event.type === 'result') {
        // 用 result 中的文本作为最终内容
        if (event.result) {
          fullTextRef.current = event.result
        }
        doneRef.current = true
        // 如果打字机还没启动（极端情况），直接显示
        if (!timerRef.current) {
          replaceLastMessage(fullTextRef.current)
          finishLastMessage()
          setLoading(false)
          const sid = useChatStore.getState().activeSessionId
          if (sid && fullTextRef.current) {
            window.api.session.updateAssistant(sid, fullTextRef.current)
          }
          loadSessions()
        }
      }
    })

    const cleanupError = window.api.chat.onError((error: string) => {
      console.error('[Chat] Error:', error)
    })

    const cleanupDone = window.api.chat.onDone(() => {
      doneRef.current = true
      // 如果打字机没在运行，说明没收到任何文本，直接完成
      if (!timerRef.current) {
        finishLastMessage()
        setLoading(false)
        loadSessions()
      }
    })

    return () => {
      cleanupStream()
      cleanupError()
      cleanupDone()
      clearTypewriter()
    }
  }, [replaceLastMessage, finishLastMessage, setLoading, loadSessions, startTypewriter, clearTypewriter])

  const handleSend = async (content: string): Promise<void> => {
    if (!workingDirectory) return

    let sessionId = activeSessionId

    // 如果没有活动会话，创建新会话
    if (!sessionId) {
      const session = await window.api.session.create(workingDirectory)
      sessionId = session.id
      useChatStore.getState().updateActiveSessionId(sessionId)
      loadSessions()
    }

    // 重置打字机状态
    clearTypewriter()
    fullTextRef.current = ''
    displayedLenRef.current = 0
    doneRef.current = false

    addUserMessage(content)
    setLoading(true)
    startAssistantMessage()

    // 持久化（不阻塞聊天发送）
    const persistMessages = async (): Promise<void> => {
      try {
        await window.api.session.addMessage(sessionId!, {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now()
        })

        // 第一条消息作为标题
        const currentMessages = useChatStore.getState().messages
        if (currentMessages.filter((m) => m.role === 'user').length === 1) {
          const title = content.slice(0, 30) + (content.length > 30 ? '...' : '')
          await window.api.session.updateTitle(sessionId!, title)
          loadSessions()
        }

        await window.api.session.addMessage(sessionId!, {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: '',
          timestamp: Date.now()
        })
      } catch (e) {
        console.warn('[Chat] persist failed:', e)
      }
    }
    persistMessages()

    // 只有非临时 ID 才传给 Claude CLI 用于 --resume
    const resumeId = sessionId.startsWith('temp-') ? undefined : sessionId
    await window.api.chat.send(content, workingDirectory, resumeId)
  }

  return (
    <div className="chat-view">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-title">New Chat</p>
            <p className="chat-empty-hint">Press Ctrl+Enter to send a message</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
