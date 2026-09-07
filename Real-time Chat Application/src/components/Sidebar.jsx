import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import UserSearch from './UserSearch'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Sidebar({ conversations, activeConversation, onSelectConversation, onNewChat, onOpenProfile, profile }) {
  const { signOut } = useAuth()
  const [search, setSearch] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)

  const filtered = conversations.filter(c =>
    !search || c.otherUser?.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage?.content?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleStartChat(userId) {
    await onNewChat(userId)
  }

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l5.18-1.35A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">Nexus</span>
        </div>
        <button className="icon-btn compose-btn" title="New conversation" onClick={() => setShowUserSearch(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="conversations-list">
        {filtered.length === 0 && (
          <div className="sidebar-empty">
            {search ? 'No conversations found' : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.3">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l5.18-1.35A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                </svg>
                <p>No conversations yet</p>
                <button className="btn-ghost-sm" onClick={() => setShowUserSearch(true)}>Start one</button>
              </>
            )}
          </div>
        )}

        {filtered.map(conv => (
          <button
            key={conv.id}
            className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv)}
          >
            <div className="avatar-wrap">
              <img
                src={conv.otherUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.otherUser?.username || 'U'}`}
                alt={conv.otherUser?.username}
                className="avatar"
              />
              {conv.otherUser?.is_online && <span className="online-dot" />}
            </div>
            <div className="conv-info">
              <div className="conv-top">
                <span className="conv-name">{conv.otherUser?.username ?? 'Unknown'}</span>
                <span className="conv-time">{formatTime(conv.lastMessage?.created_at)}</span>
              </div>
              <div className="conv-bottom">
                <span className="conv-last-msg">
                  {conv.lastMessage?.content ?? 'No messages yet'}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer: profile */}
      <div className="sidebar-footer">
        <button className="profile-btn" onClick={onOpenProfile}>
          <div className="avatar-wrap">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'U'}`}
              alt={profile?.username}
              className="avatar"
            />
            <span className="online-dot" />
          </div>
          <div className="profile-info">
            <span className="profile-name">{profile?.username}</span>
            <span className="profile-status">Online</span>
          </div>
        </button>
        <button className="icon-btn logout-btn" title="Sign out" onClick={() => signOut().catch(console.error)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {showUserSearch && (
        <UserSearch
          onStartChat={handleStartChat}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </aside>
  )
}
