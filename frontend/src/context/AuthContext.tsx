import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { JwtPayload } from 'jsonwebtoken';

// Types
import type { User, UserRole } from '../types/user';
import type { TokenPayload as AuthTokenPayload } from '../types/auth';

interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyOTP: (data: OTPVerification) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (data: ResetPassword) => Promise<boolean>;
  googleLogin: (token: string) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_URL = (import.meta as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:8000/api';

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('eventflow-token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('eventflow-token');
        const storedUser = localStorage.getItem('eventflow-user');
        
        if (storedToken && storedUser) {
          // Verify token
          try {
            const decoded = jwtDecode<TokenPayload>(storedToken);
            const now = Date.now() / 1000;
            
            if (decoded.exp && decoded.exp > now) {
              // Token is valid
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
              setRole(decoded.role as UserRole);
              setIsAuthenticated(true);
            } else {
              // Token expired
              localStorage.removeItem('eventflow-token');
              localStorage.removeItem('eventflow-user');
              setIsAuthenticated(false);
            }
          } catch (error) {
            localStorage.removeItem('eventflow-token');
            localStorage.removeItem('eventflow-user');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update role when user changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
    } else {
      setRole(null);
    }
  }, [user]);

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      if (response.data.success && response.data.token) {
        const { token, user: userData } = response.data;
        
        // Store token and user
        localStorage.setItem('eventflow-token', token);
        localStorage.setItem('eventflow-user', JSON.stringify(userData));
        
        setToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Decode token to get role
        const decoded = jwtDecode<TokenPayload>(token);
        setRole(decoded.role as UserRole);
        
        setIsLoading(false);
        return true;
      } else {
        setError(response.data.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Login failed';
      setError(message);
      setIsLoading(false);
      toast.error(message);
      return false;
    }
  }, []);

  // Register
  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, credentials);
      
      if (response.data.success) {
        // Auto-login after registration
        const loginSuccess = await login({
          email: credentials.email,
          password: credentials.password,
        });
        
        setIsLoading(false);
        return loginSuccess;
      } else {
        setError(response.data.message || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Registration failed';
      setError(message);
      setIsLoading(false);
      toast.error(message);
      return false;
    }
  }, [login]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state
      localStorage.removeItem('eventflow-token');
      localStorage.removeItem('eventflow-user');
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setRole(null);
      
      // Redirect to login
      navigate('/login');
    }
  }, [token, navigate]);

  // Verify OTP
  const verifyOTP = useCallback(async (data: OTPVerification): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, data);
      
      if (response.data.success) {
        setIsLoading(false);
        return true;
      } else {
        setError(response.data.message || 'OTP verification failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'OTP verification failed';
      setError(message);
      setIsLoading(false);
      toast.error(message);
      return false;
    }
  }, []);

  // Forgot Password
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      
      if (response.data.success) {
        setIsLoading(false);
        return true;
      } else {
        setError(response.data.message || 'Password reset request failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Password reset request failed';
      setError(message);
      setIsLoading(false);
      toast.error(message);
      return false;
    }
  }, []);

  // Reset Password
  const resetPassword = useCallback(async (data: ResetPassword): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, data);
      
      if (response.data.success) {
        setIsLoading(false);
        return true;
      } else {
        setError(response.data.message || 'Password reset failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Password reset failed';
      setError(message);
      setIsLoading(false);
      toast.error(message);
      return false;
    }
  }, []);

  // Google Login
  const googleLogin = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/google`, { token });
      
      if (response.data.success && response.data.token) {
        const { token: accessToken, user: userData } = response.data;
        
        localStorage.setItem('eventflow-token', accessToken);
        localStorage.setItem('eventflow-user', JSON.stringify(userData));
        
        setToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        const decoded = jwtDecode<TokenPayload>(accessToken);
        setRole(decoded.role as UserRole);
        
        setIsLoading(false);
        return true;
      } else {
        setError(response.data.message || 'Google login failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Google login failed';
      setError(message);
      setIsLoading(false);
      toast.error(message);
      return false;
    }
  }, []);

  // Refresh Token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success && response.data.token) {
        const { token: newToken, user: userData } = response.data;
        
        localStorage.setItem('eventflow-token', newToken);
        localStorage.setItem('eventflow-user', JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [token]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    role,
    login,
    register,
    logout,
    verifyOTP,
    forgotPassword,
    resetPassword,
    googleLogin,
    refreshToken,
    clearError,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for testing
export { AuthContext };
