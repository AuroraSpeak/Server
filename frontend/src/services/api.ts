import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
})

// WebSocket URL basierend auf der API URL
export const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/^http/, 'ws');

// WebSocket Endpunkt
export const WS_ENDPOINT = "/ws";

// Request Interceptor für Authentifizierung
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token ungültig oder abgelaufen
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default api

