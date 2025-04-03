<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useWebRTCStore } from '@/stores/webrtc'

const webrtcStore = useWebRTCStore()

const isCallActive = computed(() => webrtcStore.isCallActive)
const isMuted = computed(() => webrtcStore.isMuted)
const connectionState = computed(() => webrtcStore.connectionState)
const error = computed(() => webrtcStore.error)
const activeSpeakers = computed(() => webrtcStore.activeSpeakers)
const currentChannel = computed(() => webrtcStore.currentChannel)

const getStatusText = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Verbunden'
    case 'connecting':
      return 'Verbindung wird hergestellt...'
    case 'disconnected':
      return 'Nicht verbunden'
    default:
      return 'Unbekannter Status'
  }
})

async function handleCallToggle() {
  try {
    if (isCallActive.value) {
      await webrtcStore.leaveChannel()
    } else if (currentChannel.value) {
      await webrtcStore.joinChannel(currentChannel.value)
    }
  } catch (err) {
    console.error('Fehler beim Umschalten des Anrufs:', err)
  }
}

async function handleMuteToggle() {
  try {
    await webrtcStore.toggleMute()
  } catch (err) {
    console.error('Fehler beim Umschalten der Stummschaltung:', err)
  }
}

onMounted(async () => {
  try {
    await webrtcStore.initialize('ws://localhost:8080/webrtc')
  } catch (err) {
    console.error('Fehler beim Initialisieren der WebRTC-Verbindung:', err)
  }
})

onUnmounted(async () => {
  try {
    await webrtcStore.disconnect()
  } catch (err) {
    console.error('Fehler beim Trennen der Verbindung:', err)
  }
})
</script>

<template>
  <div class="control-panel">
    <div class="status-indicator" :class="connectionState">
      {{ getStatusText }}
    </div>

    <div class="controls">
      <button 
        class="control-button"
        :class="{ active: isCallActive }"
        @click="handleCallToggle"
        :disabled="connectionState === 'disconnected'"
      >
        <i class="fas" :class="isCallActive ? 'fa-phone-slash' : 'fa-phone'"></i>
        {{ isCallActive ? 'Kanal verlassen' : 'Kanal beitreten' }}
      </button>

      <button 
        class="control-button"
        :class="{ active: isMuted }"
        @click="handleMuteToggle"
        :disabled="!isCallActive"
      >
        <i class="fas" :class="isMuted ? 'fa-microphone-slash' : 'fa-microphone'"></i>
        {{ isMuted ? 'Stummschaltung aufheben' : 'Stummschaltung' }}
      </button>

      <div class="speaker-indicator" v-if="activeSpeakers.length > 0">
        <i class="fas fa-users"></i>
        {{ activeSpeakers.length }} Sprecher aktiv
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 1rem;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-indicator {
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.status-indicator.connected {
  background-color: #4caf50;
}

.status-indicator.connecting {
  background-color: #ff9800;
}

.status-indicator.disconnected {
  background-color: #f44336;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-button {
  background-color: #2c2c2c;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.control-button:hover:not(:disabled) {
  background-color: #3c3c3c;
}

.control-button.active {
  background-color: #4caf50;
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speaker-indicator {
  background-color: #2c2c2c;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #f44336;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.fas {
  font-size: 1.2rem;
}
</style>

