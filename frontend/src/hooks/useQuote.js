import { useState, useEffect } from 'react'
import { fetchQuote } from '../api/client'

export function useQuote() {
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    fetchQuote().then(r => setQuote(r.data)).catch(() => {})
  }, [])

  return quote
}
