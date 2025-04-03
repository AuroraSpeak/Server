<script setup lang="ts">
import { ref } from 'vue'

const servers = ref([
  { id: 1, name: 'AuraSpeak', icon: 'AS', color: 'bg-violet-600', selected: true },
  { id: 2, name: 'Gaming Hub', icon: '🎮', color: 'bg-emerald-600' },
  { id: 3, name: 'Squad Team', icon: '🛡️', color: 'bg-blue-600' },
  { id: 4, name: 'Raid Party', icon: '⚔️', color: 'bg-red-600' },
  { id: 5, name: 'Strategy Group', icon: '🧠', color: 'bg-amber-600' },
  { id: 6, name: 'Casual Chat', icon: '💬', color: 'bg-indigo-600' },
])

const activeServer = ref(1)

const selectServer = (id: number) => {
  activeServer.value = id
}
</script>

<template>
  <div class="flex flex-col h-full py-3 items-center">
    <!-- Home button -->
    <button class="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-violet-600 hover:rounded-xl transition-all duration-200 mb-2 flex items-center justify-center text-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
      </svg>
    </button>
    
    <!-- Server divider -->
    <div class="w-8 h-0.5 bg-slate-700 rounded-full my-2"></div>
    
    <!-- Server list -->
    <div class="flex flex-col items-center space-y-2 overflow-y-auto flex-grow">
      <button 
        v-for="server in servers" 
        :key="server.id"
        @click="selectServer(server.id)"
        :class="[
          'w-12 h-12 rounded-full flex items-center justify-center text-white font-medium transition-all duration-200',
          server.color,
          activeServer === server.id ? 'rounded-2xl' : 'hover:rounded-2xl'
        ]"
        :title="server.name"
      >
        <div 
          v-if="activeServer === server.id" 
          class="absolute -left-1.5 w-1.5 h-10 bg-white rounded-r-full"
        ></div>
        {{ server.icon }}
      </button>
    </div>
    
    <!-- Add server button -->
    <button class="w-12 h-12 rounded-full bg-slate-800 hover:bg-emerald-600 hover:rounded-xl transition-all duration-200 mt-2 flex items-center justify-center text-emerald-500 hover:text-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>
    
    <!-- Explore servers button -->
    <button class="w-12 h-12 rounded-full bg-slate-800 hover:bg-violet-600 hover:rounded-xl transition-all duration-200 mt-2 flex items-center justify-center text-violet-500 hover:text-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  </div>
</template>

