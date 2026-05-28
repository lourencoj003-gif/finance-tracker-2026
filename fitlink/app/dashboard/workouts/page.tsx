'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Home',      icon: '⌂' },
  { href: '/dashboard/health',    label: 'Health',    icon: '❤️' },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: '🥦' },
  { href: '/dashboard/workouts',  label: 'Workouts',  icon: '💪' },
  { href: '/dashboard/progress',  label: 'Progress',  icon: '📈' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
type Exercise = {
  name: string
  sets?: number
  reps?: number
  weight?: number
  notes?: string
}

type Workout = {
  id:          string
  title:       string
  description: string | null
  status:      'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  scheduledAt: string | null
  startedAt:   string | null
  completedAt: string | null
  durationMin: number | null
  xpReward:    number
  exercises:   Exercise[] | null
  notes:       string | null
  createdAt:   string
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  PLANNED:     'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Done',
  SKIPPED:     'Skipped',
}
const STATUS_COLOR: Record<string, string> = {
  PLANNED:     '#888',
  IN_PROGRESS: '#facc15',
  COMPLETED:   '#a3f510',
  SKIPPED:     '#f87171',
}

// ── Empty exercise row ────────────────────────────────────────────────────────
const emptyExercise = (): Exercise => ({ name: '', sets: undefined, reps: undefined, weight: undefined, notes: '' })

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function WorkoutModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Workout
  onClose: () => void
  onSave: (w: Workout) => void
}) {
  const [title,       setTitle]       = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt?.slice(0, 10) ?? '')
  const [notes,       setNotes]       = useState(initial?.notes ?? '')
  const [exercises,   setExercises]   = useState<Exercise[]>(
    (initial?.exercises ?? []).length > 0 ? (initial!.exercises ?? []) : [emptyExercise()],
  )
  const [err, setErr]     = useState('')
  const [pending, start]  = useTransition()

  function updateExercise(i: number, field: keyof Exercise, val: string) {
    setExercises(prev => {
      const copy = [...prev]
      if (field === 'sets' || field === 'reps' || field === 'weight') {
        copy[i] = { ...copy[i], [field]: val === '' ? undefined : Number(val) }
      } else {
        copy[i] = { ...copy[i], [field]: val }
      }
      return copy
    })
  }

  function addExercise() { setExercises(prev => [...prev, emptyExercise()]) }
  function removeExercise(i: number) { setExercises(prev => prev.filter((_, idx) => idx !== i)) }

  function submit() {
    if (!title.trim()) { setErr('Title is required'); return }
    setErr('')

    const cleanExercises = exercises.filter(e => e.name.trim())

    start(async () => {
      const method = initial ? 'PATCH' : 'POST'
      const url    = initial ? `/api/workouts/${initial.id}` : '/api/workouts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          scheduledAt: scheduledAt || null,
          exercises:   cleanExercises,
          notes:       notes.trim() || null,
          xpReward:    100,
        }),
      })

      if (res.ok) {
        const d = await res.json()
        onSave(d.workout)
        onClose()
      } else {
        const d = await res.json()
        setErr(d.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg mt-8 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-2xl font-bold">{initial ? 'Edit Workout' : 'Log Workout'}</h2>
          <button onClick={onClose} className="text-[#555] hover:text-white text-xl transition">✕</button>
        </div>

        {/* Title */}
        <label className="text-xs text-[#888] uppercase tracking-wider mb-1.5 block">Workout Name *</label>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Upper Body Push, Leg Day, 5K Run"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555] outline-none focus:border-white/20 transition mb-4"
        />

        {/* Description */}
        <label className="text-xs text-[#888] uppercase tracking-wider mb-1.5 block">Description</label>
        <input
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Optional overview"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555] outline-none focus:border-white/20 transition mb-4"
        />

        {/* Scheduled date */}
        <label className="text-xs text-[#888] uppercase tracking-wider mb-1.5 block">Scheduled Date</label>
        <input
          type="date" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition mb-4"
          style={{ colorScheme: 'dark' }}
        />

        {/* Exercises */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#888] uppercase tracking-wider">Exercises</label>
            <button
              onClick={addExercise}
              className="text-xs text-primary font-semibold hover:underline"
            >+ Add exercise</button>
          </div>

          <div className="flex flex-col gap-3">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                    placeholder="Exercise name (e.g. Bench Press)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white placeholder-[#444] outline-none focus:border-white/20 transition"
                  />
                  {exercises.length > 1 && (
                    <button onClick={() => removeExercise(i)} className="text-[#555] hover:text-[#f87171] text-sm transition">✕</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['sets', 'reps', 'weight'] as const).map(field => (
                    <div key={field}>
                      <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">
                        {field}{field === 'weight' ? ' (kg)' : ''}
                      </label>
                      <input
                        type="number" min="0" step={field === 'weight' ? '0.5' : '1'}
                        value={ex[field] ?? ''} onChange={e => updateExercise(i, field, e.target.value)}
                        placeholder="—"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/20 transition text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <label className="text-xs text-[#888] uppercase tracking-wider mb-1.5 block">Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="How did it feel? Any PRs? Injuries to note?"
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555] resize-none outline-none focus:border-white/20 transition mb-4"
        />

        {err && <p className="text-[#f87171] text-xs mb-3">{err}</p>}

        <button
          onClick={submit}
          disabled={pending}
          className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition disabled:opacity-50 active:scale-[0.98]"
        >
          {pending ? 'Saving…' : initial ? 'Save Changes' : 'Save Workout'}
        </button>
      </div>
    </div>
  )
}

// ── Complete workout modal ────────────────────────────────────────────────────
function CompleteModal({
  workout,
  onClose,
  onComplete,
}: {
  workout: Workout
  onClose: () => void
  onComplete: (updated: Workout, xp: { awarded: number; newXp: number; newLevel: number } | null) => void
}) {
  const [duration, setDuration] = useState('')
  const [notes,    setNotes]    = useState(workout.notes ?? '')
  const [pending,  start]       = useTransition()

  function complete() {
    start(async () => {
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status:     'COMPLETED',
          durationMin: duration ? Number(duration) : undefined,
          notes:       notes.trim() || null,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        onComplete(d.workout, d.xpResult)
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-heading text-xl font-bold mb-1">Complete Workout</h3>
        <p className="text-[#888] text-sm mb-5">{workout.title}</p>

        <label className="text-xs text-[#888] uppercase tracking-wider mb-1.5 block">Duration (minutes)</label>
        <input
          type="number" value={duration} onChange={e => setDuration(e.target.value)}
          placeholder="e.g. 45"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555] outline-none focus:border-white/20 transition mb-4"
        />

        <label className="text-xs text-[#888] uppercase tracking-wider mb-1.5 block">Session Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="How did it go? Any PRs, how you felt…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555] resize-none outline-none focus:border-white/20 transition mb-5"
        />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/8 border border-primary/15 mb-5">
          <span className="text-primary text-xl">⚡</span>
          <div>
            <div className="text-primary font-bold text-sm">+{workout.xpReward} XP</div>
            <div className="text-[#888] text-xs">You&apos;ll earn this on completion</div>
          </div>
        </div>

        <button
          onClick={complete}
          disabled={pending}
          className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition disabled:opacity-50 active:scale-[0.98]"
        >
          {pending ? 'Completing…' : '✓ Mark as Complete'}
        </button>
      </div>
    </div>
  )
}

// ── XP celebration banner ─────────────────────────────────────────────────────
function XpBanner({ awarded, newXp, onDismiss }: { awarded: number; newXp: number; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary text-black font-bold shadow-[0_0_40px_rgba(163,245,16,0.4)] animate-[slideDown_0.4s_ease-out]"
      style={{ animation: 'slideDown 0.4s ease-out' }}>
      <span className="text-2xl">⚡</span>
      <div>
        <div className="text-base font-black">+{awarded} XP earned!</div>
        <div className="text-[11px] font-medium opacity-70">{newXp.toLocaleString()} XP total</div>
      </div>
    </div>
  )
}

// ── Workout card ──────────────────────────────────────────────────────────────
function WorkoutCard({
  workout,
  onEdit,
  onComplete,
  onDelete,
}: {
  workout: Workout
  onEdit: () => void
  onComplete: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const exercises = workout.exercises ?? []
  const isDone    = workout.status === 'COMPLETED'
  const isSkipped = workout.status === 'SKIPPED'
  const statusColor = STATUS_COLOR[workout.status] ?? '#888'

  const dateStr = workout.scheduledAt
    ? new Date(workout.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : workout.completedAt
    ? `Completed ${new Date(workout.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : 'No date set'

  return (
    <div className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all ${isDone ? 'border-primary/20 opacity-80' : isSkipped ? 'border-white/4 opacity-50' : 'border-white/8'}`}>
      {/* Card header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}18`, color: statusColor }}>
                {STATUS_LABEL[workout.status]}
              </span>
              {workout.durationMin && (
                <span className="text-[10px] text-[#555]">⏱ {workout.durationMin}min</span>
              )}
            </div>
            <h3 className="font-heading font-bold text-lg text-white truncate">{workout.title}</h3>
            {workout.description && (
              <p className="text-[#888] text-xs mt-0.5 truncate">{workout.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] text-[#555]">📅 {dateStr}</span>
              {exercises.length > 0 && (
                <span className="text-[11px] text-[#555]">💪 {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
              )}
              <span className="text-[11px] text-primary font-semibold">+{workout.xpReward} XP</span>
            </div>
          </div>
          <span className="text-[#555] text-sm mt-1 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4">
          {/* Exercise list */}
          {exercises.length > 0 && (
            <div className="mt-3 mb-3">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Exercises</div>
              <div className="flex flex-col gap-1.5">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-[#888] font-medium flex-1">{ex.name}</span>
                    <span className="text-[#555] text-xs">
                      {[
                        ex.sets  ? `${ex.sets} sets`      : null,
                        ex.reps  ? `${ex.reps} reps`      : null,
                        ex.weight ? `${ex.weight}kg`      : null,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {workout.notes && (
            <div className="mt-2 p-2.5 rounded-xl bg-white/3 text-xs text-[#888] italic">
              "{workout.notes}"
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {!isDone && !isSkipped && (
              <button
                onClick={onComplete}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-[#8ad40e] transition active:scale-[0.98]"
              >
                ✓ Complete
              </button>
            )}
            <button
              onClick={onEdit}
              className="px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-xs text-white hover:bg-white/10 transition"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl bg-[#f87171]/8 border border-[#f87171]/20 text-xs text-[#f87171] hover:bg-[#f87171]/12 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const [workouts,     setWorkouts]     = useState<Workout[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState<'upcoming' | 'history'>('upcoming')
  const [showCreate,   setShowCreate]   = useState(false)
  const [editWorkout,  setEditWorkout]  = useState<Workout | null>(null)
  const [completeWkt,  setCompleteWkt]  = useState<Workout | null>(null)
  const [xpBanner,     setXpBanner]     = useState<{ awarded: number; newXp: number } | null>(null)
  const [, startDelete] = useTransition()

  // Load workouts
  useEffect(() => {
    fetch('/api/workouts')
      .then(r => r.json())
      .then(d => setWorkouts(d.workouts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = workouts.filter(w => w.status === 'PLANNED' || w.status === 'IN_PROGRESS')
  const history  = workouts.filter(w => w.status === 'COMPLETED' || w.status === 'SKIPPED')
    .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())

  function handleSave(w: Workout) {
    setWorkouts(prev => {
      const idx = prev.findIndex(x => x.id === w.id)
      return idx >= 0 ? prev.map(x => x.id === w.id ? w : x) : [w, ...prev]
    })
  }

  function handleComplete(updated: Workout, xpResult: { awarded: number; newXp: number; newLevel: number } | null) {
    setWorkouts(prev => prev.map(w => w.id === updated.id ? updated : w))
    if (xpResult) setXpBanner({ awarded: xpResult.awarded, newXp: xpResult.newXp })
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
      if (res.ok) setWorkouts(prev => prev.filter(w => w.id !== id))
    })
  }

  const displayList = tab === 'upcoming' ? upcoming : history

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">FITLINK</Link>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              item.href === '/dashboard/workouts'
                ? 'bg-white/8 text-white'
                : 'text-[#888] hover:text-white hover:bg-white/5'
            }`}>
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

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#888] text-sm mb-0.5">Train smart</p>
              <h1 className="font-heading text-3xl font-bold">Workouts</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-[#8ad40e] transition active:scale-[0.98]"
            >
              <span>+</span> Log Workout
            </button>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total done',  value: history.filter(w => w.status === 'COMPLETED').length, color: '#a3f510' },
              { label: 'This week',   value: history.filter(w => w.status === 'COMPLETED' && new Date(w.completedAt!).getTime() > Date.now() - 7 * 86400000).length, color: '#38bdf8' },
              { label: 'Planned',     value: upcoming.length, color: '#facc15' },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 text-center">
                <div className="font-heading font-black text-2xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/4 rounded-xl p-1 mb-5">
            {(['upcoming', 'history'] as const).map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  tab === t ? 'bg-white/10 text-white' : 'text-[#666] hover:text-[#999]'
                }`}>
                {t} {t === 'upcoming' ? `(${upcoming.length})` : `(${history.length})`}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-4">{tab === 'upcoming' ? '💪' : '🏆'}</div>
              <h3 className="font-heading text-xl font-bold mb-2 text-white">
                {tab === 'upcoming' ? 'No workouts planned' : 'No completed workouts yet'}
              </h3>
              <p className="text-[#555] text-sm max-w-xs">
                {tab === 'upcoming'
                  ? 'Log your first workout to start tracking your progress and earning XP.'
                  : 'Complete a workout to see it in your history.'}
              </p>
              {tab === 'upcoming' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-6 px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition active:scale-[0.98]"
                >
                  Log first workout →
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayList.map(w => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  onEdit={() => setEditWorkout(w)}
                  onComplete={() => setCompleteWkt(w)}
                  onDelete={() => handleDelete(w.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden bg-[#0d0d0d]/95 backdrop-blur border-t border-white/5 flex">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              item.href === '/dashboard/workouts' ? 'text-primary' : 'text-[#666] hover:text-white'
            }`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Modals */}
      {showCreate && (
        <WorkoutModal onClose={() => setShowCreate(false)} onSave={handleSave} />
      )}
      {editWorkout && (
        <WorkoutModal initial={editWorkout} onClose={() => setEditWorkout(null)} onSave={handleSave} />
      )}
      {completeWkt && (
        <CompleteModal
          workout={completeWkt}
          onClose={() => setCompleteWkt(null)}
          onComplete={handleComplete}
        />
      )}

      {/* XP banner */}
      {xpBanner && (
        <XpBanner
          awarded={xpBanner.awarded}
          newXp={xpBanner.newXp}
          onDismiss={() => setXpBanner(null)}
        />
      )}
    </div>
  )
}
