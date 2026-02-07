import { useState, useRef, useCallback } from 'react'
import './ChatInput.css'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, disabled }: ChatInputProps): JSX.Element {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // 自动调整高度
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }

  return (
    <div className="chat-input">
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Claude 正在回复...' : '输入消息，Ctrl+Enter 发送'}
          disabled={disabled}
          rows={1}
        />
        {disabled && onStop ? (
          <button
            className="chat-input-stop"
            onClick={onStop}
            title="停止回复"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            className="chat-input-send"
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            title="发送 (Ctrl+Enter)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
