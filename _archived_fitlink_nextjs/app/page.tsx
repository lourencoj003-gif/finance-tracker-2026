import Link from 'next/link'

const features = [
  {
    icon: '⚡',
    title: 'Real-time Progress',
    body: 'Log workouts, meals, sleep, and water. See your streaks and XP grow daily.',
  },
  {
    icon: '🔗',
    title: 'Stay Connected',
    body: 'Your trainer sees your logs in real time. No more waiting until the next session.',
  },
  {
    icon: '🎯',
    title: 'Hit Your Goals',
    body: 'Smart daily summaries and milestone tracking keep you moving in the right direction.',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-white">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-background/90 backdrop-blur border-b border-white/5">
        <span className="font-heading text-2xl font-bold text-primary tracking-wide">FITLINK</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#888] hover:text-white transition-colors">Sign in</Link>
          <Link href="/register" className="px-5 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-[#8ad40e] transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-widest uppercase">Now in beta</span>
        </div>

        <h1 className="font-heading text-[clamp(56px,12vw,120px)] font-black leading-none tracking-tight mb-6">
          FITLINK
        </h1>

        <p className="text-[clamp(18px,3vw,26px)] font-light text-[#888] max-w-xl leading-relaxed mb-12">
          Fitness that works between sessions.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/register" className="px-8 py-4 rounded-xl bg-primary text-black text-base font-bold hover:bg-[#8ad40e] transition-all hover:-translate-y-0.5">
            Get started free
          </Link>
          <Link href="/login" className="px-8 py-4 rounded-xl bg-white/5 border border-white/12 text-white text-base font-medium hover:bg-white/10 transition-all">
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-xs text-[#555]">No credit card required · Free during beta</p>
      </section>

      {/* FEATURE TILES */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4 text-center">Why FitLink</p>
        <h2 className="font-heading text-[clamp(32px,5vw,56px)] font-bold text-center mb-16 leading-tight">
          Everything your trainer<br />needs to keep you on track.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-8 hover:border-primary/30 transition-colors">
              <div className="text-3xl mb-5">{f.icon}</div>
              <h3 className="font-heading text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-24 px-6 border-t border-white/5">
        <h2 className="font-heading text-[clamp(32px,6vw,64px)] font-black mb-6 leading-tight">
          READY TO LEVEL UP?
        </h2>
        <Link href="/register" className="inline-block px-10 py-5 rounded-xl bg-primary text-black text-lg font-bold hover:bg-[#8ad40e] transition-all hover:-translate-y-1">
          Join FitLink →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 py-8 flex items-center justify-between text-xs text-[#555]">
        <span className="font-heading text-lg font-bold text-primary">FITLINK</span>
        <span>© 2026 FitLink. Built for athletes.</span>
      </footer>
    </main>
  )
}
