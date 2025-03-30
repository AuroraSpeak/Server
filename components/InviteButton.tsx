import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function InviteButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const params = useParams()
  const serverId = params?.serverId as string | undefined
  const { user } = useAuth()

  // Wenn kein Server ausgewählt ist oder es der Home-Server des Users ist, zeige den Button nicht
  if (!serverId || user?.homeServerId === serverId) {
    return null
  }

  const handleInvite = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          serverId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invitation')
      }

      toast.success('Einladung wurde erfolgreich versendet!')
      setOpen(false)
      setEmail("")
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Fehler beim Versenden der Einladung')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="16" y1="11" x2="22" y2="11" />
          </svg>
          Einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neue Einladung erstellen</DialogTitle>
          <DialogDescription>
            Geben Sie die E-Mail-Adresse der Person ein, die Sie einladen möchten.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-Mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="max.mustermann@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleInvite}
            disabled={!email || isLoading}
          >
            {isLoading ? "Wird gesendet..." : "Einladung senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 