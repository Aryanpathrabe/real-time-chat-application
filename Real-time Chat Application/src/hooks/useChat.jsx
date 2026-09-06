import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useChat(currentUserId) {
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const channelRef = useRef(null)

  // Fetch all conversations for current user
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

    if (error) { console.error(error); return }

    // For each conversation, find the other member's profile
    const enriched = await Promise.all(
      (data || []).map(async (row) => {
        const conv = row.conversations
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id, profiles(id, username, avatar_url, is_online, last_seen)')
          .eq('conversation_id', conv.id)
          .neq('user_id', currentUserId)

        const otherUser = members?.[0]?.profiles ?? null

        // Last message
        const msgs = conv.messages ?? []
        const lastMsg = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

        // Unread count: messages not from current user after the last one we could track
        const unread = msgs.filter(m => m.sender_id !== currentUserId).length

        return {
          id: conv.id,
          created_at: conv.created_at,
          otherUser,
          lastMessage: lastMsg ?? null,
          unreadCount: 0, // simplified; extend with a read_at column for full tracking
        }
      })
    )

    enriched.sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.created_at
      const bTime = b.lastMessage?.created_at ?? b.created_at
      return new Date(bTime) - new Date(aTime)
    })

    setConversations(enriched)
  }, [currentUserId])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId) => {
    setLoadingMessages(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(id, username, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) setMessages(data || [])
    setLoadingMessages(false)
  }, [])

  // Subscribe to realtime for active conversation
  useEffect(() => {
    if (!activeConversation) return

    fetchMessages(activeConversation.id)

    // Remove previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
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
            setMessages(prev => [...prev, data])
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
    }
  }, [activeConversation?.id, fetchMessages, fetchConversations])

  // Subscribe to conversation list changes
  useEffect(() => {
    if (!currentUserId) return
    fetchConversations()

    const channel = supabase
      .channel(`conversations:${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchConversations)
      .subscribe()

    return () => supabase.removeChannel(channel)
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
    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    if (error) throw error
  }

  async function findOrCreateConversation(otherUserId) {
    // Check if a conversation between these two already exists
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    const myConvIds = (myConvs || []).map(r => r.conversation_id)

    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds)

      if (shared && shared.length > 0) {
        // Return existing conversation
        const existingId = shared[0].conversation_id
        const found = conversations.find(c => c.id === existingId)
        if (found) { setActiveConversation(found); return found }
        // Build a minimal object if not yet in state
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single()
        const conv = { id: existingId, otherUser: profile, lastMessage: null, unreadCount: 0 }
        setActiveConversation(conv)
        return conv
      }
    }

    // Create new conversation
    const { data: newConv, error } = await supabase.from('conversations').insert({}).select().single()
    if (error) throw error

    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: currentUserId },
      { conversation_id: newConv.id, user_id: otherUserId },
    ])

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single()
    const conv = { id: newConv.id, otherUser: profile, lastMessage: null, unreadCount: 0 }
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
