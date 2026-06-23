import { useState, useRef, useEffect, useCallback } from 'react'

export function PomodoroTimer({
  display,
  running,
  onToggle,
  onReset,
  durations,
  selectedDuration,
  onSelectDuration,
  onBreak,
  isBreak,
  onSetCustomTime,
  dark,
}) {
  const [editSeg, setEditSeg] = useState(null)
  const [editBuffer, setEditBuffer] = useState('')
  const timerRef = useRef(null)
  const timeoutRef = useRef(null)
  // Refs so event handlers always read fresh values without re-registering
  const editBufferRef = useRef('')
  const displayRef = useRef(display)
  editBufferRef.current = editBuffer
  displayRef.current = display

  const [dh, dm, ds] = display.split(':')

  const stop = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setEditSeg(null)
    setEditBuffer('')
  }, [])

  const abort = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setEditSeg(null)
    setEditBuffer('')
    onSelectDuration(0) // reset to 25 min
  }, [onSelectDuration])

  const apply = useCallback((buf, seg) => {
    const [cdh, cdm, cds] = displayRef.current.split(':')
    const val = parseInt(buf || '0', 10)
    const h = seg === 'h' ? Math.min(val, 99) : parseInt(cdh, 10)
    const m = seg === 'm' ? Math.min(val, 59) : parseInt(cdm, 10)
    const s = seg === 's' ? Math.min(val, 59) : parseInt(cds, 10)
    onSetCustomTime(h, m, s)
    stop()
  }, [onSetCustomTime, stop])

  function enterEdit(seg) {
    if (running || isBreak) return
    clearTimeout(timeoutRef.current)
    setEditSeg(seg)
    setEditBuffer('')
    timeoutRef.current = setTimeout(abort, 3000)
  }

  // Document-level keyboard + mousedown listeners while editing
  useEffect(() => {
    if (!editSeg) return

    function onKey(e) {
      const buf = editBufferRef.current
      clearTimeout(timeoutRef.current)

      if (e.key === 'Escape') { abort(); return }
      if (e.key === 'Enter') { apply(buf, editSeg); return }

      if (!/^\d$/.test(e.key)) {
        timeoutRef.current = setTimeout(abort, 3000)
        return
      }

      const next = buf + e.key
      if (next.length >= 2) {
        apply(next, editSeg)
      } else {
        setEditBuffer(next)
        timeoutRef.current = setTimeout(abort, 3000)
      }
    }

    function onMouseDown(e) {
      clearTimeout(timeoutRef.current)
      if (!timerRef.current?.contains(e.target)) {
        abort() // outside card → reset to 25 min
      } else {
        stop() // inside card (e.g. Start) → exit edit, keep current time
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [editSeg, abort, apply, stop])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  function renderSeg(val, seg) {
    if (editSeg === seg) {
      const buf = editBuffer.padEnd(2, '_')
      return (
        <span
          className="animate-pulse text-indigo-600"
          onDoubleClick={() => enterEdit(seg)}
        >
          {buf}
        </span>
      )
    }
    return (
      <span
        className={!running && !isBreak ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}
        onDoubleClick={() => enterEdit(seg)}
      >
        {val}
      </span>
    )
  }

  return (
    <div ref={timerRef} className={`rounded-xl p-4 h-full flex ${dark ? 'bg-zinc-900' : 'bg-white'}`}>
      {/* Left: label + display + controls */}
      <div className="flex flex-col items-center justify-center gap-3 flex-1">
        <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider">
          Pomodoro
        </p>

        <div className={`text-5xl font-mono font-bold tracking-widest tabular-nums select-none ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
          {renderSeg(dh, 'h')}
          <span>:</span>
          {renderSeg(dm, 'm')}
          <span>:</span>
          {renderSeg(ds, 's')}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBreak}
            disabled={running || isBreak}
            className={`text-sm px-4 py-2 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed
              ${dark ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            Break
          </button>
          <button
            onClick={onToggle}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm
                       px-5 py-2 rounded transition-colors font-medium"
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onReset}
            className={`text-sm px-4 py-2 rounded transition-colors
              ${dark ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right: duration picker stacked vertically */}
      <div className="flex flex-col gap-1.5 justify-center items-center">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
          Time
        </p>
        {durations.map((d, i) => (
          <button
            key={d.label}
            onClick={() => onSelectDuration(i)}
            disabled={running || isBreak}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors w-16 text-center
              ${selectedDuration === i
                ? 'bg-indigo-600 text-white'
                : dark ? 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed'
                       : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}
