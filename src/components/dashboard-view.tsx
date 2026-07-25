'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { useAppStore } from '@/store/use-app-store'
import { useEffect } from 'react'

const INR = (n?: number | null) => (typeof n === 'number' && !isNaN(n) ? n.toLocaleString('en-IN') : '0')

function severityColor(severity: string) {
  switch (severity) {
    case 'Critical': return 'bg-red-500/15 text-red-600 border-red-200'
    case 'High': return 'bg-orange-500/15 text-orange-600 border-orange-200'
    case 'Medium': return 'bg-yellow-500/15 text-yellow-700 border-yellow-200'
    case 'Low': return 'bg-green-500/15 text-green-600 border-green-200'
    default: return ''
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'Open': return 'bg-orange-500/15 text-orange-600'
    case 'Closed': return 'bg-green-500/15 text-green-600'
    case 'Under Investigation': return 'bg-yellow-500/15 text-yellow-700'
    default: return ''
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
  if (!data || data.error) return <p className="text-muted-foreground p-6">Failed to load dashboard data.</p>

  const highSeverityCount = (data.severityDistribution || [])
    .filter((s: { severity: string; count: number }) => s.severity === 'High' || s.severity === 'Critical')
    .reduce((acc: number, s: { count: number }) => acc + s.count, 0)

  const statCards = [
    { label: 'Total FIRs', value: INR(data.totalFirs), icon: FileText, color: 'border-orange-500', iconBg: 'bg-orange-500/10 text-orange-500' },
    { label: 'Open Cases', value: INR(data.openFirs), icon: AlertTriangle, color: 'border-amber-500', iconBg: 'bg-amber-500/10 text-amber-500' },
    { label: 'Closed Cases', value: INR(data.closedFirs), icon: CheckCircle, color: 'border-green-500', iconBg: 'bg-green-500/10 text-green-500' },
    { label: 'High Severity', value: INR(highSeverityCount), icon: ShieldAlert, color: 'border-red-500', iconBg: 'bg-red-500/10 text-red-500' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className={`border-l-4 ${card.color}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Crime by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data.crimeByType || []).slice(0, 8)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Cases" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Crime by District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.crimeByDistrict || []} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="district" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Cases" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Monthly Crime Trend (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(data.monthlyTrend || []).map((m: { month: string; count: number }) => ({
                ...m,
                monthLabel: new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
              }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" name="FIRs" stroke="#f97316" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent FIRs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">FIR Number</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">District</TableHead>
                  <TableHead className="text-xs">Crime Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.recentFirs || []).slice(0, 8).map((fir: Record<string, unknown>) => (
                  <TableRow key={fir.id as string}>
                    <TableCell className="font-mono text-xs">{fir.firNumber as string}</TableCell>
                    <TableCell className="text-xs">{new Date(fir.date as string).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-xs">{fir.district as string}</TableCell>
                    <TableCell className="text-xs">{fir.crimeType as string}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(fir.status as string)}`}>
                        {fir.status as string}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${severityColor(fir.severity as string)}`}>
                        {fir.severity as string}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-72 rounded-lg" />
    </div>
  )
}
