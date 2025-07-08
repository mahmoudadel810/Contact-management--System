export interface User {
  userName: string;
  password: string;
  role: string;
  contacts?: string[];
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
} 