import { NextResponse } from "next/server"

import { getAuthContext } from "@/lib/auth/context"
import { handle } from "@/lib/http/respond"
import { createMealSchema, listMealsQuerySchema } from "@/lib/validation/meals"
import { mealService } from "@/server/services/mealService"

export const POST = (req: Request) =>
  handle(async () => {
    const ctx = await getAuthContext(req)
    const body = createMealSchema.parse(await req.json())

    return NextResponse.json(await mealService.createMeal(ctx, body), {
      status: 201,
    })
  })

export const GET = (req: Request) =>
  handle(async () => {
    const ctx = await getAuthContext(req)
    const url = new URL(req.url)
    const query = listMealsQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries())
    )

    return NextResponse.json(await mealService.listMeals(ctx, query))
  })
