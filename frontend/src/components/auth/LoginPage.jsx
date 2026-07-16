import { useState } from 'react'
import defaultAvatar from '../../assets/default-avatar.svg'

export function LoginPage({ onLogin, onGoToSignup, dark }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid username or password')
      setSubmitting(false)
    }
  }

  const inputClass = `w-full border rounded-lg px-3 py-2 text-sm placeholder-gray-400
    focus:outline-none focus:ring-1 focus:ring-indigo-500
    ${dark ? 'bg-zinc-800 border-zinc-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${dark ? 'bg-black' : 'bg-[#F3F2EF]'}`}>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm rounded-xl p-6 flex flex-col items-center gap-4 ${dark ? 'bg-zinc-900' : 'bg-white'}`}
      >
        <img src={defaultAvatar} alt="" className="w-16 h-16 rounded-full" />
        <h1 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Welcome back</h1>

        <input
          type="text"
          required
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          className={`${inputClass} w-full`}
        />

        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className={inputClass}
        />

        {error && <p className="text-red-500 text-xs w-full text-left">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !username || !password}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          New user?{' '}
          <button type="button" onClick={onGoToSignup} className="text-indigo-500 hover:text-indigo-400 font-medium">
            Sign up
          </button>
        </p>
      </form>
    </div>
  )
}
