import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  fullName: string;
  userType: 'user' | 'employee' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem('auth-token');
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('auth-token', data.token);
    
    return data;
  }

  async signup(userData: {
    email: string;
    password: string;
    fullName: string;
    userType?: 'user' | 'employee';
    phone?: string;
    companyName?: string;
  }): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/signup', userData);
    const data = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('auth-token', data.token);
    
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return data.user;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
    
    return null;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth-token');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = new AuthService();
