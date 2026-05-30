'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Home',      icon: '⌂' },
  { href: '/dashboard/health',     label: 'Health',    icon: '❤️' },
  { href: '/dashboard/nutrition',  label: 'Nutrition', icon: '🥦' },
  { href: '/dashboard/workouts',   label: 'Workouts',  icon: '💪' },
  { href: '/dashboard/progress',   label: 'Progress',  icon: '📈' },
  { href: '/dashboard/tasks',      label: 'Tasks',     icon: '✓' },
]

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch',     label: 'Lunch',     icon: '☀️' },
  { key: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { key: 'snacks',    label: 'Snacks',    icon: '🍎' },
] as const
type MealKey = typeof MEALS[number]['key']

interface FoodEntry {
  id:         string
  name:       string
  kcal:       number
  proteinG:   number
  carbsG:     number
  fatG:       number
  quantity:   number
  unit:       string
}
interface MealGroup { meal: string; entries: FoodEntry[]; totalKcal: number }

interface AiEstimate {
  name:       string
  kcal:       number
  proteinG:   number
  carbsG:     number
  fatG:       number
  quantity:   number
  unit:       string
  confidence: 'high' | 'medium' | 'low'
  reasoning:  string
}

const CAL_GOAL = 2000

const CONFIDENCE_COLORS: Record<string, string> = {
  high:   '#a3f510',
  medium: '#facc15',
  low:    '#f87171',
}

