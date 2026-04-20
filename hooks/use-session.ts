"use client"

import { useEffect, useState } from "react"

import { getSession, type Session } from "@/lib/session"

export const useSession = () => {
  const [session, setSessionState] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSessionState(getSession())
    setReady(true)

    const onChange = () => setSessionState(getSession())
    window.addEventListener("session-change", onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener("session-change", onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  return { session, ready }
}
