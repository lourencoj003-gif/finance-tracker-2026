'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getLevelFromXp, getLevelProgress, LEVEL_TITLES, getStreakMultiplier } from '@/lib/xp'

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Home',      icon: '⌂' },
  { href: '/dashboard/health',     label: 'Health',    icon: '❤️' },
  { href: '/dashboard/nutrition',  label: 'Nutrition', icon: '🥦' },
  { href: '/dashboard/workouts',   label: 'Workouts',  icon: '💪' },
  { href: '/dashboard/progress',   label: 'Progress',  icon: '📈' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface Snapshot {
  date:        string
  xpTotal:     number
  level:       number
  streakCount: number
  weightKg:    number | null
}

interface CompletedWorkout {
  completedAt: string
  durationMin: number | null
  xpReward:    number
  title:       string
}

interface HealthLog {
  date:   string
  weight: number | null
  steps:  number | null
}

interface ProgressData {
  user: {
    name:             string | null
    xp:               number
    level:            number
    levelTitle:       string
    levelProgress:    { current: number; required: number; pct: number }
    streakCount:      number
    streakMultiplier: number
  }
}

// ── Chart helpers ─────────────────────────────────────────────────────────────
function buildXpChart(snapshots: Snapshot[]) {
  const points: { day: string; xp: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d   = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const lbl = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const snap = snapshots.find(s => s.date.slice(0, 10) === key)
    points.push({ day: lbl, xp: snap?.xpTotal ?? 0 })
  }
  return points
}

function buildWeeklyWorkouts(workouts: CompletedWorkout[]) {
  // Last 4 calendar weeks, Mon–Sun
  const weeks: { week: string; count: number; xp: number }[] = []
  for (let w = 3; w >= 0; w--) {
    const now    = new Date()
    const day    = now.getDay() || 7  // Mon=1 … Sun=7
    const monThis = new Date(now)
    monThis.setDate(now.getDate() - (day - 1) - w * 7)
    monThis.setHours(0, 0, 0, 0)
    const sunThis = new Date(monThis)
    sunThis.setDate(monThis.getDate() + 6)
    sunThis.setHours(23, 59, 59, 999)

    const wkWorkouts = workouts.filter(wo => {
      const d = new Date(wo.completedAt)
      return d >= monThis && d <= sunThis
    })

    const label = w === 0
      ? 'This week'
      : w === 1
      ? 'Last week'
      : monThis.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    weeks.push({
      week:  label,
      count: wkWorkouts.length,
      xp:    wkWorkouts.reduce((a, wo) => a + wo.xpReward, 0),
    })
  }
  return weeks
}

function buildWeightChart(healthLogs: HealthLog[]) {
  return healthLogs
    .filter(l => l.weight !== null)
    .map(l => ({
      day:    new Date(l.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      weight: l.weight as number,
    }))
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ color: '#888', marginBottom: 3 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#a3f510', fontWeight: 600 }}>
          {p.value}{p.name === 'weight' ? ' kg' : p.name === 'xp' ? ' XP' : ''}
        </p>
      ))}
    </div>
  )
}

