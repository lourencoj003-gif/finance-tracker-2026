import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { XP, getLevelFromXp } from '@/lib/xp'

// POST /api/workouts/log
// Quick-log a completed workout immediately (no planned → started → completed flow).
// Body:
//   workoutType:    string   (e.g. "Running", "Strength", "Yoga")
//   durationMinutes: number  (1 – 999)
//   intensity:       number  (1 – 10)
//   caloriesBurned?: number  (optional)
//   notes?:          string  (optional, max 500 chars)
//   hitTarget:       boolean (bonus XP if true)
//
// XP:
//   +150 XP  WORKOUT_QUICK_LOG (always)
//   + 50 XP  WORKOUT_TARGET_HIT (when hitTarget === true)
//
// Response: { ok, workout, awarded, newXp, newLevel }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: {
    workoutType?: string
    durationMinutes?: number
    intensity?: number
    caloriesBurned?: number
    notes?: string
    hitTarget?: boolean
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const workoutType     = String(body.workoutType ?? '').trim().slice(0, 100)
  const durationMinutes = Math.max(1, Math.min(999, parseInt(String(body.durationMinutes ?? 30), 10)))
  const intensity       = Math.max(1, Math.min(10, parseInt(String(body.intensity ?? 5), 10)))
  const caloriesBurned  = body.caloriesBurned ? Math.max(0, parseInt(String(body.caloriesBurned), 10)) : null
  const notes           = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : null
  const hitTarget       = body.hitTarget === true

  if (!workoutType) return NextResponse.json({ error: 'workoutType is required' }, { status: 400 })

  const now = new Date()

  // Store intensity / caloriesBurned / hitTarget in the exercises JSON field
  const exercisesMeta = {
    intensity,
    ...(caloriesBurned !== null ? { caloriesBurned } : {}),
    hitTarget,
  }

  // Create a COMPLETED workout record
  const workout = await prisma.workout.create({
    data: {
      userId:      session.user.id,
      title:       workoutType,
      status:      'COMPLETED',
      durationMin: durationMinutes,
      completedAt: now,
      notes:       notes ?? undefined,
      exercises:   exercisesMeta,
      xpReward:    XP.WORKOUT_QUICK_LOG + (hitTarget ? XP.WORKOUT_TARGET_HIT : 0),
    },
  })

  // ── Award XP ──────────────────────────────────────────────────────────────
  const baseXp   = XP.WORKOUT_QUICK_LOG
  const bonusXp  = hitTarget ? XP.WORKOUT_TARGET_HIT : 0
  const totalXp  = baseXp + bonusXp

  const updatedUser = await prisma.user.update({
    where:  { id: session.user.id },
    data:   { xp: { increment: totalXp } },
    select: { xp: true },
  })

  const newLevel = getLevelFromXp(updatedUser.xp)
  await prisma.user.update({ where: { id: session.user.id }, data: { level: newLevel } })

  // XP events
  await prisma.xpEvent.create({
    data: {
      userId:      session.user.id,
      amount:      baseXp,
      reason:      'WORKOUT_QUICK_LOG',
      referenceId: workout.id,
    },
  })

  if (hitTarget) {
    await prisma.xpEvent.create({
      data: {
        userId:      session.user.id,
        amount:      bonusXp,
        reason:      'WORKOUT_TARGET_HIT',
        referenceId: workout.id,
      },
    })
  }

  // Upsert today's DailyProgressSnapshot
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const existingSnap = await prisma.dailyProgressSnapshot.findFirst({
    where: { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
  })

  if (existingSnap) {
    await prisma.dailyProgressSnapshot.update({
      where: { id: existingSnap.id },
      data:  { xpTotal: updatedUser.xp, level: newLevel },
    })
  } else {
    await prisma.dailyProgressSnapshot.create({
      data: {
        userId:  session.user.id,
        date:    todayStart,
        xpTotal: updatedUser.xp,
        level:   newLevel,
      },
    })
  }

  return NextResponse.json({
    ok:      true,
    workout,
    awarded: totalXp,
    hitTarget,
    newXp:   updatedUser.xp,
    newLevel,
  })
}
