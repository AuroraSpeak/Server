import { defineStore } from "pinia"
import { messageService, type Message } from "../services/message.service"

interface MessagesState {
  messages: Message[]
  loading: boolean
  error: string | null
}

export const useMessagesStore = defineStore("messages", {
  state: (): MessagesState => ({
    messages: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchMessages(channelId: string) {
      try {
        this.loading = true
        this.error = null
        this.messages = await messageService.getMessages(channelId)
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to fetch messages"
        console.error("Failed to fetch messages:", error)
      } finally {
        this.loading = false
      }
    },

    async sendMessage(channelId: string, content: string) {
      try {
        this.loading = true
        this.error = null
        const newMessage = await messageService.sendMessage(channelId, content)
        this.messages.push(newMessage)
        return newMessage
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to send message"
        console.error("Failed to send message:", error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteMessage(messageId: string) {
      try {
        this.loading = true
        this.error = null
        await messageService.deleteMessage(messageId)
        this.messages = this.messages.filter((message) => message.id !== messageId)
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to delete message"
        console.error("Failed to delete message:", error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateMessage(messageId: string, content: string) {
      try {
        this.loading = true
        this.error = null
        // Fix: Pass an object with content property instead of just the string
        const updatedMessage = await messageService.updateMessage(messageId, { content })

        // Update the message in the local state
        const index = this.messages.findIndex((msg) => msg.id === messageId)
        if (index !== -1) {
          this.messages[index] = updatedMessage
        }

        return updatedMessage
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to update message"
        console.error("Failed to update message:", error)
        throw error
      } finally {
        this.loading = false
      }
    },

    addMessage(message: Message) {
      this.messages.push(message)
    },

    clearMessages() {
      this.messages = []
    },
  },
})

