export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export type MealItem = {
  name: string
  quantity?: number
  unit?: string
  notes?: string
}

export type MealEntry = {
  id: string
  userId: string
  mealDate: string
  mealType: MealType
  items: MealItem[]
  createdAt: string
  updatedAt: string
}

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"]

export const todayUtc = () => new Date().toISOString().slice(0, 10)

export const isSameUtcDay = (date: string) => date === todayUtc()
