"use client"
import { createContext, useContext } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
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
  const { theme, setTheme } = useNextTheme()
  return { theme, setTheme }
}

