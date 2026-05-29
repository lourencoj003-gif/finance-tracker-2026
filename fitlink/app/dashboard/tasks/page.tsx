'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Home',      icon: '⌂' },
  { href: '/dashboard/health',    label: 'Health',    icon: '❤️' },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: '🥦' },
  { href: '/dashboard/workouts',  label: 'Workouts',  icon: '💪' },
  { href: '/dashboard/progress',  label: 'Progress',  icon: '📈' },
  { href: '/dashboard/tasks',     label: 'Tasks',     icon: '✓' },
]

const CATEGORIES = ['Fitness', 'Nutrition', 'Recovery', 'Lifestyle', 'Goal', 'Other']

// ── Types ─────────────────────────────────────────────────────────────────────
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

type Task = {
  id:          string
  title:       string
  description: string | null
  category:    string | null
  status:      TaskStatus
  dueDate:     string | null
  xpReward:    number
  createdAt:   string
  completedAt: string | null
}

// ── XP Banner ─────────────────────────────────────────────────────────────────
function XpBanner({ awarded, newXp, onDismiss }: { awarded: number; newXp: number; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary text-black font-bold shadow-[0_0_40px_rgba(163,245,16,0.4)]">
      <span className="text-2xl">⚡</span>
      <div>
        <div className="text-base font-black">+{awarded} XP — task complete!</div>
        <div className="text-[11px] font-medium opacity-70">{newXp.toLocaleString()} XP total</div>
      </div>
    </div>
  )
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onComplete,
  onDelete,
}: {
  task:       Task
  onComplete: (id: string) => void
  onDelete:   (id: string) => void
}) {
  const isDone    = task.status === 'COMPLETED'
  const isSkipped = task.status === 'SKIPPED'
  const overdue   = !isDone && !isSkipped && task.dueDate && new Date(task.dueDate) < new Date()

  const dueLbl = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className={`bg-[#1a1a1a] border rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-all ${
      isDone    ? 'border-primary/20 opacity-60'
      : isSkipped ? 'border-white/4 opacity-40'
      : overdue   ? 'border-[#f87171]/30'
      : 'border-white/8'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => !isDone && !isSkipped && onComplete(task.id)}
        disabled={isDone || isSkipped}
        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
          isDone
            ? 'border-primary bg-primary/20 text-primary'
            : 'border-white/20 hover:border-primary/60'
        }`}
      >
        {isDone && <span className="text-[10px] font-black text-primary">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${isDone ? 'line-through text-[#555]' : 'text-white'}`}>
            {task.title}
          </span>
          {task.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 text-[#888]">
              {task.category}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-[#666] mt-0.5 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {dueLbl && (
            <span className={`text-[10px] font-medium ${overdue ? 'text-[#f87171]' : 'text-[#555]'}`}>
              {overdue ? '⚠ overdue · ' : '📅 '}due {dueLbl}
            </span>
          )}
          <span className="text-[10px] text-primary font-semibold">+{task.xpReward} XP</span>
        </div>
      </div>

      {/* Delete */}
      {!isDone && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-[#444] hover:text-[#f87171] transition text-sm px-1 flex-shrink-0 mt-0.5"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: Task) => void }) {
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [category, setCategory] = useState('')
  const [dueDate,  setDueDate]  = useState('')
  const [err,      setErr]      = useState('')
  const [pending, start]        = useTransition()

  function submit() {
    if (!title.trim()) { setErr('Title is required'); return }
    setErr('')
    start(async () => {
      const res = await fetch('/api/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          description: desc.trim() || undefined,
          category:    category || undefined,
          dueDate:     dueDate || undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) { onCreate(d.task); onClose() }
      else setErr(d.error ?? 'Something went wrong')
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md mt-12 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-bold">New Task</h2>
          <button onClick={onClose} className="text-[#555] hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wider mb-1.5">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Complete 10,000 steps"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary/60 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wider mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(cat => cat === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === c ? 'bg-primary text-black' : 'bg-white/6 text-[#888] hover:bg-white/10 hover:text-white'
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wider mb-1.5">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        {err && <p className="text-[#f87171] text-xs mt-3">{err}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-[#888] text-sm font-semibold hover:bg-white/8 transition">Cancel</button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 py-3 rounded-xl bg-primary text-black text-sm font-bold hover:bg-[#8ad40e] transition active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks,      setTasks]     = useState<Task[]>([])
  const [loading,    setLoading]   = useState(true)
  const [tab,        setTab]       = useState<'active' | 'done'>('active')
  const [showCreate, setShowCreate] = useState(false)
  const [xpBanner,   setXpBanner]  = useState<{ awarded: number; newXp: number } | null>(null)
  const [,           startDelete]  = useTransition()

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => setTasks(d.tasks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'SKIPPED')
    .sort((a, b) => {
      // Overdue first, then by dueDate, then by createdAt
      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date() ? 0 : 1
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date() ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

  const done = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'SKIPPED')
    .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())

  const completedThisWeek = done.filter(t =>
    t.completedAt && new Date(t.completedAt).getTime() > Date.now() - 7 * 86400000
  ).length

  async function handleComplete(id: string) {
    const res = await fetch(`/api/tasks/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    const d = await res.json()
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === id ? d.task : t))
      if (d.xpResult) setXpBanner({ awarded: d.xpResult.awarded, newXp: d.xpResult.newXp })
    }
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (res.ok) setTasks(prev => prev.filter(t => t.id !== id))
    })
  }

  function handleCreated(task: Task) {
    setTasks(prev => [task, ...prev])
  }

  const displayList = tab === 'active' ? active : done

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">FITLINK</Link>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              item.href === '/dashboard/tasks'
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
              <p className="text-[#888] text-sm mb-0.5">Stay on track</p>
              <h1 className="font-heading text-3xl font-bold">Tasks</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-[#8ad40e] transition active:scale-[0.98]"
            >
              <span>+</span> Add Task
            </button>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Active',       value: active.length,         color: '#a3f510' },
              { label: 'Done this week', value: completedThisWeek,   color: '#38bdf8' },
              { label: 'Total done',   value: done.filter(t => t.status === 'COMPLETED').length, color: '#facc15' },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 text-center">
                <div className="font-heading font-black text-2xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/4 rounded-xl p-1 mb-5">
            {(['active', 'done'] as const).map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  tab === t ? 'bg-white/10 text-white' : 'text-[#666] hover:text-[#999]'
                }`}>
                {t} {t === 'active' ? `(${active.length})` : `(${done.length})`}
              </button>
            ))}
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/4 animate-pulse" />)}
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-4">{tab === 'active' ? '📋' : '🏆'}</div>
              <h3 className="font-heading text-xl font-bold mb-2 text-white">
                {tab === 'active' ? 'No active tasks' : 'No completed tasks yet'}
              </h3>
              <p className="text-[#555] text-sm max-w-xs">
                {tab === 'active'
                  ? 'Add a task to start working toward your goals and earning XP.'
                  : 'Complete a task to see it here.'}
              </p>
              {tab === 'active' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-6 px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-[#8ad40e] transition active:scale-[0.98]"
                >
                  Add first task →
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayList.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
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
              item.href === '/dashboard/tasks' ? 'text-primary' : 'text-[#666] hover:text-white'
            }`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Create modal */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />}

      {/* XP banner */}
      {xpBanner && (
        <XpBanner awarded={xpBanner.awarded} newXp={xpBanner.newXp} onDismiss={() => setXpBanner(null)} />
      )}
    </div>
  )
}
