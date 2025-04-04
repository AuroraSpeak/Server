<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-900">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">
          AS
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
        {{ title }}
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-700">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

