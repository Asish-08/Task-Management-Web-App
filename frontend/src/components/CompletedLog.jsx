import { formatDisplayDate } from '../utils/dateHelpers'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function CompletedLog({ tasks, selectedDate, dark }) {
  const isToday = selectedDate === localDateStr(new Date())
  const label   = isToday ? 'Today' : formatShortDate(selectedDate)

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-zinc-900' : 'bg-white'}`}>
      <h2 className={`font-semibold text-base mb-3 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
        {label} — Completed
        {tasks.length > 0 && (
          <span className="ml-2 text-gray-500 text-sm font-normal">
            ({tasks.length})
          </span>
        )}
      </h2>

      {tasks.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">
          {isToday ? 'No tasks completed today.' : `No tasks completed on ${label}.`}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map(task => (
            <li
              key={task.id}
              className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2.5
                ${dark ? 'bg-zinc-800' : 'bg-gray-100'}`}
            >
              <span className={`text-sm flex items-center gap-2 min-w-0 ${dark ? 'text-gray-100' : 'text-gray-700'}`}>
                <span className="text-indigo-600 flex-shrink-0">&#10003;</span>
                <span className="truncate">{task.title}</span>
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                {formatDisplayDate(task.completed_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
