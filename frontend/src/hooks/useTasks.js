import { useState, useEffect, useCallback } from 'react'
import { fetchActiveTasks, createTask, completeTask, updateTask, fetchCompletedTasks } from '../api/client'

export function useTasks() {
  const [active, setActive] = useState([])
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [a, c] = await Promise.all([fetchActiveTasks(), fetchCompletedTasks()])
      setActive(a.data)
      setCompleted(c.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const addTask = async (title) => {
    const { data } = await createTask(title)
    setActive(prev => [data, ...prev])
  }

  const markComplete = async (id) => {
    const { data } = await completeTask(id)
    setActive(prev => prev.filter(t => t.id !== id))
    setCompleted(prev => [data, ...prev])
  }

  const editTask = async (id, title) => {
    const { data } = await updateTask(id, title)
    setActive(prev => prev.map(t => t.id === id ? data : t))
  }

  return { active, completed, loading, addTask, markComplete, editTask }
}
