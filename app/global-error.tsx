"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import logger from "@/lib/logging"

export default function GlobalError({ error }: { error: Error }) {
  const router = useRouter()

  useEffect(() => {
    logger.error("Global error occurred", {
      error: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: window.navigator.userAgent,
    })

    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="de" className="dark">
      <body className="min-h-screen bg-aura-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Ups! Etwas ist schiefgelaufen</h1>
            <p className="text-aura-text-muted">
              Ein unerwarteter Fehler ist aufgetreten. Wir haben ihn bereits protokolliert und werden uns darum kümmern.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => {
                logger.info("User attempting to refresh page after error")
                router.refresh()
              }}
              className="w-full bg-aura-primary hover:bg-aura-primary/90"
            >
              Seite neu laden
            </Button>
            <Button
              onClick={() => {
                logger.info("User navigating to home page after error")
                router.push("/")
              }}
              variant="outline"
              className="w-full border-aura-muted text-white hover:bg-aura-muted"
            >
              Zur Startseite
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-aura-muted/20 rounded-lg text-left">
              <p className="text-sm text-aura-danger font-mono whitespace-pre-wrap">{error.message}</p>
              <p className="text-xs text-aura-text-muted mt-2">{error.stack}</p>
            </div>
          )}
        </div>
      </body>
    </html>
  )
}

