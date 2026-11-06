---
name: chorequest-feature
description: Use when implementing a full feature in ChoreQuest end-to-end — guides through the DB schema, API route, and UI page in the correct order for this project.
---

# ChoreQuest Feature Implementation

Use this skill when implementing a complete feature from the `chorequest-plan.md` sub-tasks. It
walks through the correct layered order: schema → lib logic → API → UI, and checks each layer
before moving to the next.

## Step 1 — Read the plan

Read `chorequest-plan.md` and locate the sub-task being implemented. Note:
- Its **dependencies** (which ST numbers must be complete first)
- Its **todo list** (the ordered steps)
- Its **expected outcomes** (the definition of done)
- Its **relevant context** (files, models, and patterns to reuse)

If a dependency ST is not yet complete, stop and tell the user which one needs to be done first.

## Step 2 — Schema layer (if the feature touches the DB)

Check `prisma/schema.prisma`. If the feature requires new fields or models:

1. Read the Data Model section of `.bob/rules/AGENTS.md` for the authoritative field list
2. Add the required fields/models to `schema.prisma`
3. Run the migration:
   ```bash
   npx prisma migrate dev --name <feature-name>
   npx prisma generate
   ```
4. If any new enum values are added, update the Prisma schema enum block

Never skip this step and write application code against fields that don't exist in the schema yet.

## Step 3 — Library logic layer (scoring, badges, permissions, streaks)

If the feature involves:
- **Scoring** → edit or extend `src/lib/scoring.ts`. See scoring formula in `.bob/rules/AGENTS.md`.
- **Badges** → edit `src/lib/badges.ts`. System badge definitions are in `prisma/seed.ts`.
- **Streaks** → edit `src/lib/streaks.ts`.
- **Permissions** → edit `src/lib/permissions.ts`. Never inline permission checks in route handlers.

Write or extend the relevant lib function before writing the API route that calls it.
Keep lib functions pure where possible — they should accept typed arguments and return typed values,
not reach into `req` objects.

## Step 4 — API route layer

Follow the API route pattern from the `chorequest-scaffold` skill:

- Session check first
- Zod validation of request body
- `hasPermission()` check before any write
- Call lib functions (scoring, badges) rather than inlining the logic
- Wrap multi-step DB operations in `prisma.$transaction()`
- Return `{ data: ... }` or `{ error: "message" }` with correct status codes

After writing the route, verify it handles all the error cases listed in the sub-task.

## Step 5 — UI layer

For each page or component in the sub-task:

1. Determine if it's a Server Component (data display) or Client Component (forms, interactions)
2. Use the `chorequest-scaffold` skill patterns for boilerplate
3. Fetch data in Server Components directly with Prisma; call API routes from Client Components
4. Use existing components from `src/components/` before creating new ones — check what exists first
5. Tailwind only for all styles

UI must satisfy the **Expected Outcomes** in the plan sub-task — check each bullet point.

## Step 6 — Mark the sub-task done

After all expected outcomes are met:

1. Update the sub-task's **Status** in `chorequest-plan.md` from `[ ] pending` to `[x] done`
2. Add a brief note under the sub-task if there is any context the next developer needs
   (e.g. a migration name, a seed command to run, a known limitation)
3. Run `npx tsc --noEmit` to confirm no TypeScript errors were introduced

## Reminders

- Never bypass `hasPermission()` — every write route must check it
- Never select `passwordHash` in any Prisma query returned to the client
- Always update `.env.example` if a new environment variable is added
- The scoring formula and permission model are the source of truth in `.bob/rules/AGENTS.md`
