import { useState } from 'react'
import defaultAvatar from '../../assets/default-avatar.svg'

export function ProfileSetupPage({ user, mode, onSubmit, onCancel, dark }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(name.trim(), email.trim(), bio)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save profile')
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
        className={`w-full max-w-lg rounded-xl p-6 flex flex-col gap-4 ${dark ? 'bg-zinc-900' : 'bg-white'}`}
      >
        <h1 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
          {mode === 'edit' ? 'Edit your profile' : 'Set up your profile'}
        </h1>

        <div className="flex gap-6 items-start">
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself (optional)"
                rows={4}
                className={inputClass}
              />
            </div>
          </div>

          {/* Profile-picture slot: static placeholder only — upload is not implemented yet */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <img src={defaultAvatar} alt="" className="w-20 h-20 rounded-full" />
            <span className={`text-[10px] text-center max-w-[6rem] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              Profile pictures coming soon
            </span>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors
                ${dark ? 'text-gray-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
