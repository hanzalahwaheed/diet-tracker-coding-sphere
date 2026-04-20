"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { RoleTabs } from "@/components/role-tabs"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, api } from "@/lib/api"
import { setSession, type SessionRole } from "@/lib/session"

type LoginResponse = {
  token: string
  trainer?: { id: string; name: string; email: string }
  user?: { id: string; name: string; email: string; trainerId: string }
}

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<SessionRole>("user")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const path =
        role === "trainer" ? "/api/auth/trainer/login" : "/api/auth/user/login"
      const data = await api<LoginResponse>(path, {
        method: "POST",
        body: { email, password },
        auth: false,
      })

      const profile = role === "trainer" ? data.trainer! : data.user!
      setSession({
        token: data.token,
        role,
        id: profile.id,
        name: profile.name,
        email: profile.email,
        trainerId: role === "user" ? data.user?.trainerId : undefined,
      })
      router.push(role === "trainer" ? "/trainer" : "/meals")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main className="flex justify-center px-4 py-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Welcome back. Pick your role to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleTabs value={role} onChange={setRole} />
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Signing in…" : "Log in"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="underline underline-offset-2">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
