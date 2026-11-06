# ChoreQuest — Full Product Plan

## Overview

ChoreQuest is a household chore management and rewards app inspired by Class Dojo. Households are created by an Owner, members join via invite code, chores are assigned with point values and due dates, and a gamification layer (points, streaks, badges) keeps members engaged. The UI is deliberately barebones and functional — structured for easy visual upgrades later.

**Repo:** https://github.com/yigithuseyin/IBMHackathon  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · NextAuth.js  
**Deploy target:** Vercel  

---

## Feature Summary

| Feature | Scope |
|---|---|
| Auth (register/login) | Email + password via NextAuth credentials |
| Households | Create, join via invite code, leave |
| Roles | Owner / Admin / Member + per-user permission overrides |
| Chores | Create, assign, difficulty tier, due date, point value |
| Chore completion | Mark complete, approve flow, point award, late penalty |
| Scoring | Base points + early bonus + late penalty + streak multiplier |
| Badges — Milestone | Auto-awarded at point/chore-count thresholds |
| Badges — Behaviour | Auto-awarded for streaks, early bird, perfect week |
| Badges — Custom | Admins can define and manually award custom badges |
| Badges — Temporary | Negative badges for lateness/inactivity, Exempt status badge |
| Leaderboard | Per-household ranked view |
| Dashboard | Member cards showing avatar, points, badges, current chores |
| AGENTS.md | Shared Bob context committed to the repo for team use |

---

## Data Model

### User
- id, name, email, passwordHash
- avatarColour (hex string — simple coloured circle avatar for now)
- totalPoints (denormalised for fast leaderboard queries)
- createdAt

### Household
- id, name, inviteCode (random 8-char alphanumeric)
- createdAt, ownerId (FK → User)

### HouseholdMember
- id, householdId, userId
- role: OWNER | ADMIN | MEMBER
- permissions: JSON (per-user overrides — see Permissions section below)
- isExempt: boolean (exempt from chores — set by admin or awarded as reward)
- joinedAt

### Chore
- id, householdId, title, description
- difficulty: EASY | MEDIUM | HARD
- basePoints (set by creator)
- dueDate (optional)
- assignedToId (FK → User, nullable — unassigned chores visible to all)
- createdById (FK → User)
- status: PENDING | IN_REVIEW | COMPLETED | OVERDUE
- isRecurring: boolean
- recurringFrequency: DAILY | WEEKLY | MONTHLY (nullable)
- createdAt

### ChoreCompletion
- id, choreId, completedByUserId, householdId
- pointsAwarded (final after bonuses/penalties)
- completedAt
- approvedById (nullable — who approved it)
- approvedAt (nullable)
- wasLate: boolean
- wasEarly: boolean
- streakAtCompletion: integer

### Badge
- id, name, description, icon (emoji or short string)
- type: MILESTONE | BEHAVIOUR | CUSTOM | TEMPORARY
- isNegative: boolean (for temporary negative badges)
- householdId (nullable — null = system badge, set = household-specific custom badge)
- awardCondition (string description for custom badges)

### UserBadge
- id, userId, badgeId, householdId
- awardedAt
- expiresAt (nullable — for temporary badges)
- awardedByUserId (nullable — for manually awarded custom badges)

### UserStreak
- id, userId, householdId
- currentStreak (days)
- longestStreak
- lastCompletionDate

---

## Roles & Permissions

### Role hierarchy
- **Owner** — created the household. Cannot be removed. Full permissions always.
- **Admin** — full management rights (create/edit/delete chores, assign chores, manage members, award custom badges, set exempt status).
- **Member** — can view household, view chores assigned to them, mark their own chores as complete.

### Per-user permission overrides (stored as JSON on HouseholdMember)
Individual permissions that can be toggled on a per-user basis regardless of role:
- `canCreateChores` — can create new chores
- `canAssignChores` — can assign chores to others
- `canApproveCompletions` — can approve a chore marked complete
- `canAwardBadges` — can award custom badges
- `canManageMembers` — can invite/remove members
- `canSetExempt` — can mark a member as exempt

Admins can grant or revoke any of these on any Member. Owners can do the same for Admins.

---

## Scoring System

### Point calculation on completion

```
finalPoints = basePoints × difficultyMultiplier × streakMultiplier + earlyBonus − latePenalty
```

