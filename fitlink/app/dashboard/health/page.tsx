'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Home',      icon: '⌂' },
  { href: '/dashboard/health',     label: 'Health',    icon: '❤️' },
  { href: '/dashboard/nutrition',  label: 'Nutrition', icon: '🥦' },
  { href: '/dashboard/workouts',   label: 'Workouts',  icon: '💪' },
  { href: '/dashboard/progress',   label: 'Progress',  icon: '📈' },
]

interface HealthLog {
  id: string
  date: string
  steps?: number | null
  calories?: number | null
  waterMl?: number | null
  sleepHrs?: number | null
  heartRate?: number | null
}

interface ChartPoint { day: string; steps: number }

function buildChartData(logs: HealthLog[]): ChartPoint[] {
  const points: ChartPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const log = logs.find(l => l.date.slice(0, 10) === key)
    points.push({ day: label, steps: log?.steps ?? 0 })
  }
  return points
}

export default function HealthPage() {
  const [logs, setLogs]     = useState<HealthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved]   = useState(false)

  // Form state
  const [steps,     setSteps]     = useState('')
  const [water,     setWater]     = useState('')
  const [sleep,     setSleep]     = useState('')
  const [calories,  setCalories]  = useState('')
  const [heartRate, setHeartRate] = useState('')

  useEffect(() => {
    fetch('/api/health-logs')
      .then(r => r.json())
      .then(d => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/health-logs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps:     steps     ? Number(steps)     : undefined,
          waterMl:   water     ? Number(water)     : undefined,
          sleepHrs:  sleep     ? Number(sleep)     : undefined,
          calories:  calories  ? Number(calories)  : undefined,
          heartRate: heartRate ? Number(heartRate) : undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Refresh logs
      const r = await fetch('/api/health-logs')
      const d = await r.json()
      setLogs(d.logs ?? [])
    } catch {
      // silently fail — offline / no DB in dev
    } finally {
      setSubmitting(false)
    }
  }

  const chartData = buildChartData(logs)
  const today = logs.find(l => l.date.slice(0, 10) === new Date().toISOString().slice(0, 10))

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
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[#888] text-sm mb-0.5">Track your body</p>
              <h1 className="font-heading text-3xl font-bold">Health</h1>
            </div>
            <button
              onClick={() => alert('Wearable sync coming soon — connect Apple Health or Garmin.')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-[#888] hover:text-white hover:border-white/25 transition-all"
            >
              <span>⌚</span> Sync wearable
            </button>
          </div>

          {/* 30-day steps chart */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Steps — last 30 days</h2>
              <span className="text-xs text-[#555]">Goal: 10,000/day</span>
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-[#444] text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a3f510" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#a3f510" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#555', fontSize: 10 }}
                    interval={6}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#555', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#888' }}
                    itemStyle={{ color: '#a3f510' }}
                    formatter={(v) => [`${Number(v ?? 0).toLocaleString()} steps`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="steps"
                    stroke="#a3f510"
                    strokeWidth={2}
                    fill="url(#stepsGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#a3f510' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Today's at-a-glance */}
          {today && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Steps',    value: today.steps?.toLocaleString() ?? '—', color: '#a3f510' },
                { label: 'Water',    value: today.waterMl ? `${today.waterMl}ml` : '—', color: '#38bdf8' },
                { label: 'Sleep',    value: today.sleepHrs ? `${today.sleepHrs}h` : '—', color: '#a78bfa' },
                { label: 'Heart',    value: today.heartRate ? `${today.heartRate}bpm` : '—', color: '#f87171' },
              ].map(s => (
                <div key={s.label} className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3 text-center">
                  <div className="text-[#555] text-[10px] uppercase tracking-wider mb-1">{s.label}</div>
                  <div className="font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Log today form */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
            <h2 className="font-heading text-xl font-bold mb-5">Log today</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-3">
                {/* Steps */}
                <div>
                  <label className="text-[#888] text-xs uppercase tracking-wider mb-1.5 block">Steps</label>
                  <input
                    type="number" value={steps} onChange={e => setSteps(e.target.value)}
                    placeholder="e.g. 8500"
                    className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]"
                  />
                </div>
                {/* Water */}
                <div>
                  <label className="text-[#888] text-xs uppercase tracking-wider mb-1.5 block">Water (ml)</label>
                  <input
                    type="number" value={water} onChange={e => setWater(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]"
                  />
                </div>
                {/* Sleep */}
                <div>
                  <label className="text-[#888] text-xs uppercase tracking-wider mb-1.5 block">Sleep (hrs)</label>
                  <input
                    type="number" step="0.5" value={sleep} onChange={e => setSleep(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]"
                  />
                </div>
                {/* Calories burned */}
                <div>
                  <label className="text-[#888] text-xs uppercase tracking-wider mb-1.5 block">Calories burned</label>
                  <input
                    type="number" value={calories} onChange={e => setCalories(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]"
                  />
                </div>
              </div>

              {/* Heart rate */}
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wider mb-1.5 block">Resting heart rate (bpm)</label>
                <input
                  type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)}
                  placeholder="e.g. 62"
                  className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]"
                />
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Saving…' : saved ? '✓ Saved' : 'Save health log'}
              </button>
            </form>
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
