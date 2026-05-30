import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/nutrition-logs/food-entries — add a food entry to a meal log for today
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { meal, name, kcal, proteinG, carbsG, fatG, quantity, unit } = body

    if (!meal || !name) {
      return NextResponse.json({ error: 'meal and name are required' }, { status: 400 })
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

    // Find or create today's NutritionLog for this meal
    let log = await prisma.nutritionLog.findFirst({
      where: { userId: session.user.id, mealType: meal, date: { gte: todayStart, lte: todayEnd } },
    })
    if (!log) {
      log = await prisma.nutritionLog.create({
        data: { userId: session.user.id, mealType: meal, date: todayStart },
      })
    }

    const entry = await prisma.foodEntry.create({
      data: {
        nutritionLogId: log.id,
        name:     String(name),
        kcal:     kcal     != null ? Number(kcal)     : 0,
        proteinG: proteinG != null ? Number(proteinG) : 0,
        carbsG:   carbsG   != null ? Number(carbsG)   : 0,
        fatG:     fatG     != null ? Number(fatG)     : 0,
        quantity: quantity != null ? Number(quantity) : 1,
        unit:     unit     ? String(unit)             : 'g',
      },
    })

    // Update the NutritionLog totals
    const allEntries = await prisma.foodEntry.findMany({ where: { nutritionLogId: log.id } })
    await prisma.nutritionLog.update({
      where: { id: log.id },
      data: {
        totalKcal: allEntries.reduce((s, e) => s + e.kcal, 0),
        proteinG:  allEntries.reduce((s, e) => s + e.proteinG, 0),
        carbsG:    allEntries.reduce((s, e) => s + e.carbsG, 0),
        fatG:      allEntries.reduce((s, e) => s + e.fatG, 0),
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (err) {
    console.error('[nutrition-logs/food-entries POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/nutrition-logs/food-entries — today's food entries grouped by meal
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const logs = await prisma.nutritionLog.findMany({
    where:   { userId: session.user.id, date: { gte: todayStart, lte: todayEnd } },
    include: { foodEntries: { orderBy: { id: 'asc' } } },
  })

  // Shape: { meal: string, entries: FoodEntry[], totalKcal: number }[]
  const grouped = logs.map(l => ({
    meal:      l.mealType,
    entries:   l.foodEntries,
    totalKcal: l.totalKcal,
  }))

  return NextResponse.json({ grouped })
}
