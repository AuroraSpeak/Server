<script setup lang="ts">
import { ref } from 'vue'
import ServerSidebar from './ServerSidebar.vue'
import Sidebar from './Sidebar.vue'
import ChatArea from '../chat/ChatArea.vue'
import UserList from '../users/UserList.vue'
import ControlPanel from '../controls/ControlPanel.vue'
import { useWebRTCStore } from '../../stores/webrtc'

const webrtcStore = useWebRTCStore()
const showMobileMenu = ref(false)

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-900">
    <!-- Server sidebar - always visible -->
    <div class="bg-slate-900 border-r border-slate-700 w-16 flex-shrink-0">
      <ServerSidebar />
    </div>
    
    <!-- Channel sidebar - hidden on mobile unless toggled -->
    <div 
      :class="[
        'bg-slate-800 border-r border-slate-700 w-60 flex-shrink-0 transition-all duration-300 ease-in-out',
        { '-ml-60 md:ml-0': !showMobileMenu }
      ]"
    >
      <Sidebar />
    </div>

    <!-- Main content area -->
    <div class="flex flex-col flex-grow overflow-hidden">
      <!-- Mobile header with menu toggle -->
      <div class="md:hidden bg-slate-800 p-2 border-b border-slate-700 flex items-center">
        <button @click="toggleMobileMenu" class="btn btn-ghost p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="text-lg font-bold ml-2 text-violet-400">AuraSpeak</h1>
      </div>

      <!-- Main content layout -->
      <div class="flex flex-grow overflow-hidden">
        <!-- Chat area with control panel -->
        <div class="flex-grow flex flex-col overflow-hidden bg-slate-900 max-h-full">
          <ChatArea />
          <ControlPanel />
        </div>

        <!-- User list - hidden on mobile -->
        <div class="hidden md:block w-64 bg-slate-800 border-l border-slate-700 overflow-y-auto">
          <UserList />
        </div>
      </div>
    </div>
  </div>
</template>

