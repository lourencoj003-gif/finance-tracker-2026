import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLevelFromXp } from '@/lib/xp'

const CHECK_IN_XP = 100

// POST /api/health-logs/submit
// Daily check-in: mood (1-10), energy (1-10), weight? (kg), trainerNote? (string)
// Creates/upserts today's DailySummary — stores check-in data as JSON in notes.
// Awards 100 XP (once per day — skip award if DailySummary already existed today).
//
// Body: { mood: number, energy: number, weight?: number, trainerNote?: string }
// Response: { ok: true, awarded: number, newXp: number, newLevel: number, alreadyDone: boolean }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body  = await req.json()
  const mood  = Math.min(10, Math.max(1, parseInt(String(body.mood ?? 5), 10)))
  const energy = Math.min(10, Math.max(1, parseInt(String(body.energy ?? 5), 10)))
  const weight = body.weight ? parseFloat(String(body.weight)) : null
  const trainerNote = typeof body.trainerNote === 'string' ? body.trainerNote.trim().slice(0, 500) : null

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const notesJson = JSON.stringify({
    mood,
    energy,
    ...(weight     ? { weight }      : {}),
    ...(trainerNote ? { trainerNote } : {}),
    checkedIn: true,
  })

  // Upsert DailySummary for today
  const existing = await prisma.dailySummary.findFirst({
    where: { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
  })

  const alreadyDone = !!existing?.notes?.startsWith('{')  // already checked in today

  if (existing) {
    await prisma.dailySummary.update({
      where: { id: existing.id },
      data:  { notes: notesJson },
    })
  } else {
    await prisma.dailySummary.create({
      data: {
        userId: session.user.id,
        date:   todayStart,
        notes:  notesJson,
      },
    })
  }

  // Update health log with weight if provided
  if (weight) {
    const existingLog = await prisma.healthLog.findFirst({
      where: { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
    })
    if (existingLog) {
      await prisma.healthLog.update({ where: { id: existingLog.id }, data: { weight } })
    } else {
      await prisma.healthLog.create({ data: { userId: session.user.id, date: todayStart, weight } })
    }
  }

  // Award XP only if this is the first check-in today
  let awarded = 0
  let newXp   = 0
  let newLevel = 1

  if (!alreadyDone) {
    const updated = await prisma.user.update({
      where:  { id: session.user.id },
      data:   { xp: { increment: CHECK_IN_XP } },
      select: { xp: true },
    })
    awarded  = CHECK_IN_XP
    newXp    = updated.xp
    newLevel = getLevelFromXp(updated.xp)

    await prisma.user.update({ where: { id: session.user.id }, data: { level: newLevel } })

    await prisma.xpEvent.create({
      data: {
        userId: session.user.id,
        amount: CHECK_IN_XP,
        reason: 'Daily check-in',
      },
    })

    // Upsert snapshot
    const existingSnap = await prisma.dailyProgressSnapshot.findFirst({
      where: { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
    })
    if (existingSnap) {
      await prisma.dailyProgressSnapshot.update({
        where: { id: existingSnap.id },
        data:  { xpTotal: newXp, level: newLevel },
      })
    } else {
      await prisma.dailyProgressSnapshot.create({
        data: {
          userId:  session.user.id,
          date:    todayStart,
          xpTotal: newXp,
          level:   newLevel,
        },
      })
    }
  }

  return NextResponse.json({ ok: true, awarded, newXp, newLevel, alreadyDone })
}
