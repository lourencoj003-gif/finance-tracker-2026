# FitLink — Status Audit

> Last updated: 2026-05-28

---

## 1. What's Built

### Pages (Frontend)

| Route | File | Lines | Status | Notes |
|---|---|---|---|---|
| `/` | `app/page.tsx` | 97 | ✅ Done | Landing — feature cards, CTA, basic layout |
| `/login` | `app/login/page.tsx` | 91 | ✅ Done | Credentials form, styled |
| `/register` | `app/register/page.tsx` | 121 | ✅ Done | Role selection CLIENT/TRAINER |
| `/onboarding` | `app/onboarding/page.tsx` | 143 | ✅ Done | 4-step profile setup |
| `/dashboard` | `app/dashboard/page.tsx` | 303 | ✅ Done | Main layout, sidebar, bottom nav, stats widgets |
| `/dashboard/health` | `app/dashboard/health/page.tsx` | 273 | ✅ Done | Health log form (steps, water, sleep, weight, HR) |
| `/dashboard/checkin` | `app/dashboard/checkin/page.tsx` | 232 | ✅ Done | Daily check-in flow |
| `/dashboard/clients` | `app/dashboard/clients/page.tsx` | 184 | ✅ Done | Trainer: client list |
| `/dashboard/clients/[id]` | `app/dashboard/clients/[clientId]/page.tsx` | ~80 | ✅ Done | Client profile view (wrapper) |
| `/dashboard/nutrition` | `app/dashboard/nutrition/page.tsx` | 269 | ✅ Done | Nutrition log — meals + macro totals |
| `/dashboard/workouts` | ❌ Missing | — | ❌ Not built | No workout logging route |
| `/dashboard/progress` | ❌ Missing | — | ❌ Not built | No progress/charts view |

### API Routes (Backend)

| Route | File | Status | Notes |
|---|---|---|---|
| `POST /api/auth/register` | `app/api/auth/register/route.ts` | ✅ Done | bcrypt hash, user creation |
| `[...nextauth]` | `app/api/auth/[...nextauth]/route.ts` | ✅ Done | NextAuth v5 credentials handler |
| `GET/POST /api/health-logs` | `app/api/health-logs/route.ts` | ✅ Done | Daily health CRUD |
| `POST /api/health-logs/submit` | `app/api/health-logs/submit/route.ts` | ✅ Done | Submit + XP award |
| `GET/POST /api/nutrition-logs/food-entries` | `app/api/nutrition-logs/food-entries/route.ts` | ✅ Done | Meal food entry CRUD |
| `GET/POST /api/progress` | `app/api/progress/route.ts` | ✅ Done | Progress profile + snapshots |
| `POST /api/progress/award` | `app/api/progress/award/route.ts` | ✅ Done | Manual XP award |
| `GET /api/tasks` + `POST` | `app/api/tasks/route.ts` | ✅ Done | Task list + creation |
| `GET/PUT /api/trainers` | `app/api/trainers/route.ts` | ✅ Done | Trainer search |
| `GET /api/trainers/[clientId]` | `app/api/trainers/[clientId]/route.ts` | ✅ Done | Client detail |
| `POST /api/trainers/[clientId]/award-xp` | `app/api/trainers/[clientId]/award-xp/route.ts` | ✅ Done | Trainer awards XP to client |
| `/api/workouts` | ❌ Missing | ❌ Not built | Workout CRUD not wired |

### Data Layer

| Component | Status | Notes |
|---|---|---|
| `prisma/schema.prisma` | ✅ Complete | 12 models: User, HealthLog, NutritionLog, FoodEntry, Task, Workout, Connection, TrainerClient, DailySummary, ProgressProfile, XpEvent, DailyProgressSnapshot |
| `lib/prisma.ts` | ✅ Done | Singleton client |
| `lib/xp.ts` | ✅ Done | XP values, streak multipliers, level thresholds 1–10, level titles, helper functions |
| `auth.ts` | ✅ Done | NextAuth v5 JWT flow with bcrypt |
| `.env.example` | ✅ Done | Documents required vars |

### Infrastructure

| Component | Status |
|---|---|
| Next.js 15 App Router | ✅ Configured |
| TypeScript | ✅ Strict |
| Tailwind CSS | ✅ Volt green design system (`#a3f510` on `#0a0a0a`) |
| Recharts (installed) | ✅ Installed, not yet used |
| Lucide React (icons) | ✅ Used throughout |
| PostgreSQL + Prisma | ✅ Wired — needs live DB URL to run |
| NextAuth v5 | ✅ Wired — needs `NEXTAUTH_SECRET` + `NEXTAUTH_URL` |

---

## 2. Completion Estimate

