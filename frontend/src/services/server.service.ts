import { apiService } from "./api.service"

export interface Server {
  id: string
  name: string
  icon?: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface ServerStats {
  id: string
  userCount: number
  channelCount: number
  messageCount: number
}

export interface CreateServerRequest {
  name: string
  icon?: string
}

export interface UpdateServerRequest {
  name?: string
  icon?: string
}

class ServerService {
  async getServers(): Promise<Server[]> {
    return apiService.get<Server[]>("/servers")
  }

  async getServer(id: string): Promise<Server> {
    return apiService.get<Server>(`/servers/${id}`)
  }

  async createServer(data: CreateServerRequest): Promise<Server> {
    return apiService.post<Server>("/servers", data)
  }

  async updateServer(id: string, data: UpdateServerRequest): Promise<Server> {
    return apiService.put<Server>(`/servers/${id}`, data)
  }

  async deleteServer(id: string): Promise<void> {
    return apiService.delete<void>(`/servers/${id}`)
  }

  async getServerStats(id: string): Promise<ServerStats> {
    return apiService.get<ServerStats>(`/servers/${id}/stats`)
  }
}

export const serverService = new ServerService()

