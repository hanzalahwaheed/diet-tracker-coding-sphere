"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { MealCard } from "@/components/meal-card"
import { MealForm, type MealFormValues } from "@/components/meal-form"
import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSession } from "@/hooks/use-session"
import { ApiError, api } from "@/lib/api"
import { type MealEntry } from "@/lib/meal-types"

export default function MealsPage() {
  const { session, ready } = useSession()
  const router = useRouter()

  const [meals, setMeals] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setListError(null)
    try {
      const data = await api<MealEntry[]>("/api/meals")
      setMeals(data)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Failed to load meals")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!session) {
      router.push("/login")
      return
    }
    if (session.role !== "user") {
      router.push("/trainer")
      return
    }
    refresh()
  }, [ready, session, router, refresh])

  const onCreate = async (values: MealFormValues) => {
    setCreateError(null)
    setCreating(true)
    try {
      await api("/api/meals", { method: "POST", body: values })
      await refresh()
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create meal")
    } finally {
      setCreating(false)
    }
  }

  const onUpdate = async (id: string, values: MealFormValues) => {
    await api(`/api/meals/${id}`, { method: "PATCH", body: values })
    await refresh()
  }

  const onDelete = async (id: string) => {
    await api(`/api/meals/${id}`, { method: "DELETE" })
    await refresh()
  }

  if (!ready || !session || session.role !== "user") {
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
          <h1 className="text-sm font-medium">Your meals</h1>
          <p className="text-xs text-muted-foreground">
            Log what you eat. You can edit or delete a meal only on its UTC day.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log a meal</CardTitle>
            <CardDescription>
              Add an entry for today or backfill a past day (no future dates).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MealForm
              submitLabel="Add meal"
              submitting={creating}
              error={createError}
              onSubmit={onCreate}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">History</h2>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : listError ? (
            <p className="text-xs text-destructive">{listError}</p>
          ) : meals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No meals yet. Add your first one above.
            </p>
          ) : (
            meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
