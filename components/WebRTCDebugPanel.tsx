"use client"

import React, { useState, useEffect } from "react"
import { useWebRTC } from "@/contexts/webrtc-context"

const WebRTCDebugPanel: React.FC = () => {
  let rtc: ReturnType<typeof useWebRTC> | null = null
  try {
    rtc = useWebRTC()
  } catch (err) {
    return (
      <div style={{
        position: "fixed",
        top: 100,
        left: 100,
        background: "#300",
        color: "#faa",
        padding: 12,
        fontSize: 14,
        zIndex: 9999,
      }}>
        ⚠️ WebRTC context not available
      </div>
    )
  }

  const {
    logs,
    activeSpeakers,
    isMicrophoneActive,
    isSpeaking,
    peerConnections,
    getAudioLevel,
  } = rtc

  const [visible, setVisible] = useState(true)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [dragging, setDragging] = useState(false)
  const [rel, setRel] = useState({ x: 0, y: 0 })
  const [renderTick, setRenderTick] = useState(0)

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true)
    setRel({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    e.stopPropagation()
    e.preventDefault()
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return
    setPosition({ x: e.clientX - rel.x, y: e.clientY - rel.y })
    e.stopPropagation()
    e.preventDefault()
  }

  const onMouseUp = () => setDragging(false)

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  })

  // Force panel to re-render every second to reflect live audio levels
  useEffect(() => {
    const interval = setInterval(() => setRenderTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!visible) {
    return (
      <button
        style={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999 }}
        onClick={() => setVisible(true)}
      >
        🔍 Show Debug Panel
      </button>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: 340,
        maxHeight: 420,
        overflowY: "auto",
        background: "#111",
        color: "#0f0",
        fontSize: 12,
        padding: 12,
        borderRadius: 8,
        zIndex: 9999,
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        cursor: dragging ? "grabbing" : "default",
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          fontWeight: "bold",
          marginBottom: 8,
          cursor: "grab",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>WebRTC Debug Panel</span>
        <button
          onClick={() => setVisible(false)}
          style={{
            marginLeft: 8,
            background: "transparent",
            border: "none",
            color: "#f55",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ marginBottom: 8 }}>
        🎤 Mic: {isMicrophoneActive ? "ON" : "OFF"} | 🗣 Speaking: {isSpeaking ? "YES" : "NO"}
      </div>
      <div style={{ marginBottom: 8 }}>
        👥 Peers Connected: {peerConnections.size} <br />
        🟢 Active Speakers: {[...activeSpeakers].join(", ") || "None"}
      </div>
      <div style={{ marginBottom: 8 }}>
        🔊 Audio Levels:
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {[...peerConnections.entries()].map(([id]) => (
            <li key={id}>
              {id}: {getAudioLevel(id).toFixed(1)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>📄 Logs:</div>
        {[...logs].reverse().map((log, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap" }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WebRTCDebugPanel