// ── Level badge colours ────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<number, string> = {
  1: '#888', 2: '#aaa', 3: '#60a5fa', 4: '#818cf8',
  5: '#c084fc', 6: '#f472b6', 7: '#fb923c', 8: '#facc15',
  9: '#a3f510', 10: '#a3f510',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const [progressData,   setProgressData]   = useState<ProgressData | null>(null)
  const [snapshots,      setSnapshots]      = useState<Snapshot[]>([])
  const [workouts,       setWorkouts]       = useState<CompletedWorkout[]>([])
  const [healthLogs,     setHealthLogs]     = useState<HealthLog[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeChart,    setActiveChart]    = useState<'xp' | 'workouts' | 'weight'>('xp')

  useEffect(() => {
    Promise.all([
      fetch('/api/progress').then(r => r.json()),
      fetch('/api/progress/history').then(r => r.json()),
    ])
      .then(([prog, hist]) => {
        setProgressData(prog)
        setSnapshots(hist.snapshots   ?? [])
        setWorkouts(hist.workouts     ?? [])
        setHealthLogs(hist.healthLogs ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const user         = progressData?.user
  const levelColor   = LEVEL_COLORS[user?.level ?? 1] ?? '#a3f510'
  const xpChartData  = buildXpChart(snapshots)
  const weeklyData   = buildWeeklyWorkouts(workouts)
  const weightData   = buildWeightChart(healthLogs)

  const totalWorkouts  = workouts.length
  const totalXpEarned  = snapshots.reduce((a, s) => Math.max(a, s.xpTotal), 0)
  const bestStreak     = snapshots.reduce((a, s) => Math.max(a, s.streakCount), 0)
  const avgDuration    = workouts.length
    ? Math.round(workouts.filter(w => w.durationMin).reduce((a, w) => a + (w.durationMin ?? 0), 0) / workouts.filter(w => w.durationMin).length)
    : 0

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">
          FITLINK
        </Link>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${item.href === '/dashboard/progress'
                ? 'bg-primary/10 text-primary'
                : 'text-[#888] hover:text-white hover:bg-white/5'}`}>
            <span className="text-lg w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-8">

          {/* Header */}
          <div className="mb-8">
            <p className="text-[#888] text-sm mb-0.5">Your journey</p>
            <h1 className="font-heading text-3xl font-bold">Progress</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 text-[#444] text-sm">Loading your progress…</div>
          ) : (
            <>
              {/* ── Level & XP ─────────────────────────────────────────── */}
              <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[#888] text-xs uppercase tracking-widest mb-1">Current Level</p>
                    <div className="flex items-center gap-3">
                      <span
                        style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40` }}
                        className="text-3xl font-black font-heading px-4 py-1 rounded-xl"
                      >
                        {user?.level ?? 1}
                      </span>
                      <div>
                        <p className="font-heading font-bold text-lg">{user?.levelTitle ?? 'Beginner'}</p>
                        <p className="text-[#888] text-xs">{user?.xp?.toLocaleString() ?? 0} XP total</p>
                      </div>
                    </div>
                  </div>

                  {/* Streak badge */}
                  <div className="text-right">
                    <p className="text-[#888] text-xs uppercase tracking-widest mb-1">Streak</p>
                    <p className="font-heading text-2xl font-bold">
                      🔥 {user?.streakCount ?? 0}
                    </p>
                    {(user?.streakCount ?? 0) >= 7 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#facc1520', color: '#facc15', border: '1px solid #facc1540' }}>
                        {user?.streakMultiplier ?? 1}× XP
                      </span>
                    )}
                  </div>
                </div>

                {/* XP progress bar */}
                {user && (
                  <div>
                    <div className="flex justify-between text-xs text-[#555] mb-1.5">
                      <span>Lv {user.level}</span>
                      <span>{user.levelProgress.current} / {user.levelProgress.required} XP</span>
                      <span>Lv {user.level + 1}</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${user.levelProgress.pct}%`, background: levelColor }}
                      />
                    </div>
                    <p className="text-[#555] text-xs mt-1.5 text-right">
                      {user.levelProgress.required - user.levelProgress.current} XP to {LEVEL_TITLES[(user.level + 1) as keyof typeof LEVEL_TITLES] ?? 'Max Level'}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Stats row ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Workouts (30d)', value: String(totalWorkouts), unit: '' },
                  { label: 'XP Earned',      value: totalXpEarned > 0 ? totalXpEarned.toLocaleString() : '—', unit: '' },
                  { label: 'Best Streak',    value: bestStreak > 0 ? String(bestStreak) : '—', unit: bestStreak > 0 ? 'days' : '' },
                  { label: 'Avg Duration',   value: avgDuration > 0 ? String(avgDuration) : '—', unit: avgDuration > 0 ? 'min' : '' },
                ].map(s => (
                  <div key={s.label} className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4">
                    <p className="text-[#888] text-xs uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      {s.value}<span className="text-sm font-normal text-[#888] ml-1">{s.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Chart tabs ─────────────────────────────────────────── */}
              <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
                <div className="flex gap-2 mb-5 border-b border-white/5 pb-4">
                  {([
                    { key: 'xp',       label: 'XP History' },
                    { key: 'workouts', label: 'Workout Frequency' },
                    { key: 'weight',   label: 'Body Weight' },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveChart(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${activeChart === tab.key
                          ? 'bg-primary/15 text-primary'
                          : 'text-[#888] hover:text-white'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* XP History */}
                {activeChart === 'xp' && (
                  <>
                    <p className="text-[#888] text-xs mb-4">Total XP by day — last 30 days</p>
                    {snapshots.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-[#444] text-sm">
                        No XP data yet — start logging!
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={xpChartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10 }} interval={6} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Line type="monotone" dataKey="xp" stroke="#a3f510" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </>
                )}

                {/* Workout Frequency */}
                {activeChart === 'workouts' && (
                  <>
                    <p className="text-[#888] text-xs mb-4">Completed workouts per week — last 4 weeks</p>
                    {workouts.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-[#444] text-sm">
                        No completed workouts yet — mark one as done!
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={weeklyData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="week" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <ReferenceLine y={3} stroke="rgba(163,245,16,0.2)" strokeDasharray="4 4" label={{ value: 'Goal: 3', fill: '#555', fontSize: 10 }} />
                          <Bar dataKey="count" fill="#a3f510" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {workouts.length > 0 && (
                      <p className="text-[#555] text-xs mt-3 text-center">
                        {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''} completed this month
                        {weeklyData[3]?.count > 0 && ` · ${weeklyData[3].count} this week`}
                      </p>
                    )}
                  </>
                )}

                {/* Body Weight */}
                {activeChart === 'weight' && (
                  <>
                    <p className="text-[#888] text-xs mb-4">Body weight trend — last 30 days</p>
                    {weightData.length < 2 ? (
                      <div className="h-40 flex items-center justify-center text-[#444] text-sm text-center px-8">
                        Log your weight in the Health section for at least 2 days to see the trend.
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={weightData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10 }} interval={Math.floor(weightData.length / 5)} tickLine={false} axisLine={false} />
                            <YAxis
                              tick={{ fill: '#555', fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickFormatter={v => `${v}kg`}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Line type="monotone" dataKey="weight" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between text-xs text-[#555] mt-2 px-1">
                          <span>Start: {weightData[0]?.weight}kg</span>
                          <span>
                            {weightData.length > 1 && (() => {
                              const diff = (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)
                              const num  = parseFloat(diff)
                              return (
                                <span style={{ color: num < 0 ? '#a3f510' : num > 0 ? '#f87171' : '#888' }}>
                                  {num > 0 ? '+' : ''}{diff}kg
                                </span>
                              )
                            })()}
                          </span>
                          <span>Now: {weightData[weightData.length - 1]?.weight}kg</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* ── Recent workouts list ─────────────────────────────── */}
              {workouts.length > 0 && (
                <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
                  <h2 className="font-heading font-bold mb-4">Recent Completions</h2>
                  <div className="space-y-2">
                    {workouts.slice(-6).reverse().map((wo, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{wo.title}</p>
                          <p className="text-[#555] text-xs">
                            {new Date(wo.completedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {wo.durationMin ? ` · ${wo.durationMin} min` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-primary">+{wo.xpReward} XP</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard/workouts"
                    className="block text-center text-xs text-[#888] hover:text-primary transition-colors mt-4">
                    View all workouts →
                  </Link>
                </div>
              )}

              {/* ── Level map ─────────────────────────────────────────── */}
              <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
                <h2 className="font-heading font-bold mb-4">Level Map</h2>
                <div className="space-y-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(lvl => {
                    const current = user?.level ?? 1
                    const done    = lvl < current
                    const active  = lvl === current
                    const col     = LEVEL_COLORS[lvl]
                    return (
                      <div key={lvl}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                          ${active ? 'border' : 'opacity-40'}`}
                        style={active ? {
                          background:   `${col}12`,
                          borderColor:  `${col}40`,
                        } : {}}>
                        <span
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black font-heading"
                          style={{ background: done || active ? `${col}25` : '#222', color: done || active ? col : '#555' }}
                        >
                          {done ? '✓' : lvl}
                        </span>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${active ? 'text-white' : ''}`}>
                            {LEVEL_TITLES[lvl as keyof typeof LEVEL_TITLES]}
                          </p>
                        </div>
                        {active && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${col}20`, color: col, border: `1px solid ${col}40` }}>
                            You are here
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            </>
          )}
        </div>
      </main>

      {/* ── Mobile bottom nav ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-white/5 flex items-center justify-around px-2 py-3 z-50">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all text-xs
              ${item.href === '/dashboard/progress' ? 'text-primary' : 'text-[#666]'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="hidden xs:block">{item.label}</span>
          </Link>
        ))}
      </nav>

    </div>
  )
}
