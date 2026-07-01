import { useState, useEffect } from 'react'

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildHeatmapGrid(timestamps) {
  const counts = {}
  for (const ts of timestamps) {
    const key = localDateStr(new Date(ts))
    counts[key] = (counts[key] || 0) + 1
  }

  const today = new Date()
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const rangeStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const rangeEnd = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate() + 363,
  )

  const daysBack = (rangeStart.getDay() + 6) % 7
  const gridStart = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate() - daysBack,
  )

  const result = []
  const cur = new Date(gridStart)
  while (cur <= rangeEnd) {
    const dateStr = localDateStr(cur)
    const inRange = cur >= rangeStart
    const isFuture = cur > todayNorm
    result.push({
      date: dateStr,
      count: !inRange ? -1
           : isFuture ? 0
           : (counts[dateStr] ?? 0),
    })
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export function useHeatmap(seedTimestamps) {
  const [data, setData] = useState([])

  useEffect(() => {
    if (!seedTimestamps) return
    setData(buildHeatmapGrid(seedTimestamps))
  }, [seedTimestamps])

  function incrementToday() {
    const todayStr = localDateStr(new Date())
    setData(prev => prev.map(entry =>
      entry.date === todayStr
        ? { ...entry, count: entry.count + 1 }
        : entry
    ))
  }

  return { data, incrementToday }
}
