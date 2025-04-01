import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { AuthProvider } from "./contexts/AuthContext"
import { WebRTCProvider } from "./contexts/WebRTCContext"
import { AppProvider } from "./contexts/AppContext"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"

// Add dark class to html element
document.documentElement.classList.add("dark")

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="aura-theme">
      <AuthProvider>
        <WebRTCProvider>
          <AppProvider>
            <App />
            <Toaster position="top-right" />
          </AppProvider>
        </WebRTCProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

