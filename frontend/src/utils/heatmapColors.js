export function colorClass(count) {
  if (count === 0) return 'bg-gray-200'
  if (count <= 2)  return 'bg-green-900'
  if (count <= 5)  return 'bg-green-600'
  return            'bg-green-400'
}

export function tooltipText(date, count) {
  if (count === 0) return `${date}: no tasks`
  return `${date}: ${count} task${count > 1 ? 's' : ''} completed`
}
