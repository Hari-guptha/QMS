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
      // Check session validity
      const { sessionManager } = await import('./session-manager');
      if (sessionManager && !sessionManager.isSessionValid()) {
        // Session expired, logout
        const { auth } = await import('./auth');
        auth.logout();

        // Redirect to appropriate login
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.role === 'admin') {
              window.location.href = '/admin/login';
            } else if (user.role === 'agent') {
              window.location.href = '/agent/login';
            } else {
              window.location.href = '/';
            }
          } catch {
            window.location.href = '/';
          }
        } else {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

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
          window.location.href = '/';
        }
      } else {
        // No refresh token, logout
        const { auth } = await import('./auth');
        auth.logout();
        window.location.href = '/';
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
  updatePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/update-password', { currentPassword, newPassword }),
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; language?: string; theme?: string }) =>
    api.put('/auth/profile', data),
  getProfile: () => api.get('/users/profile/me'),
  microsoftAuth: () => {
    // Redirect to Microsoft OAuth endpoint
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${API_URL}/auth/microsoft`;
  },
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
  getAgentHistory: (agentId: string, startDate?: string, endDate?: string) =>
    api.get(`/queue/agent/${agentId}/history`, { params: { startDate, endDate } }),
  callNext: () => api.post('/queue/agent/call-next'),
  markAsServing: (ticketId: string) =>
    api.patch(`/queue/agent/${ticketId}/serving`),
  markAsCompleted: (ticketId: string, note?: string) =>
    api.patch(`/queue/agent/${ticketId}/complete`, note ? { note } : {}),
  markAsNoShow: (ticketId: string, note?: string) =>
    api.patch(`/queue/agent/${ticketId}/no-show`, note ? { note } : {}),
  reopenTicket: (ticketId: string) =>
    api.patch(`/queue/agent/${ticketId}/reopen`),
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
  deleteUser: (id: string, confirm?: boolean) =>
    api.delete(`/users/${id}`, { params: { confirm: confirm ? 'true' : 'false' } }),

  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: string, confirm?: boolean) =>
    api.delete(`/categories/${id}`, { params: { confirm: confirm ? 'true' : 'false' } }),
  assignAgent: (categoryId: string, agentId: string) =>
    api.post(`/categories/${categoryId}/assign-agent/${agentId}`),
  removeAgent: (categoryId: string, agentId: string) =>
    api.delete(`/categories/${categoryId}/remove-agent/${agentId}`),

  // Queues
  getAllQueues: (categoryId?: string, agentId?: string) =>
    api.get('/queue/admin/all', { params: { categoryId, agentId } }),
  getAgentQueue: (agentId: string) =>
    api.get(`/queue/admin/all`, { params: { agentId } }),
  reorderAgentQueue: (agentId: string, ticketIds: string[]) =>
    api.put(`/queue/admin/reorder/${agentId}`, { ticketIds }),
  adminCallNext: (agentId: string) =>
    api.post(`/queue/admin/call-next/${agentId}`),
  reassignTicket: (ticketId: string, newAgentId: string) =>
    api.patch(`/queue/admin/${ticketId}/reassign/${newAgentId}`),
  adminMarkAsCompleted: (ticketId: string) =>
    api.patch(`/queue/admin/${ticketId}/complete`),
  adminMarkAsServing: (ticketId: string) =>
    api.patch(`/queue/admin/${ticketId}/serving`),
  adminMarkAsNoShow: (ticketId: string) =>
    api.patch(`/queue/admin/${ticketId}/no-show`),
  adminReopenTicket: (ticketId: string) =>
    api.patch(`/queue/admin/${ticketId}/reopen`),
  adminUpdateTicket: (ticketId: string, data: any) =>
    api.put(`/queue/admin/${ticketId}`, data),
  deleteTicket: (ticketId: string) =>
    api.delete(`/queue/admin/${ticketId}`),

  // Notification config
  getNotificationConfig: () => api.get('/notification/config'),
  setNotificationConfig: (data: any) => api.post('/notification/config', data),

  // Analytics
  getDashboard: (startDate?: string, endDate?: string) =>
    api.get('/analytics/dashboard', { params: { startDate, endDate } }),
  getAgentPerformance: (startDate?: string, endDate?: string) =>
    api.get('/analytics/agent-performance', { params: { startDate, endDate } }),
  getDetailedAgentPerformance: (startDate?: string, endDate?: string, categoryId?: string) =>
    api.get('/analytics/detailed-agent-performance', { params: { startDate, endDate, categoryId } }),
  exportExcel: (startDate?: string, endDate?: string) =>
    api.get('/analytics/export/excel', { params: { startDate, endDate }, responseType: 'blob' }),
  exportAnalytics: (params: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/export', { params }),
};

