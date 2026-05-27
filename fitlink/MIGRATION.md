# FitLink — Lovable Migration Plan

Research document only. No code changes. Last updated: 2026-05-27.

---

## 1. What Exists in This Repo

The `fitlink/` directory contains a complete **Next.js 15 App Router scaffold** with full backend wiring.

### Pages
| Route | Status | Notes |
|---|---|---|
| `/` | ✅ Built | Landing page with feature cards and CTA |
| `/login` | ✅ Built | Credentials sign-in form |
| `/register` | ✅ Built | Registration + role selection (CLIENT / TRAINER) |
| `/onboarding` | ✅ Built | 4-step profile setup |
| `/dashboard` | ✅ Built | Main layout with sidebar + bottom nav |
| `/dashboard/health` | ✅ Built | Health log page |
| `/dashboard/checkin` | ✅ Built | Daily check-in page |
| `/dashboard/clients` | ✅ Built | Trainer: client list |
| `/dashboard/nutrition` | ✅ Built | Nutrition log page |

### API Routes
| Route | Purpose |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth credentials handler |
| `/api/auth/register` | User registration endpoint |
| `/api/health-logs` | CRUD for daily health logs |
| `/api/nutrition-logs` | CRUD for nutrition/meal logs |
| `/api/progress` | Progress profile + daily snapshots |
| `/api/tasks` | Task management (assigned + self-created) |
| `/api/trainers` | Trainer search and connection |

### Database
Full **Prisma schema** with 12 models at `prisma/schema.prisma`:
- `User`, `HealthLog`, `NutritionLog`, `FoodEntry`, `Task`, `Workout`
- `Connection`, `TrainerClient`, `DailySummary`, `ProgressProfile`, `XpEvent`, `DailyProgressSnapshot`

### Auth
`auth.ts` — NextAuth v5 credentials flow with bcrypt password hashing and JWT sessions.

### Lib
- `lib/prisma.ts` — Prisma client singleton
- `lib/xp.ts` — XP award logic

### Stack
- Next.js 15 + App Router
- TypeScript
- Tailwind CSS (volt green `#a3f510` design system)
- PostgreSQL + Prisma
- NextAuth v5
- Recharts (charting)
- Lucide React (icons)

---

## 2. What Likely Exists in the Lovable Version

Based on the architecture pack and Lovable's typical output:

| Feature | Repo | Lovable (estimated) |
|---|---|---|
| Landing page | ✅ Basic | ✅ Polished with animations, screenshots |
| Auth (login/register) | ✅ Functional | ✅ Styled, possibly Supabase Auth |
| Dashboard layout | ✅ Scaffold | ✅ More complete with all sidebar items |
| Health logging UI | ✅ Route exists | ✅ Likely has charts, streak display |
| Nutrition logging | ✅ Route exists | ✅ Likely has macro charts |
| Trainer ↔ Client views | ✅ Schema exists | ✅ Likely has full UI |
| Workout logging | ❌ Route missing in repo | ✅ Likely built |
| XP / level system | ✅ Schema + lib/xp.ts | ✅ Likely has level badge UI |
| Progress charts | ✅ Recharts installed | ✅ Likely has chart components |
| Mobile responsiveness | ✅ Tailwind | ✅ Likely better polish |
| Database | PostgreSQL + Prisma | Supabase (Postgres + Supabase client) |

**Key gap:** The repo likely has less UI polish and is missing the workout logging route compared to the Lovable version.

---

## 3. Source of Truth Recommendation

### Recommendation: **Keep Lovable as source of truth**

**Rationale:**
1. Lovable generates production-quality UI components — polished, mobile-first, and consistent
2. The repo scaffold is an API-first backend implementation, not a finished product
3. Migrating Lovable → repo (exporting clean code) is safer than rebuilding Lovable features from scratch
4. Lovable's Supabase integration is simpler to deploy than Prisma + self-managed Postgres
5. The 12-model Prisma schema can be recreated in Supabase SQL if needed

**Exception:** Keep `lib/xp.ts` and the Prisma schema as reference for Lovable's data model — these define the full feature surface and are worth preserving.

---

## 4. Migration Strategy

### Phase 1 — Export from Lovable

1. In Lovable, click **Share → Download code** (exports a `.zip` of the full project)
2. Alternatively: connect Lovable to GitHub → Lovable pushes to a branch automatically
3. The export will be a Vite + React (or Next.js) project — check the framework before importing

### Phase 2 — Import to This Repo

