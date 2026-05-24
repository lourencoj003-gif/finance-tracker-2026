# FitLink

> Fitness that works between sessions.

FitLink connects clients with their personal trainers through a shared platform for logging workouts, nutrition, health metrics, and goals. Trainers see client progress in real time. Clients stay accountable between sessions.

---

## Stack

| Layer    | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling  | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth     | NextAuth v5 (credentials + JWT) |
| Icons    | Lucide React |

---

## Project Structure

```
fitlink/
├── app/
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout + global CSS
│   ├── globals.css         # Tailwind + custom styles
│   ├── login/page.tsx      # Sign-in form
│   ├── register/page.tsx   # Registration + role selection
│   ├── onboarding/page.tsx # 4-step profile setup
│   ├── dashboard/page.tsx  # Main dashboard (sidebar + bottom nav)
│   └── api/auth/
│       ├── [...nextauth]/route.ts  # NextAuth handler
│       └── register/route.ts       # Registration API
├── auth.ts                 # NextAuth config (credentials, JWT)
├── lib/prisma.ts           # Prisma client singleton
├── prisma/schema.prisma    # Full 12-model schema
├── tailwind.config.ts
├── next.config.ts
└── .env.example
```

---

## Setup

### 1. Install dependencies
```bash
cd fitlink
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local — add DATABASE_URL and AUTH_SECRET
```

### 3. Push the database schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Database Schema

12 models covering the full FitLink feature surface:

| Model | Description |
|-------|-------------|
| `User` | Core user — name, email, role (CLIENT / TRAINER / ADMIN), XP, level |
| `HealthLog` | Daily steps, calories, water, sleep, weight, heart rate |
| `NutritionLog` | Meal-level nutrition tracking with macro breakdowns |
| `FoodEntry` | Individual food items linked to a NutritionLog |
| `Task` | Assigned or self-created tasks with XP reward and status |
| `Workout` | Planned/completed workouts with exercise JSON blob |
| `Connection` | Trainer↔client connection requests with status |
| `TrainerClient` | Active trainer-client relationship with notes |
| `DailySummary` | End-of-day rolled-up snapshot with goal percentages |
| `ProgressProfile` | User's goals, measurements, and daily targets |
| `XpEvent` | Ledger of XP awarded — reason + reference ID |
| `DailyProgressSnapshot` | Historical level/XP/streak snapshots for charts |

---

## Manual Steps Before Running

1. **DATABASE_URL** — provision a PostgreSQL database (Railway, Supabase, Neon, or local)
2. **AUTH_SECRET** — `openssl rand -base64 32`
3. **`npx prisma db push`** — applies the schema to the database

---

## Design Tokens

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Secondary | `#1a1a1a` |
| Primary (volt green) | `#a3f510` |
| Muted | `#888888` |
| Heading font | Barlow Condensed |
| Body font | Inter |
