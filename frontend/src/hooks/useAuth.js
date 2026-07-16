import { useState, useEffect, useCallback } from 'react'
import { signup as signupApi, login as loginApi, fetchMe, updateProfile as updateProfileApi } from '../api/client'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (localStorage.getItem('token') ? 'loading' : 'unauthed'))

  useEffect(() => {
    if (!token) { setStatus('unauthed'); return }
    fetchMe()
      .then(r => { setUser(r.data); setStatus('authed') })
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setStatus('unauthed')
      })
  }, [token])

  const persistSession = useCallback((data) => {
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    setStatus('authed')
  }, [])

  const signup = useCallback(async (username, password) => {
    const { data } = await signupApi(username, password)
    persistSession(data)
  }, [persistSession])

  const login = useCallback(async (username, password) => {
    const { data } = await loginApi(username, password)
    persistSession(data)
  }, [persistSession])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setStatus('unauthed')
  }, [])

  const updateProfile = useCallback(async (name, email, bio) => {
    const { data } = await updateProfileApi(name, email, bio)
    setUser(data)
    return data
  }, [])

  return { user, status, signup, login, logout, updateProfile }
}
