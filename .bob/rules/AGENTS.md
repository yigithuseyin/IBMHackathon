# ChoreQuest — Bob Project Rules

## Project Overview

ChoreQuest is a household chore management and gamification app. Households have Owners, Admins,
and Members. Members are assigned chores with point values; completing chores earns points, streaks,
and badges. The leaderboard ranks members within each household. Inspired by Class Dojo.

**Plan file:** `chorequest-plan.md` — read this before starting any sub-task.

## Tech Stack

- **Framework:** Next.js 14, App Router, `src/` directory layout
- **Language:** TypeScript (strict mode — `"strict": true` in tsconfig)
- **Styling:** Tailwind CSS utility classes only — no custom CSS files, no CSS modules
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js with credentials provider, JWT session strategy
- **Password hashing:** bcryptjs

## Folder Structure

```
src/
  app/                      # Next.js App Router
    (auth)/                 # Route group — login, register (no shared layout)
    (app)/                  # Route group — authenticated pages (shared layout with nav)
      dashboard/
      households/
        [id]/
          chores/
          members/
          badges/
          leaderboard/
          settings/
      profile/
    api/
      auth/[...nextauth]/
      households/
        route.ts            # GET list, POST create
        join/route.ts       # POST join
        [id]/
          route.ts          # GET, PATCH, DELETE
          chores/
            route.ts        # GET list, POST create
            [choreId]/
              route.ts      # GET, PATCH, DELETE
              complete/route.ts
              approve/route.ts
          members/
            route.ts
            [userId]/route.ts
          badges/
            route.ts
            [badgeId]/
              award/route.ts
          leaderboard/route.ts
      profile/route.ts
  lib/
    prisma.ts               # Prisma singleton client
    auth.ts                 # NextAuth config
    scoring.ts              # Point calculation engine
    streaks.ts              # Streak tracking logic
    badges.ts               # Badge check and award logic
    permissions.ts          # hasPermission() util
  components/
    ui/                     # Generic reusable UI atoms (Button, Card, Badge, Input, Modal)
    MemberCard.tsx          # Household member card with avatar, points, badges
    ChoreCard.tsx           # Chore list item card
    Leaderboard.tsx         # Ranked member table
  types/
    next-auth.d.ts          # Session type extensions
prisma/
  schema.prisma
  seed.ts                   # Seeds system badges
```

## Coding Conventions

### TypeScript
- Always type function parameters and return values explicitly — no implicit `any`
- Use `type` for object shapes, `interface` only when extension is needed
- Use Zod for all API input validation — define a schema before touching `req.json()`
- Always handle the `null` case from Prisma findUnique — never use `!` non-null assertion

### API Route Handlers
- Always call `getServerSession(authOptions)` at the top and return `401` if no session
- Check membership and permissions before any DB write — use `hasPermission()` from `src/lib/permissions.ts`
- Return consistent JSON shapes: `{ data: ... }` for success, `{ error: "message" }` for errors
- Use HTTP status codes correctly: 200 GET, 201 POST, 400 bad input, 401 unauth, 403 forbidden, 404 not found

### Prisma
- Use the singleton from `src/lib/prisma.ts` — never `new PrismaClient()` directly
- Always use `select` or `include` explicitly — never return raw records with password hashes
- Wrap multi-step operations (create + update) in `prisma.$transaction()`
- Never put `prisma` calls inside React components — data fetching in Server Components or route handlers only

### Components
- Server Components by default — only add `"use client"` when you need interactivity (forms, onClick, useState)
- Props typed inline with `type Props = { ... }` above each component
- Tailwind only — no inline `style` props
- Follow existing component patterns in `src/components/ui/`

### Naming
- Files: `kebab-case.ts` for lib/util files, `PascalCase.tsx` for components
- API routes: always `route.ts`
- DB model fields: `camelCase` (Prisma default)
- Environment variables: `SCREAMING_SNAKE_CASE`, always documented in `.env.example`

## Data Model Quick Reference

| Model | Key fields |
|---|---|
| User | id, name, email, passwordHash, totalPoints, avatarColour |
| Household | id, name, inviteCode, ownerId |
| HouseholdMember | householdId, userId, role (OWNER/ADMIN/MEMBER), permissions (JSON), isExempt |
| Chore | id, householdId, title, difficulty (EASY/MEDIUM/HARD), basePoints, dueDate, assignedToId, status |
| ChoreCompletion | id, choreId, completedByUserId, pointsAwarded, wasLate, wasEarly, streakAtCompletion |
| Badge | id, name, type (MILESTONE/BEHAVIOUR/CUSTOM/TEMPORARY), isNegative, householdId (null = system) |
| UserBadge | id, userId, badgeId, householdId, awardedAt, expiresAt |
| UserStreak | userId, householdId, currentStreak, longestStreak, lastCompletionDate |

## Scoring Formula

```
finalPoints = basePoints × difficultyMultiplier × streakMultiplier + earlyBonus − latePenalty
```

- EASY ×1.0, MEDIUM ×1.5, HARD ×2.0
- Streak multiplier: `1 + (0.1 × min(streak, 10))` → max ×2.0 at 10-day streak
- Early bonus: +20% of basePoints if completed >24h before dueDate
- Late penalty: −25% of basePoints if completed after dueDate
- Result always floored to integer, minimum 1

## Permissions

`HouseholdMember.permissions` is a JSON object with boolean flags:

```ts
type MemberPermissions = {
  canCreateChores: boolean
  canAssignChores: boolean
  canApproveCompletions: boolean
  canAwardBadges: boolean
  canManageMembers: boolean
  canSetExempt: boolean
}
```

Owners always have all permissions. Admins have all permissions by default. Members inherit
from their permissions JSON (defaults all false). Use `hasPermission(member, key)` from
`src/lib/permissions.ts` — never check role strings directly in route handlers.

## Environment Variables

Required in `.env.local` (see `.env.example`):

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Git Conventions

- Branch names: `feature/<short-description>`, `fix/<short-description>`
- Commit messages: imperative, present tense (`Add scoring engine`, not `Added scoring engine`)
- Each sub-task in `chorequest-plan.md` should be one PR
- Never commit `.env.local` — it is in `.gitignore`

## Skills Available

This workspace has the following Bob skills to help you work consistently:

- **`/chorequest-scaffold`** — scaffolds a new page or API route following the project's patterns
- **`/chorequest-feature`** — guides implementing a new feature end-to-end (DB → API → UI)
- **`/chorequest-scoring`** — explains the scoring/badge engine and guides changes to it safely

## Team

Three developers share this workspace via Git. All Bob configuration (`.bob/rules/`, `.bob/skills/`,
`AGENTS.md`) is committed to the repo so each developer's Bob instance loads the same context.
Read `chorequest-plan.md` to see what sub-tasks are pending before picking up work.
