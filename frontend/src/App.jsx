import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './components/auth/LoginPage'
import { SignupPage } from './components/auth/SignupPage'
import { ProfileSetupPage } from './components/auth/ProfileSetupPage'
import { Home } from './components/Home'

export default function App() {
  const auth = useAuth()
  const [authView, setAuthView] = useState('login') // 'login' | 'signup' — only relevant pre-auth
  const [editingProfile, setEditingProfile] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  function toggleDark() {
    setDark(d => {
      const next = !d
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  if (auth.status === 'loading') {
    return <div className={`min-h-screen ${dark ? 'bg-black' : 'bg-[#F3F2EF]'}`} />
  }

  if (auth.status === 'unauthed') {
    return authView === 'signup'
      ? <SignupPage dark={dark} onSignup={auth.signup} onBackToLogin={() => setAuthView('login')} />
      : <LoginPage dark={dark} onLogin={auth.login} onGoToSignup={() => setAuthView('signup')} />
  }

  if (!auth.user?.name || editingProfile) {
    return (
      <ProfileSetupPage
        dark={dark}
        user={auth.user}
        mode={auth.user?.name ? 'edit' : 'create'}
        onCancel={auth.user?.name ? () => setEditingProfile(false) : undefined}
        onSubmit={async (name, email, bio) => {
          await auth.updateProfile(name, email, bio)
          setEditingProfile(false)
        }}
      />
    )
  }

  return (
    <Home
      dark={dark}
      toggleDark={toggleDark}
      user={auth.user}
      onLogout={auth.logout}
      onOpenProfileEdit={() => setEditingProfile(true)}
    />
  )
}
