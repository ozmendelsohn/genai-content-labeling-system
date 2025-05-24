/**
 * Authentication utilities for the GenAI Content Labeling System
 * 
 * This module provides authentication functions for login/logout,
 * token management, and API authentication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'labeler' | 'viewer';
  bio?: string;
  profile_image_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  login_count: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

/**
 * Store authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }
}

/**
 * Store current user data in localStorage
 */
export function setCurrentUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_user', JSON.stringify(user));
  }
}

/**
 * Get current user data from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        removeAuthToken(); // Clear invalid data
      }
    }
  }
  return null;
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  // Check if token is expired (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < exp;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

/**
 * Get authorization headers for form data requests
 */
export function getAuthHeadersForForm(): HeadersInit {
  const token = getAuthToken();
  return {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

/**
 * Login user with credentials
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  const loginResponse: LoginResponse = await response.json();
  
  // Store token and user data
  setAuthToken(loginResponse.access_token);
  setCurrentUser(loginResponse.user);
  
  return loginResponse;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const token = getAuthToken();
  
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error during logout API call:', error);
      // Continue with local logout even if API call fails
    }
  }
  
  // Clear local storage
  removeAuthToken();
}

/**
 * Check authentication status with the server
 */
export async function checkAuthStatus(): Promise<User | null> {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear it
        removeAuthToken();
      }
      return null;
    }

    const user: User = await response.json();
    setCurrentUser(user); // Update stored user data
    return user;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, clear auth and throw error
  if (response.status === 401) {
    removeAuthToken();
    throw new Error('Authentication required. Please log in again.');
  }

  return response;
}

/**
 * Utility to check if user has required role
 */
export function hasRole(requiredRole: User['role']): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Role hierarchy: admin > labeler > viewer
  const roleHierarchy = { admin: 3, labeler: 2, viewer: 1 };
  const userLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Utility to check if user is admin
 */
export function isAdmin(): boolean {
  return hasRole('admin');
}

/**
 * Utility to check if user is labeler or higher
 */
export function isLabeler(): boolean {
  return hasRole('labeler');
} 