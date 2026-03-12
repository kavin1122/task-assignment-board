import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgotpassword', data),
  resetPassword: (token, data) => api.put(`/auth/resetpassword/${token}`, data),
  getUsers: () => api.get('/auth/users'),
  getUserById: (id) => api.get(`/auth/users/${id}`),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Projects API
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  addTeam: (id, data) => api.post(`/projects/${id}/teams`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Teams API
export const teamAPI = {
  create: (data) => api.post('/teams', data),
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, data) => api.post(`/teams/${id}/remove-member`, data),
};

// Tasks API
export const taskAPI = {
  create: (data) => api.post('/tasks', data),
  getAll: () => api.get('/tasks'),
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  startTask: (id) => api.patch(`/tasks/${id}/start`),
  delete: (id) => api.delete(`/tasks/${id}`),
  submit: (id, answers, language) => api.post(`/tasks/${id}/submit`, { answers, language }),
  submitGeneral: (id) => api.post(`/tasks/${id}/submit-general`),
  runCode: (id, questionIndex, code, language) => api.post(`/tasks/${id}/run`, { questionIndex, code, language }),
  getLanguages: () => api.get('/tasks/languages'),
  getProgress: (projectId) => api.get(`/tasks/progress/${projectId}`),
  getSubmission: (id) => api.get(`/tasks/${id}/submission`),
};

// Comments API
export const commentAPI = {
  create: (data) => api.post('/comments', data),
  getByTask: (taskId) => api.get(`/comments/task/${taskId}`),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadFile: (taskId, formData) => api.post(`/uploads/${taskId}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadFiles: (taskId, formData) => api.post(`/uploads/${taskId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submitLink: (taskId, data) => api.post(`/uploads/${taskId}/link`, data),
  getByTask: (taskId) => api.get(`/uploads/${taskId}`),
  delete: (id) => api.delete(`/uploads/delete/${id}`),
};

export default api;
