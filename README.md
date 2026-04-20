# Diet Tracker

Diet Tracker is a Next.js app for trainer-supervised meal logging. Users log meals, trainers review their assigned roster, and the backend enforces role-aware access rules plus same-day meal editing in UTC.

## Live App

- Deployed URL: `https://diet-tracker-coding-sphere.vercel.app/login`

## Demo Credentials

- Email: `test@test.com`
- Password: `Test#123`

## Stack

- Next.js on Vercel
- NeonDB for Postgres
- Drizzle ORM
- shadcn/ui

## Build Notes

- Backend planning was done with ChatGPT and Claude Code.
- The backend plan was executed with Codex GPT-5.4.
- The initial UI build used shadcn projects and was then executed with Claude Code.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add environment variables to `.env`:

```dotenv
DATABASE_URL=postgresql://...
JWT_SECRET=change-me
```

3. Start the app:

```bash
npm run dev
```

## Useful Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run db:push`
- `npm run db:studio`
