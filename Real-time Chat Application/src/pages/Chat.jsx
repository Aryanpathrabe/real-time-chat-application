import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import ProfileModal from '../components/ProfileModal'

export default function Chat() {
  const { user, profile } = useAuth()
  const chat = useChat(user?.id)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Mark user online on mount, offline on unmount
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').update({ is_online: true }).eq('id', user.id)

    const handleVisibility = () => {
      supabase.from('profiles').update({
        is_online: !document.hidden,
        last_seen: new Date().toISOString(),
      }).eq('id', user.id)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', user.id)
    }
  }, [user])

  function handleSelectConversation(conv) {
    chat.setActiveConversation(conv)
    // On mobile, hide sidebar when a conversation is selected
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <div className="chat-layout">
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
        <Sidebar
          conversations={chat.conversations}
          activeConversation={chat.activeConversation}
          onSelectConversation={handleSelectConversation}
          onNewChat={chat.findOrCreateConversation}
          onOpenProfile={() => setShowProfile(true)}
          profile={profile}
        />
      </div>

      <div className="chat-wrapper">
        {/* Mobile header toggle */}
        {!sidebarOpen && (
          <button className="mobile-back-btn" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
        <ChatWindow
          conversation={chat.activeConversation}
          messages={chat.messages}
          loading={chat.loadingMessages}
          currentUserId={user?.id}
          onSendMessage={chat.sendMessage}
          onDeleteMessage={chat.deleteMessage}
        />
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}
