import { eq } from "drizzle-orm"

import { db, trainers, users, type NewTrainer } from "@/db"

export const trainerRepo = {
  async create(data: NewTrainer) {
    const [trainer] = await db.insert(trainers).values(data).returning()
    return trainer ?? null
  },

  async findById(id: string) {
    const [trainer] = await db
      .select()
      .from(trainers)
      .where(eq(trainers.id, id))
      .limit(1)

    return trainer ?? null
  },

  async findByEmail(email: string) {
    const [trainer] = await db
      .select()
      .from(trainers)
      .where(eq(trainers.email, email))
      .limit(1)

    return trainer ?? null
  },

  async listPublic() {
    return db
      .select({
        id: trainers.id,
        name: trainers.name,
      })
      .from(trainers)
  },

  async listRoster(trainerId: string) {
    return db
      .select({
        id: users.id,
        trainerId: users.trainerId,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.trainerId, trainerId))
  },
}
