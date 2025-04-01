"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, Volume2, Mic, Monitor, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [username, setUsername] = useState("Benutzer")
  const [email, setEmail] = useState("benutzer@example.com")
  const [microphoneDevice, setMicrophoneDevice] = useState("default")
  const [speakerDevice, setSpeakerDevice] = useState("default")
  const [inputVolume, setInputVolume] = useState([70])
  const [outputVolume, setOutputVolume] = useState([80])
  const [noiseReduction, setNoiseReduction] = useState(true)
  const [echoReduction, setEchoReduction] = useState(true)
  const [autoGainControl, setAutoGainControl] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [startupLaunch, setStartupLaunch] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(true)

  const handleSaveSettings = () => {
    // In a real app, this would save settings to the server
    toast({
      title: "Einstellungen gespeichert",
      description: "Deine Einstellungen wurden erfolgreich aktualisiert.",
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Einstellungen</h1>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="account">Konto</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="appearance">Darstellung</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Verwalte deine Kontoinformationen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Speichern</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>Konfiguriere deine Benachrichtigungseinstellungen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Benachrichtigungen aktivieren</Label>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sicherheit</CardTitle>
              <CardDescription>Verwalte deine Sicherheitseinstellungen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Passwort ändern</Button>
              <Button variant="outline" className="ml-2">
                Zwei-Faktor-Authentifizierung
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audiogeräte</CardTitle>
              <CardDescription>Wähle deine bevorzugten Ein- und Ausgabegeräte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="microphone">Mikrofon</Label>
                <Select value={microphoneDevice} onValueChange={setMicrophoneDevice}>
                  <SelectTrigger id="microphone">
                    <SelectValue placeholder="Wähle ein Mikrofon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard-Mikrofon</SelectItem>
                    <SelectItem value="mic1">Mikrofon (USB)</SelectItem>
                    <SelectItem value="mic2">Headset-Mikrofon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="speaker">Lautsprecher</Label>
                <Select value={speakerDevice} onValueChange={setSpeakerDevice}>
                  <SelectTrigger id="speaker">
                    <SelectValue placeholder="Wähle einen Lautsprecher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard-Lautsprecher</SelectItem>
                    <SelectItem value="speaker1">Lautsprecher (USB)</SelectItem>
                    <SelectItem value="speaker2">Headset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lautstärke</CardTitle>
              <CardDescription>Passe die Ein- und Ausgabelautstärke an.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="input-volume">Eingabelautstärke</Label>
                  <span className="text-sm text-muted-foreground">{inputVolume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <Slider id="input-volume" value={inputVolume} onValueChange={setInputVolume} max={100} step={1} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="output-volume">Ausgabelautstärke</Label>
                  <span className="text-sm text-muted-foreground">{outputVolume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider id="output-volume" value={outputVolume} onValueChange={setOutputVolume} max={100} step={1} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verbesserungen</CardTitle>
              <CardDescription>Aktiviere Audiofilter für eine bessere Klangqualität.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="noise-reduction">Rauschunterdrückung</Label>
                <Switch id="noise-reduction" checked={noiseReduction} onCheckedChange={setNoiseReduction} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="echo-reduction">Echounterdrückung</Label>
                <Switch id="echo-reduction" checked={echoReduction} onCheckedChange={setEchoReduction} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-gain">Automatische Verstärkung</Label>
                <Switch id="auto-gain" checked={autoGainControl} onCheckedChange={setAutoGainControl} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thema</CardTitle>
              <CardDescription>Wähle dein bevorzugtes Erscheinungsbild.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                  <Label
                    htmlFor="theme-light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <Sun className="h-6 w-6 mb-2" />
                    <span>Hell</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                  <Label
                    htmlFor="theme-dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <Moon className="h-6 w-6 mb-2" />
                    <span>Dunkel</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                  <Label
                    htmlFor="theme-system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <Monitor className="h-6 w-6 mb-2" />
                    <span>System</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App-Einstellungen</CardTitle>
              <CardDescription>Konfiguriere das Verhalten der Anwendung.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="startup">Beim Systemstart starten</Label>
                <Switch id="startup" checked={startupLaunch} onCheckedChange={setStartupLaunch} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="minimize">In Systemtray minimieren</Label>
                <Switch id="minimize" checked={minimizeToTray} onCheckedChange={setMinimizeToTray} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

