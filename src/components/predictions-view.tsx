'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, AlertTriangle, ShieldCheck, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Prediction {
  id: string
  district: string
  crimeType: string
  riskScore: number
  factors: string
  month: string
  createdAt: string
}

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

function riskLevel(score: number) {
  if (score >= 75) return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-200' }
  if (score >= 55) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-200' }
  if (score >= 35) return { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-200' }
  return { label: 'Low', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-200' }
}

function TrendIcon({ score }: { score: number }) {
  if (score >= 65) return <ArrowUp className="h-4 w-4 text-red-500" />
  if (score >= 35) return <Minus className="h-4 w-4 text-yellow-500" />
  return <ArrowDown className="h-4 w-4 text-green-500" />
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

  // Crime type distribution
  const crimeTypeRisk = predictions.reduce<Record<string, number>>((acc, p) => {
    acc[p.crimeType] = (acc[p.crimeType] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(crimeTypeRisk).map(([name, value]) => ({ name, value }))

  // Top risk predictions
  const topRisks = [...predictions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8)

  // District radar data (pick top 5 districts)
  const topDistricts = districtChartData.slice(0, 5)
  const radarData = predictions
    .filter((p) => topDistricts.some((d) => d.district === p.district))
    .reduce<Record<string, Record<string, number>>>((acc, p) => {
      if (!acc[p.crimeType]) acc[p.crimeType] = {}
      acc[p.crimeType][p.district] = p.riskScore
      return acc
    }, {})

  const radarKeys = topDistricts.map((d) => d.district)
  const radarChartData = Object.entries(radarData).map(([crimeType, districtScores]) => ({
    crimeType,
    ...districtScores,
  }))

  if (isLoading) return <PredictionsSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-xs text-muted-foreground">
            AI-powered crime risk predictions for Karnataka districts
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Risk Score</p>
              <p className="text-2xl font-bold">{avgRisk}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critical Risks</p>
              <p className="text-2xl font-bold">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <ArrowUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High Risks</p>
              <p className="text-2xl font-bold">{highCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Districts Tracked</p>
              <p className="text-2xl font-bold">{Object.keys(districtRisk).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">District Risk Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="district" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgRisk" name="Avg Risk Score" radius={[4, 4, 0, 0]}>
                    {districtChartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avgRisk >= 75 ? '#ef4444' : entry.avgRisk >= 55 ? '#f97316' : entry.avgRisk >= 35 ? '#eab308' : '#22c55e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Prediction Distribution by Crime Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Risk Predictions (Ranked)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRisks.map((p) => {
              const risk = riskLevel(p.riskScore)
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${risk.border} ${risk.bg} transition-colors`}
                >
                  <TrendIcon score={p.riskScore} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{p.crimeType}</span>
                      <Badge variant="outline" className={`text-[10px] ${risk.color}`}>
                        {risk.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.district} • {p.month}
                    </p>
                  </div>
                  <div className="text-right shrink-0 w-32">
                    <p className={`text-lg font-bold ${risk.color}`}>{p.riskScore}%</p>
                    <Progress value={p.riskScore} className="h-1.5 mt-1" />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Explainable AI Section */}
      <Card className="border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-orange-100 text-[10px] font-bold text-orange-600">AI</span>
            Explainable Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topRisks.slice(0, 6).map((p) => {
              const risk = riskLevel(p.riskScore)
              return (
                <div key={p.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold">{p.crimeType} — {p.district}</span>
                    <span className={`text-xs font-bold ${risk.color}`}>{p.riskScore}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.factors}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PredictionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}
