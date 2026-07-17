import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login = (credentials) => api.post('/auth/login', credentials)
export const getMe = () => api.get('/auth/me')

// ─── Admin – Users ────────────────────────────────────────────────────────────
export const getUsers = () => api.get('/admin/users')
export const createUser = (data) => api.post('/admin/users', data)
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

// ─── Admin – Data Types ───────────────────────────────────────────────────────
export const getDataTypes = () => api.get('/admin/data-types')
export const createDataType = (data) => api.post('/admin/data-types', data)
export const updateDataType = (id, data) => api.put(`/admin/data-types/${id}`, data)
export const deleteDataType = (id) => api.delete(`/admin/data-types/${id}`)

// ─── Admin – Tasks ────────────────────────────────────────────────────────────
export const getAdminTasks = () => api.get('/admin/tasks')
export const createTask = (data) => api.post('/admin/tasks', data)
export const updateTask = (id, data) => api.put(`/admin/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/admin/tasks/${id}`)

// ─── Admin – Templates ────────────────────────────────────────────────────────
export const getTemplates = () => api.get('/admin/templates')
export const uploadTemplate = (formData) =>
  api.post('/admin/templates', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const generateTemplate = (data) => api.post('/admin/templates/generate', data)
export const downloadAdminTemplate = (id) =>
  api.get(`/admin/templates/${id}/download`, { responseType: 'blob' })
export const deleteTemplate = (id) => api.delete(`/admin/templates/${id}`)
export const parseTemplateStructure = (formData) =>
  api.post('/admin/templates/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// ─── Admin – Submissions ──────────────────────────────────────────────────────
export const getSubmissions = () => api.get('/admin/submissions')
export const approveSubmission = (id) => api.put(`/admin/submissions/${id}/approve`)
export const revisionSubmission = (id, data) => api.put(`/admin/submissions/${id}/revision`, data)
export const downloadSubmission = (id) =>
  api.get(`/admin/submissions/${id}/download`, { responseType: 'blob' })

// ─── Admin – Manual Entries ───────────────────────────────────────────────────
export const getManualEntries = () => api.get('/admin/manual-entries')
export const createManualEntry = (data) => api.post('/admin/manual-entries', data)
export const deleteManualEntry = (id) => api.delete(`/admin/manual-entries/${id}`)

// ─── Admin – Dashboard ────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/dashboard/stats')

// ─── Contributor ──────────────────────────────────────────────────────────────
export const getMyTasks = () => api.get('/contributor/tasks')
export const getMyTask = (id) => api.get(`/contributor/tasks/${id}`)
export const downloadTemplate = (dataTypeId) =>
  api.get(`/contributor/templates/${dataTypeId}`, { responseType: 'blob' })
export const submitTask = (taskId, formData) =>
  api.post(`/contributor/tasks/${taskId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const getMySubmissions = () => api.get('/contributor/submissions')
export const getContributorStats = () => api.get('/contributor/dashboard/stats')

// ─── Viewer ───────────────────────────────────────────────────────────────────
export const getViewerDashboard = () => api.get('/viewer/dashboard')
export const getApprovedData = (dataTypeId) =>
  api.get('/viewer/data', { params: dataTypeId ? { data_type_id: dataTypeId } : {} })
export const getViewerDataTypes = () => api.get('/viewer/data-types')
export const exportViewerData = (data) =>
  api.post('/viewer/data/export', data, { responseType: 'blob' })

// ─── Penduduk (public – tidak butuh login) ────────────────────────────────────
export const getPendudukJK   = ()       => api.get('/public/penduduk/jk')
export const getPendudukUmur = (tahun)  => api.get('/public/penduduk/umur',  { params: tahun ? { tahun } : {} })
export const getPendudukKec  = ()       => api.get('/public/penduduk/kecamatan')

export default api
