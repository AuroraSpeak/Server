<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/layout/auth/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const validateForm = () => {
  if (!username.value || !fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'All fields are required'
    return false
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return false
  }
  
  if (!acceptTerms.value) {
    errorMessage.value = 'You must accept the terms and conditions'
    return false
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address'
    return false
  }
  
  // Password strength validation (at least 8 characters)
  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long'
    return false
  }
  
  return true
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    await authStore.register({
      username: username.value,
      fullName: fullName.value,
      email: email.value,
      password: password.value
    })
    
    // After successful registration, redirect to login
    router.push('/login')
  } catch (error) {
    errorMessage.value = error instanceof Error 
      ? error.message 
      : 'Registration failed. Please try again.'
    console.error('Registration error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Create an account">
    <form @submit.prevent="handleRegister" class="space-y-4 w-full">
      <!-- Error message -->
      <div v-if="errorMessage" class="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
        {{ errorMessage }}
      </div>
      
      <!-- Username input -->
      <div class="space-y-2">
        <label for="username" class="block text-sm font-medium text-slate-300">
          Username
        </label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          class="input w-full"
          :disabled="isLoading"
        />
      </div>
      
      <!-- Full Name input -->
      <div class="space-y-2">
        <label for="fullName" class="block text-sm font-medium text-slate-300">
          Full Name
        </label>
        <input
          id="fullName"
          v-model="fullName"
          type="text"
          autocomplete="name"
          required
          class="input w-full"
          :disabled="isLoading"
        />
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
        <label for="password" class="block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          class="input w-full"
          :disabled="isLoading"
        />
        <p class="text-xs text-slate-400">Must be at least 8 characters long</p>
      </div>
      
      <!-- Confirm Password input -->
      <div class="space-y-2">
        <label for="confirm-password" class="block text-sm font-medium text-slate-300">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          required
          class="input w-full"
          :disabled="isLoading"
        />
      </div>
      
      <!-- Terms checkbox -->
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input
            id="terms"
            v-model="acceptTerms"
            type="checkbox"
            required
            class="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-500 focus:ring-violet-500"
            :disabled="isLoading"
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="terms" class="text-slate-300">
            I agree to the
            <a href="#" class="text-violet-400 hover:underline">Terms of Service</a>
            and
            <a href="#" class="text-violet-400 hover:underline">Privacy Policy</a>
          </label>
        </div>
      </div>
      
      <!-- Register button -->
      <button
        type="submit"
        class="btn btn-primary w-full flex justify-center items-center"
        :disabled="isLoading"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isLoading ? 'Creating account...' : 'Register' }}
      </button>
      
      <!-- Login link -->
      <div class="text-center text-sm text-slate-400">
        Already have an account?
        <router-link to="/login" class="text-violet-400 hover:underline">
          Log In
        </router-link>
      </div>
    </form>
  </AuthLayout>
</template>

