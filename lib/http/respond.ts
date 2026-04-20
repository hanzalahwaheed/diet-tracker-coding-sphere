import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { AppError } from "@/lib/http/errors"

type RouteExecutor = () => Promise<Response> | Response

export const handle = async (fn: RouteExecutor) => {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.status }
      )
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: "Validation failed",
            details: error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    console.error(error)

    return NextResponse.json(
      {
        error: {
          code: "internal_server_error",
          message: "Internal server error",
        },
      },
      { status: 500 }
    )
  }
}
