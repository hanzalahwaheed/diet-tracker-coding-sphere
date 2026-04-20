import { relations } from "drizzle-orm"
import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export type MealItem = {
  name: string
  quantity?: number
  unit?: string
  notes?: string
}

export const trainers = pgTable(
  "trainers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("trainers_email_idx").on(table.email)]
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_trainer_id_idx").on(table.trainerId),
  ]
)

export const mealEntries = pgTable(
  "meal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mealDate: date("meal_date", { mode: "string" }).notNull(),
    mealType: text("meal_type").notNull(),
    items: jsonb("items").$type<MealItem[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("meal_entries_user_id_meal_date_idx").on(table.userId, table.mealDate)]
)

export const trainersRelations = relations(trainers, ({ many }) => ({
  users: many(users),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  trainer: one(trainers, {
    fields: [users.trainerId],
    references: [trainers.id],
  }),
  mealEntries: many(mealEntries),
}))

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  user: one(users, {
    fields: [mealEntries.userId],
    references: [users.id],
  }),
}))

export type Trainer = typeof trainers.$inferSelect
export type NewTrainer = typeof trainers.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type MealEntry = typeof mealEntries.$inferSelect
export type NewMealEntry = typeof mealEntries.$inferInsert
