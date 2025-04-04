<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/auth/AuthLayout.vue'

const router = useRouter()

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  if (!email.value) {
    errorMessage.value = 'Please enter your email address'
    return
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }
  
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // Simulate API call for password reset
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Show success message
    successMessage.value = 'If an account exists with this email, you will receive password reset instructions.'
    email.value = ''
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
    console.error('Password reset error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Reset your password">
    <form @submit.prevent="handleSubmit" class="space-y-4 w-full">
      <!-- Error message -->
      <div v-if="errorMessage" class="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
        {{ errorMessage }}
      </div>
      
      <!-- Success message -->
      <div v-if="successMessage" class="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-md text-emerald-200 text-sm">
        {{ successMessage }}
      </div>
      
      <p class="text-slate-400 text-sm">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
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
      
      <!-- Submit button -->
      <button
        type="submit"
        class="btn btn-primary w-full flex justify-center items-center"
        :disabled="isLoading"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
      </button>
      
      <!-- Back to login link -->
      <div class="text-center text-sm text-slate-400">
        <router-link to="/login" class="text-violet-400 hover:underline">
          Back to Login
        </router-link>
      </div>
    </form>
  </AuthLayout>
</template>

