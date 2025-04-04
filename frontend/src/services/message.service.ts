import { apiService } from "./api.service"

export interface Message {
  id: string
  content: string
  userId: string
  channelId: string
  createdAt: string
  updatedAt: string
}

export interface CreateMessageRequest {
  content: string
}

export interface UpdateMessageRequest {
  content: string
}

class MessageService {
  async getMessages(channelId: string): Promise<Message[]> {
    return apiService.get<Message[]>(`/channels/${channelId}/messages`)
  }

  async createMessage(channelId: string, data: CreateMessageRequest): Promise<Message> {
    return apiService.post<Message>(`/channels/${channelId}/messages`, data)
  }

  async updateMessage(id: string, data: UpdateMessageRequest): Promise<Message> {
    return apiService.put<Message>(`/messages/${id}`, data)
  }

  async deleteMessage(id: string): Promise<void> {
    return apiService.delete<void>(`/messages/${id}`)
  }

  async sendMessage(channelId: string, content: string): Promise<Message> {
    return this.createMessage(channelId, { content })
  }
}

export const messageService = new MessageService()

