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
  const selectedDurationRef = useRef(selectedDuration)
  selectedDurationRef.current = selectedDuration
  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current)
        setRunning(false)
        setIsBreak(false)
        playAlarm()
        return DURATIONS[selectedDurationRef.current].seconds
      }
      return prev - 1
    })
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, tick])

  const selectDuration = useCallback((index) => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setIsBreak(false)
    setSelectedDuration(index)
    setSecondsLeft(DURATIONS[index].seconds)
  }, [])

  const startBreak = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsBreak(true)
    setSecondsLeft(BREAK_SECONDS)
    setRunning(true)
  }, [])

  const toggle = () => setRunning(r => !r)

  const reset = () => {
    setRunning(false)
    setIsBreak(false)
    setSecondsLeft(DURATIONS[selectedDurationRef.current].seconds)
  }

  const setCustomTime = useCallback((h, m, s) => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setIsBreak(false)
    setSecondsLeft(Math.max(1, h * 3600 + m * 60 + s))
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
