import { NextResponse } from "next/server"

import { getAuthContext } from "@/lib/auth/context"
import { ForbiddenError } from "@/lib/http/errors"
import { handle } from "@/lib/http/respond"
import { trainerService } from "@/server/services/trainerService"

export const GET = (req: Request) =>
  handle(async () => {
    const ctx = await getAuthContext(req)

    if (ctx.role !== "trainer") {
      throw new ForbiddenError("Only trainers can view rosters")
    }

    return NextResponse.json(await trainerService.listRoster(ctx.sub))
  })
