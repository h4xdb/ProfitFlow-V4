import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "manager" | "cash_collector";
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    this.user = storedUser ? JSON.parse(storedUser) : null;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return !!this.user?.role && roles.includes(this.user.role);
  }

  isAdmin(): boolean {
    return this.hasRole("admin");
  }

  isManager(): boolean {
    return this.hasRole("manager");
  }

  isCashCollector(): boolean {
    return this.hasRole("cash_collector");
  }

  isAdminOrManager(): boolean {
    return this.hasAnyRole(["admin", "manager"]);
  }
}

export const authService = new AuthService();
