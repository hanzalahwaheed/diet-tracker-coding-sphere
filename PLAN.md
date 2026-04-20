# Diet Tracker MVP — Backend Plan

## 1. Context

A diet tracker where **trainers supervise users** and **users log their own meals**. The trainer's job is read-only oversight of their roster; the user's job is daily meal logging. The MVP is backend-first on Next.js 16 (App Router) + TypeScript, with Drizzle ORM against Neon Postgres (already scaffolded in this repo).

Non-negotiable rules:

- Trainers can read (never write) only their own users' data.
- Users can read and write only their own meal entries.
- A meal entry is editable **only on the same UTC calendar day as its `mealDate`**. After that it's immutable.

Auth is intentionally simple (HS256 JWT with a `role` claim) so we can move fast now and harden later. Food-item normalization, analytics, per-user timezones, and stricter RBAC are deferred and called out at the end.

**Confirmed design decisions:**
- Drizzle (already wired), not Prisma.
- Two separate tables for trainers and users (not a unified `accounts` + role column) — see §3 for rationale.
- Basic JWT with role awareness.
- User self-signup + trainer picker, **not** trainer-creates-user — see §5.

---

## 2. User flows

1. **Trainer signs up** — `POST /api/auth/trainer/register` → returns JWT.
2. **User sees trainer list** — `GET /api/trainers` (public) → `[{ id, name }]` for picker UI.
3. **User signs up picking a trainer** — `POST /api/auth/user/register` with `{ email, password, name, trainerId }` → returns JWT. Rejects unknown `trainerId`.
4. **User logs meals** — `POST /api/meals`, `GET /api/meals`.
5. **User edits today's meal** — `PATCH /api/meals/:id` succeeds if `mealDate` is today (UTC). Older entries → 409.
6. **Trainer reviews** — `GET /api/trainer/users` (own roster), `GET /api/meals?userId=…` scoped to roster members only.

---

## 3. Why two tables, not one

A single `accounts` table with a `role` column would be terser for auth but wrong for this domain. Trainer and user schemas will diverge almost immediately — users carry `trainerId`, trainers will grow fields like specialty, capacity, billing — and keeping them together forces every row to carry every other role's nullable columns.

Foreign keys also stay honest with two tables: `meal_entries.userId` can only reference an actual user, never an accidental trainer row. Role-based auth is just as clean when `role` lives in the JWT payload rather than a DB column. The one real cost — duplicated login endpoints — is trivial; the harder migration (splitting one overloaded table apart later) is what two tables avoids.

---

## 4. Architecture

Layered, one-way dependencies: `route handler → service → repository → db`.

```
app/api/...            route handlers: parse, validate (Zod), call service, map errors → HTTP
lib/auth/              JWT sign/verify + request context extraction
lib/http/              error classes, response helpers
lib/validation/        Zod schemas shared by routes + services
lib/time/              timezone helpers (sameUtcDay)
server/services/       business rules (ownership, edit window)
server/repositories/   Drizzle queries (no business rules)
db/schema.ts           Drizzle table definitions
```

Services never touch `Request`; they take plain inputs + `AuthContext`. Repositories never throw domain errors; they return rows or `null`. Route handlers stay skinny: parse → call service → return JSON.

---

## 5. Signup flow detail

**Trainer registration** — normal self-serve signup.

**User registration** — also self-serve, but must pick a trainer at signup time:

1. Frontend calls `GET /api/trainers` to populate a dropdown. This endpoint is public but returns only `{ id, name }` — no emails, no counts, no sensitive fields.
2. Frontend POSTs to `/api/auth/user/register` with `{ email, password, name, trainerId }`.
3. Service validates `trainerId` exists. If not → 400. If email already in use → 409.
4. Inserts user, returns JWT with `{ sub: userId, role: 'user', trainerId }`.

Trainers do **not** create users. They just list their roster via `GET /api/trainer/users`. Users can't reassign themselves to a different trainer in the MVP — that's a later "transfer" endpoint.

---

## 6. Schema (`db/schema.ts`)

Replace the placeholder `foodLogs` table. UUID PKs with `defaultRandom()`, `jsonb` for flexible meal items, UTC timestamps.

### `trainers`
| column        | type          | notes                         |
|---------------|---------------|-------------------------------|
| id            | uuid          | PK, default random            |
| email         | text          | unique, not null              |
| passwordHash  | text          | not null (bcrypt)             |
| name          | text          | not null                      |
| createdAt     | timestamptz   | default now()                 |

### `users`
| column        | type          | notes                                         |
|---------------|---------------|-----------------------------------------------|
| id            | uuid          | PK, default random                            |
| trainerId     | uuid          | not null, FK → trainers.id, on delete cascade |
| email         | text          | unique, not null                              |
| passwordHash  | text          | not null                                      |
| name          | text          | not null                                      |
| createdAt     | timestamptz   | default now()                                 |

