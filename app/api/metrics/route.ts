import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { register, Counter, Histogram } from 'prom-client'

// Erstelle einen Counter für HTTP-Anfragen
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
})

// Erstelle einen Counter für aktive Benutzer
const activeUsers = new Counter({
  name: 'active_users_total',
  help: 'Total number of active users',
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    const totalUsers = await prisma.user.count()
    const totalProfiles = await prisma.profile.count()

    // Aktualisiere die Metriken
    activeUsers.inc(1)

    const metrics = [
      "# HELP auraspeak_user_count Total number of users",
      "# TYPE auraspeak_user_count gauge",
      `auraspeak_user_count ${totalUsers}`,
      "",
      "# HELP auraspeak_profile_count Total number of profiles",
      "# TYPE auraspeak_profile_count gauge",
      `auraspeak_profile_count ${totalProfiles}`,
      "",
      "# HELP auraspeak_current_user_status Current user status",
      "# TYPE auraspeak_current_user_status gauge",
      `auraspeak_current_user_status{logged_in="${user ? "true" : "false"}"} ${user ? 1 : 0}`,
    ].join("\n")

    return new NextResponse(metrics, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Error generating metrics:", error)
    return new NextResponse("Error generating metrics", { status: 500 })
  }
} 