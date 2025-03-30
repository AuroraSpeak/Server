"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function GlobalError({ error }: { error: Error }) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de" className="dark">
      <body className="min-h-screen bg-[hsl(var(--aura-bg))] flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Ups! Etwas ist schiefgelaufen</h1>
            <p className="text-[hsl(var(--aura-text-muted))]">
              Ein unerwarteter Fehler ist aufgetreten. Wir haben ihn bereits protokolliert und werden uns darum kümmern.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={() => router.refresh()}
              className="w-full bg-aura-primary hover:bg-aura-primary/90"
            >
              Seite neu laden
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-aura-muted text-white hover:bg-aura-muted"
            >
              Zur Startseite
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-aura-muted/20 rounded-lg text-left">
              <p className="text-sm text-aura-danger font-mono whitespace-pre-wrap">
                {error.message}
              </p>
              <p className="text-xs text-aura-text-muted mt-2">
                {error.stack}
              </p>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}