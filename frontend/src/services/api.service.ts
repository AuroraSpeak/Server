// Base API service with common functionality
export class ApiService {
  private baseUrl: string
  private token: string | null = null
  private readonly timeout = 10000 // 10 seconds timeout

  constructor() {
    const envApiUrl = import.meta.env.VITE_API_URL
    console.log('VITE_API_URL:', envApiUrl)
    // Entferne trailing slash und /api, falls vorhanden
    this.baseUrl = (envApiUrl || "http://localhost:8080").replace(/\/+$/, '').replace(/\/api$/, '')
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

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Entferne führenden Slash, falls vorhanden
    const cleanEndpoint = endpoint.replace(/^\/+/, '')
    const url = `${this.baseUrl}/api/${cleanEndpoint}`
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
      const response = await this.fetchWithTimeout(url, config)

      if (!response.ok) {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch (e) {
          console.warn('Failed to parse error response:', e)
        }

        const errorMessage = errorData.message || `API request failed with status ${response.status}`

        // Handle authentication errors
        if (response.status === 401) {
          this.clearToken()
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

      try {
        return await response.json() as T
      } catch (e) {
        console.warn('Failed to parse response:', e)
        return {} as T
      }
    } catch (error) {
      console.error("API request error:", error)
      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          throw new Error('Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es später erneut.')
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.')
        }
      }
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

