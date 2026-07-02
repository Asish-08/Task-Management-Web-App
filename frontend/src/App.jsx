import { useState, useEffect } from 'react'

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className="text-yellow-400">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
      className="text-slate-700">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
import { useTasks }    from './hooks/useTasks'
import { useHeatmap }  from './hooks/useHeatmap'
import { useQuote }    from './hooks/useQuote'
import { useStartup }  from './hooks/useStartup'
import { usePomodoro } from './hooks/usePomodoro'
import { TaskList }    from './components/TaskList'
import { QuotePanel }  from './components/QuotePanel'
import { PomodoroTimer } from './components/PomodoroTimer'
import { Heatmap }     from './components/Heatmap'
import { CompletedLog } from './components/CompletedLog'

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

const ADD_MESSAGES = [
  "Task added! Time to get to work 💼",
  "New mission unlocked! 🎯",
  "Added to the list, now let's crush it 🔥",
  "One more thing standing between you and done 📝",
  "Challenge accepted! 🚀",
  "On the board! Let's go 🌟",
  "Task locked in ⚡",
]

const COMPLETE_MESSAGES = [
  "Hooray, you completed another one! 🎉",
  "You go champ! 💪",
  "Crushing it, one task at a time! 🔥",
  "That's what we call progress! ⚡",
  "Look at you getting things done! 🌟",
  "Another one bites the dust! 🎯",
  "Keep that momentum going! 🚀",
]

function randomMessage(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default function App() {
  const startup  = useStartup()
  const { active, completed, addTask, markComplete, editTask } = useTasks(startup)
  const { data: heatmap, incrementToday } = useHeatmap(startup?.heatmap_timestamps)
  const quote    = useQuote(startup?.quote)
  const pomodoro = usePomodoro()

  // Which day's tasks to show — defaults to today, updated on block click
  const [selectedDate, setSelectedDate] = useState(null)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  function toggleDark() {
    setDark(d => {
      const next = !d
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  function handleDaySelect(date) {
    setSelectedDate(date)
  }

  function handleAddTask(title) {
    setToast({ message: randomMessage(ADD_MESSAGES), color: 'rgb(0, 76, 252)' })
    addTask(title)
  }

  async function handleComplete(id) {
    setToast({ message: randomMessage(COMPLETE_MESSAGES), color: '' })
    await markComplete(id)
    incrementToday()
  }

  // Filter completed tasks to the selected date (treat API timestamps as UTC)
  const dailyCompleted = completed.filter(t => {
    if (!t.completed_at) return false
    const ts = t.completed_at.endsWith('Z') ? t.completed_at : t.completed_at + 'Z'
    const filterDate = selectedDate || localDateStr(new Date())
    return localDateStr(new Date(ts)) === filterDate
  })

  return (
    <div className={`min-h-screen ${dark ? 'bg-black' : 'bg-[#F3F2EF]'} text-gray-900 p-4 md:p-6 flex flex-col gap-4`}>

      {/* Header */}
      <div className={`relative flex items-center justify-between pb-2 border-b ${dark ? 'border-zinc-800' : 'border-gray-200'}`}>
        <h1 className={`text-lg font-bold tracking-tight ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Tasks Tracker</h1>
        {toast && (
          <div
            style={toast.color ? { backgroundColor: toast.color } : undefined}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap ${toast.color ? '' : 'bg-green-600'}`}
          >
            {toast.message}
          </div>
        )}
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none
            ${dark ? 'bg-slate-700' : 'bg-blue-400'}`}
        >
          <span className={`absolute top-0.5 flex items-center justify-center
                            w-6 h-6 bg-white rounded-full shadow transition-transform duration-300
                            ${dark ? 'translate-x-7' : 'translate-x-0.5'}`}>
            {dark ? <MoonIcon /> : <SunIcon />}
          </span>
        </button>
      </div>

      {/* Main panel: single 2-col grid, TaskList spans both rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[16rem_11rem] gap-4">
        {/* Left column — spans both rows */}
        <div className="md:row-span-2 h-full">
          <TaskList
            tasks={active}
            onAdd={handleAddTask}
            onComplete={handleComplete}
            onEdit={editTask}
            dark={dark}
          />
        </div>

        {/* Right col, row 1 — Quote */}
        <QuotePanel quote={quote} dark={dark} />

        {/* Right col, row 2 — Pomodoro */}
        <PomodoroTimer
          display={pomodoro.display}
          running={pomodoro.running}
          onToggle={pomodoro.toggle}
          onReset={pomodoro.reset}
          durations={pomodoro.durations}
          selectedDuration={pomodoro.selectedDuration}
          onSelectDuration={pomodoro.selectDuration}
          onBreak={pomodoro.startBreak}
          isBreak={pomodoro.isBreak}
          onSetCustomTime={pomodoro.setCustomTime}
          dark={dark}
        />
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <Heatmap
            data={heatmap}
            selectedDate={selectedDate}
            onDaySelect={handleDaySelect}
            dark={dark}
          />
        </div>
      </div>

      {/* Completed tasks — scoped to selectedDate */}
      <CompletedLog tasks={dailyCompleted} selectedDate={selectedDate} dark={dark} />
    </div>
  )
}
