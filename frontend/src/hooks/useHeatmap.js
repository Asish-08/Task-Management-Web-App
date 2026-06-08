import { useState, useEffect } from 'react'
import { fetchHeatmap } from '../api/client'

// Returns "YYYY-MM-DD" for a local Date object
function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Builds the [{date, count}] grid the Heatmap component expects.
//
// Layout rules:
//   • Grid starts on the 1st of the current month THIS year
//   • Columns are Mon–Sun weeks (Monday-first alignment)
//   • Days before the 1st (Monday-alignment padding) get count = -1  → invisible spacer
//   • Past dates (≤ today) get real task counts from timestamps
//   • Future dates (> today) get count = 0  → empty grey cell
//   • Grid spans 52 weeks (364 days) from rangeStart
//
// Example — today = Jun 7, 2026 (Sunday):
//   rangeStart  = Jun 1, 2026  (Monday → no padding needed)
//   rangeEnd    = May 30, 2027 (Sunday, 364 days later = 52 full weeks)
//   Jun 1, 2026 → col 0, row 0  (first block)
//   Jun 7, 2026 → col 0, row 6  (today, 7th block down)
//   Jun 8+      → count = 0     (future, empty grey)
function buildHeatmapGrid(timestamps) {
  // 1. Map UTC timestamps → local date counts
  const counts = {}
  for (const ts of timestamps) {
    const key = localDateStr(new Date(ts))
    counts[key] = (counts[key] || 0) + 1
  }

  const today = new Date()
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  // 2. Range: 1st of current month, THIS year
  const rangeStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // 3. End: 52 weeks (364 days inclusive) from rangeStart
  const rangeEnd = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate() + 363,
  )

  // 4. Align grid start to Monday
  //    (day + 6) % 7 → 0 for Mon, 6 for Sun
  const daysBack = (rangeStart.getDay() + 6) % 7
  const gridStart = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate() - daysBack,
  )

  // 5. Fill day-by-day from gridStart to rangeEnd
  const result = []
  const cur = new Date(gridStart)
  while (cur <= rangeEnd) {
    const dateStr = localDateStr(cur)
    const inRange = cur >= rangeStart
    const isFuture = cur > todayNorm
    result.push({
      date: dateStr,
      count: !inRange ? -1                    // padding → invisible
           : isFuture ? 0                     // future  → empty grey
           : (counts[dateStr] ?? 0),          // past    → real count
    })
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export function useHeatmap() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchHeatmap()
      .then(r => setData(buildHeatmapGrid(r.data)))
      .catch(() => {})
  }, [])

  // Called immediately after a task is marked complete so the heatmap
  // updates without a page refresh or extra API call.
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
