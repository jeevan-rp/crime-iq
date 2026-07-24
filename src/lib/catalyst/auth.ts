/**
 * Catalyst Authentication Adapter
 * 
 * When Catalyst is configured: uses Catalyst Authentication (Zoho Accounts)
 * When running locally: uses JWT-based auth with demo users
 * 
 * Roles: Admin, Officer, Investigator, Analyst
 * 
 * Usage:
 *   import { getCurrentUser, login, hasRole } from '@/lib/catalyst/auth'
 *   const user = await getCurrentUser(request)
 *   if (user && hasRole(user, 'Admin')) { ... }
 */

import { catalystConfig } from './config'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// ─── Types ────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'Officer' | 'Investigator' | 'Analyst'

export interface CrimeIQUser {
  id: string
  email: string
  name: string
  role: UserRole
  district?: string
  avatarUrl?: string
}

export interface AuthResult {
  success: boolean
  user?: CrimeIQUser
  token?: string
  error?: string
}

// ─── Demo Users (local only) ─────────────────────────────────

const DEMO_USERS: (CrimeIQUser & { password: string })[] = [
  { id: 'u1', email: 'admin@kp.gov.in', name: 'DSP Raghavendra', role: 'Admin', district: 'Bengaluru Urban', password: 'Admin@123' },
  { id: 'u2', email: 'officer@kp.gov.in', name: 'Inspector Kavitha', role: 'Officer', district: 'Mysuru', password: 'Officer@123' },
  { id: 'u3', email: 'analyst@kp.gov.in', name: 'SI Vikram', role: 'Analyst', district: 'Bengaluru Urban', password: 'Analyst@123' },
  { id: 'u4', email: 'investigator@kp.gov.in', name: 'CPI Meera', role: 'Investigator', district: 'Hubballi-Dharwad', password: 'Investigator@123' },
]

const ALL_ROLES: UserRole[] = ['Admin', 'Officer', 'Investigator', 'Analyst']

// ─── JWT Helpers ──────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'crime-iq-local-dev-secret-key-2024'
)

const TOKEN_COOKIE = 'crimeiq-token'
const TOKEN_EXPIRY = '8h'

async function signToken(user: CrimeIQUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

async function verifyToken(token: string): Promise<CrimeIQUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as CrimeIQUser
  } catch {
    return null
  }
}

// ─── Public API ──────────────────────────────────────────────

/** Authenticate a user with email and password */
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    if (catalystConfig.isCatalyst) {
      // Catalyst Authentication
      const { ZCatalystApp } = await import('zoho-catalyst-sdk')
      const app = ZCatalystApp.getInstance()
      const auth = app.auth()

      const userDetails = await auth.signIn({ email, password })
      const user: CrimeIQUser = {
        id: userDetails.zuid,
        email: userDetails.email_id,
        name: userDetails.first_name + ' ' + userDetails.last_name,
        role: (userDetails.role_details?.role_name as UserRole) || 'Analyst',
      }
      const token = await signToken(user)
      return { success: true, user, token }
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Catalyst authentication failed' }
  }

  // Local: demo users
  const found = DEMO_USERS.find(u => u.email === email && u.password === password)
  if (!found) {
    return { success: false, error: 'Invalid email or password' }
  }

  const { password: _pw, ...user } = found
  const token = await signToken(user)
  return { success: true, user, token }
}

/** Get the current authenticated user from request cookies */
export async function getCurrentUser(request?: Request): Promise<CrimeIQUser | null> {
  try {
    if (catalystConfig.isCatalyst && request) {
      // Catalyst Authentication — check Authorization header
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        return await verifyToken(token)
      }
    }
  } catch (error) {
    console.warn('[Auth] Catalyst auth check failed:', error)
  }

  // Local: check JWT cookie
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

/** Set auth cookie on response */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  })
}

/** Clear auth cookie (logout) */
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE)
}

/** Check if user has a specific role */
export function hasRole(user: CrimeIQUser | null, role: UserRole): boolean {
  if (!user) return false
  if (user.role === 'Admin') return true // Admin has all permissions
  return user.role === role
}

/** Get all available roles */
export function getRoles(): UserRole[] {
  return ALL_ROLES
}

/** Require authentication — returns user or throws */
export async function requireAuth(request?: Request): Promise<CrimeIQUser> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/** Require specific role — returns user or throws */
export async function requireRole(request: Request, role: UserRole): Promise<CrimeIQUser> {
  const user = await requireAuth(request)
  if (!hasRole(user, role)) {
    throw new Error(`Role '${role}' required`) 
  }
  return user
}
