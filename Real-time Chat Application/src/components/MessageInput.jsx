import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [text])

  async function handleSend() {
    if (!text.trim() || sending || disabled) return
    setSending(true)
    try {
      await onSend(text)
      setText('')
    } catch (err) {
      console.error('Failed to send:', err)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="message-input-bar">
      <div className="input-wrap">
        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          rows={1}
        />
        <button
          className={`send-btn ${text.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          title="Send message"
        >
          {sending
            ? <span className="btn-spinner sm" />
            : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          }
        </button>
      </div>
      <p className="input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
