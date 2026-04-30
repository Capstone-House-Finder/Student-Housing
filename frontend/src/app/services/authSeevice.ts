// frontend/src/services/authService.ts

export interface RegisterData {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export async function registerUser(data: RegisterData): Promise<RegisterResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    // Handle duplicate email error from API
    if (response.status === 409 || result.message?.includes('duplicate') || result.message?.includes('already exists')) {
      throw new Error('This email is already registered. Please use a different email or login.');
    }
    throw new Error(result.message || 'Registration failed. Please try again.');
  }

  return result;
}

// frontend/src/services/authService.ts
// Add these to your existing authService.ts

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: 'student' | 'landlord';
  };
  message?: string;
}

export async function loginUser(data: LoginData): Promise<LoginResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid email or password. Please try again.');
    }
    throw new Error(result.message || 'Login failed. Please try again.');
  }

  // Store token securely (httpOnly cookie is better, but for client-side we'll use memory)
  // For production, use httpOnly cookie via backend
  if (result.token) {
    // Store in memory (not localStorage)
    sessionStorage.setItem('authToken', result.token);
    sessionStorage.setItem('user', JSON.stringify(result.user));
  }

  return result;
}

export async function logoutUser(): Promise<void> {
  // Clear session storage
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  
  // Optional: Call backend logout endpoint if needed
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // If using httpOnly cookies
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export function getAuthToken(): string | null {
  // Use sessionStorage (cleared when tab closes) instead of localStorage
  return sessionStorage.getItem('authToken');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getUser(): any | null {
  const userStr = sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}