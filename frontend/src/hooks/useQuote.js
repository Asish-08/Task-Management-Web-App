import { useState, useEffect } from 'react'

export function useQuote(seedQuote) {
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    if (!seedQuote) return
    setQuote(seedQuote)
  }, [seedQuote])

  return quote
}
