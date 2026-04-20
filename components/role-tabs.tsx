"use client"

import { Button } from "@/components/ui/button"
import type { SessionRole } from "@/lib/session"

type Props = {
  value: SessionRole
  onChange: (role: SessionRole) => void
}

export function RoleTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex border border-border p-0.5">
      <Button
        size="xs"
        variant={value === "user" ? "default" : "ghost"}
        onClick={() => onChange("user")}
      >
        I&apos;m a user
      </Button>
      <Button
        size="xs"
        variant={value === "trainer" ? "default" : "ghost"}
        onClick={() => onChange("trainer")}
      >
        I&apos;m a trainer
      </Button>
    </div>
  )
}
