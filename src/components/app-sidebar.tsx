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
  UserCheck,
  Menu
} from 'lucide-react'
import { useAppStore, type ViewType } from '@/store/use-app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'chat', label: 'AI Chat', icon: MessageSquare },
  { view: 'map', label: 'Crime Map', icon: Map },
  { view: 'network', label: 'Network', icon: Network },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'predictions', label: 'Predictions', icon: TrendingUp },
]

export function AppSidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, totalFirs, user, setUser } = useAppStore()

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

  const getRoleColors = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'Officer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Investigator':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Analyst':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen flex flex-col text-white transition-all duration-300 ease-in-out border-r border-white/5 bg-[#08090B]/90 backdrop-blur-xl",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Header Section with Logo & Toggle Hamburger */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5 h-16 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="transition-all duration-200">
              <h1 className="text-sm font-black tracking-widest text-white font-mono">CRIME IQ</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Intelligence</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Hamburger button shown when sidebar is collapsed */}
      {sidebarCollapsed && (
        <div className="flex justify-center py-4 border-b border-white/5 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeView === item.view
          const Icon = item.icon
          const showBadge = item.view === 'dashboard' && totalFirs > 0

          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                "relative w-full flex items-center rounded-xl p-2.5 text-xs font-bold transition-all duration-200 cursor-pointer border",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-md shadow-cyan-500/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent",
                sidebarCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  isActive ? "text-cyan-400" : "text-slate-400"
                )}
              />
              {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!sidebarCollapsed && showBadge && (
                <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold border border-cyan-500/20">
                  {totalFirs}
                </span>
              )}
              {isActive && sidebarCollapsed && (
                <div className="absolute right-0 w-1 h-5 bg-cyan-400 rounded-l-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User Section at the bottom */}
      {user && (
        <div className={cn(
          "border-t border-white/5 bg-[#0D0F14]/50 flex items-center justify-between shrink-0",
          sidebarCollapsed ? "flex-col py-4 gap-4 px-2" : "px-4 py-4 gap-2"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/10 shadow-inner">
              <UserCheck className="h-4 w-4 text-cyan-400" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-slate-200 truncate font-mono">{user.name}</p>
                <span className={cn("inline-block text-[8px] font-black px-1.5 py-0.5 mt-1 rounded border", getRoleColors(user.role))}>
                  {user.role}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-red-500/10"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  )
}
