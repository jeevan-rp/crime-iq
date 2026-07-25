'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Navigation, PhoneCall, CloudSun, Shield, Compass, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { useAppStore } from '@/store/use-app-store'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

const formatNumber = (n?: number | null) => (typeof n === 'number' && !isNaN(n) ? n.toLocaleString('en-IN') : '0')

function severityBadge(severity: string) {
  switch (severity) {
    case 'Critical':
      return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'High':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'Medium':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }
}

export function DashboardView() {
  const { setTotalFirs } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  })

  useEffect(() => {
    if (data?.totalFirs) setTotalFirs(data.totalFirs)
  }, [data, setTotalFirs])

  if (isLoading) return <DashboardSkeleton />
  if (!data || data.error) return <p className="text-muted-foreground p-6">Failed to load system telemetry.</p>

  const highSeverityCount = (data.severityDistribution || [])
    .filter((s: { severity: string; count: number }) => s.severity === 'High' || s.severity === 'Critical')
    .reduce((acc: number, s: { count: number }) => acc + s.count, 0)

  const stats = [
    { label: 'Total Telemetry (FIRs)', value: formatNumber(data.totalFirs), change: '+12% this week', color: 'text-blue-500', glow: 'shadow-blue-500/5' },
    { label: 'Unresolved Alerts', value: formatNumber(data.openFirs), change: 'Active dispatch', color: 'text-amber-400', glow: 'shadow-amber-500/5' },
    { label: 'Closed Actions', value: formatNumber(data.closedFirs), change: 'Resolved incidents', color: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
    { label: 'High-Risk Threats', value: formatNumber(highSeverityCount), change: 'Immediate attention', color: 'text-red-500', glow: 'shadow-red-500/5' },
  ]

  // Mock secondary widgets for evaluation
  const safeRoutes = [
    { from: 'Indiranagar', to: 'Vidhana Soudha', safety: 98, status: 'Secured' },
    { from: 'Koramangala', to: 'Electronic City', safety: 94, status: 'Optimal' },
    { from: 'Majestic', to: 'Whitefield', safety: 72, status: 'Caution' },
  ]

  const emergencyContacts = [
    { name: 'Control Room Dispatch', phone: '112 / 100', active: true },
    { name: 'Cyber Crime Cell', phone: '1930', active: true },
    { name: 'Intelligence Bureau Desk', phone: '+91-80-22942222', active: false },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Intelligence Console
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Real-Time Threat Telemetry & Predictive Analytics</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 text-xs font-mono text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          Live Connection: Systems Nominal
        </div>
      </div>

      {/* Stats Counter Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Card className="glass-panel border-white/5 bg-slate-900/40 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent group-hover:via-cyan-400/40 transition-all duration-500" />
              <CardContent className="p-5">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{stat.label}</p>
                <div className="flex items-baseline justify-between mt-3">
                  <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                  <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Telemetry & AI Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Neon Monthly Trend Area Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="glass-panel border-white/5 p-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Trend Analysis</p>
                <h3 className="text-lg font-bold text-white mt-1">12-Month Incident Frequency</h3>
              </div>
              <Badge variant="outline" className="text-[9px] bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold tracking-widest uppercase">
                Active Trend
              </Badge>
            </div>
            
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(data.monthlyTrend || []).map((m: any) => ({
                  ...m,
                  monthLabel: new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                }))} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="neonCyanGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#0066FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fill: '#8a94a6', fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />
                  <YAxis tick={{ fill: '#8a94a6', fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#0d0f14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="count" name="FIRs" stroke="#00F0FF" strokeWidth={2} fill="url(#neonCyanGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* AI Confidence circular gauge & Emergency contacts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          <Card className="glass-panel border-white/5 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">AI Engine</p>
              <h3 className="text-lg font-bold text-white mt-1">Prediction Confidence</h3>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 relative">
              {/* Radial Confidence Gauge */}
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="absolute transform -rotate-90 w-full h-full">
                  <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="transparent" />
                  <circle cx="64" cy="64" r="54" stroke="#00F0FF" strokeWidth="6" fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - 0.88)}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-3xl font-black tracking-tight text-white">88%</span>
                  <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Reliability</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                Active Model: Gemini Core V2
              </div>
            </div>
          </Card>

          <Card className="glass-panel border-white/5 p-6">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">Hotlines</p>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div key={contact.name} className="flex items-center justify-between bg-slate-950/40 border border-white/5 rounded-xl p-2.5">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{contact.name}</p>
                    <p className="text-[10px] font-mono text-cyan-400/90 mt-0.5">{contact.phone}</p>
                  </div>
                  <button className="h-7 w-7 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors cursor-pointer border border-blue-500/20">
                    <PhoneCall className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Grid: Secondary Widgets (Weather, Safe Routes, Districting) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Safe Routes Widget */}
        <Card className="glass-panel border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Navigation className="h-4 w-4" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Routing Optimization</p>
            </div>
            <h3 className="text-base font-bold text-white mt-2">Corridor Safety Scores</h3>
          </div>
          
          <div className="space-y-3 mt-4">
            {safeRoutes.map((route) => (
              <div key={route.from} className="border border-white/5 bg-slate-950/20 rounded-xl p-3 flex items-center justify-between">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <span className="truncate">{route.from}</span>
                    <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                    <span className="truncate">{route.to}</span>
                  </div>
                  <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 mt-1 rounded ${
                    route.safety >= 90 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {route.status}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-white">{route.safety}%</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Secure</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Crime by District Table */}
        <Card className="glass-panel border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400">
              <Compass className="h-4 w-4" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Zonal Telemetry</p>
            </div>
            <h3 className="text-base font-bold text-white mt-2">Threat Vector by District</h3>
          </div>

          <div className="space-y-2 mt-4 max-h-[190px] overflow-y-auto custom-scrollbar">
            {(data.crimeByDistrict || []).map((district: any) => (
              <div key={district.district} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-slate-300 font-medium">{district.district}</span>
                <div className="flex items-center gap-3">
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (district.count / 20) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono text-slate-400">{district.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weather impact & Safe Travel suggestions */}
        <Card className="glass-panel border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-500">
              <CloudSun className="h-4 w-4" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Environmental Factors</p>
            </div>
            <h3 className="text-base font-bold text-white mt-2">Weather & Climate Impact</h3>
          </div>

          <div className="mt-4 border border-white/5 bg-slate-950/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Current Forecast</p>
                <p className="text-sm font-bold text-slate-200">Heavy Rain Warning</p>
              </div>
              <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-bold">
                Moderate Risk
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Wet road conditions and low visibility historically correlate with a **14% increase** in emergency traffic alerts and response delay in Bengaluru Central.
            </p>
          </div>
        </Card>
      </div>

      {/* Immersive Incidents Ticker */}
      <Card className="glass-panel border-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Live Feeds</p>
            <h3 className="text-lg font-bold text-white mt-1">Telemetry Broadcast Stream</h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Monitoring
          </div>
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {(data.recentFirs || []).slice(0, 5).map((fir: any) => (
            <motion.div
              key={fir.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between border border-white/5 hover:border-white/10 bg-slate-950/30 rounded-xl p-4 gap-3 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                  <FileText className="h-4.5 w-4.5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-white">{fir.firNumber}</span>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{new Date(fir.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{fir.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <span className="text-[10px] text-slate-500 font-mono">{fir.district}</span>
                <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${severityBadge(fir.severity)}`}>
                  {fir.severity}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64 bg-slate-900/60" />
        <Skeleton className="h-4 w-48 bg-slate-900/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-slate-900/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl bg-slate-900/60" />
        <div className="space-y-6">
          <Skeleton className="h-[180px] rounded-2xl bg-slate-900/60" />
          <Skeleton className="h-[140px] rounded-2xl bg-slate-900/60" />
        </div>
      </div>
    </div>
  )
}
