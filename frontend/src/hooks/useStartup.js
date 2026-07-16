import { useState, useEffect } from 'react'
import { fetchStartup } from '../api/client'

export function useStartup(enabled) {
  const [startup, setStartup] = useState(null)
  useEffect(() => {
    if (!enabled) return
    fetchStartup()
      .then(r => setStartup(r.data))
      .catch(() => {})
  }, [enabled])
  return startup
}
