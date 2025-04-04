<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/layout/auth/AuthLayout.vue'


const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error 
      ? error.message 
      : 'Login failed. Please check your credentials.'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Welcome back!">
    <form @submit.prevent="handleLogin" class="space-y-4 w-full">
      <!-- Error message -->
      <div v-if="errorMessage" class="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
        {{ errorMessage }}
      </div>
      
      <!-- Email input -->
      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="input w-full"
          :disabled="isLoading"
        />
      </div>
      
      <!-- Password input -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label for="password" class="block text-sm font-medium text-slate-300">
            Password
          </label>
          <router-link to="/forgot-password" class="text-xs text-violet-400 hover:underline">
            Forgot Password?
          </router-link>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="input w-full"
          :disabled="isLoading"
        />
      </div>
      
      <!-- Remember me checkbox -->
      <div class="flex items-center">
        <input
          id="remember-me"
          v-model="rememberMe"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-500 focus:ring-violet-500"
          :disabled="isLoading"
        />
        <label for="remember-me" class="ml-2 block text-sm text-slate-300">
          Remember me
        </label>
      </div>
      
      <!-- Login button -->
      <button
        type="submit"
        class="btn btn-primary w-full flex justify-center items-center"
        :disabled="isLoading"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isLoading ? 'Logging in...' : 'Log In' }}
      </button>
      
      <!-- Register link -->
      <div class="text-center text-sm text-slate-400">
        Need an account?
        <router-link to="/register" class="text-violet-400 hover:underline">
          Register
        </router-link>
      </div>
    </form>
  </AuthLayout>
</template>

