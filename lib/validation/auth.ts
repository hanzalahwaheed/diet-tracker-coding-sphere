import { z } from "zod"

export const trainerRegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export const userRegisterSchema = trainerRegisterSchema.extend({
  trainerId: z.uuid(),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export type TrainerRegisterInput = z.infer<typeof trainerRegisterSchema>
export type UserRegisterInput = z.infer<typeof userRegisterSchema>
export type LoginInput = z.infer<typeof loginSchema>
