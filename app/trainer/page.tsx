"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSession } from "@/hooks/use-session"
import { ApiError, api } from "@/lib/api"

type RosterUser = {
  id: string
  trainerId: string
  email: string
  name: string
  createdAt: string
}

export default function TrainerPage() {
  const { session, ready } = useSession()
  const router = useRouter()
  const [roster, setRoster] = useState<RosterUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!session) {
      router.push("/login")
      return
    }
    if (session.role !== "trainer") {
      router.push("/meals")
      return
    }

    api<RosterUser[]>("/api/trainer/users")
      .then(setRoster)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load roster")
      )
      .finally(() => setLoading(false))
  }, [ready, session, router])

  if (!ready || !session || session.role !== "trainer") {
    return (
      <div className="min-h-svh">
        <SiteHeader />
      </div>
    )
  }

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <div>
          <h1 className="text-sm font-medium">Your roster</h1>
          <p className="text-xs text-muted-foreground">
            Users who picked you as their trainer. Click a user to review their meals.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : roster.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No users yet</CardTitle>
              <CardDescription>
                Once someone signs up and selects you as their trainer, they&apos;ll
                appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {roster.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="xs" variant="outline" asChild>
                    <Link href={`/trainer/users/${user.id}`}>View meals</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
