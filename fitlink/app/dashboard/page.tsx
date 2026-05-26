import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLevelFromXp, getLevelProgress, LEVEL_TITLES, getStreakMultiplier, computeStreakFromSnapshots } from '@/lib/xp'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Home',      icon: '⌂' },
  { href: '/dashboard/health',     label: 'Health',    icon: '❤️' },
  { href: '/dashboard/nutrition',  label: 'Nutrition', icon: '🥦' },
  { href: '/dashboard/workouts',   label: 'Workouts',  icon: '💪' },
  { href: '/dashboard/progress',   label: 'Progress',  icon: '📈' },
]

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r    = 36
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

async function getUserData(userId: string) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [user, profile, todayHealth, todayNutrition, pendingTasks, snapshots] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true, xp: true, level: true },
    }),
    prisma.progressProfile.findUnique({ where: { userId } }),
    prisma.healthLog.findFirst({
      where:   { userId, date: { gte: todayStart, lte: todayEnd } },
      orderBy: { date: 'desc' },
    }),
    prisma.nutritionLog.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.task.findMany({
      where:   { userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'desc' },
      take:    5,
    }),
    prisma.dailyProgressSnapshot.findMany({
      where:   { userId },
      orderBy: { date: 'desc' },
      take:    60,
      select:  { date: true, streakCount: true },
    }),
  ])

  return { user, profile, todayHealth, todayNutrition, pendingTasks, snapshots }
}

