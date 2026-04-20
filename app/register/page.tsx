"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
import { Select } from "@/components/ui/select"
import { ApiError, api } from "@/lib/api"
import { setSession, type SessionRole } from "@/lib/session"

type RegisterResponse = {
  token: string
  trainer?: { id: string; name: string; email: string }
  user?: { id: string; name: string; email: string; trainerId: string }
}

type TrainerOption = { id: string; name: string }

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<SessionRole>("user")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [trainerId, setTrainerId] = useState("")
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [trainersLoading, setTrainersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (role !== "user") return
    setTrainersLoading(true)
    api<TrainerOption[]>("/api/trainers", { auth: false })
      .then((data) => {
        setTrainers(data)
        if (data.length > 0 && !trainerId) setTrainerId(data[0].id)
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load trainers")
      )
      .finally(() => setTrainersLoading(false))
  }, [role, trainerId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (role === "user" && !trainerId) {
      setError("Pick a trainer to continue")
      return
    }

    setSubmitting(true)
    try {
      const path =
        role === "trainer"
          ? "/api/auth/trainer/register"
          : "/api/auth/user/register"
      const body =
        role === "trainer"
          ? { email, password, name }
          : { email, password, name, trainerId }

      const data = await api<RegisterResponse>(path, {
        method: "POST",
        body,
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
      setError(err instanceof ApiError ? err.message : "Sign up failed")
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
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              {role === "user"
                ? "Sign up and pick the trainer who'll review your meals."
                : "Sign up so users can pick you as their trainer."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoleTabs value={role} onChange={setRole} />
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">
                  At least 8 characters.
                </span>
              </div>
              {role === "user" ? (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="trainer">Trainer</Label>
                  <Select
                    id="trainer"
                    required
                    value={trainerId}
                    onChange={(e) => setTrainerId(e.target.value)}
                    disabled={trainersLoading || trainers.length === 0}
                  >
                    {trainers.length === 0 ? (
                      <option value="">
                        {trainersLoading
                          ? "Loading trainers…"
                          : "No trainers yet — ask one to sign up first"}
                      </option>
                    ) : (
                      trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
              ) : null}
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create account"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-2">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
