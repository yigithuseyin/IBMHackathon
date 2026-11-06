---
name: chorequest-scaffold
description: Use when adding a new page, API route, or component to ChoreQuest — walks through creating the file in the right location with the correct patterns for this project.
---

# ChoreQuest Scaffold

Use this skill whenever you need to add a new page, API route handler, or reusable component to the
ChoreQuest project. It ensures the file lands in the right place and follows the project's
established patterns.

## Step 1 — Identify what is being added

Determine which of these three things the user wants:

- **Page** — a new route under `src/app/(app)/` that renders UI
- **API route handler** — a new `route.ts` under `src/app/api/`
- **Component** — a new `.tsx` file under `src/components/`

If it is not obvious, ask the user.

## Step 2 — Confirm the correct file path

Use the folder structure defined in `.bob/rules/AGENTS.md` to determine the exact path.

- Pages go in `src/app/(app)/<route>/page.tsx`
- API routes go in `src/app/api/<path>/route.ts`
- Shared UI atoms go in `src/components/ui/<Name>.tsx`
- Feature-specific components go in `src/components/<Name>.tsx`

Read `chorequest-plan.md` to check whether this file is part of a planned sub-task — if so, note
which ST it belongs to and any relevant context from that sub-task.

## Step 3 — Apply the correct boilerplate

### For an API route handler

Always start with this pattern:

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // TODO: implement
}
```

Rules to follow:
- Session check is always first — no exceptions
- Use Zod to validate any request body before reading it
- Use `hasPermission()` from `src/lib/permissions.ts` before any write operation
- Return `{ data: ... }` on success, `{ error: "message" }` on failure
- Use correct HTTP status codes: 200/201 success, 400 bad input, 401 unauth, 403 forbidden, 404 not found
- Never select `passwordHash` in a Prisma query

### For a page (Server Component)

```tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PageName() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // fetch data here using prisma directly (Server Component)

  return (
    <div>
      {/* UI */}
    </div>
  )
}
```

Rules to follow:
- Default to Server Component — only add `"use client"` if the page needs interactivity
- Fetch data directly with Prisma in Server Components, not via fetch to your own API
- Redirect to `/login` if no session

### For a client component with a form

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  // define props here
}

export default function ComponentName({ }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // call API route
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* fields */}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  )
}
```

### For a reusable UI atom (src/components/ui/)

```tsx
type Props = {
  // define props here
}

export function ComponentName({ }: Props) {
  return (
    <div>
      {/* implementation */}
    </div>
  )
}
```

- Named export (not default) for ui/ atoms
- Default export for feature components and pages
- Tailwind only — no inline styles

## Step 4 — Create the file

Use `write_file` to create the file at the confirmed path with the correct boilerplate filled in.

## Step 5 — Check for missing wiring

After creating the file, check whether any of the following are needed:

- **New API route** → is it documented in `chorequest-plan.md`? If it adds a new Prisma model field,
  remind the user to update `schema.prisma` and run `prisma migrate dev`.
- **New page** → does it need a link added to the nav component?
- **New component** → does it need to be exported from an index file?

Flag anything missing as a follow-up step for the user.
