import api from "./api"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    username: string
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", credentials)
    localStorage.setItem("token", response.data.token)
    return response.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/register", data)
    localStorage.setItem("token", response.data.token)
    return response.data
  },

  async logout(): Promise<void> {
    localStorage.removeItem("token")
    await api.post("/api/auth/logout")
  },

  async getCurrentUser(): Promise<AuthResponse["user"]> {
    const response = await api.get<AuthResponse>("/api/auth/me")
    return response.data.user
  },
}

