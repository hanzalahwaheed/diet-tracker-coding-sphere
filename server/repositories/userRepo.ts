import { and, eq } from "drizzle-orm"

import { db, users, type NewUser } from "@/db"

export const userRepo = {
  async create(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning()
    return user ?? null
  },

  async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user ?? null
  },

  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user ?? null
  },

  async findByIdAndTrainerId(id: string, trainerId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.trainerId, trainerId)))
      .limit(1)

    return user ?? null
  },
}
