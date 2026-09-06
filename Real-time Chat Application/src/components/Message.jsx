import { useState } from 'react'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Message({ message, isOwn, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`message-row ${isOwn ? 'own' : 'other'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && (
        <img
          src={message.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${message.profiles?.username || 'U'}`}
          alt={message.profiles?.username}
          className="msg-avatar"
        />
      )}

      <div className="message-group">
        {!isOwn && (
          <span className="msg-sender">{message.profiles?.username}</span>
        )}
        <div className="message-bubble-wrap">
          <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
            <p className="message-text">{message.content}</p>
            <span className="message-time">{formatTime(message.created_at)}</span>
          </div>
          {isOwn && hovered && (
            <button
              className="delete-btn"
              title="Delete message"
              onClick={() => onDelete(message.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
