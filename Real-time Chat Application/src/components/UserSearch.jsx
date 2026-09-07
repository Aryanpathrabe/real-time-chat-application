import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function UserSearch({ onStartChat, onClose }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback(async (q) => {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_online')
      .ilike('username', `%${q}%`)
      .neq('id', user.id)
      .limit(10)
    setResults(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(() => search(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className="user-search-overlay" onClick={onClose}>
      <div className="user-search-modal" onClick={e => e.stopPropagation()}>
        <div className="user-search-header">
          <h3>New conversation</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="search-input-wrap" style={{ padding: '0 1.25rem 0.75rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search by username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="user-search-results">
          {loading && <div className="search-empty">Searching...</div>}
          {!loading && query && results.length === 0 && (
            <div className="search-empty">No users found for "{query}"</div>
          )}
          {!loading && !query && (
            <div className="search-empty">Type a username to find people</div>
          )}
          {results.map(u => (
            <button
              key={u.id}
              className="user-search-item"
              onClick={() => { onStartChat(u.id); onClose() }}
            >
              <div className="avatar-wrap">
                <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`} alt={u.username} className="avatar" />
                {u.is_online && <span className="online-dot" />}
              </div>
              <div className="user-info">
                <span className="user-name">{u.username}</span>
                <span className="user-status">{u.is_online ? 'Online' : 'Offline'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