| Factor | Value |
|---|---|
| Difficulty EASY | ×1.0 |
| Difficulty MEDIUM | ×1.5 |
| Difficulty HARD | ×2.0 |
| Streak multiplier | 1 + (0.1 × min(currentStreak, 10)) — max ×2.0 at 10-day streak |
| Early bonus | +20% of basePoints if completed >24h before due date |
| Late penalty | −25% of basePoints if completed after due date |
| Exempt user | 0 points, chore still recorded |

Points are always floored to an integer, minimum 1.

---

## Badge System

### Milestone badges (auto-awarded, permanent)
| Badge | Condition |
|---|---|
| First Step | Complete 1st chore |
| Getting Started | Complete 10 chores |
| Century | Earn 100 points total |
| High Scorer | Earn 500 points total |
| Centurion | Earn 1000 points total |
| Chore Champion | Complete 50 chores |

### Behaviour badges (auto-awarded, permanent)
| Badge | Condition |
|---|---|
| On a Roll | 3-day streak |
| Hot Streak | 7-day streak |
| Unstoppable | 14-day streak |
| Early Bird | Complete 5 chores early |
| Perfect Week | Complete all assigned chores in a calendar week on time |
| Top of the House | Highest points in household for a week |

### Temporary badges (auto-awarded, expire)
| Badge | Negative? | Condition | Expires |
|---|---|---|---|
| Slacker 😴 | Yes | No chore completed in 3 days (when chores exist) | When next chore completed |
| Overdue ⚠️ | Yes | Has 1+ overdue chores | When overdue chore completed/reassigned |
| Exempt 🛡️ | No | isExempt = true on HouseholdMember | When exempt removed |

### Custom badges
- Created by Admin/Owner at the household level
- Have a name, description, and icon (emoji)
- Manually awarded to any member by anyone with `canAwardBadges` permission
- Can optionally have an expiry date set at award time

---

## Pages & Routes

### Public
- `/` — landing page / marketing stub
- `/login` — sign in
- `/register` — create account

### Authenticated
- `/dashboard` — list of households user belongs to
- `/households/new` — create a household
- `/households/join` — enter invite code to join
- `/households/[id]` — household dashboard (member cards, leaderboard, recent activity)
- `/households/[id]/chores` — full chore list with filters (assigned to me, all, overdue, completed)
- `/households/[id]/chores/new` — create a chore
- `/households/[id]/chores/[choreId]` — chore detail / edit
- `/households/[id]/leaderboard` — full ranked leaderboard
- `/households/[id]/members` — member management (roles, permissions, exempt status)
- `/households/[id]/badges` — badge management (view system badges, create custom badges)
- `/households/[id]/settings` — household name, invite code regeneration, danger zone
- `/profile` — user profile, all-time stats, badges across all households

### API Routes (Next.js Route Handlers)
- `POST /api/auth/[...nextauth]` — NextAuth
- `POST /api/households` — create household
- `POST /api/households/join` — join via invite code
- `GET/PATCH/DELETE /api/households/[id]` — household CRUD
- `GET/POST /api/households/[id]/chores` — list / create chores
- `PATCH /api/households/[id]/chores/[choreId]` — update chore (assign, edit, mark complete)
- `POST /api/households/[id]/chores/[choreId]/complete` — mark complete + trigger scoring
- `POST /api/households/[id]/chores/[choreId]/approve` — approve completion
- `GET /api/households/[id]/leaderboard` — ranked members with points + badges
- `GET/PATCH /api/households/[id]/members/[userId]` — manage member role/permissions/exempt
- `DELETE /api/households/[id]/members/[userId]` — remove member
- `GET/POST /api/households/[id]/badges` — list / create custom badges
- `POST /api/households/[id]/badges/[badgeId]/award` — award badge to user
- `GET /api/profile` — current user's stats

---

## Sub-Tasks

---

### ST-1: Project Scaffold & Config
**Status:** [ ] pending

**Intent:** Bootstrap the Next.js 14 project with all dependencies, folder structure, Prisma, and NextAuth wired up. No features yet — just a running app with DB connected.

**Expected Outcomes:**
- `npx create-next-app` scaffold with TypeScript, Tailwind, App Router, `src/` directory
- Prisma installed and configured with PostgreSQL provider
- All schema models defined in `schema.prisma`
- NextAuth installed, provider skeleton in place
- `.env.example` with required vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
- `AGENTS.md` at repo root describing the project for all team members' Bob instances
- `.bob/rules/` directory with project coding standards
- App runs locally with `npm run dev`

