import { useState } from 'react'

export function TaskInput({ onAdd, dark }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <div className="flex gap-2">
      <input
        className={`flex-1 border rounded-lg px-3 py-2 text-sm placeholder-gray-400
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                    ${dark ? 'bg-zinc-800 border-zinc-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
        placeholder="New task..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
      >
        Add
      </button>
    </div>
  )
}
