import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ── Data fetching ──────────────────────────────────────────────────────────────
async function getClients(trainerId: string) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const links = await prisma.trainerClient.findMany({
    where:   { trainerId, active: true },
    include: {
      client: {
        select: {
          id:        true,
          name:      true,
          xp:        true,
          level:     true,
          updatedAt: true,
          dailySummaries: {
            where:  { date: { gte: todayStart, lte: todayEnd } },
            take:   1,
            select: { notes: true },
          },
          healthLogs: {
            where:  { date: { gte: todayStart, lte: todayEnd } },
            take:   1,
            select: { id: true },
          },
          tasks: {
            where:  { status: 'COMPLETED', completedAt: { gte: todayStart, lte: todayEnd } },
            select: { id: true },
          },
          dailySnapshots: {
            orderBy: { date: 'desc' },
            take:    1,
            select:  { streakCount: true },
          },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  })

  return links.map(tc => {
    const c         = tc.client
    const summary   = c.dailySummaries[0]
    const checkedIn = !!summary?.notes?.startsWith('{')
    const hasActivity = !!c.healthLogs[0] || c.tasks.length > 0
    return {
      id:             c.id,
      name:           c.name,
      level:          c.level,
      lastActive:     c.updatedAt,
      streak:         c.dailySnapshots[0]?.streakCount ?? 0,
      tasksDoneToday: c.tasks.length,
      status:         (checkedIn ? 'green' : hasActivity ? 'amber' : 'red') as 'green' | 'amber' | 'red',
    }
  })
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS = {
  green: { dot: '#a3f510', label: 'Checked in',    bg: 'rgba(163,245,16,0.08)',  border: 'rgba(163,245,16,0.2)'  },
  amber: { dot: '#facc15', label: 'Some activity', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
  red:   { dot: '#f87171', label: 'No activity',   bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'TRAINER') redirect('/dashboard')

  let clients: Awaited<ReturnType<typeof getClients>> = []
  try {
    clients = await getClients(session.user.id)
  } catch {
    // DB not connected in dev — render empty shell
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">
          FITLINK
        </Link>
        {[
          { href: '/dashboard',         label: 'Home',    icon: '⌂' },
          { href: '/dashboard/clients', label: 'Clients', icon: '👥' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#888] hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <span className="text-lg w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="flex-1" />
        <div className="px-3 py-3 border-t border-white/5 text-xs text-[#555]">Trainer View</div>
      </aside>

      <main className="flex-1 md:ml-60 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-8">

          {/* Header */}
          <div className="mb-6">
            <p className="text-[#888] text-sm mb-0.5">{today}</p>
            <h1 className="font-heading text-3xl font-bold">My Clients</h1>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-6">
            {(Object.entries(STATUS) as [keyof typeof STATUS, typeof STATUS[keyof typeof STATUS]][]).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-[#888]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.dot }} />
                {v.label}
              </div>
            ))}
          </div>

          {/* Roster */}
          {clients.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-[#888] text-sm">No clients linked yet.</p>
              <p className="text-[#555] text-xs mt-1">Clients are linked via the TrainerClient table in the database.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {clients.map(c => {
                const s = STATUS[c.status]
                return (
                  <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                    className="block rounded-2xl p-4 border transition-all hover:bg-white/3 active:scale-[0.99]"
                    style={{ background: s.bg, borderColor: s.border }}>
                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.dot }} />

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-white text-sm truncate">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-[#888]">Lv.{c.level}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#666]">
                          {c.streak > 0 && <span>🔥 {c.streak}d streak</span>}
                          {c.tasksDoneToday > 0 && <span>✓ {c.tasksDoneToday} task{c.tasksDoneToday !== 1 ? 's' : ''} today</span>}
                          <span>Active {new Date(c.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <span className="text-[#555] text-sm">›</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden bg-[#0d0d0d]/95 backdrop-blur border-t border-white/5 flex">
        {[
          { href: '/dashboard',         label: 'Home',    icon: '⌂' },
          { href: '/dashboard/clients', label: 'Clients', icon: '👥' },
        ].map(item => (
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
