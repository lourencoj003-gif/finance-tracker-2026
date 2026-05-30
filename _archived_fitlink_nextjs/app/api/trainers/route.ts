import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/trainers
// Returns the session trainer's active client list with today's activity status.
// status: 'green' = daily check-in done | 'amber' = some health/task activity | 'red' = nothing
export async function GET() {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (session.user.role !== 'TRAINER')
    return NextResponse.json({ error: 'Forbidden — trainer role required' }, { status: 403 })

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const links = await prisma.trainerClient.findMany({
    where:   { trainerId: session.user.id, active: true },
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
            select: { id: true, notes: true, tasksComplete: true },
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

  const clients = links.map(tc => {
    const c         = tc.client
    const summary   = c.dailySummaries[0] ?? null
    // A check-in stores JSON in notes; presence of notes with { indicates a proper check-in
    const checkedIn = !!summary?.notes?.startsWith('{')
    const hasActivity = !!c.healthLogs[0] || c.tasks.length > 0

    return {
      id:             c.id,
      name:           c.name,
      xp:             c.xp,
      level:          c.level,
      lastActive:     c.updatedAt.toISOString(),
      streak:         c.dailySnapshots[0]?.streakCount ?? 0,
      tasksDoneToday: c.tasks.length,
      status:         checkedIn ? 'green' : hasActivity ? 'amber' : 'red',
    }
  })

  return NextResponse.json({ clients })
}
