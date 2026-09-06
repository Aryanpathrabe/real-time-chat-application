import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function ProfileModal({ onClose }) {
  const { profile, updateProfile } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!username.trim()) { setError('Username cannot be empty.'); return }
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return }
    setSaving(true)
    try {
      await updateProfile({
        username: username.trim(),
        avatar_url: avatarUrl.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}`,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const previewAvatar = avatarUrl.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'U')}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-avatar-preview">
          <img src={previewAvatar} alt="avatar preview" className="avatar-lg" />
          <p className="modal-email">{profile?.email}</p>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success-inline">Profile updated!</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avatar URL <span className="label-hint">(optional)</span></label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
