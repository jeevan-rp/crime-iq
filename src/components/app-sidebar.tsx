'use client'

import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  Map,
  Network,
  Search,
  TrendingUp,
  LogOut,
  UserCheck
} from 'lucide-react'
import { useAppStore, type ViewType } from '@/store/use-app-store'
import { toast } from 'sonner'

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'chat', label: 'AI Chat', icon: MessageSquare },
  { view: 'map', label: 'Crime Map', icon: Map },
  { view: 'network', label: 'Network', icon: Network },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'predictions', label: 'Predictions', icon: TrendingUp },
]

export function AppSidebar() {
  const { activeView, setActiveView, sidebarCollapsed, totalFirs, user, setUser } = useAppStore()

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        setUser(null)
        toast.success('Logged out successfully')
      } else {
        toast.error('Failed to log out')
      }
    } catch {
      toast.error('Network error during log out')
    }
  }

  // Define colors for each role
  const getRoleColors = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Officer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Investigator':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Analyst':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  return (
    <aside
      className={`sidebar-dark fixed top-0 left-0 z-40 h-screen flex flex-col text-white transition-transform duration-300 ease-in-out ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      } w-64 border-r border-white/5 bg-slate-950`}
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">CRIME IQ</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Intelligence Bureau</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view
          const Icon = item.icon
          const showBadge = item.view === 'dashboard' && totalFirs > 0

          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-orange-500' : 'text-slate-400'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="bg-orange-500/25 text-orange-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {(totalFirs ?? 0).toLocaleString('en-IN')}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-7 bg-orange-500 rounded-r-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User Section at the bottom */}
      {user && (
        <div className="px-4 py-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/10">
              <UserCheck className="h-4.5 w-4.5 text-orange-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 mt-0.5 rounded border ${getRoleColors(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="px-5 py-3 border-t border-white/10 text-center">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Karnataka State Police</p>
      </div>
    </aside>
  )
}