#### Option A: Replace fitlink/ wholesale (recommended)
```bash
# 1. Export Lovable project zip or clone from Lovable's GitHub push
# 2. Back up current repo state
git checkout -b fitlink-pre-migration

# 3. Replace fitlink/ directory entirely
rm -rf fitlink/
# Unzip/copy Lovable export into fitlink/

# 4. Check for conflicts
git diff --stat
```

#### Option B: Cherry-pick Lovable components
If Lovable uses React components, copy individual page components into the existing Next.js structure:
- Copy `src/pages/` or `src/app/` components from Lovable export
- Adapt imports to Next.js App Router conventions (`"use client"`, etc.)
- Replace Supabase calls with Prisma if staying on the current DB

---

## 5. Conflicts to Resolve

### Auth system
| Aspect | Repo | Lovable |
|---|---|---|
| Provider | NextAuth v5 (credentials) | Likely Supabase Auth or NextAuth |
| Session | JWT in cookie | Supabase JWT or similar |
| Resolution | Adopt whichever Lovable uses — don't mix |

### Database
| Aspect | Repo | Lovable |
|---|---|---|
| Client | Prisma | Likely Supabase JS client |
| Schema | SQL via Prisma migrations | Supabase table editor or migrations |
| Resolution | If using Supabase: drop Prisma, use Supabase client throughout. If staying on Prisma: point Prisma at Supabase's Postgres URL |

### Styling
| Aspect | Repo | Lovable |
|---|---|---|
| System | Tailwind (custom design tokens) | Likely shadcn/ui + Tailwind or Tailwind alone |
| Colors | Volt green `#a3f510` on black `#0a0a0a` | Unknown — check export |
| Resolution | Adopt Lovable's design system wholesale |

### Node version
- Repo: whatever system default is
- Lovable export: check `package.json` `engines` field
- Resolution: align both to Node 20 LTS

---

## 6. Exact Steps to Export from Lovable and Import to Repo

```
STEP 1 — Export
  a. Open fitlink project in Lovable
  b. Click Share (top right) → Download as ZIP
     — OR — connect GitHub: Settings → Sync to GitHub → choose branch
  c. Save zip to ~/Downloads/fitlink-lovable-export.zip

STEP 2 — Inspect the export
  a. Unzip: unzip fitlink-lovable-export.zip -d ~/fitlink-lovable
  b. Check framework: ls ~/fitlink-lovable → look for next.config.ts (Next.js) or vite.config.ts (Vite/React)
  c. Check auth: grep -r "supabase\|nextauth\|clerk" ~/fitlink-lovable --include="*.ts" --include="*.tsx" -l
  d. Check DB: grep -r "prisma\|supabase\|drizzle" ~/fitlink-lovable --include="*.ts" -l
  e. Note any .env.example vars needed

STEP 3 — Branch and replace
  git checkout main
  git pull
  git checkout -b fitlink/lovable-migration

  # Backup current fitlink
  cp -r fitlink/ fitlink-backup/

  # Replace with Lovable export
  rm -rf fitlink/
  cp -r ~/fitlink-lovable/ fitlink/

STEP 4 — Resolve dependencies
  cd fitlink
  npm install

  # If Supabase: add Supabase project URL + anon key to .env.local
  # If Prisma: update DATABASE_URL in .env.local

STEP 5 — Test locally
  npm run dev
  # Visit localhost:3000
  # Test: register → login → dashboard → log health → check trainer view

STEP 6 — Commit and PR
  git add fitlink/
  git commit -m "feat: FitLink — import Lovable export"
  git push origin fitlink/lovable-migration
  gh pr create --title "FitLink: Lovable migration" --body "Importing Lovable export — see fitlink/MIGRATION.md"
```

---

## 7. Post-Migration Checklist

- [ ] Auth works (register → login → session persists)
- [ ] Health log CRUD works
- [ ] Nutrition log CRUD works
- [ ] Trainer ↔ Client connection works
- [ ] XP + level system awards correctly
- [ ] Dashboard charts render
- [ ] Mobile layout correct (320px width)
- [ ] Vercel deployment succeeds
- [ ] Environment variables set in Vercel (DB URL, auth secret)
- [ ] Prisma schema (or Supabase) migration applied to production DB

---

## 8. What to Keep from This Repo Regardless

Even after a full Lovable import, preserve these for reference:

| File | Why Keep |
|---|---|
| `prisma/schema.prisma` | Gold standard for the full data model — 12 models with all relationships defined |
| `lib/xp.ts` | XP award logic — behavioural rules for the gamification system |
| `fitlink/README.md` | Design token reference and setup instructions |
| `fitlink/MIGRATION.md` | This document |

---

*This is a planning document only. No code was modified.*
