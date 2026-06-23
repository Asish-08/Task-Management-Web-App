import { colorClass } from '../utils/heatmapColors'

export function HeatmapCell({ count, isSelected, onClick, onMouseEnter, onMouseLeave, dark }) {
  if (count < 0) {
    return <div className="w-3 h-3" />
  }

  const cellColor = count === 0
    ? (dark ? 'bg-zinc-700' : 'bg-gray-200')
    : colorClass(count)

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`w-3 h-3 rounded-sm ${cellColor} cursor-pointer transition-all
                  ${isSelected
                    ? `ring-2 ring-indigo-500 ring-offset-1 ${dark ? 'ring-offset-zinc-900' : 'ring-offset-white'}`
                    : 'hover:ring-1 hover:ring-gray-400'}`}
    />
  )
}
