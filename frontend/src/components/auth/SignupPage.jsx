import { useState, useMemo } from 'react'
import defaultAvatar from '../../assets/default-avatar.svg'

// Kept in sync by hand with the identical 5-rule checklist in
// backend/app/schemas.py's SignupIn.check_password_strength — update both together.
const RULES = [
  { test: pw => pw.length >= 8, label: 'At least 8 characters' },
  { test: pw => /[A-Z]/.test(pw), label: 'An uppercase letter' },
  { test: pw => /[a-z]/.test(pw), label: 'A lowercase letter' },
  { test: pw => /\d/.test(pw), label: 'A digit' },
  { test: pw => /[^A-Za-z0-9]/.test(pw), label: 'A special character' },
]

export function SignupPage({ onSignup, onBackToLogin, dark }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const usernameValid = username.trim().length >= 3
  const ruleResults = useMemo(() => RULES.map(r => ({ ...r, passed: r.test(password) })), [password])
  const allRulesPass = ruleResults.every(r => r.passed)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit = usernameValid && allRulesPass && passwordsMatch && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      await onSignup(username.trim(), password)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create account')
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
        className={`w-full max-w-sm rounded-xl p-6 flex flex-col gap-3 ${dark ? 'bg-zinc-900' : 'bg-white'}`}
      >
        <div className="flex flex-col items-center gap-2 mb-1">
          <img src={defaultAvatar} alt="" className="w-14 h-14 rounded-full" />
          <h1 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Create your account</h1>
        </div>

        <input
          type="text"
          required
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Choose a username"
          className={inputClass}
        />
        {username.length > 0 && (
          <p className={`text-xs -mt-1 ${usernameValid ? 'text-green-500' : 'text-red-500'}`}>
            {usernameValid ? '✓' : '○'} At least 3 characters
          </p>
        )}

        <input
          type="password"
          required
          maxLength={72}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="New password"
          className={inputClass}
        />

        <input
          type="password"
          required
          maxLength={72}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className={inputClass}
        />
        {confirmPassword.length > 0 && (
          <p className={`text-xs -mt-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
            {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}

        <ul className="text-xs space-y-1">
          {ruleResults.map(r => (
            <li key={r.label} className={r.passed ? 'text-green-500' : (dark ? 'text-gray-500' : 'text-gray-400')}>
              {r.passed ? '✓' : '○'} {r.label}
            </li>
          ))}
        </ul>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>

        <p className={`text-xs text-center ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Already have an account?{' '}
          <button type="button" onClick={onBackToLogin} className="text-indigo-500 hover:text-indigo-400 font-medium">
            Log in
          </button>
        </p>
      </form>
    </div>
  )
}
