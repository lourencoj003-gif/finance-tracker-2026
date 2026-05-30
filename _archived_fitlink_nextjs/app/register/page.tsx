'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Role = 'CLIENT' | 'TRAINER'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<Role>('CLIENT')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Registration failed'); return }
    router.push('/onboarding')
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-heading text-3xl font-black text-primary mb-10 tracking-wide">
          FITLINK
        </Link>

        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-8">
          <h1 className="font-heading text-2xl font-bold mb-1">Create account</h1>
          <p className="text-[#888] text-sm mb-7">Start your FitLink journey today.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-[#888] mb-1.5 font-medium uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 font-medium uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8+ characters"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#888] mb-2 font-medium uppercase tracking-wider">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {(['CLIENT', 'TRAINER'] as Role[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      role === r
                        ? 'bg-primary text-black border-primary'
                        : 'bg-transparent text-[#888] border-white/12 hover:border-white/25'
                    }`}
                  >
                    {r === 'CLIENT' ? '🏋️ Client' : '👟 Trainer'}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3.5 rounded-xl bg-primary text-black font-bold text-base hover:bg-[#8ad40e] disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[#555] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
