'use client'

import { useState, useTransition } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
type HealthLog = {
  id: string
  date: string
  steps:    number | null
  calories: number | null
  waterMl:  number | null
  sleepHrs: number | null
  weight:   number | null
}

type NutritionLog = {
  id: string; date: string; mealType: string
  totalKcal: number; proteinG: number; carbsG: number; fatG: number
}

type Task = {
  id: string; title: string; category: string | null
  status: string; dueDate: string | null; xpReward: number; createdAt: string
}

type ClientData = {
  id: string; name: string; email: string
  xp: number; level: number; avatarUrl: string | null; bio: string | null
}

type CheckIn = { mood?: number; energy?: number; weight?: number; trainerNote?: string } | null

export type ProfileProps = {
  client:       ClientData
  healthLogs:   HealthLog[]
  nutritionLogs: NutritionLog[]
  tasks:        Task[]
  todayCheckin: CheckIn
  trainerNotes: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PENDING:     '#888',
  IN_PROGRESS: '#facc15',
  COMPLETED:   '#a3f510',
  SKIPPED:     '#f87171',
}

const CATEGORIES = ['workout', 'nutrition', 'habit', 'recovery']

// ── Assign task modal ─────────────────────────────────────────────────────────
function AssignTaskModal({ clientId, onClose, onDone }: { clientId: string; onClose: () => void; onDone: () => void }) {
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState('workout')
  const [dueDate,  setDueDate]  = useState('')
  const [target,   setTarget]   = useState('')
  const [err,      setErr]      = useState('')
  const [pending,  start]       = useTransition()

  function submit() {
    if (!title.trim()) { setErr('Title is required'); return }
    setErr('')
    start(async () => {
      const res = await fetch('/api/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: clientId, title, category, dueDate: dueDate || undefined, targetValue: target || undefined }),
      })
      if (res.ok) { onDone(); onClose() }
      else { const d = await res.json(); setErr(d.error ?? 'Failed to create task') }
    })
  }

  return (
    <Overlay onClose={onClose}>
      <Modal title="Assign Task">
        <Label>Title *</Label>
        <Input value={title} onChange={setTitle} placeholder="e.g. 3×10 squats at 60 kg" />
        <Label>Category</Label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Label>Due date</Label>
        <Input type="date" value={dueDate} onChange={setDueDate} />
        <Label>Target value (optional)</Label>
        <Input value={target} onChange={setTarget} placeholder="e.g. 60 kg, 5km, 10 000 steps" />
        {err && <p className="text-[#f87171] text-xs mb-2">{err}</p>}
        <ModalBtn onClick={submit} disabled={pending} primary>
          {pending ? 'Assigning…' : 'Assign Task'}
        </ModalBtn>
      </Modal>
    </Overlay>
  )
}

