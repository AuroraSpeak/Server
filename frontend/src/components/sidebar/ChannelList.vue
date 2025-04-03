<template>
  <div class="channel-list">
    <div class="channel-list-header">
      <h3>Voice Kanäle</h3>
      <button 
        class="add-channel-button"
        @click="showCreateChannelModal = true"
      >
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <div class="channels">
      <div
        v-for="channel in availableChannels"
        :key="channel.id"
        class="channel-item"
        :class="{ 
          'active': currentChannel === channel.id,
          'has-speakers': activeSpeakers.length > 0
        }"
        @click="handleChannelClick(channel)"
      >
        <div class="channel-icon">
          <i class="fas fa-volume-up"></i>
        </div>
        <div class="channel-info">
          <div class="channel-name">{{ channel.name }}</div>
          <div class="channel-status">
            <span v-if="currentChannel === channel.id">
              {{ isCallActive ? 'Verbunden' : 'Ausgewählt' }}
            </span>
            <span v-else-if="activeSpeakers.length > 0">
              {{ activeSpeakers.length }} Sprecher
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal für neue Kanäle -->
    <div v-if="showCreateChannelModal" class="modal">
      <div class="modal-content">
        <h3>Neuen Kanal erstellen</h3>
        <input
          v-model="newChannelName"
          type="text"
          placeholder="Kanalname"
          class="channel-input"
        />
        <div class="modal-buttons">
          <button 
            class="cancel-button"
            @click="showCreateChannelModal = false"
          >
            Abbrechen
          </button>
          <button 
            class="create-button"
            @click="createChannel"
            :disabled="!newChannelName.trim()"
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWebRTCStore } from '@/stores/webrtc'

const webrtcStore = useWebRTCStore()
const showCreateChannelModal = ref(false)
const newChannelName = ref('')

const availableChannels = computed(() => webrtcStore.availableChannels)
const currentChannel = computed(() => webrtcStore.currentChannel)
const isCallActive = computed(() => webrtcStore.isCallActive)
const activeSpeakers = computed(() => webrtcStore.activeSpeakers)

async function handleChannelClick(channel: { id: string, name: string }) {
  try {
    if (currentChannel.value === channel.id) {
      if (isCallActive.value) {
        await webrtcStore.leaveChannel()
      }
    } else {
      if (isCallActive.value) {
        await webrtcStore.leaveChannel()
      }
      await webrtcStore.joinChannel(channel.id)
    }
  } catch (err) {
    console.error('Fehler beim Wechseln des Kanals:', err)
  }
}

async function createChannel() {
  try {
    // Hier API-Aufruf zum Erstellen des Kanals
    const response = await fetch('/api/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newChannelName.value })
    })

    if (!response.ok) {
      throw new Error('Fehler beim Erstellen des Kanals')
    }

    const newChannel = await response.json()
    await webrtcStore.joinChannel(newChannel.id)
    showCreateChannelModal.value = false
    newChannelName.value = ''
  } catch (err) {
    console.error('Fehler beim Erstellen des Kanals:', err)
  }
}
</script>

<style scoped>
.channel-list {
  padding: 1rem;
  background-color: #1a1a1a;
  border-radius: 8px;
  color: #ffffff;
}

.channel-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.channel-list-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.add-channel-button {
  background: none;
  border: none;
  color: #4caf50;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.add-channel-button:hover {
  background-color: #2c2c2c;
}

.channels {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.channel-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.channel-item:hover {
  background-color: #2c2c2c;
}

.channel-item.active {
  background-color: #4caf50;
}

.channel-item.has-speakers {
  border-left: 3px solid #4caf50;
}

.channel-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2c2c2c;
  border-radius: 4px;
  margin-right: 0.5rem;
}

.channel-info {
  flex: 1;
}

.channel-name {
  font-weight: 500;
}

.channel-status {
  font-size: 0.8rem;
  color: #888;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.channel-input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
  background-color: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  color: #ffffff;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button,
.create-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.cancel-button {
  background-color: #2c2c2c;
  color: #ffffff;
}

.create-button {
  background-color: #4caf50;
  color: #ffffff;
}

.create-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 