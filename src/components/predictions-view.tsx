'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, AlertTriangle, ShieldCheck, ArrowUp, ArrowDown, Minus, Sparkles, Target, Compass, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'
import { motion } from 'framer-motion'

interface Prediction {
  id: string
  district: string
  crimeType: string
  riskScore: number
  factors: string
  month: string
  createdAt: string
}

function riskLevel(score: number) {
  if (score >= 75) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  if (score >= 55) return { label: 'HIGH', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  if (score >= 35) return { label: 'MEDIUM', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' }
  return { label: 'LOW', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
}

export function PredictionsView() {
  const { data, isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => fetch('/api/predictions').then((r) => r.json()),
  })

  const predictions: Prediction[] = data || []

  const avgRisk = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length)
    : 0

  const criticalCount = predictions.filter((p) => p.riskScore >= 75).length
  const highCount = predictions.filter((p) => p.riskScore >= 55 && p.riskScore < 75).length

  // District risk aggregation
  const districtRisk = predictions.reduce<Record<string, { total: number; count: number }>>((acc, p) => {
    if (!acc[p.district]) acc[p.district] = { total: 0, count: 0 }
    acc[p.district].total += p.riskScore
    acc[p.district].count++
    return acc
  }, {})

  const districtChartData = Object.entries(districtRisk)
    .map(([district, { total, count }]) => ({
      district,
      avgRisk: Math.round(total / count),
      count,
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk)

  // Top risk predictions
  const topRisks = [...predictions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6)

  // Format Radar data (mapping crime type risks)
  const radarChartData = predictions.slice(0, 6).map((p) => ({
    subject: p.crimeType,
    score: p.riskScore,
  }))

  if (isLoading) return <PredictionsSkeleton />

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Predictive Threats
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            AI-Engine Crime Risk Forecasting & Pattern Clustering
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 text-xs font-mono text-cyan-400">
          <Sparkles className="h-4 w-4 animate-spin text-cyan-400" />
          Active Intelligence Engine Model
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Threat Level', value: `${avgRisk}%`, color: 'text-cyan-400', icon: Target },
          { label: 'Critical Zones', value: criticalCount, color: 'text-red-500', icon: AlertTriangle },
          { label: 'Elevated Zones', value: highCount, color: 'text-amber-500', icon: TrendingUp },
          { label: 'Monitored Sectors', value: Object.keys(districtRisk).length, color: 'text-emerald-400', icon: ShieldCheck }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="glass-panel border-white/5 bg-slate-900/40 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{stat.label}</p>
                    <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Threat Chart */}
        <Card className="glass-panel border-white/5 p-6">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">District Threats</p>
          <h3 className="text-base font-bold text-white mb-4">Risk Factor Index</h3>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="district" tick={{ fill: '#8a94a6', fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />
                <YAxis domain={[0, 100]} tick={{ fill: '#8a94a6', fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />
                <ChartTooltip
                  contentStyle={{ backgroundColor: '#0d0f14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Bar dataKey="avgRisk" name="Avg Risk Score" radius={[4, 4, 0, 0]}>
                  {districtChartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.avgRisk >= 75 ? '#FF3B30' : entry.avgRisk >= 55 ? '#F59E0B' : entry.avgRisk >= 35 ? '#00F0FF' : '#10B981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Threat Radar Target Matrix */}
        <Card className="glass-panel border-white/5 p-6">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Threat Vectors</p>
          <h3 className="text-base font-bold text-white mb-4">AI Pattern Clustering Radar</h3>
          
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" r="80%" data={radarChartData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8a94a6', fontSize: 9 }} />
                <Radar name="Threat Factor" dataKey="score" stroke="#00F0FF" fill="#0066FF" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Predictions Details Matrix */}
      <Card className="glass-panel border-white/5 p-6">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Threat Map</p>
        <h3 className="text-base font-bold text-white mb-4">Risk Matrix Logs</h3>
        
        <div className="space-y-3">
          {topRisks.map((p, idx) => {
            const risk = riskLevel(p.riskScore)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border ${risk.border} ${risk.bg} bg-slate-950/20`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{p.crimeType.toUpperCase()}</span>
                    <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0.5 border ${risk.color}`}>
                      {risk.label}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                    {p.district} • {p.month}
                  </p>
                </div>
                <div className="w-full sm:w-48 text-right shrink-0 flex items-center gap-3">
                  <div className="flex-1">
                    <Progress value={p.riskScore} className="h-1.5 bg-slate-800" style={{ color: getComputedStyle(document.body).getPropertyValue('--primary') }} />
                  </div>
                  <span className={`text-sm font-black font-mono ${risk.color}`}>{p.riskScore}%</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Explainable Risk Factors */}
      <Card className="glass-panel border-white/5 p-6">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <Eye className="h-4.5 w-4.5" />
          <h3 className="text-base font-bold text-white">Explainable Risk Factors</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topRisks.map((p) => {
            const risk = riskLevel(p.riskScore)
            return (
              <div key={p.id} className="border border-white/5 bg-slate-950/40 rounded-xl p-4 flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <span className="text-[11px] font-bold text-white truncate max-w-[70%]">{p.crimeType}</span>
                  <span className={`text-xs font-mono font-black ${risk.color}`}>{p.riskScore}%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{p.factors}</p>
                <div className="mt-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider">{p.district}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function PredictionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 bg-slate-900/60" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-slate-900/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-2xl bg-slate-900/60" />
        <Skeleton className="h-80 rounded-2xl bg-slate-900/60" />
      </div>
      <Skeleton className="h-96 rounded-2xl bg-slate-900/60" />
    </div>
  )
}
