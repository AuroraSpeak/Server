<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useWebRTCStore } from './stores/webrtc'

const webrtcStore = useWebRTCStore()

onMounted(async () => {
  try {
    const wsUrl = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8080'
    await webrtcStore.initialize(wsUrl)
  } catch (err) {
    console.error('Fehler bei der WebRTC-Initialisierung:', err)
  }
})

onUnmounted(() => {
  webrtcStore.disconnect()
})
</script>

<template>
  <div class="app">
    <div class="sidebar">
      <h2>Voice Kanäle</h2>
      <div class="channels">
        <div
          v-for="channel in webrtcStore.availableChannels"
          :key="channel.id"
          class="channel-item"
          :class="{ 'active': webrtcStore.currentChannel === channel.id }"
          @click="webrtcStore.joinChannel(channel.id)"
        >
          {{ channel.name }}
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="status-bar">
        <span>Status: {{ webrtcStore.connectionState }}</span>
        <button 
          v-if="webrtcStore.currentChannel"
          @click="webrtcStore.leaveChannel()"
        >
          Kanal verlassen
        </button>
      </div>
      <div class="speakers">
        <h3>Aktive Sprecher</h3>
        <ul>
          <li v-for="speaker in webrtcStore.activeSpeakers" :key="speaker">
            {{ speaker }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  background-color: #1a1a1a;
  color: #ffffff;
}

.sidebar {
  width: 250px;
  padding: 1rem;
  background-color: #2c2c2c;
  border-right: 1px solid #3c3c3c;
}

.channels {
  margin-top: 1rem;
}

.channel-item {
  padding: 0.5rem;
  margin: 0.5rem 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.channel-item:hover {
  background-color: #3c3c3c;
}

.channel-item.active {
  background-color: #4caf50;
}

.main-content {
  flex: 1;
  padding: 1rem;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #2c2c2c;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.speakers {
  background-color: #2c2c2c;
  padding: 1rem;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>