**Todo List:**
- [ ] Run `create-next-app` with TS, Tailwind, App Router, src dir
- [ ] Install dependencies: `prisma`, `@prisma/client`, `next-auth`, `bcryptjs`, `@types/bcryptjs`
- [ ] Create `prisma/schema.prisma` with all models from Data Model section above
- [ ] Create `.env.example` and `.env.local` (gitignored) with placeholder values
- [ ] Run `prisma generate` and `prisma migrate dev --name init`
- [ ] Create `src/lib/prisma.ts` singleton client
- [ ] Create `src/lib/auth.ts` with NextAuth config (credentials provider, session strategy JWT)
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Write `AGENTS.md` at repo root
- [ ] Write `.bob/rules/PROJECT.md` with coding conventions

**Relevant Context:** Full schema defined in Data Model section above.

---

### ST-2: Auth — Register & Login
**Status:** [ ] pending

**Intent:** Users can create an account with name/email/password and sign in. Session is available throughout the app via NextAuth `useSession` / `getServerSession`.

**Expected Outcomes:**
- `POST /api/auth/register` creates a User record with hashed password
- NextAuth credentials provider validates email + password, returns session with `id`, `name`, `email`
- `/register` page — form with name, email, password, confirm password
- `/login` page — form with email, password, error display
- Redirect to `/dashboard` after login
- Auth middleware protects all `/dashboard`, `/households`, `/profile` routes
- Session type extended with `user.id`

**Todo List:**
- [ ] Create `POST /api/auth/register` route handler (validate, hash password, create User)
- [ ] Configure NextAuth credentials provider in `src/lib/auth.ts`
- [ ] Extend NextAuth session/JWT types to include `user.id`
- [ ] Create `app/(auth)/login/page.tsx` with form and error state
- [ ] Create `app/(auth)/register/page.tsx` with form and validation
- [ ] Create `src/middleware.ts` to protect authenticated routes
- [ ] Create shared `AuthForm` component reused by both pages

**Relevant Context:** ST-1 must be complete. `User` model in schema. NextAuth config in `src/lib/auth.ts`.

---

### ST-3: Households — Create, Join, Dashboard
**Status:** [ ] pending

**Intent:** Authenticated users can create a household (becoming Owner) or join one via an 8-char invite code. The household dashboard shows member cards.

**Expected Outcomes:**
- `POST /api/households` — creates Household + HouseholdMember (role=OWNER) + generates invite code
- `POST /api/households/join` — finds household by invite code, creates HouseholdMember (role=MEMBER)
- `/dashboard` lists all households the user belongs to with name, member count, and link
- `/households/new` — form to create household
- `/households/join` — form to enter invite code
- `/households/[id]` — shows a grid of member cards (avatar colour circle, name, total points, badge count)

**Todo List:**
- [ ] Create `POST /api/households` route (generate invite code utility, create records)
- [ ] Create `POST /api/households/join` route (lookup by inviteCode, check not already member)
- [ ] Create `GET /api/households` to list user's households
- [ ] Create `GET /api/households/[id]` to get household detail + members
- [ ] Create `/dashboard` page listing households
- [ ] Create `/households/new` page with form
- [ ] Create `/households/join` page with form
- [ ] Create `/households/[id]` page with `MemberCard` component (avatar, name, points, badges)

**Relevant Context:** ST-2 must be complete. `Household`, `HouseholdMember` models. Invite code = `nanoid(8)` or `crypto.randomBytes(4).toString('hex')`.

---

### ST-4: Chores — CRUD & Assignment
**Status:** [ ] pending

**Intent:** Admins/Owners (and Members with `canCreateChores`) can create chores with title, description, difficulty, base points, due date, and assignee. Chores can be viewed, edited, and deleted.

**Expected Outcomes:**
- `GET /api/households/[id]/chores` returns chore list with filters (status, assignee)
- `POST /api/households/[id]/chores` creates a chore (permission checked)
- `PATCH /api/households/[id]/chores/[choreId]` edits a chore
- `DELETE /api/households/[id]/chores/[choreId]` removes a chore (Owner/Admin only)
- `/households/[id]/chores` page — list view with filter tabs: All, Mine, Unassigned, Overdue, Completed
- `/households/[id]/chores/new` — create chore form
- `/households/[id]/chores/[choreId]` — detail/edit view
- A background check marks chores as OVERDUE when dueDate has passed (run on page load / API call)

