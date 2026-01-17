// Auth utilities for JWT token management
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

export const AUTH_TOKEN_KEY = 'urban_intel_token';

export const authUtils = {
  // Store token
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  // Get token
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  // Remove token
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  // Check if token exists and is valid
  isAuthenticated: (): boolean => {
    const token = authUtils.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      // Check if token is expired (exp is in seconds)
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Get decoded token
  getDecodedToken: (): DecodedToken | null => {
    const token = authUtils.getToken();
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  },

  // Get user info from token
  getUserInfo: () => {
    const decoded = authUtils.getDecodedToken();
    if (!decoded) return null;

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const user = authUtils.getUserInfo();
    return user?.role === 'admin';
  },

  // Check if token will expire soon (within 1 hour)
  willExpireSoon: (): boolean => {
    const decoded = authUtils.getDecodedToken();
    if (!decoded) return false;

    const expiryTime = decoded.exp * 1000;
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    return expiryTime < oneHourFromNow;
  },
};