| Area | Estimate |
|---|---|
| Data model (schema) | **100%** — fully normalised, production-ready |
| Backend API routes | **80%** — workout CRUD and messaging routes missing |
| Auth system | **90%** — functional; no social providers, no password reset |
| Frontend pages | **70%** — all core pages built; workouts and progress charts missing |
| UI polish / mobile | **50%** — Tailwind layout is correct; no animations, no empty states, no error UX |
| XP / gamification | **75%** — logic complete; no frontend level badge or XP feed UI |
| Trainer ↔ Client | **65%** — API built, client list built; no in-app messaging or workout assignment UI |
| Charts / analytics | **20%** — Recharts installed, no chart components built yet |

**Overall: ~65% to a working MVP.** The hard parts (schema, auth, API structure, nav) are done. What remains is UI completeness and the workout flow.

---

## 3. Recommendation

### Stay in this repo (Next.js 15 + Prisma). Do not migrate to Lovable.

**Rationale:**

1. **The hardest work is done.** The schema is production-grade, the API is 80% complete, and the auth flow works. Recreating this in Lovable would restart from scratch on the backend.

2. **Lovable's advantage (UI speed) is diminishing.** At 65% completion, the remaining work is domain-specific — workout logging, trainer assignment, XP display — where Lovable would need heavy prompting to get right. Claude Code can hit the same quality directly in this repo.

3. **PostgreSQL + Prisma is production-appropriate.** The 12-model schema with cascaded deletes, indexes, and enums would be degraded if replaced with Supabase's visual editor. The Prisma schema is the single source of truth for what FitLink _is_.

4. **Vercel deployment is trivial.** Next.js 15 deploys to Vercel in one command. Add Supabase Postgres (or Neon) as the DATABASE_URL. No architectural change needed.

5. **`lib/xp.ts` is non-trivial.** Level thresholds, streak multipliers, and progress helpers are precision-designed. Reproducing this in a Lovable prompt without drift is risky.

**When Lovable would be appropriate:** If starting from zero and prioritising demo speed over production correctness. At 65% done, the inflection point has passed.

---

## 4. Next 3 Sessions to MVP

### Session 1 — Workout Logging (4–5 hrs)

**Goal:** Clients can log a workout; trainers can assign workouts.

**What to build:**
- `app/api/workouts/route.ts` — GET (list), POST (create), PATCH (update status), DELETE
- `app/dashboard/workouts/page.tsx` — workout list, create form, exercise entries
- `app/dashboard/clients/[clientId]/ClientProfileView.tsx` — add "Assign Workout" tab
- Wire XP award on `WORKOUT_COMPLETE` from `lib/xp.ts`
- Add "Workouts" to sidebar nav in `app/dashboard/page.tsx`

**Commit:** `feat: FitLink — workout logging + trainer assignment`

---

### Session 2 — Progress Charts + XP Display (3–4 hrs)

**Goal:** Users see their history, level, and XP in a visual dashboard.

**What to build:**
- `app/dashboard/progress/page.tsx` — progress page with:
  - Weight trend chart (Recharts LineChart from `HealthLog.weight`)
  - XP history chart (Recharts BarChart from `XpEvent`)
  - Level badge with progress bar (using `getLevelProgress` from `lib/xp.ts`)
  - 30-day health snapshot grid (steps %, water %, sleep %)
- Level badge component shown in sidebar (next to username)
- XP event feed on dashboard: "You earned 100 XP for completing a workout"
- Add "Progress" to sidebar nav

**Commit:** `feat: FitLink — progress charts, XP display, level system UI`

---

### Session 3 — Polish, Empty States, and Vercel Deploy (3–4 hrs)

**Goal:** Production-ready. Clean empty states, error handling, deployed on Vercel.

**What to build:**
- Empty states for all list views (workouts, tasks, health log, clients)
- Loading skeletons (Tailwind `animate-pulse`) on dashboard widgets
- Error boundaries and toast notifications for failed API calls
- Password reset flow (send reset email — can be Resend or just mailto for now)
- Mobile bottom nav icons reviewed for all 6 routes
- Landing page (`app/page.tsx`) updated: real screenshots, trainer + client value props, pricing
- Vercel deployment:
  - `vercel.json` or `vercel.ts` config
  - Environment vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - Production PostgreSQL: Neon (free tier) or Supabase Postgres
  - `prisma db push` run against production DB
- `fitlink/README.md` updated with deploy instructions

**Commit:** `feat: FitLink — polish, empty states, Vercel deployment`

---

## 5. Files to Preserve Regardless of Any Refactor

| File | Reason |
|---|---|
| `prisma/schema.prisma` | Gold standard 12-model data schema — single source of truth |
| `lib/xp.ts` | Full XP logic with level thresholds, streak multipliers, helpers |
| `lib/prisma.ts` | Singleton pattern — prevents connection pool exhaustion in Next.js |
| `auth.ts` | NextAuth v5 setup — credentials + JWT |
| `fitlink/MIGRATION.md` | Detailed migration notes if Lovable import is ever needed |

---

*Audit by Claude Sonnet 4.6 on 2026-05-28. No code was modified.*
