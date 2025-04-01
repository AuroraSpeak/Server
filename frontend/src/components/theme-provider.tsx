"use client"
import { createContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

interface ThemeContextProps {
  theme?: "light" | "dark" | "system"
  setTheme?: (theme: "light" | "dark" | "system") => void
}

const ThemeContext = createContext<ThemeContextProps>({})

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark")

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)

    // Apply theme class to html element
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }

    // Store theme preference
    localStorage.setItem("aura-theme", newTheme)
  }

  useEffect(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem("aura-theme") as "light" | "dark" | undefined
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.add(savedTheme)
      if (savedTheme === "light") {
        document.documentElement.classList.remove("dark")
      }
    } else {
      // Default to dark theme
      document.documentElement.classList.add("dark")
    }
  }, [])

  return {
    theme,
    setTheme: toggleTheme,
  }
}

