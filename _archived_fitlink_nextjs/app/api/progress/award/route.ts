import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  XP, XpReason,
  getLevelFromXp,
  getStreakMultiplier,
  computeStreakFromSnapshots,
} from '@/lib/xp'

// POST /api/progress/award
// Body: { reason: XpReason, referenceId?: string }
// Awards XP to the session user, applies streak multiplier for STREAK_BONUS,
// updates User.xp + User.level, creates XpEvent, upserts DailyProgressSnapshot.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { reason, referenceId }: { reason: XpReason; referenceId?: string } = body

    if (!reason || !(reason in XP)) {
      return NextResponse.json({ error: `Invalid reason. Must be one of: ${Object.keys(XP).join(', ')}` }, { status: 400 })
    }

    // Get current streak from snapshots
    const recentSnapshots = await prisma.dailyProgressSnapshot.findMany({
      where:   { userId: session.user.id },
      orderBy: { date: 'desc' },
      take:    60,
      select:  { date: true, streakCount: true },
    })

    const currentStreak    = computeStreakFromSnapshots(recentSnapshots)
    const streakMultiplier = getStreakMultiplier(currentStreak)

    // Compute base XP, apply streak multiplier to STREAK_BONUS only
    const baseXp  = XP[reason]
    const awardXp = reason === 'STREAK_BONUS'
      ? Math.round(baseXp * streakMultiplier)
      : baseXp

    // Update user XP atomically
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data:  { xp: { increment: awardXp } },
      select: { xp: true },
    })

    const newLevel = getLevelFromXp(updatedUser.xp)

    // Sync level on user record if it changed
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { level: newLevel },
    })

    // Record XP event
    const xpEvent = await prisma.xpEvent.create({
      data: {
        userId:      session.user.id,
        amount:      awardXp,
        reason:      `${reason}${streakMultiplier > 1 && reason === 'STREAK_BONUS' ? ` (${streakMultiplier}x)` : ''}`,
        referenceId: referenceId ?? null,
      },
    })

    // Upsert today's DailyProgressSnapshot
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

    // Determine new streak: if this is a STREAK_BONUS award, increment streak by 1
    const newStreak = reason === 'STREAK_BONUS' ? currentStreak + 1 : currentStreak

    const existingSnap = await prisma.dailyProgressSnapshot.findFirst({
      where: { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
    })

    if (existingSnap) {
      await prisma.dailyProgressSnapshot.update({
        where: { id: existingSnap.id },
        data: {
          xpTotal:     updatedUser.xp,
          level:       newLevel,
          streakCount: newStreak,
        },
      })
    } else {
      await prisma.dailyProgressSnapshot.create({
        data: {
          userId:      session.user.id,
          date:        todayStart,
          xpTotal:     updatedUser.xp,
          level:       newLevel,
          streakCount: newStreak,
        },
      })
    }

    return NextResponse.json({
      awarded:    awardXp,
      reason,
      multiplier: reason === 'STREAK_BONUS' ? streakMultiplier : 1,
      newXp:      updatedUser.xp,
      newLevel,
      streakCount: newStreak,
      xpEventId:  xpEvent.id,
    })
  } catch (err) {
    console.error('[progress/award POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
