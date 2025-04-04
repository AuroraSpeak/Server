<template>
  <div class="flex h-screen">
    <!-- Channel Sidebar -->
    <div class="w-64 bg-gray-800 text-white p-4">
      <h2 class="text-xl font-bold mb-4">Kanäle</h2>
      <div class="space-y-2">
        <div 
          v-for="channel in channels" 
          :key="channel.id"
          @click="selectChannel(channel)"
          class="p-2 rounded hover:bg-gray-700 cursor-pointer"
          :class="{ 'bg-gray-700': selectedChannel?.id === channel.id }"
        >
          <div class="flex items-center">
            <span class="mr-2">#</span>
            <span>{{ channel.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Channel Header -->
      <div class="bg-gray-700 text-white p-4 border-b border-gray-600">
        <h1 class="text-xl font-bold"># {{ selectedChannel?.name || 'Wähle einen Kanal' }}</h1>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 p-4 overflow-y-auto">
        <div v-if="selectedChannel" class="space-y-4">
          <div v-for="message in messages" :key="message.id" class="message">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <img :src="message.user.avatar" class="w-8 h-8 rounded-full" alt="User Avatar">
              </div>
              <div class="ml-3">
                <div class="flex items-center">
                  <span class="font-bold text-white">{{ message.user.name }}</span>
                  <span class="ml-2 text-sm text-gray-400">{{ message.timestamp }}</span>
                </div>
                <p class="text-gray-200">{{ message.content }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-full">
          <p class="text-gray-400">Wähle einen Kanal aus der Sidebar</p>
        </div>
      </div>

      <!-- Message Input -->
      <div v-if="selectedChannel" class="p-4 border-t border-gray-600">
        <div class="flex items-center">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Nachricht eingeben..."
            class="flex-1 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <button
            @click="sendMessage"
            class="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Channel {
  id: string
  name: string
}

interface Message {
  id: string
  content: string
  timestamp: string
  user: {
    id: string
    name: string
    avatar: string
  }
}

// Beispiel-Daten (später durch API-Aufrufe ersetzen)
const channels = ref<Channel[]>([
  { id: '1', name: 'allgemein' },
  { id: '2', name: 'entwicklung' },
  { id: '3', name: 'design' }
])

const selectedChannel = ref<Channel | null>(null)
const messages = ref<Message[]>([])
const newMessage = ref('')

const selectChannel = (channel: Channel) => {
  selectedChannel.value = channel
  // Hier später: Nachrichten für den ausgewählten Kanal laden
  loadMessages(channel.id)
}

const loadMessages = async (channelId: string) => {
  // Hier später: API-Aufruf implementieren
  messages.value = [
    {
      id: '1',
      content: 'Willkommen im Kanal!',
      timestamp: '12:00',
      user: {
        id: '1',
        name: 'System',
        avatar: 'https://via.placeholder.com/32'
      }
    }
  ]
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedChannel.value) return
  
  // Hier später: API-Aufruf implementieren
  messages.value.push({
    id: Date.now().toString(),
    content: newMessage.value,
    timestamp: new Date().toLocaleTimeString(),
    user: {
      id: '1',
      name: 'Aktueller Benutzer',
      avatar: 'https://via.placeholder.com/32'
    }
  })
  
  newMessage.value = ''
}
</script>

<style scoped>
.message {
  @apply mb-4;
}

input::placeholder {
  @apply text-gray-400;
}
</style> 