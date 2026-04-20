import { and, desc, eq, gte, lte } from "drizzle-orm"

import { db, mealEntries, type NewMealEntry } from "@/db"

type ListByUserIdOptions = {
  from?: string
  to?: string
}

const buildListConditions = (userId: string, options: ListByUserIdOptions) => {
  const conditions = [eq(mealEntries.userId, userId)]

  if (options.from) {
    conditions.push(gte(mealEntries.mealDate, options.from))
  }

  if (options.to) {
    conditions.push(lte(mealEntries.mealDate, options.to))
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions)
}

export const mealRepo = {
  async create(data: NewMealEntry) {
    const [mealEntry] = await db.insert(mealEntries).values(data).returning()
    return mealEntry ?? null
  },

  async findById(id: string) {
    const [mealEntry] = await db
      .select()
      .from(mealEntries)
      .where(eq(mealEntries.id, id))
      .limit(1)

    return mealEntry ?? null
  },

  async listByUserId(userId: string, options: ListByUserIdOptions = {}) {
    return db
      .select()
      .from(mealEntries)
      .where(buildListConditions(userId, options))
      .orderBy(desc(mealEntries.mealDate), desc(mealEntries.createdAt))
  },

  async updateById(
    id: string,
    data: Partial<Pick<NewMealEntry, "mealDate" | "mealType" | "items">> & {
      updatedAt: Date
    }
  ) {
    const [mealEntry] = await db
      .update(mealEntries)
      .set(data)
      .where(eq(mealEntries.id, id))
      .returning()

    return mealEntry ?? null
  },

  async deleteById(id: string) {
    const [mealEntry] = await db
      .delete(mealEntries)
      .where(eq(mealEntries.id, id))
      .returning()

    return mealEntry ?? null
  },
}
