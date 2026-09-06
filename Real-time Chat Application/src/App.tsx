import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Chat from './pages/Chat'

function AppInner() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-spinner" />
      </div>
    )
  }

  if (!user) {
    return authView === 'login' ? (
      <Login
        onSwitchToSignup={() => setAuthView('signup')}
      />
    ) : (
      <Signup
        onSwitchToLogin={() => setAuthView('login')}
      />
    )
  }

  return <Chat />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
