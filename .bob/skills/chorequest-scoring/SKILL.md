---
name: chorequest-scoring
description: Use when working on the ChoreQuest scoring engine, badge system, or streak logic — explains how the systems interlock and guides safe changes to them.
---

# ChoreQuest Scoring, Badges & Streaks

Use this skill when reading, changing, or debugging any part of the gamification engine:
`src/lib/scoring.ts`, `src/lib/badges.ts`, `src/lib/streaks.ts`, and the badge seed data in
`prisma/seed.ts`.

## How the systems interlock

When a chore is marked complete and approved, three things happen in sequence:

```
POST .../complete or .../approve
  │
  ├─ 1. scoring.ts → calculatePoints()    returns finalPoints (integer ≥ 1)
  │       uses: chore.basePoints, chore.difficulty, chore.dueDate,
  │             completedAt, UserStreak.currentStreak
  │
  ├─ 2. streaks.ts → updateStreak()       updates UserStreak record
  │       increments currentStreak if gap ≤ 24h, else resets to 1
  │       updates longestStreak if new record
  │
  └─ 3. badges.ts → checkAndAwardBadges() checks all badge conditions
          reads: User.totalPoints (after update), ChoreCompletion count,
                 UserStreak.currentStreak, UserStreak.longestStreak
          writes: UserBadge records (idempotent — checks for existing before insert)
```

The streak value used in step 1 must be the streak **before** step 2 updates it — read
`UserStreak.currentStreak` before calling `updateStreak()`.

## Scoring formula

```
finalPoints = floor(basePoints × difficultyMultiplier × streakMultiplier + earlyBonus − latePenalty)
minimum: 1
```

| Factor | Calculation |
|---|---|
| difficultyMultiplier | EASY=1.0, MEDIUM=1.5, HARD=2.0 |
| streakMultiplier | `1 + (0.1 × min(currentStreak, 10))` |
| earlyBonus | `+0.2 × basePoints` if `completedAt < dueDate − 24h`, else 0 |
| latePenalty | `−0.25 × basePoints` if `completedAt > dueDate`, else 0 |

Early bonus and late penalty are mutually exclusive. An exempt user scores 0 points (check
`HouseholdMember.isExempt` before calling `calculatePoints()`).

## Badge conditions reference

### Milestone badges (permanent, auto-awarded)

| Badge name | Condition to check |
|---|---|
| First Step | ChoreCompletion count for user in household = 1 |
| Getting Started | ChoreCompletion count = 10 |
| Century | User.totalPoints ≥ 100 |
| High Scorer | User.totalPoints ≥ 500 |
| Centurion | User.totalPoints ≥ 1000 |
| Chore Champion | ChoreCompletion count = 50 |

### Behaviour badges (permanent, auto-awarded)

| Badge name | Condition to check |
|---|---|
| On a Roll | UserStreak.currentStreak ≥ 3 |
| Hot Streak | UserStreak.currentStreak ≥ 7 |
| Unstoppable | UserStreak.currentStreak ≥ 14 |
| Early Bird | count of ChoreCompletions where wasEarly=true ≥ 5 |
| Perfect Week | all chores assigned in the past calendar week completed on time |
| Top of the House | highest totalPoints in household for the past 7 days |

### Temporary badges (auto-managed)

These are applied and removed separately from the completion flow. Call
`applyTemporaryBadges(householdId)` on household page load.

| Badge | Applied when | Removed when |
|---|---|---|
| Slacker | No completion in 3 days and at least 1 pending chore | Next completion |
| Overdue | Has 1+ chores with status=OVERDUE | All overdue chores resolved |
| Exempt | HouseholdMember.isExempt = true | isExempt set to false |

Temporary badges use `UserBadge.expiresAt = null` (they don't time out — they are removed
programmatically). When removing, delete the `UserBadge` record (do not set an expiry).

## Rules for safe changes

1. **Always read the current test for the function you are changing** before editing it
2. The scoring formula in `.bob/rules/AGENTS.md` is the source of truth — if the formula changes,
   update `AGENTS.md` first, then `scoring.ts`
3. Badge award logic must be **idempotent** — always do a `findFirst` check before creating a
   `UserBadge`. A duplicate unique constraint error means the guard is missing.
4. `updateStreak()` must be called after `calculatePoints()` — the streak used for scoring is the
   streak before the current completion
5. `User.totalPoints` must be updated atomically with the `ChoreCompletion` insert —
   use `prisma.$transaction()`
6. When adding a new system badge, add it to **both** `prisma/seed.ts` and the badge conditions
   table above. Re-run `npx prisma db seed` after schema migrations.

## Debugging tips

- If points look wrong, log the intermediate values: `basePoints`, `difficultyMultiplier`,
  `streakMultiplier`, `earlyBonus`, `latePenalty` before the `floor()` call
- If a badge is not being awarded, check: (1) the seed ran and the Badge record exists,
  (2) the `findFirst` guard is not blocking re-award due to a stale record, (3) `checkAndAwardBadges`
  is actually being called after the transaction commits
- Streak not incrementing: check that `lastCompletionDate` is being compared in UTC, not local time
