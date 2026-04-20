"use client"

export type SessionRole = "trainer" | "user"

export type Session = {
  token: string
  role: SessionRole
  id: string
  name: string
  email: string
  trainerId?: string
}

const STORAGE_KEY = "diet-tracker.session"

export const getSession = (): Session | null => {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export const setSession = (session: Session) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event("session-change"))
}

export const clearSession = () => {
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event("session-change"))
}
