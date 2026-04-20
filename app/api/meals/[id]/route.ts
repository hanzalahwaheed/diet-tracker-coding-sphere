import { NextResponse } from "next/server"

import { getAuthContext } from "@/lib/auth/context"
import { handle } from "@/lib/http/respond"
import { updateMealSchema } from "@/lib/validation/meals"
import { mealService } from "@/server/services/mealService"

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export const GET = (_req: Request, { params }: RouteParams) =>
  handle(async () => {
    const ctx = await getAuthContext(_req)
    const { id } = await params

    return NextResponse.json(await mealService.getMeal(ctx, id))
  })

export const PATCH = (req: Request, { params }: RouteParams) =>
  handle(async () => {
    const ctx = await getAuthContext(req)
    const body = updateMealSchema.parse(await req.json())
    const { id } = await params

    return NextResponse.json(await mealService.updateMeal(ctx, id, body))
  })

export const DELETE = (req: Request, { params }: RouteParams) =>
  handle(async () => {
    const ctx = await getAuthContext(req)
    const { id } = await params

    return NextResponse.json(await mealService.deleteMeal(ctx, id))
  })
