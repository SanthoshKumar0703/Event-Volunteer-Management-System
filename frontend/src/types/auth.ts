// ============================================
// AUTH TYPES
// ============================================

import { User, UserRole } from './user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

export interface ForgotPassword {
  email: string;
}

export interface ResetPassword {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: UserRole | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  expiresIn?: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
  expiresIn: number;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmail {
  token: string;
}

export interface ResendOTP {
  email: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string; // Only for development/testing
}
