import api from "./api"

export interface Server {
  id: string
  name: string
  status: "online" | "offline"
  ip: string
  port: number
  lastSeen: string
}

export interface ServerStats {
  cpu: number
  memory: number
  disk: number
  uptime: number
}

export const serverService = {
  async getServers(): Promise<Server[]> {
    const response = await api.get<Server[]>("/api/servers")
    return response.data
  },

  async getServerById(id: string): Promise<Server> {
    const response = await api.get<Server>(`/api/servers/${id}`)
    return response.data
  },

  async getServerStats(id: string): Promise<ServerStats> {
    const response = await api.get<ServerStats>(`/api/servers/${id}/stats`)
    return response.data
  },

  async createServer(data: Omit<Server, "id" | "status" | "lastSeen">): Promise<Server> {
    const response = await api.post<Server>("/api/servers", data)
    return response.data
  },

  async updateServer(id: string, data: Partial<Server>): Promise<Server> {
    const response = await api.put<Server>(`/api/servers/${id}`, data)
    return response.data
  },

  async deleteServer(id: string): Promise<void> {
    await api.delete(`/api/servers/${id}`)
  },
}

