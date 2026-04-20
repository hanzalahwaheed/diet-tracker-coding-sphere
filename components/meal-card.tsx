"use client"

import { useState } from "react"

import { MealForm, type MealFormValues } from "@/components/meal-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isSameUtcDay, type MealEntry } from "@/lib/meal-types"

type Props = {
  meal: MealEntry
  /** When false, hides edit/delete buttons (trainer review). */
  editable?: boolean
  onUpdate?: (id: string, values: MealFormValues) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function MealCard({ meal, editable = true, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const sameDay = isSameUtcDay(meal.mealDate)

  const handleUpdate = async (values: MealFormValues) => {
    if (!onUpdate) return
    setError(null)
    setBusy(true)
    try {
      await onUpdate(meal.id, values)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setError(null)
    setBusy(true)
    try {
      await onDelete(meal.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="capitalize">{meal.mealType}</CardTitle>
            <p className="text-xs text-muted-foreground">{meal.mealDate}</p>
          </div>
          {editable && !editing ? (
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="outline"
                disabled={!sameDay || busy}
                title={sameDay ? "Edit meal" : "Editing closed after the meal day"}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                disabled={!sameDay || busy}
                title={sameDay ? "Delete meal" : "Deleting closed after the meal day"}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <MealForm
            initial={meal}
            submitLabel="Save changes"
            submitting={busy}
            error={error}
            lockDate
            onSubmit={handleUpdate}
            onCancel={() => {
              setError(null)
              setEditing(false)
            }}
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {meal.items.map((item, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium">{item.name}</span>
                {item.quantity != null ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </span>
                ) : null}
                {item.notes ? (
                  <span className="text-muted-foreground"> — {item.notes}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {error && !editing ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
