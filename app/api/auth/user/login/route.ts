import { NextResponse } from "next/server"

import { handle } from "@/lib/http/respond"
import { loginSchema } from "@/lib/validation/auth"
import { userService } from "@/server/services/userService"

export const POST = (req: Request) =>
  handle(async () => {
    const body = loginSchema.parse(await req.json())
    const result = await userService.loginUser(body)

    return NextResponse.json(result)
  })
