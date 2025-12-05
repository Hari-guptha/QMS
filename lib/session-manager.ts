/**
 * Session Manager
 * Handles session timeout, activity tracking, and cross-tab synchronization
 */

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

export interface SessionData {
  sessionId: string;
  lastActivity: number;
  expiresAt: number;
}

class SessionManager {
  private sessionId: string | null = null;
  private lastActivity: number = Date.now();
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];
  private onTimeoutCallback: (() => void) | null = null;
  private onWarningCallback: ((timeLeft: number) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Generate unique session ID
    this.sessionId = this.generateSessionId();
    
    // Load existing session or create new one
    const stored = sessionStorage.getItem('session');
    if (stored) {
      try {
        const sessionData: SessionData = JSON.parse(stored);
        // Check if session is still valid
        if (sessionData.expiresAt > Date.now() && sessionData.sessionId === this.sessionId) {
          this.lastActivity = sessionData.lastActivity;
        } else {
          this.createNewSession();
        }
      } catch {
        this.createNewSession();
      }
    } else {
      this.createNewSession();
    }

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Start activity tracking
    this.startActivityTracking();
    
    // Start timeout
    this.startTimeout();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createNewSession() {
    this.sessionId = this.generateSessionId();
    this.lastActivity = Date.now();
    this.saveSession();
  }

  private saveSession() {
    if (!this.sessionId) return;
    
    const sessionData: SessionData = {
      sessionId: this.sessionId,
      lastActivity: this.lastActivity,
      expiresAt: this.lastActivity + SESSION_TIMEOUT,
    };
    
    sessionStorage.setItem('session', JSON.stringify(sessionData));
    // Also set in localStorage for cross-tab detection
    localStorage.setItem('sessionId', this.sessionId);
    localStorage.setItem('sessionLastActivity', this.lastActivity.toString());
  }

  private handleActivity() {
    const now = Date.now();
    
    // Only update if significant time has passed (throttle)
    if (now - this.lastActivity > 1000) {
      this.lastActivity = now;
      this.saveSession();
      this.startTimeout();
      
      // Notify listeners
      this.activityListeners.forEach(listener => listener());
    }
  }

  private startActivityTracking() {
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), { passive: true });
    });
  }

  private handleStorageChange(e: StorageEvent) {
    // If another tab logged out or session expired
    if (e.key === 'sessionId' && e.newValue === null) {
      this.logout();
    }
    
    // If another tab updated session
    if (e.key === 'sessionLastActivity' && e.newValue) {
      const otherTabActivity = parseInt(e.newValue, 10);
      if (otherTabActivity > this.lastActivity) {
        this.lastActivity = otherTabActivity;
        this.startTimeout();
      }
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Check if session is still valid when tab becomes visible
      const stored = sessionStorage.getItem('session');
      if (stored) {
        try {
          const sessionData: SessionData = JSON.parse(stored);
          if (sessionData.expiresAt <= Date.now()) {
            this.logout();
          } else {
            this.lastActivity = Date.now();
            this.saveSession();
            this.startTimeout();
          }
        } catch {
          this.logout();
        }
      }
    }
  }

  private startTimeout() {
    // Clear existing timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }

    const timeUntilTimeout = SESSION_TIMEOUT - (Date.now() - this.lastActivity);
    const timeUntilWarning = timeUntilTimeout - WARNING_TIME;

    // Set warning timeout
    if (timeUntilWarning > 0) {
      this.warningId = setTimeout(() => {
        const timeLeft = Math.ceil((SESSION_TIMEOUT - (Date.now() - this.lastActivity)) / 1000 / 60);
        if (this.onWarningCallback) {
          this.onWarningCallback(timeLeft);
        }
      }, timeUntilWarning);
    }

    // Set logout timeout
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, timeUntilTimeout);
  }

  private logout() {
    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }

    // Clear session data
    sessionStorage.removeItem('session');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionLastActivity');
    
    // Clear auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Notify callback
    if (this.onTimeoutCallback) {
      this.onTimeoutCallback();
    }
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  public getTimeRemaining(): number {
    const stored = sessionStorage.getItem('session');
    if (!stored) return 0;
    
    try {
      const sessionData: SessionData = JSON.parse(stored);
      const remaining = sessionData.expiresAt - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }

  public isSessionValid(): boolean {
    const stored = sessionStorage.getItem('session');
    if (!stored) return false;
    
    try {
      const sessionData: SessionData = JSON.parse(stored);
      return sessionData.expiresAt > Date.now() && sessionData.sessionId === this.sessionId;
    } catch {
      return false;
    }
  }

  public onTimeout(callback: () => void) {
    this.onTimeoutCallback = callback;
  }

  public onWarning(callback: (timeLeft: number) => void) {
    this.onWarningCallback = callback;
  }

  public onActivity(callback: () => void) {
    this.activityListeners.push(callback);
  }

  public reset() {
    this.createNewSession();
    this.startTimeout();
  }

  public destroy() {
    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }

    // Remove event listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, this.handleActivity.bind(this));
    });
    
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
}

// Singleton instance - lazy initialization
let sessionManagerInstance: SessionManager | null = null;

export const getSessionManager = (): SessionManager | null => {
  if (typeof window === 'undefined') return null;
  
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  
  return sessionManagerInstance;
};

// For backward compatibility
export const sessionManager = typeof window !== 'undefined' ? getSessionManager() : null;

