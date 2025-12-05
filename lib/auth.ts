import { authApi } from './api';
import { getSessionManager } from './session-manager';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'agent' | 'admin';
  employeeId?: string;
  counterNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const auth = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await authApi.login(username, password);
    const data = response.data;
    
    if (typeof window !== 'undefined') {
      // Store tokens in localStorage (needed for API calls)
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Reset session manager to start new session
      const sessionManager = getSessionManager();
      if (sessionManager) {
        sessionManager.reset();
      }
    }
    
    return data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear session data
      sessionStorage.removeItem('session');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('sessionLastActivity');
      
      // Reset session manager
      const sessionManager = getSessionManager();
      if (sessionManager) {
        sessionManager.reset();
      }
    }
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    // Check if session is valid
    const sessionManager = getSessionManager();
    if (sessionManager && !sessionManager.isSessionValid()) {
      auth.logout();
      return null;
    }
    
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    // Check if session is valid
    const sessionManager = getSessionManager();
    if (sessionManager && !sessionManager.isSessionValid()) {
      auth.logout();
      return null;
    }
    
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: (): boolean => {
    // Check session validity first
    const sessionManager = getSessionManager();
    if (sessionManager && !sessionManager.isSessionValid()) {
      auth.logout();
      return false;
    }
    
    return !!auth.getToken();
  },
};

