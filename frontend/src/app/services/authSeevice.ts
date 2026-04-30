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