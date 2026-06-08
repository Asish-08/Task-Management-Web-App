import { useState, useEffect, useRef, useCallback } from 'react'

const WORK_SECONDS = 25 * 60

export function usePomodoro() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current)
        setRunning(false)
        return WORK_SECONDS
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

  const toggle = () => setRunning(r => !r)
  const reset = () => {
    setRunning(false)
    setSecondsLeft(WORK_SECONDS)
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return { display: `${minutes}:${seconds}`, running, toggle, reset }
}
