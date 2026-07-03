import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
})

export const fetchStartup        = () => api.get('/startup')
export const fetchActiveTasks    = () => api.get('/tasks')
export const createTask          = (title) => api.post('/tasks', { title })
export const updateTask          = (id, title) => api.patch(`/tasks/${id}`, { title })
export const completeTask        = (id) => api.patch(`/tasks/${id}/complete`)
export const fetchCompletedTasks = () => api.get('/tasks/completed')
export const fetchHeatmap        = () => api.get('/heatmap')
export const fetchQuote          = () => api.get('/quotes')

export const createFolder        = () => api.post('/folders', {})
export const renameFolder        = (id, name) => api.patch(`/folders/${id}`, { name })
export const deleteFolder        = (id) => api.delete(`/folders/${id}`)
export const moveTaskToFolder    = (taskId, folderId) => api.patch(`/tasks/${taskId}/folder`, { folder_id: folderId })
