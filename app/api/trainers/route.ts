import { NextResponse } from "next/server"

import { handle } from "@/lib/http/respond"
import { trainerService } from "@/server/services/trainerService"

export const GET = () =>
  handle(async () =>
    NextResponse.json(await trainerService.listTrainersPublic())
  )
