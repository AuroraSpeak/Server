// Import dependencies first
import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import "./assets/main.css"
import { useAuthStore } from "./stores/auth"
import { useWebSocketStore } from "./stores/websocket"

// Create and mount the app
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount("#app")

// Initialize stores AFTER mounting
const authStore = useAuthStore()
const wsStore = useWebSocketStore()