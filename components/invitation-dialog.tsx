"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Copy, Mail, MoreHorizontal, Loader2, UserPlus, RefreshCw, Trash2, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useCsrfToken } from "@/hooks/useCsrfToken"

interface InvitationDialogProps {
  serverId: string
  trigger?: React.ReactNode
}

interface Invitation {
  id: string
  email: string
  token: string
  status: "pending" | "accepted" | "expired"
  createdAt: string
  expiresAt: string
  invitedById: string
  invitedBy: {
    fullName: string
  }
}

export function InvitationDialog({ serverId, trigger }: InvitationDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { csrfToken } = useCsrfToken()
  const router = useRouter()

  const fetchInvitations = async () => {
    if (!serverId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitations?serverId=${serverId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch invitations")
      }

      const data = await response.json()
      setInvitations(data)
    } catch (error) {
      console.error("Error fetching invitations:", error)
      setError("Failed to load invitations. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchInvitations()
    }
  }, [open, serverId])

  const handleCreateInvitation = async () => {
    if (!email.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        body: JSON.stringify({
          email,
          serverId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create invitation")
      }

      // Reset form and refresh invitations
      setEmail("")
      toast.success("Invitation sent successfully!")
      fetchInvitations()
    } catch (error) {
      console.error("Error creating invitation:", error)
      setError("Failed to send invitation. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(inviteLink)
    toast.success("Invite link copied to clipboard!")
  }

  const handleDeleteInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrfToken || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete invitation")
      }

      toast.success("Invitation deleted successfully!")
      fetchInvitations()
    } catch (error) {
      console.error("Error deleting invitation:", error)
      toast.error("Failed to delete invitation")
    }
  }

  const handleResendInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/invitations/${id}/resend`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to resend invitation")
      }

      toast.success("Invitation resent successfully!")
      fetchInvitations()
    } catch (error) {
      console.error("Error resending invitation:", error)
      toast.error("Failed to resend invitation")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Pending
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Accepted
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Expired
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="text-aura-success border-aura-success/30 hover:bg-aura-success/10"
          >
            <UserPlus size={14} className="mr-1" />
            Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-aura-channels border-aura-primary/20">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Invitations</DialogTitle>
          <DialogDescription className="text-aura-text-muted">
            Invite new members to your server or manage existing invitations.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-aura-bg">
            <TabsTrigger value="create">Create Invitation</TabsTrigger>
            <TabsTrigger value="manage">Manage Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <Card className="bg-aura-bg border-aura-primary/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Invite New Member</CardTitle>
                <CardDescription className="text-aura-text-muted">
                  Send an invitation email or copy an invite link to share.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert
                    variant="destructive"
                    className="mb-4 bg-aura-danger/10 text-aura-danger border-aura-danger/30"
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email Address
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="friend@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-aura-muted border-aura-primary/20 text-white"
                      />
                      <Button
                        onClick={handleCreateInvitation}
                        disabled={isCreating || !email.trim()}
                        className="bg-aura-primary hover:bg-aura-primary/90 whitespace-nowrap"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invite
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            <Card className="bg-aura-bg border-aura-primary/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg">Manage Invitations</CardTitle>
                  <CardDescription className="text-aura-text-muted">
                    View, copy, or revoke existing invitations.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchInvitations}
                  disabled={isLoading}
                  className="border-aura-primary/20 text-white hover:bg-aura-primary/10"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert
                    variant="destructive"
                    className="mb-4 bg-aura-danger/10 text-aura-danger border-aura-danger/30"
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-aura-primary" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8 text-aura-text-muted">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No invitations found</p>
                    <p className="text-sm mt-1">Create a new invitation to get started.</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-aura-primary/10 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-aura-muted/20">
                        <TableRow className="hover:bg-transparent border-aura-primary/10">
                          <TableHead className="text-aura-text-muted">Email</TableHead>
                          <TableHead className="text-aura-text-muted">Status</TableHead>
                          <TableHead className="text-aura-text-muted">Created</TableHead>
                          <TableHead className="text-aura-text-muted">Expires</TableHead>
                          <TableHead className="text-aura-text-muted w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((invitation) => (
                          <TableRow key={invitation.id} className="hover:bg-aura-primary/5 border-aura-primary/10">
                            <TableCell className="text-white">{invitation.email}</TableCell>
                            <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                            <TableCell className="text-aura-text-muted">{formatDate(invitation.createdAt)}</TableCell>
                            <TableCell className="text-aura-text-muted">
                              <div className="flex items-center">
                                {isExpired(invitation.expiresAt) ? (
                                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                )}
                                {formatDate(invitation.expiresAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-aura-text-muted hover:text-white"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-aura-bg border-aura-primary/20">
                                  <DropdownMenuItem
                                    onClick={() => handleCopyInviteLink(invitation.token)}
                                    className="text-white hover:bg-aura-primary/10 cursor-pointer"
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvitation(invitation.id)}
                                    disabled={invitation.status === "accepted"}
                                    className="text-white hover:bg-aura-primary/10 cursor-pointer"
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Resend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteInvitation(invitation.id)}
                                    className="text-red-500 hover:bg-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-aura-primary/20 text-white hover:bg-aura-primary/10"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

