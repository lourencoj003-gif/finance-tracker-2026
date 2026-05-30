import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLevelFromXp } from '@/lib/xp'

type Params = { params: Promise<{ clientId: string }> }

// POST /api/trainers/[clientId]/award-xp
// Body: { amount: number, reason: string }
// Awards manual XP to a client. Trainer must have an active link with the client.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (session.user.role !== 'TRAINER')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { clientId } = await params

  const link = await prisma.trainerClient.findUnique({
    where: { trainerId_clientId: { trainerId: session.user.id, clientId } },
  })
  if (!link) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const body  = await req.json()
  const xp    = Math.min(1000, Math.max(1, parseInt(String(body.amount ?? 50), 10)))
  const reason = String(body.reason ?? 'Manual trainer award').slice(0, 100)

  // Increment client XP
  const updated = await prisma.user.update({
    where:  { id: clientId },
    data:   { xp: { increment: xp } },
    select: { xp: true },
  })

  // Sync level
  const newLevel = getLevelFromXp(updated.xp)
  await prisma.user.update({ where: { id: clientId }, data: { level: newLevel } })

  // Record XP event
  await prisma.xpEvent.create({
    data: {
      userId:      clientId,
      amount:      xp,
      reason:      `Trainer award — ${reason}`,
      referenceId: session.user.id,
    },
  })

  return NextResponse.json({ awarded: xp, newXp: updated.xp, newLevel })
}
