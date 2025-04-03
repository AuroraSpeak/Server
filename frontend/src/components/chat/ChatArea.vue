<script setup lang="ts">
import { ref } from 'vue'
import ChatMessage from './ChatMessage.vue'

const messages = ref([
  { id: 1, user: 'GameMaster42', avatar: '🎮', content: 'Welcome to the Gaming Hub! Who\'s up for some ranked matches tonight?', time: '10:30 AM' },
  { id: 2, user: 'SniperElite', avatar: '🎯', content: 'I\'m in! Just finished updating my drivers.', time: '10:32 AM' },
  { id: 3, user: 'TankCommander', avatar: '🛡️', content: 'Count me in too. I\'ve been practicing that new strategy we talked about.', time: '10:35 AM' },
  { id: 4, user: 'HealerPro', avatar: '💊', content: 'I\'ll join after dinner, around 8PM. Save a spot for me!', time: '10:40 AM' },
  { id: 5, user: 'GameMaster42', avatar: '🎮', content: 'Perfect! We\'ll have a full squad then. Let\'s meet in the voice channel at 8PM.', time: '10:42 AM' },
  { id: 6, user: 'SniperElite', avatar: '🎯', content: 'Sounds good! I\'ll bring my new headset.', time: '10:45 AM' },
  { id: 7, user: 'TankCommander', avatar: '🛡️', content: 'By the way, has anyone tried the new map yet? I heard it has some interesting choke points.', time: '10:50 AM' },
  { id: 8, user: 'GameMaster42', avatar: '🎮', content: 'Yeah, I played a few rounds yesterday. The north side has a great sniper spot, @SniperElite you\'ll love it.', time: '10:55 AM' },
])

const newMessage = ref('')

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: messages.value.length + 1,
      user: 'User123',
      avatar: 'U',
      content: newMessage.value,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    newMessage.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900">
    <!-- Channel header -->
    <div class="py-2 px-3 border-b border-slate-700 bg-slate-800 flex items-center flex-shrink-0">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h2 class="font-medium"># general</h2>
      </div>
      <div class="ml-auto flex items-center space-x-2">
        <button class="p-1 rounded hover:bg-slate-700 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button class="p-1 rounded hover:bg-slate-700 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button class="p-1 rounded hover:bg-slate-700 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages area -->
    <div class="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-900 min-h-0">
      <ChatMessage 
        v-for="message in messages" 
        :key="message.id" 
        :user="message.user" 
        :avatar="message.avatar" 
        :content="message.content" 
        :time="message.time" 
      />
    </div>

    <!-- Message input -->
    <div class="py-2 px-3 border-t border-slate-700 bg-slate-800 flex-shrink-0">
      <div class="flex items-center bg-slate-700 rounded-lg p-1">
        <button class="p-1 rounded hover:bg-slate-600 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <input 
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text" 
          placeholder="Message #general" 
          class="flex-grow bg-transparent border-none focus:outline-none px-3 py-1 text-slate-100"
        >
        <button class="p-1 rounded hover:bg-slate-600 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button 
          @click="sendMessage"
          class="p-1 rounded bg-violet-500 hover:bg-violet-600 text-white ml-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

