import { useEffect, useState } from 'react'

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const csrfError = error

  useEffect(() => {
    let cancelled = false

    const fetchToken = async () => {
      try {
        const res = await fetch('/api/csrf-token', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error(`CSRF fetch failed: ${res.status}`)
        }

        const data = await res.json()
        if (!cancelled) {
          setCsrfToken(data.csrfToken ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchToken()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    csrfToken,
    loading,
    csrfError,
    isReady: !loading && csrfToken !== null,
  }
}
