import { NextResponse } from "next/server"

import { handle } from "@/lib/http/respond"
import { userRegisterSchema } from "@/lib/validation/auth"
import { userService } from "@/server/services/userService"

export const POST = (req: Request) =>
  handle(async () => {
    const body = userRegisterSchema.parse(await req.json())
    const result = await userService.registerUser(body)

    return NextResponse.json(result, { status: 201 })
  })
