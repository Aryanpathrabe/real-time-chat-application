import { supabase } from '../lib/supabase'

export function useAuth() {
  // Sign Up Function
  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username // Yeh username SQL Trigger auto-read karke profiles table me daal dega
        }
      }
    })

    if (error) throw error
    return data
  }

  // Sign In Function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) throw error
    return data
  }

  // Sign Out Function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    signUp,
    signIn,
    signOut
  }
}
