"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
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
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include", // Important to include credentials
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        console.error("Logout failed:", await response.text())
      }

      // Clear user state regardless of response
      setUser(null)

      // Force redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      // Still clear user state and redirect even if there's an error
      setUser(null)
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>
}

