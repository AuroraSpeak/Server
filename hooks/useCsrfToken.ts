import { useEffect, useState } from "react"

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const csrfError = error
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch("/api/csrf-token", {
          credentials: "include", // to include cookies
        })

        if (!res.ok) {
          throw new Error("Failed to fetch CSRF token")
        }

        const data = await res.json()
        setCsrfToken(data.csrfToken)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [])

  return { csrfToken, loading, csrfError }
}
