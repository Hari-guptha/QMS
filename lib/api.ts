import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Public API
export const publicApi = {
  checkIn: (data: any) => api.post('/queue/check-in', data),
  getStatus: (categoryId?: string) =>
    api.get('/queue/status', { params: { categoryId } }),
  getTicketByToken: (tokenNumber: string) =>
    api.get(`/queue/ticket/${tokenNumber}`),
  getCategories: () => api.get('/categories/public'),
};

// Agent API
export const agentApi = {
  getMyQueue: () => api.get('/queue/agent/my-queue'),
  callNext: () => api.post('/queue/agent/call-next'),
  markAsServing: (ticketId: string) =>
    api.patch(`/queue/agent/${ticketId}/serving`),
  markAsCompleted: (ticketId: string) =>
    api.patch(`/queue/agent/${ticketId}/complete`),
  markAsNoShow: (ticketId: string) =>
    api.patch(`/queue/agent/${ticketId}/no-show`),
  reorderQueue: (ticketIds: string[]) =>
    api.put('/queue/agent/reorder', { ticketIds }),
  transferTicket: (ticketId: string, newAgentId: string) =>
    api.post(`/queue/agent/${ticketId}/transfer/${newAgentId}`),
};

// Admin API
export const adminApi = {
  // Users
  getUsers: () => api.get('/users'),
  getAgents: () => api.get('/users/agents'),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),
  assignAgent: (categoryId: string, agentId: string) =>
    api.post(`/categories/${categoryId}/assign-agent/${agentId}`),
  removeAgent: (categoryId: string, agentId: string) =>
    api.delete(`/categories/${categoryId}/remove-agent/${agentId}`),
  
  // Queues
  getAllQueues: (categoryId?: string, agentId?: string) =>
    api.get('/queue/admin/all', { params: { categoryId, agentId } }),
  
  // Analytics
  getDashboard: (startDate?: string, endDate?: string) =>
    api.get('/analytics/dashboard', { params: { startDate, endDate } }),
  getAgentPerformance: (startDate?: string, endDate?: string) =>
    api.get('/analytics/agent-performance', { params: { startDate, endDate } }),
  exportExcel: (startDate?: string, endDate?: string) =>
    api.get('/analytics/export/excel', { params: { startDate, endDate }, responseType: 'blob' }),
};

