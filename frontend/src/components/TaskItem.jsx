import { useState, useRef } from 'react'

export function TaskItem({ task, onComplete, onEdit, dark }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef(null)
  const isPersisted = typeof task.id !== 'string'

  function startEdit() {
    setDraft(task.title)
    setEditing(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed)
    }
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.target.blur() }
    if (e.key === 'Escape') { setDraft(task.title); setEditing(false) }
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', String(task.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <li
      draggable={isPersisted}
      onDragStart={isPersisted ? handleDragStart : undefined}
      className={`flex items-start gap-3 rounded-lg px-3 py-2 ${dark ? 'bg-zinc-800' : 'bg-gray-100'}
        ${isPersisted ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <button
        onClick={() => onComplete(task.id)}
        className="w-5 h-5 mt-0.5 rounded border border-gray-300 hover:border-indigo-500
                   hover:bg-indigo-50 transition-colors flex-shrink-0"
        aria-label="Mark complete"
      />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`flex-1 text-sm border border-indigo-400 rounded px-2 py-0.5 outline-none min-w-0
            ${dark ? 'bg-zinc-700 text-gray-100' : 'bg-white text-gray-800'}`}
        />
      ) : (
        <span
          className={`text-sm flex-1 min-w-0 cursor-text break-words whitespace-pre-wrap ${dark ? 'text-gray-100' : 'text-gray-800'}`}
          onDoubleClick={startEdit}
          title="Double-click to edit"
        >
          {task.title}
        </span>
      )}
    </li>
  )
}
