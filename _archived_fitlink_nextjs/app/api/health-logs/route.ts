import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/health-logs — last 30 days of health logs for the session user
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const logs = await prisma.healthLog.findMany({
    where:   { userId: session.user.id, date: { gte: since } },
    orderBy: { date: 'asc' },
    select:  { id: true, date: true, steps: true, calories: true, waterMl: true, sleepHrs: true, heartRate: true },
  })

  return NextResponse.json({ logs })
}

// POST /api/health-logs — create or update today's health log entry
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { steps, calories, waterMl, sleepHrs, heartRate, weight } = body

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

    // Update today's log if it exists, otherwise create
    const existing = await prisma.healthLog.findFirst({
      where: { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
    })

    const data = {
      ...(steps     != null && { steps:     Number(steps)     }),
      ...(calories  != null && { calories:  Number(calories)  }),
      ...(waterMl   != null && { waterMl:   Number(waterMl)   }),
      ...(sleepHrs  != null && { sleepHrs:  Number(sleepHrs)  }),
      ...(heartRate != null && { heartRate: Number(heartRate) }),
      ...(weight    != null && { weight:    Number(weight)    }),
    }

    const log = existing
      ? await prisma.healthLog.update({ where: { id: existing.id }, data })
      : await prisma.healthLog.create({ data: { userId: session.user.id, date: todayStart, ...data } })

    return NextResponse.json({ log }, { status: 201 })
  } catch (err) {
    console.error('[health-logs POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
