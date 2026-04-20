"use client"

import { getSession } from "@/lib/session"

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  query?: Record<string, string | undefined>
}

export const api = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { method = "GET", body, auth = true, query } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers["content-type"] = "application/json"

  if (auth) {
    const session = getSession()
    if (session) headers["authorization"] = `Bearer ${session.token}`
  }

  const url = new URL(path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error
    throw new ApiError(
      err?.message ?? `Request failed (${res.status})`,
      res.status,
      err?.code ?? "unknown_error",
      err?.details
    )
  }

  return data as T
}
