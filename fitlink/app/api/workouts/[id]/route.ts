import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { XP, getLevelFromXp } from '@/lib/xp'

// GET /api/workouts/[id] — single workout
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const workout = await prisma.workout.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!workout) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ workout })
}

// PATCH /api/workouts/[id] — update status / complete / start
// Body: { status?, durationMin?, notes?, title?, description?, scheduledAt?, exercises? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  // Verify ownership (trainers can also update workouts they assigned)
  const existing = await prisma.workout.findFirst({
    where: { id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const callerIsOwner = existing.userId === session.user.id
  if (!callerIsOwner) {
    // Allow trainers who have this user as a client
    const link = await prisma.trainerClient.findFirst({
      where: { trainerId: session.user.id, clientId: existing.userId, active: true },
    })
    if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { status, durationMin, notes, title, description, scheduledAt, exercises } = body

    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      if (!['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status

      if (status === 'IN_PROGRESS' && !existing.startedAt) {
        updateData.startedAt = new Date()
      }
      if (status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date()
      }
    }

    if (typeof durationMin === 'number') updateData.durationMin = durationMin
    if (typeof notes       === 'string') updateData.notes       = notes
    if (typeof title       === 'string') updateData.title       = title.trim()
    if (typeof description === 'string') updateData.description = description.trim()
    if (scheduledAt !== undefined)       updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (Array.isArray(exercises))        updateData.exercises   = exercises

    const workout = await prisma.workout.update({
      where: { id },
      data: updateData,
    })

    // If completing the workout, award XP to the owner
    let xpResult: { awarded: number; newXp: number; newLevel: number } | null = null

    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      const awardXp = existing.xpReward ?? XP.WORKOUT_COMPLETE

      const updatedUser = await prisma.user.update({
        where: { id: existing.userId },
        data: { xp: { increment: awardXp } },
        select: { xp: true },
      })

      const newLevel = getLevelFromXp(updatedUser.xp)

      await prisma.user.update({ where: { id: existing.userId }, data: { level: newLevel } })

      await prisma.xpEvent.create({
        data: {
          userId:      existing.userId,
          amount:      awardXp,
          reason:      'WORKOUT_COMPLETE',
          referenceId: id,
        },
      })

      // Upsert today snapshot
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
      const snap = await prisma.dailyProgressSnapshot.findFirst({
        where: { userId: existing.userId, date: { gte: todayStart, lte: todayEnd } },
      })
      if (snap) {
        await prisma.dailyProgressSnapshot.update({
          where: { id: snap.id },
          data: { xpTotal: updatedUser.xp, level: newLevel },
        })
      } else {
        await prisma.dailyProgressSnapshot.create({
          data: { userId: existing.userId, date: todayStart, xpTotal: updatedUser.xp, level: newLevel, streakCount: 0 },
        })
      }

      xpResult = { awarded: awardXp, newXp: updatedUser.xp, newLevel }
    }

    return NextResponse.json({ workout, xpResult })
  } catch (err) {
    console.error('[workouts PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workouts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.workout.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.workout.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
