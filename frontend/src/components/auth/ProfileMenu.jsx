import { useState } from 'react'
import defaultAvatar from '../../assets/default-avatar.svg'

export function ProfileMenu({ user, dark, onEditProfile, onLogout }) {
  const [open, setOpen] = useState(false)

  function toggleOpen(e) {
    e.stopPropagation()
    setOpen(o => {
      const next = !o
      if (next) window.addEventListener('click', () => setOpen(false), { once: true })
      return next
    })
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Profile menu"
        className="w-8 h-8 rounded-full overflow-hidden border border-transparent hover:border-indigo-400 transition-colors flex-shrink-0"
      >
        <img src={defaultAvatar} alt="" className="w-full h-full object-cover" />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className={`absolute right-0 top-10 w-48 rounded-lg shadow-lg border z-10 overflow-hidden
            ${dark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}
        >
          <div className={`flex items-center gap-2 px-3 py-3 border-b ${dark ? 'border-zinc-700' : 'border-gray-100'}`}>
            <img src={defaultAvatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
            <span className={`text-sm font-medium truncate ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
              {user?.name || user?.username}
            </span>
          </div>
          <button
            onClick={() => { setOpen(false); onEditProfile() }}
            className={`w-full text-left text-sm px-3 py-2 transition-colors
              ${dark ? 'text-gray-200 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className={`w-full text-left text-sm px-3 py-2 transition-colors text-red-500
              ${dark ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'}`}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
