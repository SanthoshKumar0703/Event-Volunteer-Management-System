import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('eventflow-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle errors globally
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          toast.error(data?.message || 'Unauthorized. Please login again.');
          localStorage.removeItem('eventflow-token');
          localStorage.removeItem('eventflow-user');
          window.location.href = '/login';
          break;
        case 403:
          toast.error(data?.message || 'Forbidden. You do not have permission.');
          break;
        case 404:
          toast.error(data?.message || 'Resource not found.');
          break;
        case 429:
          toast.error(data?.message || 'Too many requests. Please try again later.');
          break;
        case 500:
          toast.error(data?.message || 'Server error. Please try again later.');
          break;
        default:
          if (data?.message) {
            toast.error(data.message);
          }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API Methods
class ApiService {
  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Handle errors
  private handleError(error: AxiosError): never {
    if (error.response) {
      throw new Error(error.response.data?.message || 'An error occurred');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message);
    }
  }

  // Upload file
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Download file
  async downloadFile(url: string): Promise<Blob> {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}

// Create instance
export const apiService = new ApiService();

// Export axios instance for direct use
export { api };

// Export API URL
export { API_URL };

// ============================================
// AUTH API FUNCTIONS
// ============================================

export const apiLogin = async (credentials: { email: string; password: string }) => {
  return apiService.post<{ success: boolean; message: string; token?: string; user?: any }>(
    '/auth/login',
    credentials
  );
};

export const apiRegister = async (credentials: { 
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}) => {
  return apiService.post<{ success: boolean; message: string; token?: string; user?: any }>(
    '/auth/register',
    credentials
  );
};

export const apiLogout = async () => {
  return apiService.post<{ success: boolean; message: string }>('/auth/logout');
};

export const apiForgotPassword = async (data: { email: string }) => {
  return apiService.post<{ success: boolean; message: string }>('/auth/forgot-password', data);
};

export const apiResetPassword = async (data: { token: string; password: string }) => {
  return apiService.post<{ success: boolean; message: string; token?: string }>(
    '/auth/reset-password',
    data
  );
};

export const apiVerifyOTP = async (data: { email: string; otp: string }) => {
  return apiService.post<{ success: boolean; message: string; token?: string }>(
    '/auth/verify-otp',
    data
  );
};

export const apiResendOTP = async (data: { email: string }) => {
  return apiService.post<{ success: boolean; message: string }>('/auth/resend-otp', data);
};

export const apiRefreshToken = async (token: string) => {
  return apiService.post<{ success: boolean; token: string; expiresIn: number }>(
    '/auth/refresh',
    { token }
  );
};

export const apiGoogleLogin = async (token: string) => {
  return apiService.post<{ success: boolean; message: string; token?: string; user?: any }>(
    '/auth/google',
    { token }
  );
};

// Default export
export default apiService;
