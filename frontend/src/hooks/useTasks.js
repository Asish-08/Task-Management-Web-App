import { useState, useEffect, useCallback } from 'react'
import { fetchActiveTasks, createTask, completeTask, updateTask, fetchCompletedTasks } from '../api/client'

export function useTasks(seed) {
  const [active, setActive] = useState([])
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seed) return
    setActive(seed.active_tasks)
    setCompleted(seed.completed_tasks)
    setLoading(false)
  }, [seed])

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

  const addTask = async (title) => {
    const tempId = 'temp-' + Date.now()
    const optimistic = { id: tempId, title, status: 'active', created_at: new Date().toISOString() }
    setActive(prev => [optimistic, ...prev])
    try {
      const { data } = await createTask(title)
      setActive(prev => prev.map(t => t.id === tempId ? data : t))
    } catch {
      setActive(prev => prev.filter(t => t.id !== tempId))
    }
  }

  const markComplete = async (id) => {
    const task = active.find(t => t.id === id)
    if (!task) return
    const optimistic = { ...task, status: 'completed', completed_at: new Date().toISOString() }
    setActive(prev => prev.filter(t => t.id !== id))
    setCompleted(prev => [optimistic, ...prev])
    try {
      const { data } = await completeTask(id)
      setCompleted(prev => prev.map(t => t.id === id ? data : t))
    } catch {
      setActive(prev => [task, ...prev])
      setCompleted(prev => prev.filter(t => t.id !== id))
    }
  }

  const editTask = async (id, title) => {
    const { data } = await updateTask(id, title)
    setActive(prev => prev.map(t => t.id === id ? data : t))
  }

  return { active, completed, loading, addTask, markComplete, editTask, loadAll }
}
