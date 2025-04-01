"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface VoiceIndicatorProps {
  isSpeaking: boolean
  className?: string
}

export default function VoiceIndicator({ isSpeaking, className }: VoiceIndicatorProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (isSpeaking) {
      // Animate the bars when speaking
      barRefs.current.forEach((bar, i) => {
        if (bar) {
          bar.style.animation = `voice-bar-animation ${0.5 + i * 0.1}s ease-in-out infinite alternate`
        }
      })
    } else {
      // Stop animation when not speaking
      barRefs.current.forEach((bar) => {
        if (bar) {
          bar.style.animation = "none"
          bar.style.height = "4px"
        }
      })
    }

    // Add animation keyframes to document if they don't exist
    if (!document.getElementById("voice-indicator-keyframes")) {
      const style = document.createElement("style")
      style.id = "voice-indicator-keyframes"
      style.innerHTML = `
        @keyframes voice-bar-animation {
          0% { height: 4px; }
          100% { height: 12px; }
        }
      `
      document.head.appendChild(style)
    }
  }, [isSpeaking])

  return (
    <div className={cn("flex items-end gap-0.5 h-3", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          ref={(el) => (barRefs.current[i] = el)}
          className={cn(
            "w-0.5 h-1 rounded-full transition-all duration-100",
            isSpeaking ? "bg-green-500" : "bg-muted-foreground/50",
          )}
        />
      ))}
    </div>
  )
}

