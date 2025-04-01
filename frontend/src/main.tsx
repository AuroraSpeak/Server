import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { WebRTCProvider } from "./contexts/WebRTCContext";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </React.StrictMode>,
);
