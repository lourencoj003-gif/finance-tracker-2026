import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ClientProfileView, { type ProfileProps } from './ClientProfileView'

type PageProps = { params: Promise<{ clientId: string }> }

async function getClientData(trainerId: string, clientId: string): Promise<ProfileProps | null> {
  const link = await prisma.trainerClient.findUnique({
    where: { trainerId_clientId: { trainerId, clientId } },
  })
  if (!link) return null

  const since30    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [client, healthLogs, nutritionLogs, tasks, todaySummary] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: clientId },
      select: { id: true, name: true, email: true, xp: true, level: true, avatarUrl: true, bio: true },
    }),
    prisma.healthLog.findMany({
      where:   { userId: clientId, date: { gte: since30 } },
      orderBy: { date: 'asc' },
      select:  { id: true, date: true, steps: true, calories: true, waterMl: true, sleepHrs: true, weight: true, heartRate: true },
    }),
    prisma.nutritionLog.findMany({
      where:   { userId: clientId, date: { gte: since30 } },
      orderBy: { date: 'desc' },
      take:    14,
      select:  { id: true, date: true, mealType: true, totalKcal: true, proteinG: true, carbsG: true, fatG: true },
    }),
    prisma.task.findMany({
      where:   { userId: clientId },
      orderBy: { createdAt: 'desc' },
      take:    25,
      select:  { id: true, title: true, category: true, status: true, dueDate: true, xpReward: true, createdAt: true, completedAt: true },
    }),
    prisma.dailySummary.findFirst({
      where:  { userId: clientId, date: { gte: todayStart, lte: todayEnd } },
      select: { notes: true },
    }),
  ])

  if (!client) return null

  // Serialise dates — server components can't pass Date objects to client components
  const serialise = <T extends Record<string, unknown>>(obj: T) =>
    JSON.parse(JSON.stringify(obj)) as T

  let todayCheckin: ProfileProps['todayCheckin'] = null
  if (todaySummary?.notes) {
    try { todayCheckin = JSON.parse(todaySummary.notes) } catch { /* ignore */ }
  }

  return {
    client:        serialise(client),
    healthLogs:    healthLogs.map(serialise),
    nutritionLogs: nutritionLogs.map(serialise),
    tasks:         tasks.map(serialise),
    todayCheckin,
    trainerNotes:  link.notes ?? '',
  }
}

export default async function ClientPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'TRAINER') redirect('/dashboard')

  const { clientId } = await params

  let data: ProfileProps | null = null
  try {
    data = await getClientData(session.user.id, clientId)
  } catch {
    // DB unavailable in dev — fall through to notFound
  }

  if (!data) notFound()

  return (
    <div className="min-h-screen bg-background text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0d0d0d] px-4 py-6 gap-1 fixed top-0 left-0 bottom-0">
        <Link href="/" className="font-heading text-2xl font-black text-primary tracking-wide mb-8 px-3">
          FITLINK
        </Link>
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#888] hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
          <span className="text-lg w-5 text-center">⌂</span> Home
        </Link>
        <Link href="/dashboard/clients" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white bg-white/5 text-sm font-medium">
          <span className="text-lg w-5 text-center">👥</span> Clients
        </Link>
        <div className="flex-1" />
        <div className="px-3 py-3 border-t border-white/5 text-xs text-[#555]">Trainer View</div>
      </aside>

      <main className="flex-1 md:ml-60">
        <div className="max-w-2xl mx-auto px-4 pt-8">
          {/* Back */}
          <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-white mb-6 transition">
            ← All clients
          </Link>

          <ClientProfileView {...data} />
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
