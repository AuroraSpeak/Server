import { apiService } from "./api.service"

export interface Channel {
  id: string
  name: string
  type: "text" | "voice"
  serverId: string
  createdAt: string
  updatedAt: string
}

export interface CreateChannelRequest {
  name: string
  type: "text" | "voice"
}

export interface UpdateChannelRequest {
  name?: string
}

class ChannelService {
  async getChannels(serverId: string): Promise<Channel[]> {
    return apiService.get<Channel[]>(`/servers/${serverId}/channels`)
  }

  async getChannel(id: string): Promise<Channel> {
    return apiService.get<Channel>(`/channels/${id}`)
  }

  async createChannel(serverId: string, data: CreateChannelRequest): Promise<Channel> {
    return apiService.post<Channel>(`/servers/${serverId}/channels`, data)
  }

  async updateChannel(id: string, data: UpdateChannelRequest): Promise<Channel> {
    return apiService.put<Channel>(`/channels/${id}`, data)
  }

  async deleteChannel(id: string): Promise<void> {
    return apiService.delete<void>(`/channels/${id}`)
  }
}

export const channelService = new ChannelService()

