import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',     icon: '⌂' },
  { href: '/workouts',  label: 'Workouts', icon: '💪' },
  { href: '/nutrition', label: 'Nutrition', icon: '🥦' },
  { href: '/progress',  label: 'Progress', icon: '📈' },
  { href: '/profile',   label: 'Profile',  icon: '👤' },
]

interface StatCard {
  label:   string
  value:   string | number
  unit:    string
  goal:    number
  current: number
  color:   string
}

const stats: StatCard[] = [
  { label: 'Steps',    value: 0,     unit: 'today',   goal: 100, current: 0,  color: '#a3f510' },
  { label: 'Calories', value: 0,     unit: 'kcal',    goal: 100, current: 0,  color: '#facc15' },
  { label: 'Water',    value: 0,     unit: 'ml',      goal: 100, current: 0,  color: '#38bdf8' },
  { label: 'Sleep',    value: '—',   unit: 'hrs',     goal: 100, current: 0,  color: '#a78bfa' },
]

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r   = 36
  const circ = 2 * Math.PI * r  // ≈ 226
  const dash = (pct / 100) * circ

  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      {/* Track */}
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      {/* Progress */}
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">
          FITLINK
        </Link>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#888] hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            <span className="text-lg w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="flex-1" />
        <div className="px-3 py-3 border-t border-white/5 text-xs text-[#555]">
          FitLink Beta
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-8">

          {/* Welcome */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[#888] text-sm mb-0.5">Good morning 👋</p>
              <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-lg">
              👤
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
          <button className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-lg mb-6 hover:bg-[#8ad40e] transition-all active:scale-[0.98]">
            ⚡ Log Today
          </button>

          {/* Tasks section */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">Today's Tasks</h2>
              <button className="text-xs text-primary font-medium hover:underline">+ Add task</button>
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center py-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-[#888] text-sm">No tasks yet.</p>
              <p className="text-[#555] text-xs mt-1">Your trainer or you can add tasks here.</p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden bg-[#0d0d0d]/95 backdrop-blur border-t border-white/5 flex">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[#666] hover:text-white transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
