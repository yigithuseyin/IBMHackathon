# ChoreQuest

A household chore management and gamification app.

## Tech Stack
Next.js 14 · TypeScript · Tailwind CSS · Prisma (SQLite dev / PostgreSQL prod) · NextAuth.js

## Local Setup

```bash
cd chorequest
npm install
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```
