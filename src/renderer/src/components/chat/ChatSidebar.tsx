import { useEffect, useState, useRef } from 'react'
import { useChatStore } from '../../stores/chat-store'
import './ChatSidebar.css'

function getDateGroup(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return '今天'
  if (diff < 2 * day) return '昨天'
  if (diff < 7 * day) return '最近 7 天'
  return '更早'
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export function ChatSidebar(): JSX.Element {
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const loadSessions = useChatStore((s) => s.loadSessions)
  const createNewSession = useChatStore((s) => s.createNewSession)
  const switchSession = useChatStore((s) => s.switchSession)
  const deleteSession = useChatStore((s) => s.deleteSession)
  const renameSession = useChatStore((s) => s.renameSession)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleDoubleClick = (session: { id: string; title: string }): void => {
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const handleRenameConfirm = async (): Promise<void> => {
    if (editingId && editTitle.trim()) {
      await renameSession(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleRenameConfirm()
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  // 按日期分组
  const groups: Record<string, typeof sessions> = {}
  for (const session of sessions) {
    const group = getDateGroup(session.updatedAt)
    if (!groups[group]) groups[group] = []
    groups[group].push(session)
  }

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <span>聊天记录</span>
        <button className="chat-sidebar-new" onClick={createNewSession} title="新对话">
          +
        </button>
      </div>
      <div className="chat-sidebar-list">
        {sessions.length === 0 && (
          <div className="chat-sidebar-empty">暂无聊天记录</div>
        )}
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="chat-sidebar-group">
            <div className="chat-sidebar-group-title">{group}</div>
            {items.map((session) => (
              <div
                key={session.id}
                className={`chat-sidebar-item ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => switchSession(session.id)}
              >
                {editingId === session.id ? (
                  <input
                    ref={editInputRef}
                    className="chat-sidebar-item-edit"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRenameConfirm}
                    onKeyDown={handleRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="chat-sidebar-item-title"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      handleDoubleClick(session)
                    }}
                  >
                    {session.title}
                  </div>
                )}
                <div className="chat-sidebar-item-time">
                  {formatRelativeTime(session.updatedAt)}
                </div>
                <button
                  className="chat-sidebar-item-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  title="删除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
