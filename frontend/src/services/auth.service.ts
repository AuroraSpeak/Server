import { apiService } from "./api.service"

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
  status: string
}

export interface AuthResponse {
  user: User
  token: string
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>("/auth/login", credentials)
      apiService.setToken(response.token)
      return response
    } catch (error) {
      if (error instanceof Error) {
        // Spezifische Fehlermeldungen vom Backend
        const errorMessage = error.message
        if (errorMessage.includes("No account found")) {
          throw new Error("Kein Konto mit dieser E-Mail-Adresse gefunden")
        } else if (errorMessage.includes("Incorrect password")) {
          throw new Error("Falsches Passwort")
        } else if (errorMessage.includes("deactivated")) {
          throw new Error("Ihr Konto wurde deaktiviert")
        } else if (errorMessage.includes("internal server error")) {
          throw new Error("Ein interner Serverfehler ist aufgetreten")
        }
      }
      throw error
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>("/auth/register", userData)
    apiService.setToken(response.token)
    return response
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>("/auth/me")
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>("/auth/refresh", {})
      apiService.setToken(response.token)
      return response
    } catch (error) {
      this.logout()
      throw error
    }
  }

  logout(): void {
    apiService.clearToken()
  }

  isAuthenticated(): boolean {
    return !!apiService.getToken()
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return apiService.put<User>("/auth/me", userData);
  }

  async updateAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiService.put<User>("/auth/me/avatar", formData);
  }

  async updateStatus(status: User["status"]): Promise<User> {
    return apiService.put<User>("/auth/me/status", { status });
  }
}

export const authService = new AuthService()

