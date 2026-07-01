import { useState, useEffect } from 'react'
import { fetchStartup } from '../api/client'

export function useStartup() {
  const [startup, setStartup] = useState(null)
  useEffect(() => {
    fetchStartup()
      .then(r => setStartup(r.data))
      .catch(() => {})
  }, [])
  return startup
}