export default function NutritionPage() {
  const [activeTab,   setActiveTab]   = useState<MealKey>('breakfast')
  const [grouped,     setGrouped]     = useState<MealGroup[]>([])
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [saved,       setSaved]       = useState(false)

  // Entry mode: 'manual' | 'ai'
  const [entryMode,   setEntryMode]   = useState<'manual' | 'ai'>('manual')

  // Manual form state
  const [name,     setName]     = useState('')
  const [kcal,     setKcal]     = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG,   setCarbsG]   = useState('')
  const [fatG,     setFatG]     = useState('')
  const [qty,      setQty]      = useState('')
  const [unit,     setUnit]     = useState('g')

  // AI describe state
  const [aiDesc,      setAiDesc]      = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiEstimate,  setAiEstimate]  = useState<AiEstimate | null>(null)
  const [aiError,     setAiError]     = useState('')
  // Editable review state (after AI estimate arrives)
  const [revName,     setRevName]     = useState('')
  const [revKcal,     setRevKcal]     = useState('')
  const [revProtein,  setRevProtein]  = useState('')
  const [revCarbs,    setRevCarbs]    = useState('')
  const [revFat,      setRevFat]      = useState('')

  const fetchEntries = useCallback(async () => {
    try {
      const r = await fetch('/api/nutrition-logs/food-entries')
      const d = await r.json()
      setGrouped(d.grouped ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const totalCals  = grouped.reduce((s, g) => s + g.totalKcal, 0)
  const calPct     = Math.min(100, Math.round((totalCals / CAL_GOAL) * 100))
  const allEntries = grouped.flatMap(g => g.entries)

  const mealGroup  = grouped.find(g => g.meal === activeTab)
  const tabEntries = mealGroup?.entries ?? []
  const mealCals   = (m: string) => grouped.find(g => g.meal === m)?.totalKcal ?? 0

  // ── Manual form submit ──────────────────────────────────────────────
  async function addEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !kcal) return
    setSubmitting(true)
    try {
      await fetch('/api/nutrition-logs/food-entries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal:     activeTab,
          name:     name.trim(),
          kcal:     Number(kcal),
          proteinG: proteinG ? Number(proteinG) : 0,
          carbsG:   carbsG   ? Number(carbsG)   : 0,
          fatG:     fatG     ? Number(fatG)     : 0,
          quantity: qty      ? Number(qty)      : 1,
          unit,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      setName(''); setKcal(''); setProteinG(''); setCarbsG(''); setFatG(''); setQty('')
      await fetchEntries()
    } catch {}
    setSubmitting(false)
  }

  // ── AI estimate request ─────────────────────────────────────────────
  async function requestAiEstimate() {
    if (!aiDesc.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiEstimate(null)
    try {
      const r = await fetch('/api/nutrition/ai-parse', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDesc.trim() }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setAiEstimate(d as AiEstimate)
      setRevName(d.name)
      setRevKcal(String(d.kcal))
      setRevProtein(String(d.proteinG))
      setRevCarbs(String(d.carbsG))
      setRevFat(String(d.fatG))
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Could not estimate. Try again or enter manually.')
    }
    setAiLoading(false)
  }

  // ── Log AI-estimated entry (after review) ───────────────────────────
  async function logAiEntry() {
    if (!aiEstimate) return
    setSubmitting(true)
    try {
      await fetch('/api/nutrition-logs/food-entries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal:     activeTab,
          name:     revName || aiEstimate.name,
          kcal:     Number(revKcal)    || aiEstimate.kcal,
          proteinG: Number(revProtein) || aiEstimate.proteinG,
          carbsG:   Number(revCarbs)   || aiEstimate.carbsG,
          fatG:     Number(revFat)     || aiEstimate.fatG,
          quantity: aiEstimate.quantity,
          unit:     aiEstimate.unit,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      setAiDesc('')
      setAiEstimate(null)
      await fetchEntries()
    } catch {}
    setSubmitting(false)
  }

  // ── Switch mode — reset state ────────────────────────────────────────
  function switchMode(mode: 'manual' | 'ai') {
    setEntryMode(mode)
    setAiEstimate(null)
    setAiError('')
    setAiDesc('')
  }

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">FITLINK</Link>
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

          <div className="mb-8">
            <p className="text-[#888] text-sm mb-0.5">What you've eaten today</p>
            <h1 className="font-heading text-3xl font-bold">Nutrition</h1>
          </div>

          {/* Daily calorie card */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[#888] text-xs uppercase tracking-wider mb-0.5">Today's calories</div>
                <div className="text-3xl font-bold text-primary">{totalCals.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[#555] text-xs">Goal</div>
                <div className="text-lg font-semibold text-[#888]">{CAL_GOAL.toLocaleString()}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-white/6 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${calPct}%`,
                  background: calPct >= 100 ? '#f87171' : calPct >= 80 ? '#facc15' : '#a3f510',
                }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-[#555]">{calPct}% of goal</span>
              <span className="text-[10px] text-[#555]">{Math.max(0, CAL_GOAL - totalCals)} remaining</span>
            </div>

            {/* Macros */}
            {allEntries.length > 0 && (
              <div className="flex gap-3 mt-4">
                {[
                  { label: 'Protein', val: allEntries.reduce((s,e) => s + e.proteinG, 0), color: '#a78bfa' },
                  { label: 'Carbs',   val: allEntries.reduce((s,e) => s + e.carbsG,   0), color: '#facc15' },
                  { label: 'Fat',     val: allEntries.reduce((s,e) => s + e.fatG,     0), color: '#f87171' },
                ].map(m => (
                  <div key={m.label} className="flex-1 bg-white/4 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-[#666] mb-0.5">{m.label}</div>
                    <div className="text-sm font-bold" style={{ color: m.color }}>{m.val.toFixed(0)}g</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meal tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {MEALS.map(m => (
              <button key={m.key} onClick={() => setActiveTab(m.key)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activeTab === m.key ? 'rgba(163,245,16,0.12)' : 'rgba(255,255,255,0.04)',
                  border:     activeTab === m.key ? '1px solid rgba(163,245,16,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  color:      activeTab === m.key ? '#a3f510' : '#888',
                }}>
                <span>{m.icon}</span>
                <span>{m.label}</span>
                {mealCals(m.key) > 0 && <span className="text-[10px] opacity-70">{mealCals(m.key)} kcal</span>}
              </button>
            ))}
          </div>

          {/* Entries list */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-4">
            {loading ? (
              <div className="py-6 text-center text-[#444] text-sm">Loading…</div>
            ) : tabEntries.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-3xl mb-2">{MEALS.find(m => m.key === activeTab)?.icon}</div>
                <p className="text-[#555] text-sm">No {MEALS.find(m => m.key === activeTab)?.label.toLowerCase()} logged yet.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {tabEntries.map(entry => (
                  <li key={entry.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{entry.name}</div>
                      <div className="text-[#555] text-xs mt-0.5">
                        {[
                          `${entry.quantity}${entry.unit}`,
                          entry.proteinG > 0 ? `P ${entry.proteinG.toFixed(0)}g` : null,
                          entry.carbsG   > 0 ? `C ${entry.carbsG.toFixed(0)}g`   : null,
                          entry.fatG     > 0 ? `F ${entry.fatG.toFixed(0)}g`     : null,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div className="text-primary font-bold text-sm">{entry.kcal} kcal</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Add food section ─────────────────────────────────────────── */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
            {/* Mode toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold">
                Add to {MEALS.find(m => m.key === activeTab)?.label}
              </h3>
              <div className="flex bg-[#111] border border-white/8 rounded-xl p-0.5 gap-0.5">
                <button
                  onClick={() => switchMode('manual')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: entryMode === 'manual' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: entryMode === 'manual' ? '#fff' : '#555',
                  }}
                >Manual</button>
                <button
                  onClick={() => switchMode('ai')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                  style={{
                    background: entryMode === 'ai' ? 'rgba(163,245,16,0.12)' : 'transparent',
                    color: entryMode === 'ai' ? '#a3f510' : '#555',
                  }}
                >
                  <span>✦</span> AI Estimate
                </button>
              </div>
            </div>

            {/* ── Manual form ──────────────────────────────────────────── */}
            {entryMode === 'manual' && (
              <form onSubmit={addEntry} className="flex flex-col gap-3">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Food name (e.g. Oat porridge)" required
                  className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]" />

                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={kcal} onChange={e => setKcal(e.target.value)}
                    placeholder="Calories" required
                    className="col-span-2 bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]" />
                  <div className="flex gap-1">
                    <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty"
                      className="w-14 bg-[#111] border border-white/8 rounded-xl px-2 py-3 text-white text-sm focus:outline-none placeholder:text-[#444]" />
                    <select value={unit} onChange={e => setUnit(e.target.value)}
                      className="flex-1 bg-[#111] border border-white/8 rounded-xl px-1 py-3 text-[#888] text-xs focus:outline-none">
                      {['g', 'ml', 'oz', 'cup', 'tbsp', 'pcs'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Protein (g)', val: proteinG, set: setProteinG },
                    { label: 'Carbs (g)',   val: carbsG,   set: setCarbsG },
                    { label: 'Fat (g)',     val: fatG,     set: setFatG },
                  ].map(m => (
                    <input key={m.label} type="number" value={m.val} onChange={e => m.set(e.target.value)}
                      placeholder={m.label}
                      className="bg-[#111] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]" />
                  ))}
                </div>

                <button type="submit" disabled={submitting || !name || !kcal}
                  className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition-all active:scale-[0.98] disabled:opacity-40">
                  {submitting ? 'Adding…' : saved ? '✓ Added' : '+ Add food'}
                </button>
              </form>
            )}

            {/* ── AI Describe mode ─────────────────────────────────────── */}
            {entryMode === 'ai' && (
              <div className="flex flex-col gap-4">
                {/* No estimate yet — show describe input */}
                {!aiEstimate && (
                  <>
                    <div>
                      <p className="text-[#666] text-xs mb-2 leading-relaxed">
                        Describe what you ate in plain language — include portion size if you know it.
                        Claude will estimate the calories and macros.
                      </p>
                      <textarea
                        value={aiDesc}
                        onChange={e => setAiDesc(e.target.value)}
                        placeholder="e.g. Large chicken burrito with rice, black beans, cheese and sour cream from Chipotle"
                        rows={3}
                        maxLength={500}
                        className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444] resize-none"
                      />
                      <div className="text-[10px] text-[#444] text-right mt-1">{aiDesc.length}/500</div>
                    </div>

                    {aiError && (
                      <div className="text-xs text-[#f87171] bg-[#f871711a] border border-[#f8717130] rounded-xl px-4 py-3">
                        {aiError}
                      </div>
                    )}

                    <button
                      onClick={requestAiEstimate}
                      disabled={aiLoading || !aiDesc.trim()}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: 'rgba(163,245,16,0.15)', border: '1px solid rgba(163,245,16,0.3)', color: '#a3f510' }}
                    >
                      {aiLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Estimating…
                        </>
                      ) : (
                        <><span>✦</span> Estimate with AI</>
                      )}
                    </button>
                  </>
                )}

                {/* Estimate arrived — show review card */}
                {aiEstimate && (
                  <div>
                    {/* AI estimate header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-sm">✦</span>
                        <span className="text-sm font-semibold text-white">AI estimate</span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: CONFIDENCE_COLORS[aiEstimate.confidence],
                            background: `${CONFIDENCE_COLORS[aiEstimate.confidence]}18`,
                            border: `1px solid ${CONFIDENCE_COLORS[aiEstimate.confidence]}40`,
                          }}
                        >
                          {aiEstimate.confidence} confidence
                        </span>
                      </div>
                      <button
                        onClick={() => { setAiEstimate(null); setAiError('') }}
                        className="text-[#444] hover:text-[#888] text-sm transition-colors"
                      >re-describe</button>
                    </div>

                    {/* Reasoning */}
                    {aiEstimate.reasoning && (
                      <p className="text-[#555] text-xs italic mb-3 leading-relaxed">
                        {aiEstimate.reasoning}
                      </p>
                    )}

                    {/* Editable review fields */}
                    <div className="flex flex-col gap-2 mb-4">
                      <input
                        value={revName}
                        onChange={e => setRevName(e.target.value)}
                        placeholder="Food name"
                        className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-[#444]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-[#555] mb-1">Calories (kcal)</div>
                          <input
                            type="number"
                            value={revKcal}
                            onChange={e => setRevKcal(e.target.value)}
                            className="w-full bg-[#111] border border-primary/30 rounded-xl px-3 py-2 text-primary font-bold text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] text-[#555] mb-1">Protein (g)</div>
                          <input
                            type="number"
                            value={revProtein}
                            onChange={e => setRevProtein(e.target.value)}
                            className="w-full bg-[#111] border border-white/8 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-[#555] mb-1">Carbs (g)</div>
                          <input
                            type="number"
                            value={revCarbs}
                            onChange={e => setRevCarbs(e.target.value)}
                            className="w-full bg-[#111] border border-white/8 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] text-[#555] mb-1">Fat (g)</div>
                          <input
                            type="number"
                            value={revFat}
                            onChange={e => setRevFat(e.target.value)}
                            className="w-full bg-[#111] border border-white/8 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={logAiEntry}
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition-all active:scale-[0.98] disabled:opacity-40"
                    >
                      {submitting ? 'Logging…' : saved ? '✓ Logged' : 'Log this meal'}
                    </button>
                  </div>
                )}
              </div>
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
