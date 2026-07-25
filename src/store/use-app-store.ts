import { create } from 'zustand'

export type ViewType = 'dashboard' | 'chat' | 'map' | 'network' | 'search' | 'predictions'
export type UserRole = 'Admin' | 'Officer' | 'Investigator' | 'Analyst'

export interface CrimeIQUser {
  id: string
  email: string
  name: string
  role: UserRole
  district?: string
  avatarUrl?: string
}

interface AppState {
  activeView: ViewType
  setActiveView: (view: ViewType) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  totalFirs: number
  setTotalFirs: (count: number) => void
  user: CrimeIQUser | null
  setUser: (user: CrimeIQUser | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view, sidebarCollapsed: false }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  totalFirs: 0,
  setTotalFirs: (count) => set({ totalFirs: count }),
  user: null,
  setUser: (user) => set({ user }),
}))
