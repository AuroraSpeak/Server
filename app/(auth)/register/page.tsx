"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AuraLogo from "@/components/aura-logo"
import { useCsrfToken } from "@/hooks/useCsrfToken"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { csrfToken, loading, csrfError} = useCsrfToken()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create account")
        setIsLoading(false)
        return
      }

      // Redirect to login page with success message
      router.push("/login?registered=true")
    } catch (err) {
      console.error("Registration error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
    if (loading) return <p>Loading CSRF token...</p>
    if (csrfError) return <p>Error loading CSRF: {csrfError}</p>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[hsl(230,15%,10%)] text-white">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <AuraLogo size={48} className="mr-3" />
          <div>
            <h1 className="text-3xl font-bold">AuraSpeak</h1>
            <p className="text-sm text-[hsl(190,80%,50%)]">Connect through sound</p>
          </div>
        </div>

        <Card className="border-[hsl(230,15%,15%)] bg-[hsl(230,15%,12%)] text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center">Create Account</CardTitle>
            <CardDescription className="text-[hsl(214,10%,70%)]">Join the ultimate voice community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-[hsl(0,80%,60%)]/20 text-[hsl(0,80%,60%)] border-[hsl(0,80%,60%)]/30"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">
                  Username
                </Label>
                <Input
                  id="fullName"
                  placeholder="YourUsername"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-[hsl(230,15%,15%)] border-[hsl(230,15%,18%)] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[hsl(230,15%,15%)] border-[hsl(230,15%,18%)] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[hsl(230,15%,15%)] border-[hsl(230,15%,18%)] text-white"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(214,10%,70%)]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-[hsl(214,10%,70%)]">Must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[hsl(230,15%,15%)] border-[hsl(230,15%,18%)] text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[hsl(262,70%,60%)] hover:bg-[hsl(262,70%,55%)] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t border-[hsl(230,15%,15%)] pt-4">
            <div className="text-center w-full text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[hsl(262,70%,60%)] hover:text-[hsl(262,70%,70%)] font-medium">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

