"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { MealCard } from "@/components/meal-card"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "@/hooks/use-session"
import { ApiError, api } from "@/lib/api"
import { type MealEntry } from "@/lib/meal-types"

type RosterUser = {
  id: string
  email: string
  name: string
}

export default function TrainerUserMealsPage() {
  const { session, ready } = useSession()
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [user, setUser] = useState<RosterUser | null>(null)
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

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
  }, [ready, session, router])

  useEffect(() => {
    if (!session || session.role !== "trainer") return

    setLoading(true)
    setError(null)

    Promise.all([
      api<RosterUser[]>("/api/trainer/users").then(
        (roster) => roster.find((u) => u.id === userId) ?? null
      ),
      api<MealEntry[]>("/api/meals", {
        query: { userId, from: from || undefined, to: to || undefined },
      }),
    ])
      .then(([u, m]) => {
        setUser(u)
        setMeals(m)
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false))
  }, [session, userId, from, to])

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium">
              {user?.name ?? "User"}&apos;s meals
            </h1>
            {user ? (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            ) : null}
          </div>
          <Button size="xs" variant="ghost" asChild>
            <Link href="/trainer">← Back to roster</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {(from || to) && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setFrom("")
                setTo("")
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : meals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No meals recorded for this range.
            </p>
          ) : (
            meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} editable={false} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
