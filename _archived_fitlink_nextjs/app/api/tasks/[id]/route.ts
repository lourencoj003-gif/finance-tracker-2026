import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { XP, getLevelFromXp } from '@/lib/xp'

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only owner or their trainer may view
  if (task.userId !== session.user.id && session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ task })
}

// PATCH /api/tasks/[id]
// Body: { status?: 'PENDING'|'IN_PROGRESS'|'COMPLETED'|'SKIPPED', title?, description?, dueDate? }
// Completing a task (status → COMPLETED) awards XP once.
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only owner or their trainer may update
  if (task.userId !== session.user.id && session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { status, title, description, dueDate } = body

  const wasCompleted = task.status === 'COMPLETED'
  const nowCompleting = status === 'COMPLETED' && !wasCompleted

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(status      ? { status }                              : {}),
      ...(title       ? { title: title.trim() }                 : {}),
      ...(description !== undefined ? { description }           : {}),
      ...(dueDate     !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(nowCompleting ? { completedAt: new Date() }           : {}),
    },
  })

  // ── Award XP on completion ─────────────────────────────────────────────────
  let xpResult: { awarded: number; newXp: number; newLevel: number } | null = null

  if (nowCompleting) {
    const awardXp = task.xpReward ?? XP.TASK_COMPLETE

    const updatedUser = await prisma.user.update({
      where:  { id: task.userId },
      data:   { xp: { increment: awardXp } },
      select: { xp: true },
    })
    const newLevel = getLevelFromXp(updatedUser.xp)
    await prisma.user.update({ where: { id: task.userId }, data: { level: newLevel } })

    await prisma.xpEvent.create({
      data: {
        userId:      task.userId,
        amount:      awardXp,
        reason:      'TASK_COMPLETE',
        referenceId: task.id,
      },
    })

    // Upsert today's DailyProgressSnapshot
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const snap = await prisma.dailyProgressSnapshot.findFirst({
      where: { userId: task.userId, date: { gte: todayStart, lte: todayEnd } },
    })
    if (snap) {
      await prisma.dailyProgressSnapshot.update({
        where: { id: snap.id },
        data:  { xpTotal: updatedUser.xp, level: newLevel },
      })
    } else {
      await prisma.dailyProgressSnapshot.create({
        data: {
          userId:  task.userId,
          date:    todayStart,
          xpTotal: updatedUser.xp,
          level:   newLevel,
        },
      })
    }

    xpResult = { awarded: awardXp, newXp: updatedUser.xp, newLevel }
  }

  return NextResponse.json({ task: updated, xpResult })
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (task.userId !== session.user.id && session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
