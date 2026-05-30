import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ clientId: string }> }

async function getLink(trainerId: string, clientId: string) {
  return prisma.trainerClient.findUnique({
    where: { trainerId_clientId: { trainerId, clientId } },
  })
}

// GET /api/trainers/[clientId]
// Full client data for the trainer: 30-day health logs, recent nutrition, tasks, snapshots, trainer notes.
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (session.user.role !== 'TRAINER')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { clientId } = await params
  const link = await getLink(session.user.id, clientId)
  if (!link) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const since30    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [client, healthLogs, nutritionLogs, tasks, snapshots, todaySummary] = await Promise.all([
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
    prisma.dailyProgressSnapshot.findMany({
      where:   { userId: clientId, date: { gte: since30 } },
      orderBy: { date: 'asc' },
      select:  { date: true, streakCount: true, xpTotal: true, level: true },
    }),
    prisma.dailySummary.findFirst({
      where:  { userId: clientId, date: { gte: todayStart, lte: todayEnd } },
      select: { notes: true },
    }),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Parse today's check-in from DailySummary.notes
  let todayCheckin: Record<string, unknown> | null = null
  if (todaySummary?.notes) {
    try { todayCheckin = JSON.parse(todaySummary.notes) } catch { /* ignore */ }
  }

  return NextResponse.json({
    client,
    healthLogs,
    nutritionLogs,
    tasks,
    snapshots,
    todayCheckin,
    trainerNotes: link.notes ?? '',
  })
}

// PATCH /api/trainers/[clientId]
// Update the trainer's private notes for this client (stored in TrainerClient.notes).
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (session.user.role !== 'TRAINER')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { clientId } = await params
  const link = await getLink(session.user.id, clientId)
  if (!link) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { notes } = await req.json()
  await prisma.trainerClient.update({
    where: { trainerId_clientId: { trainerId: session.user.id, clientId } },
    data:  { notes: String(notes ?? '') },
  })

  return NextResponse.json({ ok: true })
}
