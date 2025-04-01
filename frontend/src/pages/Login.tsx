"use client"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authService } from "@/services/auth"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authService.login(data)
      await login(response.token)
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      })
      navigate("/")
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Bitte überprüfen Sie Ihre Anmeldedaten.",
        variant: "destructive",
      })
      console.error("Login fehlgeschlagen:", error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Willkommen zurück</h1>
          <p className="text-muted-foreground">Melde dich an, um mit deinen Freunden zu sprechen</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input placeholder="max@beispiel.de" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Anmelden
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          Noch kein Konto?{" "}
          <Link to="/register" className="underline">
            Registrieren
          </Link>
        </div>
      </div>
    </div>
  )
}

