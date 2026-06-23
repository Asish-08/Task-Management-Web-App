import { useState, useRef } from 'react'
import { TaskInput } from './TaskInput'

function TaskItem({ task, onComplete, onEdit, dark }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef(null)

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

  return (
    <li className={`flex items-center gap-3 rounded-lg px-3 py-2 ${dark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
      <button
        onClick={() => onComplete(task.id)}
        className="w-5 h-5 rounded border border-gray-300 hover:border-indigo-500
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
          className={`text-sm truncate flex-1 cursor-text ${dark ? 'text-gray-100' : 'text-gray-800'}`}
          onDoubleClick={startEdit}
          title="Double-click to edit"
        >
          {task.title}
        </span>
      )}
    </li>
  )
}

export function TaskList({ tasks, onAdd, onComplete, onEdit, dark }) {
  return (
    <div className={`flex flex-col h-full rounded-xl p-4 gap-3 overflow-hidden ${dark ? 'bg-zinc-900' : 'bg-white'}`}>
      <h2 className={`font-semibold text-base flex-shrink-0 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Active Tasks</h2>
      <div className="flex-shrink-0">
        <TaskInput onAdd={onAdd} dark={dark} />
      </div>
      <ul className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onComplete={onComplete}
            onEdit={onEdit}
            dark={dark}
          />
        ))}
        {tasks.length === 0 && (
          <li className="text-gray-400 text-sm text-center py-6">
            No active tasks. Add one above.
          </li>
        )}
      </ul>
    </div>
  )
}
