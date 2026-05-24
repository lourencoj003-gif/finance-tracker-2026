import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role = 'CLIENT' } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role: role as 'CLIENT' | 'TRAINER',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
