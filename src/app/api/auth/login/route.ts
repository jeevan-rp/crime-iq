import { NextRequest, NextResponse } from 'next/server'
import { login, setAuthCookie } from '@/lib/catalyst/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const result = await login(email, password)

    if (!result.success || !result.user || !result.token) {
      return NextResponse.json({ error: result.error || 'Login failed' }, { status: 401 })
    }

    await setAuthCookie(result.token)

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        district: result.user.district,
      },
    })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