export default async function DashboardPage() {
  const session = await auth()

  // ── Fetch real data if logged in ───────────────────────────────────────────
  let xp = 0, level = 1, levelTitle = 'Beginner'
  let levelProgress = { current: 0, required: 200, pct: 0 }
  let streakCount = 0, streakMultiplier = 1.0
  let userName = 'there'
  let stepGoal = 10000, waterGoal = 2500, sleepGoal = 8
  let stepsToday = 0, waterToday = 0, sleepToday = 0, mealsToday = 0
  let tasks: { id: string; title: string; status: string }[] = []

  if (session?.user?.id) {
    try {
      const d = await getUserData(session.user.id)
      if (d.user) {
        xp             = d.user.xp
        level          = getLevelFromXp(xp)
        levelTitle     = LEVEL_TITLES[level] ?? 'Beginner'
        levelProgress  = getLevelProgress(xp)
        userName       = d.user.name?.split(' ')[0] ?? 'there'
      }
      streakCount      = computeStreakFromSnapshots(d.snapshots)
      streakMultiplier = getStreakMultiplier(streakCount)

      if (d.profile) {
        stepGoal  = d.profile.dailyStepGoal
        waterGoal = d.profile.dailyWaterMlGoal
        sleepGoal = d.profile.dailySleepHrsGoal
      }
      stepsToday = d.todayHealth?.steps    ?? 0
      waterToday = d.todayHealth?.waterMl  ?? 0
      sleepToday = d.todayHealth?.sleepHrs ?? 0
      mealsToday = d.todayNutrition.length
      tasks      = d.pendingTasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
    } catch {
      // DB not connected in dev — render shell with zeros
    }
  }

  const stats = [
    { label: 'Steps',    value: stepsToday ? stepsToday.toLocaleString() : 0, unit: 'today',  goal: stepGoal,  current: stepGoal  > 0 ? Math.min(100, Math.round(stepsToday / stepGoal  * 100)) : 0, color: '#a3f510' },
    { label: 'Calories', value: 0,     unit: 'kcal',   goal: 100, current: 0,  color: '#facc15' },
    { label: 'Water',    value: waterToday ? `${waterToday}ml` : 0, unit: 'ml', goal: waterGoal, current: waterGoal > 0 ? Math.min(100, Math.round(waterToday / waterGoal * 100)) : 0, color: '#38bdf8' },
    { label: 'Sleep',    value: sleepToday ? `${sleepToday}h` : '—', unit: 'hrs', goal: sleepGoal, current: sleepGoal > 0 ? Math.min(100, Math.round(sleepToday / sleepGoal * 100)) : 0, color: '#a78bfa' },
  ]

  const dailyGoals = [
    { id: 'steps',     label: `Steps (${stepGoal.toLocaleString()} goal)`, done: stepsToday >= stepGoal && stepGoal > 0 },
    { id: 'water',     label: `Water (${waterGoal}ml goal)`,               done: waterToday >= waterGoal && waterGoal > 0 },
    { id: 'sleep',     label: `Sleep (${sleepGoal}h goal)`,                done: sleepToday >= sleepGoal && sleepGoal > 0 },
    { id: 'nutrition', label: `Log at least 3 meals`,                      done: mealsToday >= 3 },
    { id: 'health',    label: `Log health data`,                           done: stepsToday > 0 || waterToday > 0 || sleepToday > 0 },
  ]
  const goalsDone = dailyGoals.filter(g => g.done).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">
          FITLINK
        </Link>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#888] hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <span className="text-lg w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="flex-1" />
        <div className="px-3 py-3 border-t border-white/5 text-xs text-[#555]">FitLink Beta</div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-8">

          {/* Welcome + streak */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#888] text-sm mb-0.5">{greeting} 👋</p>
              <h1 className="font-heading text-3xl font-bold">{userName}</h1>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl leading-none mb-0.5">🔥</div>
              <div className="text-primary font-bold text-lg leading-none">{streakCount}</div>
              <div className="text-[#555] text-[10px] uppercase tracking-wider">day streak</div>
              {streakMultiplier > 1 && (
                <div className="text-[10px] text-[#facc15] font-bold mt-0.5">{streakMultiplier}× XP</div>
              )}
            </div>
          </div>

          {/* XP / Level bar */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-primary font-heading font-black text-lg">Lv.{level}</span>
                <span className="text-white font-semibold text-sm">{levelTitle}</span>
              </div>
              <span className="text-[#555] text-xs">{xp.toLocaleString()} XP</span>
            </div>
            <div className="relative h-2 bg-white/6 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${levelProgress.pct}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#555]">{levelProgress.current.toLocaleString()} XP</span>
              <span className="text-[10px] text-[#555]">{levelProgress.required.toLocaleString()} to next level</span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {stats.map(stat => (
              <div key={stat.label} className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 flex items-center gap-4">
                <ProgressRing pct={stat.current} color={stat.color} />
                <div>
                  <div className="text-[#888] text-xs uppercase tracking-wider mb-0.5">{stat.label}</div>
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[#555] text-xs">{stat.unit}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Log today CTA */}
          <Link href="/dashboard/health"
            className="flex items-center justify-center w-full py-4 rounded-2xl bg-primary text-black font-bold text-lg mb-6 hover:bg-[#8ad40e] transition-all active:scale-[0.98]">
            ⚡ Log Today
          </Link>

          {/* Daily goals checklist */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">Daily Goals</h2>
              <span className="text-xs text-[#888] font-medium">{goalsDone}/{dailyGoals.length} complete</span>
            </div>

            <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${Math.round(goalsDone / dailyGoals.length * 100)}%` }} />
            </div>

            <ul className="flex flex-col gap-2.5">
              {dailyGoals.map(goal => (
                <li key={goal.id} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{
                      borderColor: goal.done ? '#a3f510' : 'rgba(255,255,255,0.12)',
                      background:  goal.done ? 'rgba(163,245,16,0.12)' : 'transparent',
                      color:       goal.done ? '#a3f510' : 'transparent',
                    }}>
                    {goal.done ? '✓' : ''}
                  </div>
                  <span className="text-sm" style={{ color: goal.done ? '#e5e5e5' : '#888' }}>
                    {goal.label}
                  </span>
                  {goal.done && (
                    <span className="ml-auto text-[10px] text-primary font-semibold">+XP</span>
                  )}
                </li>
              ))}
            </ul>

            {goalsDone === dailyGoals.length && (
              <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <span className="text-primary text-sm font-bold">🎉 All goals complete — streak bonus earned!</span>
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">Today&apos;s Tasks</h2>
              <button className="text-xs text-primary font-medium hover:underline">+ Add task</button>
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-[#888] text-sm">No tasks yet.</p>
                <p className="text-[#555] text-xs mt-1">Your trainer or you can add tasks here.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {tasks.map(task => (
                  <li key={task.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0">
                    <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                    <span className="text-sm text-[#ccc]">{task.title}</span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#666] uppercase tracking-wider">
                      {task.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden bg-[#0d0d0d]/95 backdrop-blur border-t border-white/5 flex">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[#666] hover:text-white transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