**Todo List:**
- [ ] Create permission helper `src/lib/permissions.ts` — `hasPermission(member, permission)` util
- [ ] Create `GET` and `POST` handlers for `/api/households/[id]/chores`
- [ ] Create `GET`, `PATCH`, `DELETE` handlers for `/api/households/[id]/chores/[choreId]`
- [ ] Create chore list page with filter tabs and `ChoreCard` component
- [ ] Create chore new/edit form page with all fields (title, description, difficulty selector, points, due date, assignee picker)
- [ ] Create chore detail page
- [ ] Add OVERDUE status update logic on chore list fetch

**Relevant Context:** ST-3 must be complete. `Chore` model. `HouseholdMember.permissions` JSON. `hasPermission` util is shared across all subsequent sub-tasks.

---

### ST-5: Chore Completion & Scoring Engine
**Status:** [ ] pending

**Intent:** Members can mark their assigned chore as complete. Admins can approve. On approval (or immediate if no approval required), the scoring engine calculates final points and updates the user's `totalPoints`.

**Expected Outcomes:**
- `POST /api/households/[id]/chores/[choreId]/complete` — sets status to IN_REVIEW (or COMPLETED if no approval needed), creates `ChoreCompletion` record
- `POST /api/households/[id]/chores/[choreId]/approve` — approves completion, triggers scoring
- Scoring engine in `src/lib/scoring.ts` implements the formula from the Scoring System section
- `UserStreak` is updated on each completion — streak resets if >24h gap between completions
- `User.totalPoints` updated atomically
- Chore card shows "Mark Complete" button to assigned user, "Approve" button to eligible members

**Todo List:**
- [ ] Create `src/lib/scoring.ts` with `calculatePoints(chore, completion, streak)` function
- [ ] Create `src/lib/streaks.ts` with `updateStreak(userId, householdId, completedAt)` function
- [ ] Create `POST .../complete` route handler
- [ ] Create `POST .../approve` route handler (checks `canApproveCompletions` permission)
- [ ] Update `ChoreCard` to show contextual action buttons based on user role/assignment
- [ ] Add completion history view on chore detail page (who completed, points awarded, when)

**Relevant Context:** ST-4 must be complete. `ChoreCompletion`, `UserStreak` models. Scoring formula in Scoring System section above.

---

### ST-6: Badge System
**Status:** [ ] pending

**Intent:** Milestone and behaviour badges are auto-awarded after each chore completion. Temporary badges are auto-managed. Admins can create and award custom badges.

