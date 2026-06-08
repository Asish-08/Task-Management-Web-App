export function PomodoroTimer({ display, running, onToggle, onReset }) {
  return (
    <div className="bg-white rounded-xl p-4 h-full flex flex-col items-center justify-center gap-4">
      <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider">
        Pomodoro
      </p>
      <div className="text-5xl font-mono font-bold text-gray-900 tracking-widest tabular-nums">
        {display}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onToggle}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm
                     px-5 py-2 rounded-lg transition-colors font-medium"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={onReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm
                     px-4 py-2 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
