// Base API service with common functionality
export class ApiService {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    const envApiUrl = import.meta.env.VITE_API_URL
    console.log('VITE_API_URL:', envApiUrl)
    this.baseUrl = envApiUrl || "http://localhost:8080/api"
    this.token = localStorage.getItem("token")
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem("token", token)
  }

  getToken(): string | null {
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem("token")
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log('API Request URL:', url)
    console.log('Base URL:', this.baseUrl)
    console.log('Environment:', import.meta.env)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {})
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    // CSRF-Token aus dem Cookie extrahieren
    const csrfToken = document.cookie
      .split("; ")
      .find(row => row.startsWith("csrf_token="))
      ?.split("=")[1]

    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken
    }

    const config = {
      ...options,
      headers,
      credentials: "include" as const
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `API request failed with status ${response.status}`

        // Handle authentication errors
        if (response.status === 401) {
          this.clearToken()
          // Optionally redirect to login page
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:unauthorized"))
          }
        }

        throw new Error(errorMessage)
      }

      // For HEAD requests or empty responses
      if (response.status === 204 || options.method === "HEAD") {
        return {} as T
      }

      return (await response.json()) as T
    } catch (error) {
      console.error("API request error:", error)
      throw error
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  head<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "HEAD" })
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiService = new ApiService()

