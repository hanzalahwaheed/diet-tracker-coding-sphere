import { z } from "zod"

export const mealItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
})

export const createMealSchema = z.object({
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  items: z.array(mealItemSchema).min(1),
})

export const updateMealSchema = createMealSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "no fields to update")

export const listMealsQuerySchema = z.object({
  userId: z.uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export type CreateMealInput = z.infer<typeof createMealSchema>
export type UpdateMealInput = z.infer<typeof updateMealSchema>
export type ListMealsQuery = z.infer<typeof listMealsQuerySchema>
