import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

// GET /api/progress/history
// Returns last 30 days of DailyProgressSnapshots + workout completions
// Used by the Progress dashboard charts.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [snapshots, workouts, healthLogs] = await Promise.all([
    // XP + level snapshots (one per day)
    prisma.dailyProgressSnapshot.findMany({
      where:   { userId: session.user.id, date: { gte: since } },
      orderBy: { date: 'asc' },
      select:  { date: true, xpTotal: true, level: true, streakCount: true, weightKg: true },
    }),

    // Workouts — last 30 days completions
    prisma.workout.findMany({
      where: {
        userId:      session.user.id,
        completedAt: { gte: since },
        status:      'COMPLETED',
      },
      orderBy: { completedAt: 'asc' },
      select:  { completedAt: true, durationMin: true, xpReward: true, title: true },
    }),

    // Health logs — for body weight trend
    prisma.healthLog.findMany({
      where: {
        userId: session.user.id,
        date:   { gte: since },
        weight: { not: null },
      },
      orderBy: { date: 'asc' },
      select:  { date: true, weight: true, steps: true },
    }),
  ])

  return NextResponse.json({ snapshots, workouts, healthLogs })
}
