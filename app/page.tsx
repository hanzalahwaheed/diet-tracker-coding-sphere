"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSession } from "@/hooks/use-session"

export default function HomePage() {
  const { session, ready } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!ready || !session) return
    router.replace(session.role === "trainer" ? "/trainer" : "/meals")
  }, [ready, session, router])

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Diet tracker</CardTitle>
            <CardDescription>
              Log your daily meals and let your trainer review them. Sign up as a
              trainer to coach others, or as a user to log your meals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
