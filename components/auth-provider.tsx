"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCsrfToken } from "@/hooks/useCsrfToken"
import logger from "@/lib/logging"

type User = {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  homeServerId?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { csrfToken } = useCsrfToken()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        logger.debug('Fetching user session');
        const response = await fetch("/api/auth/me", {
          credentials: "include", // Important to include credentials
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          logger.info('User session retrieved successfully', { 
            userId: data.user.id,
            email: data.user.email 
          });
        } else {
          setUser(null)
          logger.warn('No valid user session found');
        }
      } catch (error) {
        logger.error('Error fetching user session', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const logout = async () => {
    try {
      logger.info('Initiating logout process');
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRF-Token": csrfToken || "", // include token!
        }
      })

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Logout request failed', { 
          status: response.status,
          error: errorText
        });
      } else {
        logger.info('Logout request successful');
      }

      // Clear user state regardless of response
      setUser(null)

      // Force redirect to login page
      router.push("/login")
      logger.info('User redirected to login page');
    } catch (error) {
      logger.error('Error during logout process', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Still clear user state and redirect even if there's an error
      setUser(null)
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>
}

