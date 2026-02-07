import { useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { useAppStore } from '../../stores/app-store'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import './ChatView.css'

/** 打字机效果：每次输出的字符数 */
const TYPEWRITER_CHUNK = 4
/** 打字机效果：每次输出的间隔（毫秒） */
const TYPEWRITER_INTERVAL = 16

export function ChatView(): JSX.Element {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const workingDirectory = useAppStore((s) => s.workingDirectory)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ============ 打字机状态（全部 ref，彻底避免闭包陈旧） ============
  const fullTextRef = useRef('')
  const displayedLenRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishedRef = useRef(false)
  // 标记 Claude 进程是否已结束（收到 result 或 done 事件）
  const processEndedRef = useRef(false)
  // 追踪当前 assistant 消息 ID，用于区分不同轮次的 assistant 事件
  const currentMsgIdRef = useRef('')
  // 累积所有轮次的文本（工具调用场景下有多个 assistant 消息）
  const allTextRef = useRef('')

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 清理打字机定时器
  const clearTypewriter = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // 完成回复（通过 ref 保证只调用一次）
  const completeResponse = (): void => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearTypewriter()

    const store = useChatStore.getState()
    // 使用 fullTextRef（在 result 事件中已合并为完整文本）
    const full = fullTextRef.current

    // 确保完整文本已显示
    if (full) {
      store.replaceLastMessage(full)
    }
    store.finishLastMessage()
    store.setLoading(false)

    // 持久化
    const sid = store.activeSessionId
    if (sid && full) {
      window.api.session.updateAssistant(sid, full)
    }
    store.loadSessions()
  }

  // 打字机 tick - 直接通过 store.getState() 调用，无闭包问题
  const typewriterTick = (): void => {
    // 组合所有轮次的文本：已���成轮次(allText) + 当前轮次(fullText)
    const combinedText = allTextRef.current + fullTextRef.current
    const current = displayedLenRef.current

    if (current < combinedText.length) {
      const next = Math.min(current + TYPEWRITER_CHUNK, combinedText.length)
      displayedLenRef.current = next
      useChatStore.getState().replaceLastMessage(combinedText.substring(0, next))
    } else if (combinedText.length > 0 && processEndedRef.current) {
      // 文本已全部显示，且 Claude 进程已结束 → 完成
      completeResponse()
    }
    // 如果 combinedText.length === 0 或进程还没结束，继续等待
  }

  // 启动打字机
  const startTypewriter = (): void => {
    if (timerRef.current) return // 已在运行
    timerRef.current = setInterval(typewriterTick, TYPEWRITER_INTERVAL)
  }

  // 监听 session_id 更新
  useEffect(() => {
    const cleanup = window.api.session.onIdUpdate((realSessionId: string) => {
      useChatStore.getState().updateActiveSessionId(realSessionId)
    })
    return cleanup
  }, [])

  // 监听 Claude 流式事件 — 所有逻辑通过 ref 和 getState() 访问，无依赖
  useEffect(() => {
    const cleanupStream = window.api.chat.onStream((event: any) => {
      if (event.type === 'assistant') {
        // assistant 事件包含当前轮次的完整消息内容
        const msgId = event.message?.id || ''
        const content = event.message?.content
        if (Array.isArray(content)) {
          const text = content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text || '')
            .join('')
          if (text) {
            if (msgId !== currentMsgIdRef.current) {
              // 新的 assistant 消息（新轮次） → 将之前文本追加到 allText，开始新轮次
              if (currentMsgIdRef.current && fullTextRef.current) {
                allTextRef.current += fullTextRef.current + '\n\n'
              }
              currentMsgIdRef.current = msgId
            }
            // 同一消息内的累积更新 → 直接覆盖
            fullTextRef.current = text
            // 打字机显示的是 allText + 当前轮次文本
            startTypewriter()
          }
        }
      } else if (event.type === 'result') {
        // result 事件有最终完整文本
        processEndedRef.current = true
        if (event.result) {
          // result 包含整个对话的最终回复文本，优先使用
          // 清空 allText 因为 result 已经是完整的
          allTextRef.current = ''
          fullTextRef.current = event.result
        } else {
          // 没有 result 文本，合并所有轮次
          if (currentMsgIdRef.current && fullTextRef.current) {
            allTextRef.current += fullTextRef.current
          }
          fullTextRef.current = allTextRef.current
          allTextRef.current = ''
        }
        // 如果打字机没在运行，直接完成
        if (!timerRef.current) {
          completeResponse()
        }
        // 打字机在运行 → tick 中检测到 processEndedRef + 文本显示完毕后自动完成
      }
    })

    const cleanupError = window.api.chat.onError((error: string) => {
      console.error('[Chat] Error:', error)
      processEndedRef.current = true
      completeResponse()
    })

    const cleanupDone = window.api.chat.onDone(() => {
      processEndedRef.current = true
      // 如果打字机没在运行，直接完成
      if (!timerRef.current) {
        completeResponse()
      }
      // 打字机在运行 → tick 中自然完成
    })

    return () => {
      cleanupStream()
      cleanupError()
      cleanupDone()
      clearTypewriter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = async (content: string): Promise<void> => {
    if (!workingDirectory) return

    const store = useChatStore.getState()
    let sessionId = store.activeSessionId

    // 如果没有活动会话，创建新会话
    if (!sessionId) {
      const session = await window.api.session.create(workingDirectory)
      sessionId = session.id
      useChatStore.getState().updateActiveSessionId(sessionId)
      useChatStore.getState().loadSessions()
    }

    // 重置打字机状态
    clearTypewriter()
    fullTextRef.current = ''
    displayedLenRef.current = 0
    finishedRef.current = false
    processEndedRef.current = false
    currentMsgIdRef.current = ''
    allTextRef.current = ''

    store.addUserMessage(content)
    store.setLoading(true)
    store.startAssistantMessage()

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
          useChatStore.getState().loadSessions()
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

  const handleStop = (): void => {
    // 中止 Claude 进程
    window.api.chat.abort()
    // 合并已累积的文本，确保已显示的部分不丢失
    if (allTextRef.current || fullTextRef.current) {
      fullTextRef.current = allTextRef.current + fullTextRef.current
      allTextRef.current = ''
    }
    // 立即结束打字机和加载状态
    processEndedRef.current = true
    completeResponse()
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
      <ChatInput onSend={handleSend} onStop={handleStop} disabled={isLoading} />
    </div>
  )
}
