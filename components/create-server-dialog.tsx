"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppContext } from "@/contexts/app-context"
import { Check, Loader2 } from "lucide-react"
import { useCsrfToken } from "@/hooks/useCsrfToken"

interface CreateServerDialogProps {
  isOpen: boolean
  onClose: () => void
}

const colorOptions = [
  { value: "purple", label: "Purple", class: "bg-[hsl(264,73%,65%)]" },
  { value: "blue", label: "Blue", class: "bg-[hsl(210,100%,60%)]" },
  { value: "green", label: "Green", class: "bg-[hsl(150,70%,55%)]" },
  { value: "orange", label: "Orange", class: "bg-[hsl(30,100%,60%)]" },
  { value: "pink", label: "Pink", class: "bg-[hsl(330,85%,65%)]" },
]

export default function CreateServerDialog({ isOpen, onClose }: CreateServerDialogProps) {
  const [serverName, setServerName] = useState("")
  const [iconColor, setIconColor] = useState("purple")
  const [isCreating, setIsCreating] = useState(false)

  const { createServer } = useAppContext()
  const{ csrfToken } = useCsrfToken()

  const handleCreate = async () => {
    if (!serverName.trim()) return
    setIsCreating(true)

    try {
      await createServer({
        name: serverName,
        icon: serverName.charAt(0).toUpperCase(),
        color: iconColor,
        csrfToken: csrfToken,
      })

      onClose()
      resetForm()
    } catch (err) {
      console.error("Failed to create server:", err)
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setServerName("")
    setIconColor("purple")
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--aura-channels))] border-[hsla(var(--aura-primary),0.2)]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Create a Server</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input
              id="server-name"
              placeholder="My Awesome Server"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="bg-[hsl(var(--aura-bg))] border-[hsla(var(--aura-primary),0.2)]"
            />
          </div>

          <div className="space-y-2">
            <Label>Server Icon Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  className={`w-full aspect-square rounded-md flex items-center justify-center ${color.class} transition-all ${
                    iconColor === color.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[hsl(var(--aura-bg))]"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setIconColor(color.value)}
                  title={color.label}
                >
                  {iconColor === color.value && <Check className="text-white" size={20} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center mt-6">
            <div
              className={`w-24 h-24 rounded-full ${
                colorOptions.find((c) => c.value === iconColor)?.class
              } flex items-center justify-center text-white text-4xl font-bold`}
            >
              {serverName ? serverName.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-[hsl(var(--aura-primary))] hover:bg-[hsla(var(--aura-primary),0.9)]"
            disabled={isCreating || !serverName.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
