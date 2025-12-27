export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User; // 添加用户信息
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
  phone: string;
  major_id: number;
  id_card?: string;
  role?: 'student' | 'teacher'; // Default to student in UI
}

