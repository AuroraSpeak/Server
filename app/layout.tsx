import type React from "react"
import type { Metadata } from "next"
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-[hsl(var(--aura-bg))] antialiased`}>
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