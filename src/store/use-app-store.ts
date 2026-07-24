import { create } from 'zustand'

export type ViewType = 'dashboard' | 'chat' | 'map' | 'network' | 'search' | 'predictions'

interface AppState {
  activeView: ViewType
  setActiveView: (view: ViewType) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  totalFirs: number
  setTotalFirs: (count: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view, sidebarCollapsed: false }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  totalFirs: 0,
  setTotalFirs: (count) => set({ totalFirs: count }),
}))