// ── Award XP modal ────────────────────────────────────────────────────────────
function AwardXpModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [amount, setAmount] = useState('50')
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<{ awarded: number; newXp: number } | null>(null)
  const [err,    setErr]    = useState('')
  const [pending, start]    = useTransition()

  function submit() {
    if (!reason.trim()) { setErr('Reason is required'); return }
    setErr('')
    start(async () => {
      const res = await fetch(`/api/trainers/${clientId}/award-xp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: parseInt(amount, 10), reason }),
      })
      if (res.ok) { const d = await res.json(); setResult(d) }
      else { const d = await res.json(); setErr(d.error ?? 'Failed') }
    })
  }

  if (result) {
    return (
      <Overlay onClose={onClose}>
        <Modal title="XP Awarded! 🎉">
          <div className="text-center py-4">
            <div className="text-4xl font-heading font-black text-primary mb-2">+{result.awarded} XP</div>
            <div className="text-[#888] text-sm">Total: {result.newXp.toLocaleString()} XP</div>
          </div>
          <ModalBtn onClick={onClose} primary>Done</ModalBtn>
        </Modal>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <Modal title="Award XP">
        <Label>Amount</Label>
        <Input type="number" value={amount} onChange={setAmount} min="1" max="1000" />
        <Label>Reason *</Label>
        <Input value={reason} onChange={setReason} placeholder="e.g. Nailed leg day" />
        {err && <p className="text-[#f87171] text-xs mb-2">{err}</p>}
        <ModalBtn onClick={submit} disabled={pending} primary>
          {pending ? 'Awarding…' : 'Award XP'}
        </ModalBtn>
      </Modal>
    </Overlay>
  )
}

// ── Notes section ─────────────────────────────────────────────────────────────
function TrainerNotes({ clientId, initial }: { clientId: string; initial: string }) {
  const [notes,   setNotes]   = useState(initial)
  const [saved,   setSaved]   = useState(false)
  const [pending, start]      = useTransition()

  function save() {
    start(async () => {
      await fetch(`/api/trainers/${clientId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    })
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg font-bold">Private Notes</h2>
        {saved && <span className="text-[10px] text-primary font-semibold">Saved ✓</span>}
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={4}
        placeholder="Notes visible only to you — goals, injuries, observations…"
        className="w-full bg-white/4 border border-white/8 rounded-xl p-3 text-sm text-white placeholder-[#555] resize-none outline-none focus:border-white/20 transition"
      />
      <button
        onClick={save}
        disabled={pending}
        className="mt-2 text-xs px-4 py-1.5 rounded-lg bg-white/6 border border-white/10 text-[#888] hover:text-white transition disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function ClientProfileView({ client, healthLogs, nutritionLogs, tasks, todayCheckin, trainerNotes }: ProfileProps) {
  const [showAssignTask, setShowAssignTask] = useState(false)
  const [showAwardXp,   setShowAwardXp]    = useState(false)
  const [taskList,      setTaskList]        = useState(tasks)

  // Build chart data — one point per day, fill missing with null
  const chartData = healthLogs.map(l => ({
    date:    new Date(l.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    Steps:   l.steps    ? Math.round(l.steps / 100) / 10 : null,  // in thousands
    Sleep:   l.sleepHrs ?? null,
    Weight:  l.weight   ?? null,
  }))

  return (
    <div className="pb-24 md:pb-8">
      {/* Client header */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">{client.name}</h1>
            <div className="flex items-center gap-2 text-xs text-[#888]">
              <span className="px-2 py-0.5 rounded bg-white/8">Lv.{client.level}</span>
              <span>{client.xp.toLocaleString()} XP</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAssignTask(true)}
              className="text-xs px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/15 transition">
              + Assign Task
            </button>
            <button
              onClick={() => setShowAwardXp(true)}
              className="text-xs px-3 py-2 rounded-xl bg-[#facc15]/10 border border-[#facc15]/20 text-[#facc15] font-semibold hover:bg-[#facc15]/15 transition">
              ✦ Award XP
            </button>
          </div>
        </div>

        {/* Today's check-in */}
        {todayCheckin ? (
          <div className="flex gap-4 p-3 rounded-xl bg-primary/6 border border-primary/15">
            <Stat label="Mood"   value={`${todayCheckin.mood ?? '—'}/10`}   color="#a3f510" />
            <Stat label="Energy" value={`${todayCheckin.energy ?? '—'}/10`} color="#38bdf8" />
            {todayCheckin.weight && <Stat label="Weight" value={`${todayCheckin.weight}kg`} color="#a78bfa" />}
            {todayCheckin.trainerNote && (
              <div className="flex-1 text-xs text-[#888] italic">"{todayCheckin.trainerNote}"</div>
            )}
          </div>
        ) : (
          <div className="text-xs text-[#555] px-3 py-2 rounded-xl border border-white/5">
            No check-in today yet
          </div>
        )}
      </div>

      {/* 30-day health chart */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
        <h2 className="font-heading text-xl font-bold mb-4">30-Day Overview</h2>
        {chartData.length === 0 ? (
          <div className="text-[#555] text-sm text-center py-8">No health data logged yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#555' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: '#555' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11 }}
                labelStyle={{ color: '#888' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              <Line type="monotone" dataKey="Steps" stroke="#a3f510" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Sleep"  stroke="#38bdf8" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Weight" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="text-[#555] text-[10px] mt-2">Steps in thousands · Sleep in hours · Weight in kg</p>
      </div>

      {/* Tasks */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Tasks</h2>
          <button onClick={() => setShowAssignTask(true)} className="text-xs text-primary font-medium hover:underline">+ Assign</button>
        </div>
        {taskList.length === 0 ? (
          <p className="text-[#555] text-sm text-center py-6">No tasks assigned yet</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {taskList.map(t => (
              <li key={t.id} className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0">
                <span className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[t.status] ?? '#888' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{t.title}</div>
                  <div className="text-[11px] text-[#555] mt-0.5 flex gap-2">
                    {t.category && <span>{t.category}</span>}
                    {t.dueDate && <span>Due {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-[#666] flex-shrink-0">
                  {t.status.toLowerCase().replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Nutrition (last 7 logs) */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 mb-6">
        <h2 className="font-heading text-xl font-bold mb-4">Recent Nutrition</h2>
        {nutritionLogs.length === 0 ? (
          <p className="text-[#555] text-sm text-center py-6">No nutrition logs yet</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {nutritionLogs.slice(0, 7).map(n => (
              <li key={n.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0 text-sm">
                <span className="text-[#888] text-xs w-20 flex-shrink-0">
                  {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className="capitalize text-white">{n.mealType}</span>
                <span className="ml-auto text-[11px] text-[#888]">{n.totalKcal} kcal · {Math.round(n.proteinG)}g P</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trainer notes */}
      <TrainerNotes clientId={client.id} initial={trainerNotes} />

      {/* Modals */}
      {showAssignTask && (
        <AssignTaskModal
          clientId={client.id}
          onClose={() => setShowAssignTask(false)}
          onDone={() => {
            // Optimistically reload — in prod you'd re-fetch
            setTaskList(prev => [{ id: Date.now().toString(), title: '(new task)', category: null, status: 'PENDING', dueDate: null, xpReward: 50, createdAt: new Date().toISOString() }, ...prev])
          }}
        />
      )}
      {showAwardXp && <AwardXpModal clientId={client.id} onClose={() => setShowAwardXp(false)} />}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="font-heading font-bold text-lg leading-none" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[#555] mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
      <h3 className="font-heading text-xl font-bold mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[#888] mb-1 mt-3">{children}</p>
}

function Input({ value, onChange, placeholder, type = 'text', min, max }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; min?: string; max?: string
}) {
  return (
    <input
      type={type} value={value} min={min} max={max} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555] outline-none focus:border-white/20 transition mb-1"
    />
  )
}

function ModalBtn({ children, onClick, disabled, primary }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full mt-4 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 ${
        primary
          ? 'bg-primary text-black hover:bg-[#8ad40e]'
          : 'bg-white/6 border border-white/10 text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none',
  marginBottom: 4,
}
