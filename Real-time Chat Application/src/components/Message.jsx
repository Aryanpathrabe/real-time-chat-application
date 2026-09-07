import { useState } from 'react'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Message({ message, isOwn, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(message.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      // Auto-cancel confirmation after 3s
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div
      className={`message-row ${isOwn ? 'own' : 'other'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      {!isOwn && (
        <img
          src={message.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(message.profiles?.username || 'U')}`}
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
              className={`delete-btn ${confirmDelete ? 'confirm' : ''}`}
              title={confirmDelete ? 'Click again to confirm delete' : 'Delete message'}
              onClick={handleDeleteClick}
            >
              {confirmDelete
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
