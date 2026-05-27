'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Emoji scales ───────────────────────────────────────────────────────────────
const MOOD_EMOJI   = ['😞','😟','😕','😐','🙂','😊','😄','😁','🤩','🔥']
const ENERGY_EMOJI = ['🪫','😴','🥱','😑','😶','🙂','⚡','💥','🚀','🌟']

type Step = 'mood' | 'energy' | 'weight' | 'note' | 'done'

// ── Rating picker ─────────────────────────────────────────────────────────────
function RatingPicker({
  value, onChange, emojis, label,
}: { value: number; onChange: (v: number) => void; emojis: string[]; label: string }) {
  return (
    <div className="mb-8">
      <p className="text-[#888] text-sm mb-4 text-center">{label}</p>
      <div className="text-6xl text-center mb-5 select-none" style={{ transition: 'all 0.15s' }}>
        {emojis[value - 1]}
      </div>
      <div className="flex justify-between items-center gap-1 mb-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex-1 aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all"
            style={{
              background: n === value ? '#a3f510' : 'rgba(255,255,255,0.05)',
              color:      n === value ? '#000'    : n < value ? '#a3f510' : '#555',
              border:     n === value ? '2px solid #a3f510' : '2px solid transparent',
              transform:  n === value ? 'scale(1.12)' : 'scale(1)',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[#555] px-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CheckInPage() {
  const router = useRouter()

  const [step,        setStep]        = useState<Step>('mood')
  const [mood,        setMood]        = useState(5)
  const [energy,      setEnergy]      = useState(5)
  const [weight,      setWeight]      = useState('')
  const [trainerNote, setTrainerNote] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [result,      setResult]      = useState<{ awarded: number; alreadyDone: boolean } | null>(null)
  const [error,       setError]       = useState('')

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/health-logs/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          energy,
          weight:      weight ? parseFloat(weight) : undefined,
          trainerNote: trainerNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setResult({ awarded: data.awarded, alreadyDone: data.alreadyDone })
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <Screen>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="text-7xl mb-5">{result.alreadyDone ? '✅' : '🎉'}</div>
          <h2 className="font-heading text-3xl font-bold mb-2">
            {result.alreadyDone ? 'Already checked in!' : 'Check-in complete!'}
          </h2>
          {!result.alreadyDone && result.awarded > 0 && (
            <div className="text-primary font-heading font-black text-4xl mb-2">+{result.awarded} XP</div>
          )}
          <p className="text-[#888] text-sm mb-8">
            {result.alreadyDone
              ? 'Your data has been updated.'
              : 'Your trainer can see your check-in. Keep the streak going.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-[#8ad40e] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </Screen>
    )
  }

  const steps: Step[] = ['mood', 'energy', 'weight', 'note']
  const stepIdx = steps.indexOf(step)
  const progress = ((stepIdx + 1) / steps.length) * 100

  return (
    <Screen>
      {/* Progress bar */}
      <div className="h-1 bg-white/6 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-[#555] text-xs uppercase tracking-widest text-center mb-2">
        Step {stepIdx + 1} of {steps.length}
      </p>

      {/* ── Mood ─────────────────────────────────────────────────────────── */}
      {step === 'mood' && (
        <>
          <h2 className="font-heading text-2xl font-bold text-center mb-6">How are you feeling today?</h2>
          <RatingPicker value={mood} onChange={setMood} emojis={MOOD_EMOJI} label="Rate your overall mood" />
          <NavBtn onClick={() => setStep('energy')}>Next →</NavBtn>
        </>
      )}

      {/* ── Energy ───────────────────────────────────────────────────────── */}
      {step === 'energy' && (
        <>
          <h2 className="font-heading text-2xl font-bold text-center mb-6">What&apos;s your energy like?</h2>
          <RatingPicker value={energy} onChange={setEnergy} emojis={ENERGY_EMOJI} label="Rate your energy level" />
          <div className="flex gap-3">
            <NavBtn onClick={() => setStep('mood')} secondary>← Back</NavBtn>
            <NavBtn onClick={() => setStep('weight')}>Next →</NavBtn>
          </div>
        </>
      )}

      {/* ── Weight ───────────────────────────────────────────────────────── */}
      {step === 'weight' && (
        <>
          <h2 className="font-heading text-2xl font-bold text-center mb-2">Body weight today</h2>
          <p className="text-[#888] text-sm text-center mb-8">Optional — skip if you don&apos;t want to log it</p>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-8">
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 78.5"
              min="30"
              max="250"
              step="0.1"
              className="flex-1 bg-transparent text-white text-2xl font-bold outline-none placeholder-[#333]"
            />
            <span className="text-[#888] text-lg font-medium">kg</span>
          </div>
          <div className="flex gap-3">
            <NavBtn onClick={() => setStep('energy')} secondary>← Back</NavBtn>
            <NavBtn onClick={() => setStep('note')}>Next →</NavBtn>
          </div>
        </>
      )}

      {/* ── Trainer note ─────────────────────────────────────────────────── */}
      {step === 'note' && (
        <>
          <h2 className="font-heading text-2xl font-bold text-center mb-2">Note to your trainer</h2>
          <p className="text-[#888] text-sm text-center mb-6">Optional — anything they should know today</p>
          <textarea
            value={trainerNote}
            onChange={e => setTrainerNote(e.target.value)}
            rows={5}
            placeholder="e.g. Lower back tightness, skipped warm-up, feeling strong…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-[#444] outline-none focus:border-white/20 transition resize-none mb-6 text-sm"
          />
          {error && <p className="text-[#f87171] text-xs text-center mb-3">{error}</p>}
          <div className="flex gap-3">
            <NavBtn onClick={() => setStep('weight')} secondary>← Back</NavBtn>
            <NavBtn onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Check-in ✓'}
            </NavBtn>
          </div>
        </>
      )}
    </Screen>
  )
}

// ── Layout helpers ─────────────────────────────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
      <div className="w-full max-w-sm px-5 pt-12 pb-8">
        <a href="/dashboard" className="block text-[#888] text-sm mb-8 hover:text-white transition">
          ← Dashboard
        </a>
        {children}
      </div>
    </div>
  )
}

function NavBtn({
  children, onClick, secondary, disabled,
}: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition disabled:opacity-50 ${
        secondary
          ? 'bg-white/5 border border-white/10 text-[#888] hover:text-white'
          : 'bg-primary text-black hover:bg-[#8ad40e] active:scale-[0.98]'
      }`}
    >
      {children}
    </button>
  )
}
