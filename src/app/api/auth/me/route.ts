import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/catalyst/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        district: user.district,
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
