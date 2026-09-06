import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';

export default function App() {
  const { user, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user) {
    return <Chat />;
  }

  return (
    <>
      {isLoginView ? (
        <Login onSwitchToSignup={() => setIsLoginView(false)} />
      ) : (
        <Signup onSwitchToLogin={() => setIsLoginView(true)} />
      )}
    </>
  );
}
