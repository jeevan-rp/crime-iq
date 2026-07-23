'use client'

import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  Map,
  Network,
  Search,
  TrendingUp,
} from 'lucide-react'
import { useAppStore, type ViewType } from '@/store/use-app-store'

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'chat', label: 'AI Chat', icon: MessageSquare },
  { view: 'map', label: 'Crime Map', icon: Map },
  { view: 'network', label: 'Network', icon: Network },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'predictions', label: 'Predictions', icon: TrendingUp },
]

export function AppSidebar() {
  const { activeView, setActiveView, sidebarCollapsed, totalFirs } = useAppStore()

  return (
    <aside
      className={`sidebar-dark fixed top-0 left-0 z-40 h-screen flex flex-col text-white transition-transform duration-300 ease-in-out ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      } w-64`}
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">CRIME IQ</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Intelligence Platform</p>
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
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-orange-500' : 'text-slate-400'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0.5 rounded-full">
                  {totalFirs.toLocaleString('en-IN')}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-7 bg-orange-500 rounded-r-full" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs font-semibold text-slate-300">Karnataka Police</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Intelligence Bureau</p>
      </div>
    </aside>
  )
}
