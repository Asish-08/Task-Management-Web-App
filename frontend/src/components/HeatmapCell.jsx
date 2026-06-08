import { colorClass } from '../utils/heatmapColors'

export function HeatmapCell({ count, isSelected, onClick, onMouseEnter, onMouseLeave }) {
  if (count < 0) {
    return <div className="w-3 h-3" />
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`w-3 h-3 rounded-sm ${colorClass(count)} cursor-pointer transition-all
                  ${isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white'
                    : 'hover:ring-1 hover:ring-gray-400'}`}
    />
  )
}
