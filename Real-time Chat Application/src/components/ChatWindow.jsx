import { useEffect, useRef, useMemo } from 'react'
import Message from './Message'
import MessageInput from './MessageInput'

function formatDateLabel(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function groupByDate(messages) {
  const groups = []
  let currentDay = null
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString()
    if (day !== currentDay) {
      currentDay = day
      groups.push({ type: 'date', label: formatDateLabel(msg.created_at), key: `date-${day}` })
    }
    groups.push({ type: 'message', msg })
  }
  return groups
}

export default function ChatWindow({ conversation, messages, loading, currentUserId, onSendMessage, onDeleteMessage }) {
  const bottomRef = useRef(null)

  const items = useMemo(() => groupByDate(messages), [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div className="chat-empty-state">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l5.18-1.35A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.15"/>
          </svg>
        </div>
        <h2>Select a conversation</h2>
        <p>Choose from your existing conversations or start a new one.</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="avatar-wrap">
            <img
              src={conversation.otherUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conversation.otherUser?.username || 'U')}`}
              alt={conversation.otherUser?.username}
              className="avatar"
            />
            {conversation.otherUser?.is_online && <span className="online-dot" />}
          </div>
          <div>
            <h2 className="chat-header-name">{conversation.otherUser?.username ?? 'Unknown'}</h2>
            <p className="chat-header-status">
              {conversation.otherUser?.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {loading && (
          <div className="messages-loading">
            <span className="loading-dots"><span /><span /><span /></span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="messages-empty">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}

        {!loading && items.map(item =>
          item.type === 'date'
            ? <div key={item.key} className="date-label"><span>{item.label}</span></div>
            : (
              <Message
                key={item.msg.id}
                message={item.msg}
                isOwn={item.msg.sender_id === currentUserId}
                onDelete={onDeleteMessage}
              />
            )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} disabled={loading} />
    </div>
  )
}
