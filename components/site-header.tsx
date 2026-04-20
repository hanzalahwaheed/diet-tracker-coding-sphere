"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useSession } from "@/hooks/use-session"
import { clearSession } from "@/lib/session"

export function SiteHeader() {
  const { session, ready } = useSession()
  const router = useRouter()

  const onLogout = () => {
    clearSession()
    router.push("/login")
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2">
      <Link href="/" className="text-xs font-medium">
        diet tracker
      </Link>
      <div className="flex items-center gap-2">
        {!ready ? null : session ? (
          <>
            <span className="text-xs text-muted-foreground">
              {session.name} · {session.role}
            </span>
            <Button size="xs" variant="outline" onClick={onLogout}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <Button size="xs" variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="xs" asChild>
              <Link href="/register">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
