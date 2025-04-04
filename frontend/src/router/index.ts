import { createRouter, createWebHistory } from "vue-router"
import HomeView from "../views/HomeView.vue"
import LoginView from "../views/auth/LoginView.vue"
import RegisterView from "../views/auth/RegisterView.vue"
import ForgotPasswordView from "../views/auth/ForgotPasswordView.vue"
import { useAuthStore } from "../stores/auth"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guest: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPasswordView,
      meta: { guest: true },
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Routes that require authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      next({ name: "login", query: { redirect: to.fullPath } })
    } else {
      next()
    }
  }
  // Routes for guests only (login, register, etc.)
  else if (to.matched.some((record) => record.meta.guest)) {
    if (authStore.isAuthenticated) {
      next({ name: "home" })
    } else {
      next()
    }
  }
  // Public routes
  else {
    next()
  }
})

export default router

