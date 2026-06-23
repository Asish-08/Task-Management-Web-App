import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
})

export const fetchActiveTasks    = () => api.get('/tasks')
export const createTask          = (title) => api.post('/tasks', { title })
export const updateTask          = (id, title) => api.patch(`/tasks/${id}`, { title })
export const completeTask        = (id) => api.patch(`/tasks/${id}/complete`)
export const fetchCompletedTasks = () => api.get('/tasks/completed')
export const fetchHeatmap        = () => api.get('/heatmap')
export const fetchQuote          = () => api.get('/quotes')
