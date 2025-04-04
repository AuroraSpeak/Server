<script setup lang="ts">
import { useWebRTCStore } from '../../stores/webrtc'
import { computed, ref } from 'vue'

const webrtcStore = useWebRTCStore()

const isCallActive = computed(() => webrtcStore.isInCall)
const isMuted = ref(false)
const connectionState = computed(() => {
  if (webrtcStore.peerConnection) {
    return webrtcStore.peerConnection.connectionState
  }
  return 'disconnected'
})

const toggleMute = () => {
  if (webrtcStore.localStream) {
    webrtcStore.localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
    })
    isMuted.value = !isMuted.value
  }
}

const startCall = async () => {
  try {
    await webrtcStore.initializeLocalStream()
    await webrtcStore.createOffer()
  } catch (error) {
    console.error('Failed to start call:', error)
  }
}

const endCall = () => {
  webrtcStore.endCall()
}
</script>

<template>
  <div class="bg-slate-800 border-t border-slate-700 py-2 px-3 flex-shrink-0">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="relative mr-2">
          <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-medium">
            U
          </div>
          <div 
            :class="[
              'absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-slate-800',
              connectionState === 'connected' ? 'bg-emerald-500' : 'bg-slate-500'
            ]"
          ></div>
        </div>
        <div>
          <div class="font-medium text-sm">Voice Connected</div>
          <div class="text-xs text-slate-400">Main Lobby</div>
        </div>
      </div>
      
      <div class="flex space-x-2">
        <!-- Mute button -->
        <button 
          @click="toggleMute"
          :class="[
            'rounded-full w-8 h-8 flex items-center justify-center',
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
          ]"
          :title="isMuted ? 'Unmute' : 'Mute'"
        >
          <svg v-if="isMuted" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        
        <!-- Call control button -->
        <button 
          v-if="!isCallActive"
          @click="startCall"
          class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
          title="Start Call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
        <button 
          v-else
          @click="endCall"
          class="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
          title="End Call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
        
        <!-- Settings button -->
        <button 
          class="bg-transparent hover:bg-slate-700 text-slate-300 rounded-full w-8 h-8 flex items-center justify-center"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