**Expected Outcomes:**
- `src/lib/badges.ts` — `checkAndAwardBadges(userId, householdId)` runs after every scoring event
- All system milestone and behaviour badges from the Badge System section are seeded into the DB
- `UserBadge` records created when conditions met (idempotent — don't double-award permanent badges)
- Temporary negative badges (Slacker, Overdue) auto-applied on a scheduled check triggered by page load
- Exempt badge applied/removed when `isExempt` toggled
- `/households/[id]/badges` page — lists system badges + custom badges, shows who earned what
- Custom badge create form (Admin/Owner only)
- Award badge modal on member card (for users with `canAwardBadges`)
- Badges visible on member cards (up to 3 shown, +N overflow)

**Todo List:**
- [ ] Create badge seed script `prisma/seed.ts` to insert all system badges
- [ ] Create `src/lib/badges.ts` with `checkAndAwardBadges` logic for all milestone + behaviour badges
- [ ] Create temporary badge logic — `applyTemporaryBadges(householdId)` checks all members
- [ ] Create `GET /api/households/[id]/badges` and `POST` for custom badge creation
- [ ] Create `POST /api/households/[id]/badges/[badgeId]/award` for manual award
- [ ] Update `POST .../complete` and `POST .../approve` to call `checkAndAwardBadges` after scoring
- [ ] Add badge icons to `MemberCard` component
- [ ] Build `/households/[id]/badges` management page

**Relevant Context:** ST-5 must be complete. `Badge`, `UserBadge` models. Badge definitions in Badge System section.

---

### ST-7: Member Management — Roles, Permissions & Exempt
**Status:** [ ] pending

**Intent:** Owners and Admins can view and manage household members — change roles, toggle individual permissions, set/remove exempt status, and remove members.

**Expected Outcomes:**
- `/households/[id]/members` page — table of all members with role, permission toggles, exempt toggle, remove button
- `GET /api/households/[id]/members` returns all members with roles and permissions
- `PATCH /api/households/[id]/members/[userId]` updates role, permissions JSON, or isExempt
- `DELETE /api/households/[id]/members/[userId]` removes member (Owner cannot be removed)
- Setting `isExempt = true` triggers Exempt badge; setting `false` removes it
- Role changes enforce hierarchy (Admins cannot promote to Owner, cannot demote Owner)

**Todo List:**
- [ ] Create `GET /api/households/[id]/members` route
- [ ] Create `PATCH /api/households/[id]/members/[userId]` route (role + permissions + exempt)
- [ ] Create `DELETE /api/households/[id]/members/[userId]` route
- [ ] Build `/households/[id]/members` page with member table
- [ ] Add permission toggle UI (checkbox or switch per permission per user)
- [ ] Wire exempt toggle to Exempt badge creation/removal
- [ ] Add invite code display + regeneration on this page (or in settings)

**Relevant Context:** ST-3 must be complete. `HouseholdMember.permissions` JSON schema. `hasPermission` util from ST-4.

---

### ST-8: Leaderboard & Profile
**Status:** [ ] pending

**Intent:** Each household has a ranked leaderboard. Each user has a profile page showing their stats across all households.

**Expected Outcomes:**
- `/households/[id]/leaderboard` — ranked table: position, avatar, name, points, badge count, current streak, top badges
- `GET /api/households/[id]/leaderboard` returns members sorted by totalPoints descending
- `/profile` — current user's own stats: total points across all households, all badges earned, chore completion rate, longest streak
- Member cards on household dashboard link to an inline stats modal (not a separate page)

**Todo List:**
- [ ] Create `GET /api/households/[id]/leaderboard` route
- [ ] Build `/households/[id]/leaderboard` page with ranked table
- [ ] Create `GET /api/profile` route aggregating stats across households
- [ ] Build `/profile` page
- [ ] Add quick-stats modal on `MemberCard` click (points history, badges, streak)

**Relevant Context:** ST-6 must be complete. All scoring and badge data available.

---

### ST-9: Household Settings & Invite Code
**Status:** [ ] pending

**Intent:** Owner can rename the household, regenerate the invite code, and delete the household.

**Expected Outcomes:**
- `/households/[id]/settings` page (Owner only)
- Invite code displayed with copy-to-clipboard button
- Regenerate invite code button (invalidates old code)
- Rename household form
- Delete household button with confirmation (cascades to all related records)

**Todo List:**
- [ ] Create `PATCH /api/households/[id]` for rename + invite code regeneration
- [ ] Create `DELETE /api/households/[id]` for deletion
- [ ] Build `/households/[id]/settings` page
- [ ] Add copy-to-clipboard util for invite code
- [ ] Ensure Prisma cascade deletes are configured in schema

**Relevant Context:** ST-3 must be complete. Schema cascade rules in `schema.prisma`.

---

### ST-10: AGENTS.md & Bob Team Setup
**Status:** [ ] pending

**Intent:** Commit a well-structured `AGENTS.md` and `.bob/rules/PROJECT.md` so all three team members' Bob instances load the same project context automatically when they open the repo.

**Expected Outcomes:**
- `AGENTS.md` in repo root describes: project purpose, tech stack, folder structure, data model summary, coding conventions
- `.bob/rules/PROJECT.md` contains: TypeScript strictness rules, Prisma usage patterns, naming conventions, API route patterns
- Both files committed to the repo
- README.md with setup instructions (clone, install, env vars, migrate, dev)

**Todo List:**
- [ ] Write `AGENTS.md` with full project context
- [ ] Write `.bob/rules/PROJECT.md` with coding standards
- [ ] Write `README.md` with local dev setup steps
- [ ] Commit all config files

**Relevant Context:** Can be done in parallel with or after ST-1.

---

## Implementation Order

```
ST-1 (Scaffold)
  └─ ST-2 (Auth)
       └─ ST-3 (Households)
            ├─ ST-4 (Chores CRUD)
            │    └─ ST-5 (Scoring)
            │         └─ ST-6 (Badges)
            │              └─ ST-8 (Leaderboard/Profile)
            ├─ ST-7 (Member Management)
            └─ ST-9 (Settings)

ST-10 (AGENTS.md) — can run alongside ST-1
```

---

## Non-Goals (v1)

- Push notifications / email reminders
- Mobile app (responsive web is sufficient)
- Real-time updates (polling or page refresh is fine)
- OAuth providers (Google, GitHub) — credentials only
- Photo uploads for avatars — coloured circle only
- Recurring chore automation (field exists but auto-generation deferred)
