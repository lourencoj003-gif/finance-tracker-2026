'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id: 'photo',
    title: 'Add a profile photo',
    subtitle: "Put a face to the name. Skip if you'd like.",
  },
  {
    id: 'bio',
    title: 'Write a short bio',
    subtitle: 'Tell your trainer or clients a bit about yourself.',
  },
  {
    id: 'location',
    title: 'Where are you based?',
    subtitle: 'Used to match you with local trainers.',
  },
  {
    id: 'specialties',
    title: 'What are your focus areas?',
    subtitle: 'Select all that apply. Trainers: these show on your profile.',
  },
]

const SPECIALTIES = [
  'Weight loss', 'Muscle gain', 'Endurance', 'Flexibility',
  'HIIT', 'Strength', 'Nutrition', 'Recovery', 'Sports performance', 'General fitness',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]         = useState(0)
  const [bio, setBio]           = useState('')
  const [location, setLocation] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  function toggleSpecialty(s: string) {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else router.push('/dashboard')
  }

  const current = STEPS[step]
  const pct     = Math.round(((step + 1) / STEPS.length) * 100)

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="font-heading text-2xl font-black text-primary tracking-wide">FITLINK</span>
          <p className="text-[#888] text-sm mt-2">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/8 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-8 animate-slide-up">
          <h2 className="font-heading text-2xl font-bold mb-1">{current.title}</h2>
          <p className="text-[#888] text-sm mb-7">{current.subtitle}</p>

          {/* Step content */}
          {current.id === 'photo' && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-28 h-28 rounded-full bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center text-4xl">
                👤
              </div>
              <button className="px-6 py-2.5 rounded-xl bg-white/6 border border-white/12 text-sm text-[#ccc] hover:bg-white/10 transition-colors">
                Upload photo
              </button>
            </div>
          )}

          {current.id === 'bio' && (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. I'm a recreational runner training for my first marathon…"
              rows={4}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm outline-none focus:border-primary/50 transition-colors resize-none"
            />
          )}

          {current.id === 'location' && (
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. London, UK"
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm outline-none focus:border-primary/50 transition-colors"
            />
          )}

          {current.id === 'specialties' && (
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    selected.includes(s)
                      ? 'bg-primary text-black border-primary font-semibold'
                      : 'bg-transparent text-[#888] border-white/12 hover:border-white/25'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={next}
            className="flex-1 py-3.5 rounded-xl bg-transparent border border-white/12 text-[#888] text-sm hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={next}
            className="flex-[2] py-3.5 rounded-xl bg-primary text-black font-bold text-base hover:bg-[#8ad40e] transition-all"
          >
            {step < STEPS.length - 1 ? 'Continue →' : 'Go to Dashboard →'}
          </button>
        </div>
      </div>
    </main>
  )
}
