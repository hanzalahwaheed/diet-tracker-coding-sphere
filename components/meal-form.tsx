"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  MEAL_TYPES,
  type MealEntry,
  type MealItem,
  type MealType,
  todayUtc,
} from "@/lib/meal-types"

export type MealFormValues = {
  mealDate: string
  mealType: MealType
  items: MealItem[]
}

type Props = {
  initial?: MealEntry
  submitLabel: string
  submitting?: boolean
  error?: string | null
  onSubmit: (values: MealFormValues) => void
  onCancel?: () => void
  /** When editing, the date is fixed and date input is disabled. */
  lockDate?: boolean
}

const emptyItem = (): MealItem => ({ name: "" })

export function MealForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
  lockDate,
}: Props) {
  const [mealDate, setMealDate] = useState(initial?.mealDate ?? todayUtc())
  const [mealType, setMealType] = useState<MealType>(
    initial?.mealType ?? "breakfast"
  )
  const [items, setItems] = useState<MealItem[]>(
    initial?.items?.length ? initial.items : [emptyItem()]
  )

  const updateItem = (index: number, patch: Partial<MealItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = items
      .map((item) => ({
        name: item.name.trim(),
        quantity:
          typeof item.quantity === "number" && Number.isFinite(item.quantity)
            ? item.quantity
            : undefined,
        unit: item.unit?.trim() || undefined,
        notes: item.notes?.trim() || undefined,
      }))
      .filter((item) => item.name.length > 0)

    if (cleaned.length === 0) return

    onSubmit({ mealDate, mealType, items: cleaned })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="mealDate">Date (UTC)</Label>
          <Input
            id="mealDate"
            type="date"
            required
            disabled={lockDate}
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mealType">Meal</Label>
          <Select
            id="mealType"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Items</Label>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
          >
            + Add item
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_70px_auto] gap-1.5">
            <Input
              placeholder="e.g. Oatmeal"
              required={i === 0}
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
            />
            <Input
              type="number"
              step="any"
              placeholder="qty"
              value={item.quantity ?? ""}
              onChange={(e) =>
                updateItem(i, {
                  quantity:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
            <Input
              placeholder="unit"
              value={item.unit ?? ""}
              onChange={(e) => updateItem(i, { unit: e.target.value })}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={items.length === 1}
              onClick={() => removeItem(i)}
              aria-label="Remove item"
            >
              ×
            </Button>
          </div>
        ))}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
