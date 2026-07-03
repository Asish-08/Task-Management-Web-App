import { useState, useEffect, useCallback } from 'react'
import { fetchActiveTasks, createTask, completeTask, updateTask, fetchCompletedTasks, moveTaskToFolder as moveTaskToFolderApi } from '../api/client'

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
    setActive(prev => [...prev, optimistic])
    try {
      const { data } = await createTask(title)
      setActive(prev => prev.map(t => t.id === tempId ? data : t))
    } catch {
      setActive(prev => prev.filter(t => t.id !== tempId))
    }
  }

  const markComplete = async (id) => {
    const task = active.find(t => t.id === id)
    if (!task) return null
    const optimistic = { ...task, status: 'completed', completed_at: new Date().toISOString() }
    setActive(prev => prev.filter(t => t.id !== id))
    setCompleted(prev => [optimistic, ...prev])
    try {
      const { data } = await completeTask(id)
      setCompleted(prev => prev.map(t => t.id === id ? data.task : t))
      return data.deleted_folder_id ?? null
    } catch {
      setActive(prev => [...prev, task].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
      setCompleted(prev => prev.filter(t => t.id !== id))
      return null
    }
  }

  const editTask = async (id, title) => {
    const { data } = await updateTask(id, title)
    setActive(prev => prev.map(t => t.id === id ? data : t))
  }

  const moveTaskToFolder = async (taskId, folderId) => {
    const task = active.find(t => t.id === taskId)
    if (!task || typeof task.id === 'string') return
    const prevFolderId = task.folder_id ?? null
    setActive(prev => prev.map(t => t.id === taskId ? { ...t, folder_id: folderId } : t))
    try {
      const { data } = await moveTaskToFolderApi(taskId, folderId)
      setActive(prev => prev.map(t => t.id === taskId ? data : t))
    } catch {
      setActive(prev => prev.map(t => t.id === taskId ? { ...t, folder_id: prevFolderId } : t))
    }
  }

  return { active, completed, loading, addTask, markComplete, editTask, moveTaskToFolder, loadAll }
}
