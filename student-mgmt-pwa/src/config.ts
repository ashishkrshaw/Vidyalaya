// Frontend configuration for API endpoints and token management
export const API_CONFIG = {
  // Backend API base URL - consistently append /api
  BASE_URL: (import.meta.env.VITE_API_URL || 'https://nlkh.duckdns.org') + '/api',

  
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify'
  },
  
  // Student management endpoints
  STUDENTS: {
    LIST: '/students',
    CREATE: '/students',
    UPDATE: '/students',
    DELETE: '/students',
    SEARCH: '/students/search'
  },
  
  // Admin endpoints
  ADMIN: {
    SCHOOL_LINKS: '/admin/school-links',
    REGISTER_USER: '/admin/register-user',
    SYSTEM_SETTINGS: '/admin/system-settings',
    LOGS: '/admin/logs'
  },
  
  // Sync endpoints
  SYNC: {
    UPLOAD: '/sync/upload',
    DOWNLOAD: '/sync/download',
    STATUS: '/sync/status'
  },
  
  // Device binding
  DEVICE: {
    BIND: '/device-binding/bind',
    VERIFY: '/device-binding/verify'
  }
};

// Token management utilities
export const TOKEN_MANAGER = {
  // Get access token from localStorage
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },
  
  // Set access token in localStorage
  setAccessToken: (token: string): void => {
    localStorage.setItem('accessToken', token);
  },
  
  // Remove access token from localStorage
  removeAccessToken: (): void => {
    localStorage.removeItem('accessToken');
  },
  
  // Check if token exists and is valid
  hasValidToken: (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },
  
  // Get user role from token
  getUserRole: (): string | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      return null;
    }
  },
  
  // Get school ID from token
  getSchoolId: (): string | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.schoolId || null;
    } catch (error) {
      return null;
    }
  }
};

// API request utilities
export const API_UTILS = {
  // Create headers with authentication
  getHeaders: (): HeadersInit => {
    return {
      'Content-Type': 'application/json'
    };
  },
  
  // Handle API responses
  handleResponse: async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  // Make authenticated API request
  request: async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = API_UTILS.getHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    return API_UTILS.handleResponse(response);
  }
};

// Error handling
export const ERROR_HANDLER = {
  // Handle authentication errors (401)
  handleAuthError: (error: any) => {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      TOKEN_MANAGER.removeAccessToken();
      window.location.href = '/login';
    }
  },

  // Handle deactivation/forbidden errors (403)
  handleForbiddenError: (error: any) => {
    const errorMessage = error.message || '';
    
    // Check for deactivation-related errors
    if (
      errorMessage.includes('403') ||
      errorMessage.includes('ACCOUNT_DEACTIVATED') ||
      errorMessage.includes('ACCOUNT_PENDING') ||
      errorMessage.includes('ACCOUNT_REJECTED') ||
      errorMessage.includes('deactivated') ||
      errorMessage.includes('Forbidden')
    ) {
      // Clear ALL auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('schoolId');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('schoolName');
      
      // Show alert and redirect to landing page
      alert('Your account has been deactivated or is not active. Please contact support.');
      window.location.href = '/?view=landing';
      return true;
    }
    return false;
  },
  
  // Handle network errors
  handleNetworkError: (error: any) => {
    console.error('Network error:', error);
    // You can show a toast notification here
  },

  // Global error handler for API responses
  handleApiError: (status: number, errorData: any) => {
    if (status === 401) {
      TOKEN_MANAGER.removeAccessToken();
      window.location.href = '/?view=login';
      return;
    }
    
    if (status === 403) {
      const detail = errorData?.detail || '';
      if (
        detail.includes('ACCOUNT_DEACTIVATED') ||
        detail.includes('ACCOUNT_PENDING') ||
        detail.includes('ACCOUNT_REJECTED')
      ) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('schoolId');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('schoolName');
        
        alert(detail.split(':')[1]?.trim() || 'Your account is not active.');
        window.location.href = '/?view=landing';
      }
    }
  }
}; 