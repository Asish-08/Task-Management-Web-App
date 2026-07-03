import { useState } from 'react'
import { TaskInput } from './TaskInput'
import { TaskItem } from './TaskItem'
import { Folder } from './Folder'

function FolderPlusIcon({ className }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}

export function TaskList({ tasks, folders, onAdd, onComplete, onEdit, onCreateFolder, onRenameFolder, onMoveTask, dark }) {
  const [newlyCreatedFolderId, setNewlyCreatedFolderId] = useState(null)
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false)

  async function handleCreateFolder() {
    const folder = await onCreateFolder()
    if (folder) setNewlyCreatedFolderId(folder.id)
  }

  function handleUnassignedDrop(e) {
    e.preventDefault()
    setDragOverUnassigned(false)
    const taskId = Number(e.dataTransfer.getData('text/plain'))
    if (!Number.isNaN(taskId)) onMoveTask(taskId, null)
  }

  const unassigned = tasks.filter(t => !t.folder_id)

  return (
    <div className={`flex flex-col h-full rounded-xl p-4 gap-3 overflow-hidden ${dark ? 'bg-zinc-900' : 'bg-[#FFFFFF]'}`}>
      <h2 className={`font-semibold text-base flex-shrink-0 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Active Tasks</h2>
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="flex-1"><TaskInput onAdd={onAdd} dark={dark} /></div>
        <button
          onClick={handleCreateFolder}
          aria-label="New folder"
          title="New folder"
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border transition-colors
            ${dark ? 'border-zinc-700 hover:bg-zinc-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600'}`}
        >
          <FolderPlusIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {folders.map(folder => (
          <Folder
            key={folder.id}
            folder={folder}
            tasks={tasks.filter(t => t.folder_id === folder.id)}
            onRename={onRenameFolder}
            onComplete={onComplete}
            onEdit={onEdit}
            onDropTask={onMoveTask}
            startInEditMode={folder.id === newlyCreatedFolderId}
            onEditModeStarted={() => setNewlyCreatedFolderId(null)}
            dark={dark}
          />
        ))}
        <ul
          onDragOver={e => { e.preventDefault(); setDragOverUnassigned(true) }}
          onDragLeave={() => setDragOverUnassigned(false)}
          onDrop={handleUnassignedDrop}
          className={`space-y-2 rounded-lg transition-colors min-h-[3.5rem] ${dragOverUnassigned ? 'bg-indigo-500/10' : ''}`}
        >
          {unassigned.map(task => (
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
          {unassigned.length === 0 && tasks.length > 0 && (
            <li className="text-gray-400 text-xs text-center py-4 italic">
              Drag a task here to remove it from a folder
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
