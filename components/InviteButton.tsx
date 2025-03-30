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
import { UserPlus } from "lucide-react"

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
        <Button 
          variant="outline" 
          size="sm"
          className="text-[hsl(var(--aura-success))] border-[hsla(var(--aura-success),0.3)] hover:bg-[hsla(var(--aura-success),0.1)]"
        >
          <UserPlus size={14} className="mr-1" />
          Einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--aura-channels))] border-[hsla(var(--aura-primary),0.2)]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--aura-text-normal))]">Neue Einladung erstellen</DialogTitle>
          <DialogDescription className="text-[hsl(var(--aura-text-muted))]">
            Geben Sie die E-Mail-Adresse der Person ein, die Sie einladen möchten.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right text-[hsl(var(--aura-text-normal))]">
              E-Mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 bg-[hsl(var(--aura-bg))] border-[hsla(var(--aura-primary),0.2)] text-[hsl(var(--aura-text-normal))]"
              placeholder="max.mustermann@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleInvite}
            disabled={!email || isLoading}
            className="bg-[hsl(var(--aura-primary))] hover:bg-[hsla(var(--aura-primary),0.9)]"
          >
            {isLoading ? "Wird gesendet..." : "Einladung senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 