import { useState, useRef } from 'react'
import { HeatmapCell } from './HeatmapCell'
import { colorClass } from '../utils/heatmapColors'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

export function Heatmap({ data, selectedDate, onDaySelect, dark }) {
  const [tooltip, setTooltip] = useState(null)
  const hoverTimer            = useRef(null)

  // 1-second hover tooltip
  function handleMouseEnter(date, count, e) {
    if (count < 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    hoverTimer.current = setTimeout(() => {
      setTooltip({ date, count, x: rect.right + 6, y: rect.top })
    }, 500)
  }

  function handleMouseLeave() {
    clearTimeout(hoverTimer.current)
    setTooltip(null)
  }

  // Click: select this day; clicking selected day or today resets to today
  function handleCellClick(date) {
    const todayStr = localDateStr(new Date())
    const next = (selectedDate === date || date === todayStr) ? todayStr : date
    onDaySelect(next)
  }

  if (!data.length) {
    return (
      <div className={`rounded-xl p-4 ${dark ? 'bg-zinc-900' : 'bg-[#FFFFFF]'}`}>
        <h2 className={`font-semibold text-base mb-3 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Activity</h2>
        <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
          Loading activity...
        </div>
      </div>
    )
  }

  const weeks = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  let prevLabelMonth = -1
  const monthLabels = weeks.map((week) => {
    const firstReal = week.find(d => d.count >= 0)
    if (!firstReal) return ''
    const month = new Date(firstReal.date + 'T00:00:00').getMonth()
    if (month !== prevLabelMonth) { prevLabelMonth = month; return MONTHS[month] }
    return ''
  })

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-zinc-900' : 'bg-[#FFFFFF]'}`}>
      <h2 className={`font-semibold text-base mb-3 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Activity</h2>

      {/* Month labels */}
      <div className="flex gap-1 mb-1">
        {monthLabels.map((label, i) => (
          <div key={i} className="w-3 flex-shrink-0 text-gray-400 leading-none"
               style={{ fontSize: '9px' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => (
              <HeatmapCell
                key={day.date}
                date={day.date}
                count={day.count}
                isSelected={day.date === selectedDate}
                onClick={day.count >= 0 ? () => handleCellClick(day.date) : undefined}
                onMouseEnter={day.count >= 0
                  ? (e) => handleMouseEnter(day.date, day.count, e)
                  : undefined}
                onMouseLeave={day.count >= 0 ? handleMouseLeave : undefined}
                dark={dark}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-gray-400" style={{ fontSize: '10px' }}>
        <span>Less</span>
        {[0, 1, 3, 6].map(v => (
          <div key={v} className={`w-3 h-3 rounded-sm ${v === 0 ? (dark ? 'bg-zinc-700' : 'bg-gray-200') : colorClass(v)}`} />
        ))}
        <span>More</span>
      </div>

      {/* Hover tooltip — appears after 500ms */}
      {tooltip && (
        <div
          className={`fixed z-50 rounded-lg px-3 py-1.5 shadow-md pointer-events-none select-none
                     flex items-center gap-2 border
                     ${dark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300'}`}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className={`text-sm font-medium ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatDate(tooltip.date)}
          </span>
          {tooltip.count > 0 ? (
            <span className="text-indigo-600 text-xs">
              {tooltip.count} task{tooltip.count !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">no tasks</span>
          )}
        </div>
      )}
    </div>
  )
}
