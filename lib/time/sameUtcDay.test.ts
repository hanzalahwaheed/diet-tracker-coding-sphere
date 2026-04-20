import assert from "node:assert/strict"
import test from "node:test"

import { isSameUtcDay, toUtcDay } from "./sameUtcDay.ts"

test("toUtcDay normalizes timestamps to a UTC date string", () => {
  assert.equal(toUtcDay("2026-04-20T23:59:59.000Z"), "2026-04-20")
})

test("isSameUtcDay flips exactly at UTC midnight", () => {
  const justBeforeMidnight = "2026-04-20T23:59:59.000Z"
  const sameDayEarlier = "2026-04-20T00:00:00.000Z"
  const nextUtcDay = "2026-04-21T00:00:00.000Z"

  assert.equal(isSameUtcDay(justBeforeMidnight, sameDayEarlier), true)
  assert.equal(isSameUtcDay(justBeforeMidnight, nextUtcDay), false)
})
