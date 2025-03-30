import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/components/auth-provider"
import * as Sentry from '@sentry/nextjs';
import { WebRTCProvider } from "@/contexts/webrtc-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: "AuraSpeak - Connect Through Sound",
    template: "%s | AuraSpeak"
  },
  description: "Eine moderne Kommunikationsplattform für Gaming und Community",
  keywords: ["Gaming", "Voice Chat", "Community", "Kommunikation"],
  authors: [{ name: "AuraSpeak Team" }],
  creator: "AuraSpeak",
  publisher: "AuraSpeak",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://auraspeak.com',
    siteName: 'AuraSpeak',
    title: 'AuraSpeak - Connect Through Sound',
    description: 'Eine moderne Kommunikationsplattform für Gaming und Community',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuraSpeak - Connect Through Sound',
    description: 'Eine moderne Kommunikationsplattform für Gaming und Community',
    creator: '@auraspeak',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="h-full bg-aura-bg antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <WebRTCProvider>
              {children}
            </WebRTCProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}