export type UserRole = 'student' | 'landlord' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  created_at?: string;
}

export interface RegisterInput {
  full_name: string;
  phone: string;
  bio: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
