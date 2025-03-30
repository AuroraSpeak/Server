"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AuraLogo from "@/components/aura-logo"
import Link from "next/link"
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react"

interface InvitationData {
  status: string
  email: string
  invitedBy: string
  expiresAt: string
  serverName: string
  serverId: string
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const { token } = params
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptStatus, setAcceptStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`)

        if (!response.ok) {
          throw new Error("Failed to fetch invitation")
        }

        const data = await response.json()
        setInvitation(data)
      } catch (error) {
        console.error("Error fetching invitation:", error)
        setError("The invitation is invalid or has expired.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchInvitation()
    }
  }, [token])

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?returnUrl=/invite/${token}`)
      return
    }

    setAcceptStatus("loading")

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to accept invitation")
      }

      setAcceptStatus("success")

      // Redirect to the server after a short delay
      setTimeout(() => {
        router.push(`/servers/${invitation?.serverId || ""}`)
      }, 2000)
    } catch (error) {
      console.error("Error accepting invitation:", error)
      setAcceptStatus("error")
      setError("Failed to accept the invitation. Please try again.")
    }
  }

  // Show loading state while checking auth and fetching invitation
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-aura-bg">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <AuraLogo size={48} className="mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">AuraSpeak</h1>
              <p className="text-sm text-[hsl(190,80%,50%)]">Connect through sound</p>
            </div>
          </div>

          <Card className="border-aura-primary/10 bg-aura-channels">
            <CardHeader>
              <CardTitle className="text-center">
                <Skeleton className="h-8 w-3/4 mx-auto" />
              </CardTitle>
              <CardDescription className="text-center">
                <Skeleton className="h-4 w-full mt-2" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-aura-bg">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <AuraLogo size={48} className="mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">AuraSpeak</h1>
              <p className="text-sm text-[hsl(190,80%,50%)]">Connect through sound</p>
            </div>
          </div>

          <Card className="border-aura-primary/10 bg-aura-channels">
            <CardHeader>
              <CardTitle className="text-center text-white">Invalid Invitation</CardTitle>
              <CardDescription className="text-center text-aura-text-muted">
                We couldn't find the invitation you're looking for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="bg-aura-danger/10 text-aura-danger border-aura-danger/30">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "The invitation link is invalid or has expired."}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="bg-aura-primary hover:bg-aura-primary/90">
                <Link href="/">Go to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Show expired invitation
  if (invitation.status === "expired") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-aura-bg">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <AuraLogo size={48} className="mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">AuraSpeak</h1>
              <p className="text-sm text-[hsl(190,80%,50%)]">Connect through sound</p>
            </div>
          </div>

          <Card className="border-aura-primary/10 bg-aura-channels">
            <CardHeader>
              <CardTitle className="text-center text-white">Expired Invitation</CardTitle>
              <CardDescription className="text-center text-aura-text-muted">
                This invitation has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-aura-warning/10 text-aura-warning border-aura-warning/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Expired</AlertTitle>
                <AlertDescription>
                  The invitation to join this server has expired. Please request a new invitation.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="bg-aura-primary hover:bg-aura-primary/90">
                <Link href="/">Go to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Show already accepted invitation
  if (invitation.status === "accepted") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-aura-bg">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <AuraLogo size={48} className="mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">AuraSpeak</h1>
              <p className="text-sm text-[hsl(190,80%,50%)]">Connect through sound</p>
            </div>
          </div>

          <Card className="border-aura-primary/10 bg-aura-channels">
            <CardHeader>
              <CardTitle className="text-center text-white">Invitation Already Accepted</CardTitle>
              <CardDescription className="text-center text-aura-text-muted">
                You've already joined this server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-aura-success/10 text-aura-success border-aura-success/30">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Already Joined</AlertTitle>
                <AlertDescription>You've already accepted this invitation and joined the server.</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="bg-aura-primary hover:bg-aura-primary/90">
                <Link href={`/servers/${invitation.serverId}`}>
                  Go to Server <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Show valid invitation
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-aura-bg">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <AuraLogo size={48} className="mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-white">AuraSpeak</h1>
            <p className="text-sm text-[hsl(190,80%,50%)]">Connect through sound</p>
          </div>
        </div>

        <Card className="border-aura-primary/10 bg-aura-channels">
          <CardHeader>
            <CardTitle className="text-center text-white">You've Been Invited</CardTitle>
            <CardDescription className="text-center text-aura-text-muted">
              {invitation.invitedBy} has invited you to join their server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 bg-aura-bg/50 rounded-lg border border-aura-primary/10">
              <div className="w-16 h-16 rounded-full bg-aura-primary/20 flex items-center justify-center mb-4 text-2xl font-bold text-white">
                {invitation.serverName?.charAt(0) || "S"}
              </div>
              <h3 className="text-xl font-bold text-white">{invitation.serverName || "Server"}</h3>
              <p className="text-sm text-aura-text-muted mt-1">
                {user ? "Click the button below to join" : "Sign in to join this server"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            {acceptStatus === "success" ? (
              <Button disabled className="bg-aura-success text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Joined Successfully
              </Button>
            ) : acceptStatus === "error" ? (
              <div className="space-y-2 w-full">
                <Alert variant="destructive" className="bg-aura-danger/10 text-aura-danger border-aura-danger/30">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={handleAcceptInvitation} className="w-full bg-aura-primary hover:bg-aura-primary/90">
                  Try Again
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAcceptInvitation}
                disabled={acceptStatus === "loading"}
                className="bg-aura-primary hover:bg-aura-primary/90"
              >
                {acceptStatus === "loading" ? "Joining..." : user ? "Accept Invitation" : "Sign in to Join"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

