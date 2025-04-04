import { defineStore } from "pinia"
import { authService, type User } from "../services/auth.service"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
  }),

  actions: {
    async login(email: string, password: string) {
      try {
        const response = await authService.login({ email, password })
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true
        localStorage.setItem("token", response.token)
        return response
      } catch (error) {
        console.error("Login failed:", error)
        this.isAuthenticated = false
        this.token = null
        this.user = null
        throw error
      }
    },

    async register(userData: {
      username: string
      email: string
      password: string
      fullName: string
    }) {
      try {
        const response = await authService.register(userData)
        return response
      } catch (error) {
        console.error("Registration failed:", error)
        throw error
      }
    },

    async fetchUser() {
      try {
        if (!this.token) return
        const user = await authService.getCurrentUser()
        this.user = user
        this.isAuthenticated = true
      } catch (error) {
        console.error("Failed to fetch user:", error)
        this.logout()
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem("token")
    },
  },
})

