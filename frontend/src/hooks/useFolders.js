import { useState, useEffect, useRef, useCallback } from 'react'
import { createFolder as createFolderApi, renameFolder as renameFolderApi, deleteFolder as deleteFolderApi } from '../api/client'

const IDLE_MS = 60 * 1000

export function useFolders(seed, activeTasks, onExpired) {
  const [folders, setFolders] = useState([])

  const timersRef = useRef({})       // folderId -> timeoutId
  const prevCountsRef = useRef({})   // folderId -> last-seen task count
  // Mirrors so the setTimeout callback never reads a stale closure.
  const activeTasksRef = useRef(activeTasks)
  const foldersRef = useRef(folders)
  activeTasksRef.current = activeTasks
  foldersRef.current = folders

  useEffect(() => {
    if (!seed) return
    setFolders(seed)
  }, [seed])

  function clearTimer(id) {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }

  const checkAndExpire = useCallback(async (folderId) => {
    const stillEmpty = !activeTasksRef.current.some(t => t.folder_id === folderId)
    if (!stillEmpty) return
    try {
      await deleteFolderApi(folderId)
      const folder = foldersRef.current.find(f => f.id === folderId)
      delete timersRef.current[folderId]
      setFolders(prev => prev.filter(f => f.id !== folderId))
      if (folder) onExpired?.(folder)
    } catch (err) {
      // 409 = a task landed in the folder right before deletion — lost the
      // race, not an error. Any other failure: leave it, the next /startup
      // sweep will reconcile it.
      if (err?.response?.status !== 409) return
    }
  }, [onExpired])

  const armTimer = useCallback((folder) => {
    clearTimer(folder.id)
    const deadline = new Date(folder.emptied_at).getTime() + IDLE_MS
    const remaining = Math.max(0, deadline - Date.now())
    timersRef.current[folder.id] = setTimeout(() => checkAndExpire(folder.id), remaining)
  }, [checkAndExpire])

  // Detects empty <-> non-empty transitions per folder and (re)arms or cancels
  // its idle timer accordingly. Anchored to an absolute emptied_at deadline
  // (never tick-counted), so a page reload mid-countdown still fires on time.
  useEffect(() => {
    folders.forEach(folder => {
      if (typeof folder.id === 'string') return // optimistic temp folder — armed once the real one replaces it

      const count = activeTasks.filter(t => t.folder_id === folder.id).length
      const prevCount = prevCountsRef.current[folder.id]
      prevCountsRef.current[folder.id] = count

      if (count === 0 && prevCount > 0) {
        // Just drained by a drag-out — restart the idle clock from now.
        const emptiedAt = new Date().toISOString()
        setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, emptied_at: emptiedAt } : f))
        armTimer({ ...folder, emptied_at: emptiedAt })
      } else if (count === 0 && prevCount === undefined) {
        // First time seeing this folder (just seeded or just created) — arm from its own emptied_at.
        armTimer(folder)
      } else if (count > 0) {
        clearTimer(folder.id)
      }
    })

    const currentIds = new Set(folders.map(f => f.id))
    Object.keys(prevCountsRef.current).forEach(key => {
      const id = currentIds.has(Number(key)) ? Number(key) : key
      if (!currentIds.has(id)) {
        delete prevCountsRef.current[key]
        clearTimer(key)
      }
    })
  }, [activeTasks, folders, armTimer])

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout)
    }
  }, [])

  const createFolder = useCallback(async () => {
    const tempId = 'temp-folder-' + Date.now()
    const nowIso = new Date().toISOString()
    const optimistic = { id: tempId, name: 'Untitled Folder', created_at: nowIso, emptied_at: nowIso }
    setFolders(prev => [optimistic, ...prev])
    try {
      const { data } = await createFolderApi()
      setFolders(prev => prev.map(f => f.id === tempId ? data : f))
      return data
    } catch {
      setFolders(prev => prev.filter(f => f.id !== tempId))
      return null
    }
  }, [])

  const renameFolder = useCallback(async (id, name) => {
    const previous = foldersRef.current.find(f => f.id === id)
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
    try {
      await renameFolderApi(id, name)
    } catch {
      if (previous) setFolders(prev => prev.map(f => f.id === id ? previous : f))
    }
  }, [])

  const removeFolderLocally = useCallback((id) => {
    clearTimer(id)
    delete prevCountsRef.current[id]
    setFolders(prev => prev.filter(f => f.id !== id))
  }, [])

  return { folders, createFolder, renameFolder, removeFolderLocally }
}
