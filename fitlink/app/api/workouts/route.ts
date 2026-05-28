import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Exercise type stored in exercises JSON field
type Exercise = {
  name:   string
  sets?:  number
  reps?:  number
  weight?: number
  notes?: string
}

// GET /api/workouts — list workouts for the session user (upcoming + last 30 days history)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { scheduledAt: { gte: since } },                      // future or recent
        { status: { in: ['PLANNED', 'IN_PROGRESS'] } },       // always include active
        { completedAt: { gte: since } },                      // recent completions
      ],
    },
    orderBy: [
      { status: 'asc' },      // PLANNED first (alphabetically before SKIPPED/IN_PROGRESS/COMPLETED)
      { scheduledAt: 'asc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true, title: true, description: true, status: true,
      scheduledAt: true, startedAt: true, completedAt: true,
      durationMin: true, xpReward: true, exercises: true, notes: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ workouts })
}

// POST /api/workouts — create a new workout
// Trainers can set targetUserId to create a workout for a client.
// Clients can only create for themselves.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      title, description, scheduledAt, exercises, notes,
      xpReward, targetUserId,
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Determine who the workout belongs to
    let ownerId = session.user.id
    if (targetUserId && targetUserId !== session.user.id) {
      // Verify caller is a TRAINER and has a TrainerClient relationship with targetUserId
      const caller = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      if (caller?.role !== 'TRAINER') {
        return NextResponse.json({ error: 'Only trainers can assign workouts to clients' }, { status: 403 })
      }
      const link = await prisma.trainerClient.findFirst({
        where: { trainerId: session.user.id, clientId: targetUserId, active: true },
      })
      if (!link) {
        return NextResponse.json({ error: 'Client not found in your roster' }, { status: 403 })
      }
      ownerId = targetUserId
    }

    // Validate exercises array if provided
    const exerciseList: Exercise[] = Array.isArray(exercises) ? exercises : []

    const workout = await prisma.workout.create({
      data: {
        userId:      ownerId,
        title:       title.trim(),
        description: description?.trim() ?? null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        exercises:   exerciseList,
        notes:       notes?.trim() ?? null,
        xpReward:    typeof xpReward === 'number' ? xpReward : 100,
        status:      'PLANNED',
      },
    })

    return NextResponse.json({ workout }, { status: 201 })
  } catch (err) {
    console.error('[workouts POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
