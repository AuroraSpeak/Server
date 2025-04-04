<script setup lang="ts">
import { ref, computed } from 'vue'

const users = ref([
  { id: 1, name: 'GameMaster42', status: 'online', avatar: '🎮', activity: 'Playing Apex Legends', role: 'admin' },
  { id: 2, name: 'SniperElite', status: 'online', avatar: '🎯', activity: 'In Voice Channel', role: 'mod' },
  { id: 3, name: 'TankCommander', status: 'online', avatar: '🛡️', activity: 'In Voice Channel', role: 'member' },
  { id: 4, name: 'HealerPro', status: 'idle', avatar: '💊', activity: null, role: 'member' },
  { id: 5, name: 'StealthNinja', status: 'dnd', avatar: '🥷', activity: 'Playing Valorant', role: 'member' },
  { id: 6, name: 'MagicWizard', status: 'offline', avatar: '🧙', activity: null, role: 'member' },
  { id: 7, name: 'SpeedRunner', status: 'offline', avatar: '🏃', activity: null, role: 'member' },
])

const statusColors = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-red-500',
  offline: 'bg-slate-500'
}

const roleGroups = {
  admin: { name: 'Admins', order: 1 },
  mod: { name: 'Moderators', order: 2 },
  member: { name: 'Members', order: 3 }
}

const groupedUsers = computed(() => {
  const groups = {} as Record<string, typeof users.value>

  for (const role in roleGroups) {
    groups[role] = users.value.filter(user => user.role === role)
  }

  return Object.entries(groups)
    .map(([role, users]) => ({
      role,
      name: roleGroups[role as keyof typeof roleGroups].name,
      order: roleGroups[role as keyof typeof roleGroups].order,
      users
    }))
    .sort((a, b) => a.order - b.order)
})
</script>

<template>
  <div class="h-full overflow-y-auto p-3 bg-slate-800">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-sm font-medium text-slate-300">Users — {{ users.length }}</h2>
      <button class="p-1 rounded hover:bg-slate-700 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>

    <div v-for="group in groupedUsers" :key="group.role" class="mb-4">
      <h3 class="text-xs uppercase tracking-wider text-slate-500 mb-2">{{ group.name }}</h3>
      <div class="space-y-1">
        <div 
          v-for="user in group.users" 
          :key="user.id"
          class="flex items-center p-2 rounded-md hover:bg-slate-700 transition-colors"
        >
          <div class="relative flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg">
              {{ user.avatar }}
            </div>
            <div 
              :class="[
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800',
                statusColors[user.status]
              ]"
            ></div>
          </div>
          <div class="ml-2 overflow-hidden">
            <div class="font-medium text-sm truncate">{{ user.name }}</div>
            <div v-if="user.activity" class="text-xs text-slate-400 truncate">{{ user.activity }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

