import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useChat(currentUserId) {
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const channelRef = useRef(null)
  const convChannelRef = useRef(null)

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return

    const { data, error } = await supabase
      .from('conversation_members')
      .select(`
        conversation_id,
        conversations (
          id,
          created_at,
          messages (
            id,
            content,
            created_at,
            sender_id
          )
        )
      `)
      .eq('user_id', currentUserId)

    if (error) { console.error('fetchConversations error:', error); return }

    const enriched = await Promise.all(
      (data || []).map(async (row) => {
        const conv = row.conversations
        if (!conv) return null

        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id, profiles(id, username, avatar_url, is_online, last_seen)')
          .eq('conversation_id', conv.id)
          .neq('user_id', currentUserId)

        const otherUser = members?.[0]?.profiles ?? null

        // Sort a copy to avoid mutating the original array
        const msgs = [...(conv.messages ?? [])]
        msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        const lastMsg = msgs[0] ?? null

        return {
          id: conv.id,
          created_at: conv.created_at,
          otherUser,
          lastMessage: lastMsg,
          unreadCount: 0,
        }
      })
    )

    const valid = enriched.filter(Boolean)
    valid.sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.created_at
      const bTime = b.lastMessage?.created_at ?? b.created_at
      return new Date(bTime) - new Date(aTime)
    })

    setConversations(valid)
  }, [currentUserId])

  const fetchMessages = useCallback(async (conversationId) => {
    setLoadingMessages(true)
    setMessages([])
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(id, username, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('fetchMessages error:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Realtime subscription for the active conversation's messages
  useEffect(() => {
    if (!activeConversation) return

    fetchMessages(activeConversation.id)

    // Clean up previous message channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`messages:conv:${activeConversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              // Deduplicate: don't add if already present
              if (prev.some(m => m.id === data.id)) return prev
              return [...prev, data]
            })
            fetchConversations()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id))
          fetchConversations()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [activeConversation?.id, fetchMessages, fetchConversations])

  // Subscribe to conversation list: filtered to only this user's conversations
  useEffect(() => {
    if (!currentUserId) return
    fetchConversations()

    // Clean up previous conversation channel
    if (convChannelRef.current) {
      supabase.removeChannel(convChannelRef.current)
      convChannelRef.current = null
    }

    // Filter to only messages in conversations the current user is a member of.
    // We subscribe per-user rather than globally to limit noise.
    const channel = supabase
      .channel(`conv-list:${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${currentUserId}` }, fetchConversations)
      .subscribe()

    convChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      convChannelRef.current = null
    }
  }, [currentUserId, fetchConversations])

  async function sendMessage(content) {
    if (!activeConversation || !content.trim()) return
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: currentUserId,
      content: content.trim(),
    })
    if (error) throw error
  }

  async function deleteMessage(messageId) {
    const { error } = await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', currentUserId)
    if (error) throw error
  }

  async function findOrCreateConversation(otherUserId) {
    // Find conversations the current user is in
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    const myConvIds = (myConvs || []).map(r => r.conversation_id)

    // Check for an existing shared conversation with the other user
    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds)

      if (shared && shared.length > 0) {
        const existingId = shared[0].conversation_id
        const found = conversations.find(c => c.id === existingId)
        if (found) { setActiveConversation(found); return found }

        const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single()
        const conv = { id: existingId, created_at: new Date().toISOString(), otherUser: otherProfile, lastMessage: null, unreadCount: 0 }
        setActiveConversation(conv)
        fetchConversations()
        return conv
      }
    }

    // Create a new conversation
    const { data: newConv, error } = await supabase.from('conversations').insert({}).select().single()
    if (error) throw error

    const { error: memberError } = await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: currentUserId },
      { conversation_id: newConv.id, user_id: otherUserId },
    ])
    if (memberError) throw memberError

    const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single()
    const conv = { id: newConv.id, created_at: newConv.created_at, otherUser: otherProfile, lastMessage: null, unreadCount: 0 }
    setActiveConversation(conv)
    fetchConversations()
    return conv
  }

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loadingMessages,
    sendMessage,
    deleteMessage,
    findOrCreateConversation,
    fetchConversations,
  }
}
