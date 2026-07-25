/**
 * Catalyst Authentication Adapter
 * 
 * When Catalyst is configured: uses Catalyst Authentication (Zoho Accounts)
 * When running locally/Vercel: uses JWT-based auth with demo users
 * 
 * Roles: Admin, Officer, Investigator, Analyst
 * 
 * Usage:
 *   import { getCurrentUser, login, hasRole } from '@/lib/catalyst/auth'
 *   const user = await getCurrentUser(request)
 *   if (user && hasRole(user, 'Admin')) { ... }
 */

import { catalystConfig } from './config'
import { getCatalystApp } from './sdk'
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

// ─── Demo Users (local and fallback) ─────────────────────────

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
  // First check if the user matches our demo accounts (for rapid testing/development)
  const found = DEMO_USERS.find(u => u.email === email && u.password === password)
  if (found) {
    const { password: _pw, ...user } = found
    const token = await signToken(user)
    return { success: true, user, token }
  }

  // If running inside Catalyst environment and we want to validate users from Zoho User Management
  if (catalystConfig.isCatalyst) {
    try {
      const app = await getCatalystApp()
      if (!app) {
        throw new Error('Catalyst SDK not initialized (running locally)')
      }
      const userManagement = app.userManagement()
      
      // Look up all users to verify if the email is registered
      const allUsers = await userManagement.getAllUsers()
      const matchedUser = allUsers.find((u: any) => u.email_id === email)

      if (matchedUser && matchedUser.status === 'ACTIVE') {
        const user: CrimeIQUser = {
          id: matchedUser.zuid,
          email: matchedUser.email_id,
          name: `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() || matchedUser.email_id,
          role: (matchedUser.role_details?.role_name as UserRole) || 'Analyst',
        }
        const token = await signToken(user)
        return { success: true, user, token }
      }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Catalyst authentication lookup failed' }
    }
  }

  return { success: false, error: 'Invalid email or password' }
}

/** Get the current authenticated user from request cookies or AppSail headers */
export async function getCurrentUser(request?: Request): Promise<CrimeIQUser | null> {
  try {
    if (catalystConfig.isCatalyst && request) {
      // Check for AppSail request headers injected by Catalyst Gateways / Hosted Login
      const userId = request.headers.get('x-catalyst-user-id')
      const email = request.headers.get('x-catalyst-user-email')
      
      if (userId && email) {
        return {
          id: userId,
          email: email,
          name: `${request.headers.get('x-catalyst-user-first-name') || ''} ${request.headers.get('x-catalyst-user-last-name') || ''}`.trim() || email,
          role: (request.headers.get('x-catalyst-user-role-name') as UserRole) || 'Analyst',
          district: 'Bengaluru Urban', // Default district mapping for cloud accounts
        }
      }
      
      // Also check standard Authorization headers if Bearer token is passed
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        return await verifyToken(token)
      }
    }
  } catch (error) {
    console.warn('[Auth] Catalyst auth check failed:', error)
  }

  // Fallback: Check local/Vercel JWT cookie
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
