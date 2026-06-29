import { useState, useEffect, useRef, useCallback } from 'react'

const DURATIONS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '50 min', seconds: 50 * 60 },
  { label: '1.5 hr', seconds: 90 * 60 },
  { label: '2 hr',   seconds: 120 * 60 },
]
const BREAK_SECONDS = 5 * 60

function formatDisplay(s) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function playAlarm() {
  try {
    new Audio('/alarm-clock-digital-bell.mp3').play()
  } catch (_) {}
}

export function usePomodoro() {
  const [selectedDuration, setSelectedDuration] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS[0].seconds)
  const [running, setRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)

  const intervalRef = useRef(null)
  // Holds the absolute deadline while running; null when paused/stopped.
  const endTimeRef = useRef(null)
  // Mirrors secondsLeft state so effects can read the current value without stale closures.
  const secondsLeftRef = useRef(DURATIONS[0].seconds)
  secondsLeftRef.current = secondsLeft
  const selectedDurationRef = useRef(selectedDuration)
  selectedDurationRef.current = selectedDuration

  const fireComplete = useCallback(() => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setRunning(false)
    setIsBreak(false)
    playAlarm()
    const reset = DURATIONS[selectedDurationRef.current].seconds
    secondsLeftRef.current = reset
    setSecondsLeft(reset)
  }, [])

  // Recomputes remaining time from the wall-clock deadline rather than counting ticks.
  const recompute = useCallback(() => {
    if (!endTimeRef.current) return
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
    secondsLeftRef.current = remaining
    setSecondsLeft(remaining)
    if (remaining === 0) fireComplete()
  }, [fireComplete])

  useEffect(() => {
    if (running) {
      endTimeRef.current = Date.now() + secondsLeftRef.current * 1000
      recompute()
      intervalRef.current = setInterval(recompute, 250)
    } else {
      clearInterval(intervalRef.current)
      // Freeze the displayed time to the wall-clock value at the moment of pause.
      if (endTimeRef.current) {
        const frozen = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
        secondsLeftRef.current = frozen
        setSecondsLeft(frozen)
        endTimeRef.current = null
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [running, recompute])

  // Snap to correct time immediately when the tab becomes visible again.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') recompute()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [recompute])

  const selectDuration = useCallback((index) => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setRunning(false)
    setIsBreak(false)
    setSelectedDuration(index)
    const s = DURATIONS[index].seconds
    secondsLeftRef.current = s
    setSecondsLeft(s)
  }, [])

  const startBreak = useCallback(() => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    const s = BREAK_SECONDS
    secondsLeftRef.current = s
    setSecondsLeft(s)
    setIsBreak(true)
    setRunning(true)
  }, [])

  const toggle = () => setRunning(r => !r)

  const reset = () => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setRunning(false)
    setIsBreak(false)
    const s = DURATIONS[selectedDurationRef.current].seconds
    secondsLeftRef.current = s
    setSecondsLeft(s)
  }

  const setCustomTime = useCallback((h, m, s) => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setRunning(false)
    setIsBreak(false)
    const total = Math.max(1, h * 3600 + m * 60 + s)
    secondsLeftRef.current = total
    setSecondsLeft(total)
  }, [])

  return {
    display: formatDisplay(secondsLeft),
    running,
    toggle,
    reset,
    durations: DURATIONS,
    selectedDuration,
    selectDuration,
    startBreak,
    isBreak,
    setCustomTime,
  }
}
