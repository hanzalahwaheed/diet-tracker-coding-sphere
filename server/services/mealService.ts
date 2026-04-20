import type { AuthContext } from "@/lib/auth/context"
import {
  EditWindowClosedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/http/errors"
import { isSameUtcDay } from "@/lib/time/sameUtcDay"
import type {
  CreateMealInput,
  ListMealsQuery,
  UpdateMealInput,
} from "@/lib/validation/meals"
import { mealRepo } from "@/server/repositories/mealRepo"
import { trainerService } from "@/server/services/trainerService"

const getAccessibleMeal = async (ctx: AuthContext, mealId: string) => {
  const meal = await mealRepo.findById(mealId)

  if (!meal) {
    throw new NotFoundError("Meal not found")
  }

  if (ctx.role === "user") {
    if (meal.userId !== ctx.sub) {
      throw new NotFoundError("Meal not found")
    }

    return meal
  }

  await trainerService.assertTrainerOwnsUser(ctx.sub, meal.userId)
  return meal
}

export const mealService = {
  async createMeal(ctx: AuthContext, input: CreateMealInput) {
    if (ctx.role !== "user") {
      throw new ForbiddenError("Only users can create meals")
    }

    const meal = await mealRepo.create({
      userId: ctx.sub,
      mealDate: input.mealDate,
      mealType: input.mealType,
      items: input.items,
    })

    if (!meal) {
      throw new Error("Failed to create meal")
    }

    return meal
  },

  async listMeals(ctx: AuthContext, query: ListMealsQuery) {
    if (ctx.role === "user") {
      return mealRepo.listByUserId(ctx.sub, {
        from: query.from,
        to: query.to,
      })
    }

    if (!query.userId) {
      throw new ValidationError("userId is required for trainer meal queries", {
        userId: "Required",
      })
    }

    await trainerService.assertTrainerOwnsUser(ctx.sub, query.userId)

    return mealRepo.listByUserId(query.userId, {
      from: query.from,
      to: query.to,
    })
  },

  async getMeal(ctx: AuthContext, mealId: string) {
    return getAccessibleMeal(ctx, mealId)
  },

  async updateMeal(ctx: AuthContext, mealId: string, patch: UpdateMealInput) {
    if (ctx.role !== "user") {
      throw new ForbiddenError("Only users can update meals")
    }

    const meal = await getAccessibleMeal(ctx, mealId)

    if (!isSameUtcDay(meal.mealDate, new Date())) {
      throw new EditWindowClosedError()
    }

    const updatedMeal = await mealRepo.updateById(mealId, {
      mealDate: patch.mealDate ?? meal.mealDate,
      mealType: patch.mealType ?? meal.mealType,
      items: patch.items ?? meal.items,
      updatedAt: new Date(),
    })

    if (!updatedMeal) {
      throw new NotFoundError("Meal not found")
    }

    return updatedMeal
  },

  async deleteMeal(ctx: AuthContext, mealId: string) {
    if (ctx.role !== "user") {
      throw new ForbiddenError("Only users can delete meals")
    }

    const meal = await getAccessibleMeal(ctx, mealId)

    if (!isSameUtcDay(meal.mealDate, new Date())) {
      throw new EditWindowClosedError()
    }

    await mealRepo.deleteById(mealId)

    return {
      success: true,
    }
  },
}
