import { useState, useEffect, useRef } from 'react'
import { TaskItem } from './TaskItem'

function FolderIcon({ className }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg width="14" height="14" viewBox="4 4 17 17" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function Folder({ folder, tasks, onRename, onComplete, onEdit, onDropTask, startInEditMode, onEditModeStarted, dark }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(folder.name)
  const [dragOver, setDragOver] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!startInEditMode) return
    setDraft(folder.name === 'Untitled Folder' ? '' : folder.name)
    setEditing(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
      onEditModeStarted?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startInEditMode])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed !== folder.name) onRename(folder.id, trimmed || 'Untitled Folder')
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.target.blur() }
    if (e.key === 'Escape') { setDraft(folder.name); setEditing(false) }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const taskId = Number(e.dataTransfer.getData('text/plain'))
    if (!Number.isNaN(taskId)) onDropTask(taskId, folder.id)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`rounded-lg border-2 border-dashed p-2 space-y-2 transition-colors
        ${dragOver ? 'border-indigo-500 bg-indigo-500/10' : dark ? 'border-zinc-700' : 'border-gray-300'}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse folder' : 'Expand folder'}
          className={`flex-shrink-0 p-0.5 rounded transition-colors hover:text-yellow-400 active:text-yellow-800
            ${dark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-black/5'}`}
        >
          <ChevronIcon className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <FolderIcon className={`flex-shrink-0 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder="Untitled Folder"
            className={`flex-1 text-sm font-medium border border-indigo-400 rounded px-2 py-0.5 outline-none min-w-0
              ${dark ? 'bg-zinc-700 text-gray-100' : 'bg-white text-gray-800'}`}
          />
        ) : (
          <span
            className={`text-sm font-medium truncate flex-1 cursor-text ${dark ? 'text-gray-100' : 'text-gray-800'}`}
            onDoubleClick={() => { setDraft(folder.name); setEditing(true) }}
            title="Double-click to rename"
          >
            {folder.name}
          </span>
        )}
        <span className="flex-shrink-0 text-xs font-semibold text-indigo-600">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      {expanded && (
        <ul className="space-y-1.5 pl-5">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} onComplete={onComplete} onEdit={onEdit} dark={dark} />
          ))}
          {tasks.length === 0 && (
            <li className="text-xs text-gray-400 italic px-1 py-1">Drop a task here</li>
          )}
        </ul>
      )}
    </div>
  )
}
