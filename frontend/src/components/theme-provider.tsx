"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { createContext, useContext } from "react";

interface ThemeContextProps {
  theme?: "light" | "dark" | "system";
  setTheme?: (theme: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextProps>({});

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export const useTheme = () => {
  return useContext(ThemeContext);
};
