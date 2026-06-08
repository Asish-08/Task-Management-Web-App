import { TaskInput } from './TaskInput'

export function TaskList({ tasks, onAdd, onComplete }) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl p-4 gap-3 overflow-hidden">
      <h2 className="text-gray-900 font-semibold text-base flex-shrink-0">Active Tasks</h2>
      <div className="flex-shrink-0">
        <TaskInput onAdd={onAdd} />
      </div>
      <ul className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {tasks.map(task => (
          <li
            key={task.id}
            className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2"
          >
            <button
              onClick={() => onComplete(task.id)}
              className="w-5 h-5 rounded border border-gray-300 hover:border-indigo-500
                         hover:bg-indigo-50 transition-colors flex-shrink-0"
              aria-label="Mark complete"
            />
            <span className="text-sm text-gray-800 truncate">{task.title}</span>
          </li>
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