Index on `trainerId` (trainer's roster list is a hot path).

### `meal_entries`
| column     | type          | notes                                                        |
|------------|---------------|--------------------------------------------------------------|
| id         | uuid          | PK, default random                                           |
| userId     | uuid          | not null, FK → users.id, on delete cascade                   |
| mealDate   | date          | not null — UTC calendar day the meal is *logged for*         |
| mealType   | text          | not null — `'breakfast' \| 'lunch' \| 'dinner' \| 'snack'`   |
| items      | jsonb         | not null — `[{ name, quantity?, unit?, notes? }, …]`         |
| createdAt  | timestamptz   | default now()                                                |
| updatedAt  | timestamptz   | default now()                                                |

Composite index on `(userId, mealDate)` — powers both "today's meals" and date-range queries.

Export Drizzle `relations` so we can do `db.query.users.findMany({ with: { trainer, mealEntries } })` for future trainer-insight work. Export `$inferSelect` / `$inferInsert` for every table.

After schema edits: `npm run db:push` → verify in `npm run db:studio`.

---

## 7. Same-day edit rule

Enforced in the **service layer**, not the DB and not the frontend.

```ts
// lib/time/sameUtcDay.ts
export const toUtcDay = (d: Date | string) =>
  new Date(d).toISOString().slice(0, 10) // "YYYY-MM-DD"
export const isSameUtcDay = (a: Date | string, b: Date | string) =>
  toUtcDay(a) === toUtcDay(b)
```

In `mealService.updateMeal` / `deleteMeal`:

```ts
if (!isSameUtcDay(entry.mealDate, new Date())) {
  throw new EditWindowClosedError()   // → 409
}
```

**Why service layer, not DB constraint or frontend:**
- DB-level (CHECK / trigger) is hard to parametrize with "now" and impossible to unit-test without a running DB.
- Frontend-only is trivially bypassed with `curl`.
- Service layer is authoritative, testable in isolation, and swaps cleanly when we add per-user timezones (replace `isSameUtcDay` with `isSameDayInTz(date, now, user.timezone)`).

Edge case to test: 23:59:59 UTC vs 00:00:00 UTC next day — the helper must flip exactly there.

---

## 8. Auth (`lib/auth/`)

- **`jwt.ts`** — `signToken(payload)`, `verifyToken(token)` using `jsonwebtoken` (HS256, `process.env.JWT_SECRET`). Payload: `{ sub: string, role: 'trainer' | 'user', trainerId?: string }`. `trainerId` is included for user tokens so common ownership checks skip a DB round-trip.
- **`context.ts`** — `getAuthContext(req)` reads `Authorization: Bearer …`, verifies, returns typed `AuthContext`. Missing/invalid → `UnauthorizedError`.
- **`password.ts`** — `hashPassword`, `verifyPassword` via `bcryptjs`.
- **`.env.example`** — add `JWT_SECRET=change-me`.

New dependencies: `jsonwebtoken`, `bcryptjs`, `zod`, `@types/jsonwebtoken`, `@types/bcryptjs`.

---

## 9. Validation (`lib/validation/`)

Zod schemas are the single source of truth. Inferred types flow into services.

**`meals.ts`**
```ts
mealItemSchema       = z.object({ name: z.string().min(1), quantity: z.number().positive().optional(), unit: z.string().optional(), notes: z.string().optional() })
createMealSchema     = z.object({ mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), mealType: z.enum(['breakfast','lunch','dinner','snack']), items: z.array(mealItemSchema).min(1) })
updateMealSchema     = createMealSchema.partial().refine(o => Object.keys(o).length > 0, 'no fields to update')
listMealsQuerySchema = z.object({ userId: z.string().uuid().optional(), from: z.string().optional(), to: z.string().optional() })
```

**`auth.ts`**
```ts
trainerRegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) })
userRegisterSchema    = trainerRegisterSchema.extend({ trainerId: z.string().uuid() })
loginSchema           = z.object({ email: z.string().email(), password: z.string().min(1) })
```

---

## 10. HTTP plumbing (`lib/http/`)

**`errors.ts`** — `AppError` base + subclasses:
| class                   | status | used for                              |
|-------------------------|--------|---------------------------------------|
| `UnauthorizedError`     | 401    | missing/invalid JWT                   |
| `ForbiddenError`        | 403    | authenticated but wrong role          |
| `NotFoundError`         | 404    | row missing *or* ownership mismatch   |
| `ValidationError`       | 400    | wrapped Zod errors                    |
| `ConflictError`         | 409    | duplicate email, etc.                 |
| `EditWindowClosedError` | 409    | same-day edit rule violation          |

Ownership mismatches return **404, not 403** — deliberately doesn't leak whether a resource exists.

**`respond.ts`** — `handle(fn)` wrapper around every route handler:
- `AppError` → typed JSON + status.
- `ZodError` → 400 with field-level details.
- anything else → 500 with a generic body (never leak stack / internals).

---

## 11. Services (`server/services/`)

### `trainerService.ts`
- `registerTrainer(input)` — hash password, insert, return `{ trainer, token }`.
- `loginTrainer({ email, password })` — verify, return `{ trainer, token }`.
- `listTrainersPublic()` — returns `{ id, name }[]` for the signup picker.
- `listRoster(trainerId)` — returns that trainer's users.
- `assertTrainerOwnsUser(trainerId, userId)` — throws `NotFoundError` if mismatch. Reused by `mealService`.

### `userService.ts`
- `registerUser({ email, password, name, trainerId })` — verify trainer exists, hash password, insert, return `{ user, token }`.
- `loginUser({ email, password })` — verify, return `{ user, token }`.

### `mealService.ts` (core of the MVP)
- `createMeal(ctx, input)` — role `user` only; insert `{ userId: ctx.sub, …input }`.
- `listMeals(ctx, query)`:
  - `user`: force `userId = ctx.sub`.
  - `trainer`: require `query.userId`, then `assertTrainerOwnsUser(ctx.sub, query.userId)`.
- `getMeal(ctx, mealId)` — load entry; run ownership check; 404 on mismatch.
- `updateMeal(ctx, mealId, patch)` — role `user` only. Ownership check **+ edit-window check**. Touch `updatedAt`.
- `deleteMeal(ctx, mealId)` — same rules as update.

---

## 12. Repositories (`server/repositories/`)

Thin Drizzle wrappers — `trainerRepo.ts`, `userRepo.ts`, `mealRepo.ts`. No business rules, return rows or `null`. Keeps services query-syntax-free and isolates future query tuning.

---

## 13. Route handlers (`app/api/…`)

Every handler follows the same shape:

```ts
export const POST = (req: Request) => handle(async () => {
  const ctx  = await getAuthContext(req)        // if route requires auth
  const body = schema.parse(await req.json())
  return NextResponse.json(await service.x(ctx, body), { status: 201 })
})
```

| method | path                                 | auth        | purpose                         |
|--------|--------------------------------------|-------------|---------------------------------|
| POST   | `/api/auth/trainer/register`         | public      | trainer signup                  |
| POST   | `/api/auth/trainer/login`            | public      | trainer login                   |
| POST   | `/api/auth/user/register`            | public      | user signup (incl. `trainerId`) |
| POST   | `/api/auth/user/login`               | public      | user login                      |
| GET    | `/api/trainers`                      | public      | `{id,name}[]` for signup picker |
| GET    | `/api/trainer/users`                 | trainer     | own roster                      |
| POST   | `/api/meals`                         | user        | create meal                     |
| GET    | `/api/meals`                         | user/trainer| list (role-aware filtering)     |
| GET    | `/api/meals/[id]`                    | user/trainer| read one                        |
| PATCH  | `/api/meals/[id]`                    | user        | edit (same-day only)            |
| DELETE | `/api/meals/[id]`                    | user        | delete (same-day only)          |

---

## 14. Files to create / modify

**Modify**
- `db/schema.ts` — replace `foodLogs` with `trainers`, `users`, `mealEntries` + relations.
- `.env.example` — add `JWT_SECRET`.
- `package.json` — add `jsonwebtoken`, `bcryptjs`, `zod`, `@types/jsonwebtoken`, `@types/bcryptjs`.

**Create**
- `lib/auth/jwt.ts`, `lib/auth/context.ts`, `lib/auth/password.ts`
- `lib/http/errors.ts`, `lib/http/respond.ts`
- `lib/validation/meals.ts`, `lib/validation/auth.ts`
- `lib/time/sameUtcDay.ts`
- `server/repositories/{trainerRepo,userRepo,mealRepo}.ts`
- `server/services/{trainerService,userService,mealService}.ts`
- Route handlers listed in §13.

**Reuse**
- `db/index.ts` — already exports the Drizzle client with schema bound. All repos import from here.
- `lib/utils.ts` (`cn`) — frontend helper, leave alone.

---

## 15. Verification

1. `npm run db:push` — push schema to Neon; spot-check tables in `npm run db:studio`.
2. `npm run typecheck` and `npm run lint` — must pass clean.
3. End-to-end smoke via `curl` (quick scratch script, not committed):
   - Trainer registers → JWT back.
   - `GET /api/trainers` → lists the new trainer.
   - Two users (A, B) register picking that trainer → JWTs back.
   - User A `POST /api/meals` for today → 201.
   - User A `GET /api/meals` → sees own entry only.
   - User A `GET /api/meals/:bMealId` → **404** (not 403).
   - Trainer `GET /api/meals?userId=<A>` → 200; with a foreign userId → **404**.
   - User A `PATCH` today's meal → 200; manually backdate `mealDate` in DB, `PATCH` again → **409**.
   - User A `PATCH /api/meals/:bMealId` → **404**.
4. Unit-test `isSameUtcDay` directly across the UTC midnight boundary (23:59:59 vs 00:00:00 next day). Smallest test that pins the most-likely-to-regress rule.

---

## 16. Deliberately out of scope (later, not now)

- **Normalized food catalog** — `items` stays `jsonb` for the MVP; a `food_items` table + join table comes with analytics.
- **Trainer analytics** — aggregated calories/macros/adherence endpoints.
- **Per-user timezones** — UTC only for MVP; `isSameUtcDay` is the single swap point.
- **Auth hardening** — password reset, email verification, refresh tokens, session revocation.
- **User → trainer transfers** — users can't change trainer in MVP.
- **Operational extras** — rate limiting, audit log, soft deletes.
