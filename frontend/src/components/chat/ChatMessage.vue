<script setup lang="ts">
defineProps<{
  user: string;
  avatar: string;
  content: string;
  time: string;
}>();
</script>

<template>
  <div class="flex group hover:bg-slate-800/50 p-2 rounded-md -mx-2">
    <div class="flex-shrink-0 mr-3">
      <div 
        v-if="avatar.length === 1" 
        class="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-medium"
      >
        {{ avatar }}
      </div>
      <div v-else class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
        {{ avatar }}
      </div>
    </div>
    <div class="flex-grow">
      <div class="flex items-baseline">
        <span class="font-medium text-violet-400">{{ user }}</span>
        <span class="ml-2 text-xs text-slate-500">{{ time }}</span>
      </div>
      <div class="mt-1 text-slate-300">{{ content }}</div>
    </div>
    <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="p-1 rounded hover:bg-slate-700 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

