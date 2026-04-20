import { NextResponse } from "next/server"

import { handle } from "@/lib/http/respond"
import { loginSchema } from "@/lib/validation/auth"
import { trainerService } from "@/server/services/trainerService"

export const POST = (req: Request) =>
  handle(async () => {
    const body = loginSchema.parse(await req.json())
    const result = await trainerService.loginTrainer(body)

    return NextResponse.json(result)
  })
