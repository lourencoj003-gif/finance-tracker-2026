import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLevelFromXp, getLevelProgress, LEVEL_TITLES, getStreakMultiplier } from '@/lib/xp'

// GET /api/progress — full ProgressProfile + user XP, level, streak
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const [user, profile, latestSnapshot] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { id: true, name: true, xp: true, level: true },
    }),
    prisma.progressProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.dailyProgressSnapshot.findFirst({
      where:   { userId: session.user.id },
      orderBy: { date: 'desc' },
      select:  { streakCount: true, date: true, xpTotal: true, level: true },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const level          = getLevelFromXp(user.xp)
  const levelProgress  = getLevelProgress(user.xp)
  const streakCount    = latestSnapshot?.streakCount ?? 0
  const streakMultiplier = getStreakMultiplier(streakCount)

  return NextResponse.json({
    user: {
      id:    user.id,
      name:  user.name,
      xp:    user.xp,
      level,
      levelTitle:      LEVEL_TITLES[level] ?? 'Beginner',
      levelProgress,   // { current, required, pct }
      streakCount,
      streakMultiplier,
    },
    profile: profile ?? null,
  })
}
