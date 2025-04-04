<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useWebRTCStore } from './stores/webrtc'
import { useAuthStore } from './stores/auth'
import { useServersStore } from './stores/servers'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'

const webrtcStore = useWebRTCStore()
const authStore = useAuthStore()
const serversStore = useServersStore()
const route = useRoute()

// Check if the current route is an auth route
const isAuthRoute = computed(() => {
  return route.path.includes('/login') || 
         route.path.includes('/register') || 
         route.path.includes('/forgot-password')
})

onMounted(async () => {
  // Try to fetch user data if we have a token
  await authStore.fetchUser()
  
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

  if (authStore.isAuthenticated && !isAuthRoute.value) {
    try {
      await webrtcStore.initialize(wsUrl)
      await serversStore.fetchServers()
    } catch (error) {
      console.error('Failed to initialize:', error)
    }
  }
})

onUnmounted(() => {
  webrtcStore.disconnect()
})
</script>

<template>
  <router-view />
</template>

