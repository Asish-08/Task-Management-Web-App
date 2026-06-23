import { useState }    from 'react'
import { useTasks }    from './hooks/useTasks'
import { useHeatmap }  from './hooks/useHeatmap'
import { useQuote }    from './hooks/useQuote'
import { usePomodoro } from './hooks/usePomodoro'
import { TaskList }    from './components/TaskList'
import { QuotePanel }  from './components/QuotePanel'
import { PomodoroTimer } from './components/PomodoroTimer'
import { Heatmap }     from './components/Heatmap'
import { CompletedLog } from './components/CompletedLog'

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export default function App() {
  const { active, completed, addTask, markComplete, editTask } = useTasks()
  const { data: heatmap, incrementToday } = useHeatmap()
  const quote    = useQuote()
  const pomodoro = usePomodoro()

  // Which day's tasks to show — defaults to today, updated on block click
  const [selectedDate, setSelectedDate] = useState(() => localDateStr(new Date()))

  function handleDaySelect(date) {
    setSelectedDate(date)
  }

  async function handleComplete(id) {
    await markComplete(id)
    incrementToday()
  }

  // Filter completed tasks to the selected date (treat API timestamps as UTC)
  const dailyCompleted = completed.filter(t => {
    if (!t.completed_at) return false
    const ts = t.completed_at.endsWith('Z') ? t.completed_at : t.completed_at + 'Z'
    return localDateStr(new Date(ts)) === selectedDate
  })

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 p-4 md:p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        {/* <div className="w-2 h-2 rounded-full bg-indigo-600" /> */}
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Tasks Tracker</h1>
      </div>

      {/* Main panel: single 2-col grid, TaskList spans both rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[16rem_11rem] gap-4">
        {/* Left column — spans both rows */}
        <div className="md:row-span-2 h-full">
          <TaskList
            tasks={active}
            onAdd={addTask}
            onComplete={handleComplete}
            onEdit={editTask}
          />
        </div>

        {/* Right col, row 1 — Quote */}
        <QuotePanel quote={quote} />

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
        />
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <Heatmap
            data={heatmap}
            selectedDate={selectedDate}
            onDaySelect={handleDaySelect}
          />
        </div>
      </div>

      {/* Completed tasks — scoped to selectedDate */}
      <CompletedLog tasks={dailyCompleted} selectedDate={selectedDate} />
    </div>
  )
}
