import { NextResponse } from "next/server"

import { handle } from "@/lib/http/respond"
import { trainerRegisterSchema } from "@/lib/validation/auth"
import { trainerService } from "@/server/services/trainerService"

export const POST = (req: Request) =>
  handle(async () => {
    const body = trainerRegisterSchema.parse(await req.json())
    const result = await trainerService.registerTrainer(body)

    return NextResponse.json(result, { status: 201 })
  })
