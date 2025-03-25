import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/components/auth-provider"
import * as Sentry from '@sentry/nextjs';

import './globals.css'
import WebRTCDebugPanel from "@/components/webrtc-debug-panel"
import { WebRTCProvider } from "@/contexts/webrtc-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AuraSpeak - Connect Through Sound",
  description: "The ultimate voice communication platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} h-full bg-[hsl(230,15%,10%)]`}>
        <AuthProvider>
          <WebRTCProvider>
          {children}
          <WebRTCDebugPanel />
          </WebRTCProvider> 
        </AuthProvider>
      </body>
    </html>
  )
}