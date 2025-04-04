<script setup lang="ts">
import { ref } from 'vue'

const channels = ref([
  { id: 1, name: 'general', type: 'text' },
  { id: 2, name: 'strategy', type: 'text' },
  { id: 3, name: 'memes', type: 'text' },
  { id: 4, name: 'Main Lobby', type: 'voice', active: true },
  { id: 5, name: 'Team Alpha', type: 'voice' },
  { id: 6, name: 'Team Beta', type: 'voice' },
])

const activeChannel = ref(1)

const selectChannel = (id: number) => {
  activeChannel.value = id
}
</script>

<template>
  <div class="flex flex-col h-full bg-slate-800">
    <!-- Server name header -->
    <div class="p-4 border-b border-slate-700 flex items-center">
      <h1 class="text-lg font-bold text-white">AuraSpeak</h1>
      <button class="ml-auto text-slate-400 hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Channel list -->
    <div class="flex-grow overflow-y-auto p-2">
      <!-- Text channels -->
      <div class="mb-4">
        <div class="flex items-center px-1 mb-1">
          <h3 class="text-xs uppercase tracking-wider text-slate-400 flex-grow">Text Channels</h3>
          <button class="text-slate-400 hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <div class="space-y-1">
          <button 
            v-for="channel in channels.filter(c => c.type === 'text')" 
            :key="channel.id"
            @click="selectChannel(channel.id)"
            :class="[
              'flex items-center w-full p-2 rounded-md transition-colors',
              activeChannel === channel.id ? 'bg-slate-700 text-white' : 'hover:bg-slate-700 text-slate-300'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span># {{ channel.name }}</span>
          </button>
        </div>
      </div>
      
      <!-- Voice channels -->
      <div>
        <div class="flex items-center px-1 mb-1">
          <h3 class="text-xs uppercase tracking-wider text-slate-400 flex-grow">Voice Channels</h3>
          <button class="text-slate-400 hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <div class="space-y-1">
          <button 
            v-for="channel in channels.filter(c => c.type === 'voice')" 
            :key="channel.id"
            :class="[
              'flex items-center w-full p-2 rounded-md transition-colors',
              channel.active ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'hover:bg-slate-700 text-slate-300'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>{{ channel.name }}</span>
            <span v-if="channel.active" class="ml-2 text-xs text-emerald-400">(connected)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User profile -->
    <div class="p-2 border-t border-slate-700 bg-slate-700 flex items-center">
      <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
        <span class="text-white font-medium">U</span>
      </div>
      <div class="ml-2">
        <div class="text-sm font-medium">User123</div>
        <div class="text-xs text-emerald-400 flex items-center">
          <span class="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
          Online
        </div>
      </div>
      <div class="ml-auto flex space-x-1">
        <button class="p-1 rounded hover:bg-slate-600 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button class="p-1 rounded hover:bg-slate-600 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

