import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tasks
// Returns the current user's tasks, newest first.
// Query params:
//   status=PENDING|IN_PROGRESS|COMPLETED|SKIPPED  (optional filter)
//   userId=<id>  (trainer only — fetch tasks for a specific client)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') ?? undefined
  const userId       = searchParams.get('userId') ?? session.user.id

  // Only trainers may query other users' tasks
  if (userId !== session.user.id && session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(statusFilter ? { status: statusFilter as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tasks })
}

// POST /api/tasks
// Creates a task for a user.
// Trainers can create for any of their clients (pass userId in body).
// Clients can only create tasks for themselves.
//
// Body: { userId?, title, category?, dueDate?, description?, targetValue? }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { userId, title, category, dueDate, description, targetValue } = body

  if (!title?.trim())
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const targetId = userId ?? session.user.id

  // Only trainers can create tasks for other users
  if (targetId !== session.user.id) {
    if (session.user.role !== 'TRAINER')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Verify trainer–client relationship
    const link = await prisma.trainerClient.findUnique({
      where: { trainerId_clientId: { trainerId: session.user.id, clientId: targetId } },
    })
    if (!link) return NextResponse.json({ error: 'Client not linked to this trainer' }, { status: 404 })
  }

  const desc = description?.trim() || (targetValue ? `Target: ${targetValue}` : null)

  const task = await prisma.task.create({
    data: {
      userId:      targetId,
      title:       title.trim(),
      category:    category ?? null,
      dueDate:     dueDate ? new Date(dueDate) : null,
      description: desc,
      xpReward:    50,
    },
  })

  return NextResponse.json({ task }, { status: 201 })
}
