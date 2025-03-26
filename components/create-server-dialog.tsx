"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from "@/contexts/app-context"
import { Check, Loader2 } from "lucide-react"

interface CreateServerDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateServerDialog({ isOpen, onClose }: CreateServerDialogProps) {
  const [serverName, setServerName] = useState("")
  const [serverIcon, setServerIcon] = useState("")
  const [serverType, setServerType] = useState("gaming")
  const [step, setStep] = useState<"type" | "details" | "channels">("type")
  const [isCreating, setIsCreating] = useState(false)
  const [iconColor, setIconColor] = useState("purple")

  // Get the context to add the server
  const { createServer } = useAppContext()

  const handleNext = () => {
    if (step === "type") {
      setStep("details")
    } else if (step === "details") {
      setStep("channels")
    }
  }

  const handleBack = () => {
    if (step === "channels") {
      setStep("details")
    } else if (step === "details") {
      setStep("type")
    }
  }

  const handleCreateServer = async () => {
    if (!serverName.trim()) return

    setIsCreating(true)

    try {
      // Call the createServer function from the context
      await createServer({
        name: serverName,
        icon: serverIcon || serverName.charAt(0).toUpperCase(),
        color: iconColor,
        type: serverType,
      })

      // Close the dialog and reset form
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error creating server:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setServerName("")
    setServerIcon("")
    setServerType("gaming")
    setStep("type")
    setIconColor("purple")
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const colorOptions = [
    { value: "purple", label: "Purple", class: "bg-[hsl(264,73%,65%)]" },
    { value: "blue", label: "Blue", class: "bg-[hsl(210,100%,60%)]" },
    { value: "green", label: "Green", class: "bg-[hsl(150,70%,55%)]" },
    { value: "orange", label: "Orange", class: "bg-[hsl(30,100%,60%)]" },
    { value: "pink", label: "Pink", class: "bg-[hsl(330,85%,65%)]" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--aura-channels))] border-[hsla(var(--aura-primary),0.2)]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === "type" && "Create a Server"}
            {step === "details" && "Customize Your Server"}
            {step === "channels" && "Set Up Channels"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "type" && "Your server is where you and your friends hang out. Make it yours!"}
            {step === "details" && "Give your server a personality with a name and an icon."}
            {step === "channels" && "Set up some initial channels for your server."}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && (
          <div className="space-y-4 py-4">
            <Tabs defaultValue="gaming" value={serverType} onValueChange={setServerType}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="gaming">Gaming</TabsTrigger>
                <TabsTrigger value="study">Study</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
              </TabsList>

              <TabsContent value="gaming" className="mt-4">
                <div className="bg-[hsla(var(--aura-bg),0.5)] p-4 rounded-md">
                  <h3 className="font-medium mb-2">Gaming Server</h3>
                  <p className="text-sm text-[hsl(var(--aura-text-muted))]">
                    Perfect for organizing game nights, finding teammates, and discussing your favorite games.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="study" className="mt-4">
                <div className="bg-[hsla(var(--aura-bg),0.5)] p-4 rounded-md">
                  <h3 className="font-medium mb-2">Study Group</h3>
                  <p className="text-sm text-[hsl(var(--aura-text-muted))]">
                    Ideal for study sessions, sharing resources, and collaborating on projects.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="friends" className="mt-4">
                <div className="bg-[hsla(var(--aura-bg),0.5)] p-4 rounded-md">
                  <h3 className="font-medium mb-2">Friends & Community</h3>
                  <p className="text-sm text-[hsl(var(--aura-text-muted))]">
                    A place to hang out with friends, share memes, and stay connected.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                placeholder={
                  serverType === "gaming"
                    ? "Awesome Gaming Squad"
                    : serverType === "study"
                      ? "Study Group 101"
                      : "Friend Zone"
                }
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
                className={`w-24 h-24 rounded-full ${colorOptions.find((c) => c.value === iconColor)?.class} flex items-center justify-center text-white text-4xl font-bold`}
              >
                {serverIcon || (serverName ? serverName.charAt(0).toUpperCase() : "A")}
              </div>
            </div>
          </div>
        )}

        {step === "channels" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Default Channels</Label>
              <div className="bg-[hsla(var(--aura-bg),0.5)] p-4 rounded-md space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="general" className="mr-2" defaultChecked disabled />
                  <Label htmlFor="general" className="cursor-pointer">
                    general
                  </Label>
                  <span className="ml-2 text-xs text-[hsl(var(--aura-text-muted))]">(required)</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="announcements" className="mr-2" defaultChecked disabled />
                  <Label htmlFor="announcements" className="cursor-pointer">
                    announcements
                  </Label>
                  <span className="ml-2 text-xs text-[hsl(var(--aura-text-muted))]">(required)</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="voice-chat" className="mr-2" defaultChecked disabled />
                  <Label htmlFor="voice-chat" className="cursor-pointer">
                    General Voice
                  </Label>
                  <span className="ml-2 text-xs text-[hsl(var(--aura-text-muted))]">(required)</span>
                </div>

                {serverType === "gaming" && (
                  <>
                    <div className="flex items-center">
                      <input type="checkbox" id="looking-for-game" className="mr-2" defaultChecked />
                      <Label htmlFor="looking-for-game" className="cursor-pointer">
                        looking-for-game
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="game-chat" className="mr-2" defaultChecked />
                      <Label htmlFor="game-chat" className="cursor-pointer">
                        Game Voice
                      </Label>
                    </div>
                  </>
                )}

                {serverType === "study" && (
                  <>
                    <div className="flex items-center">
                      <input type="checkbox" id="resources" className="mr-2" defaultChecked />
                      <Label htmlFor="resources" className="cursor-pointer">
                        resources
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="study-session" className="mr-2" defaultChecked />
                      <Label htmlFor="study-session" className="cursor-pointer">
                        Study Session
                      </Label>
                    </div>
                  </>
                )}

                {serverType === "friends" && (
                  <>
                    <div className="flex items-center">
                      <input type="checkbox" id="memes" className="mr-2" defaultChecked />
                      <Label htmlFor="memes" className="cursor-pointer">
                        memes
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="hangout" className="mr-2" defaultChecked />
                      <Label htmlFor="hangout" className="cursor-pointer">
                        Hangout
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          {step !== "type" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="border-[hsla(var(--aura-primary),0.2)] hover:bg-[hsla(var(--aura-primary),0.1)] hover:text-[hsl(var(--aura-primary))]"
            >
              Back
            </Button>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-[hsla(var(--aura-primary),0.2)] hover:bg-[hsla(var(--aura-primary),0.1)] hover:text-[hsl(var(--aura-primary))]"
            >
              Cancel
            </Button>

            {step === "channels" ? (
              <Button
                type="button"
                onClick={handleCreateServer}
                className="bg-[hsl(var(--aura-primary))] hover:bg-[hsla(var(--aura-primary),0.9)] ml-auto sm:ml-0"
                disabled={isCreating || !serverName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Server"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[hsl(var(--aura-primary))] hover:bg-[hsla(var(--aura-primary),0.9)] ml-auto sm:ml-0"
                disabled={step === "details" && !serverName.trim()}
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

