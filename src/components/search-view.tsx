'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, X, FileText, Filter, Compass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'

interface FirRecord {
  id: string
  firNumber: string
  date: string
  district: string
  station: string
  crimeType: string
  description: string
  status: string
  severity: string
  latitude: number
  longitude: number
  suspects: { person: { name: string; age: number | null; phone: string | null; address: string | null } }[]
  victims: { person: { name: string; age: number | null; phone: string | null; address: string | null } }[]
}

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

function statusBadge(status: string) {
  switch (status) {
    case 'Open':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'Closed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    default:
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }
}

export function SearchView() {
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [crimeType, setCrimeType] = useState('')
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [page, setPage] = useState(1)
  const [selectedFir, setSelectedFir] = useState<FirRecord | null>(null)

  const queryParams = new URLSearchParams()
  if (search) queryParams.set('search', search)
  if (district) queryParams.set('district', district)
  if (crimeType) queryParams.set('crimeType', crimeType)
  if (status) queryParams.set('status', status)
  if (severity) queryParams.set('severity', severity)
  queryParams.set('page', String(page))
  queryParams.set('limit', '20')

  const { data, isLoading } = useQuery({
    queryKey: ['firs', search, district, crimeType, status, severity, page],
    queryFn: () => fetch(`/api/firs?${queryParams}`).then((r) => r.json()),
  })

  const firs: FirRecord[] = data?.data || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const hasFilters = search || district || crimeType || status || severity

  const clearFilters = () => {
    setSearch('')
    setDistrict('')
    setCrimeType('')
    setStatus('')
    setSeverity('')
    setPage(1)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/10">
            <SearchIcon className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">FIR Registry</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Search and analyze {(total ?? 0).toLocaleString('en-IN')} digital crime profiles
            </p>
          </div>
        </div>
      </div>

      {/* Glass Filters Card */}
      <Card className="glass-panel border-white/5 bg-[#0D0F14]/75 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-cyan-400" /> Filter Criteria
          </span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-white/5 cursor-pointer rounded-lg px-2.5"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" /> Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search input */}
          <div className="relative lg:col-span-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search identifier, description logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 h-10 bg-slate-950 border-white/5 text-white placeholder-slate-700 focus:border-cyan-500 rounded-xl text-xs"
            />
          </div>

          {/* District Select */}
          <Select value={district} onValueChange={(v) => { setDistrict(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="h-10 bg-slate-950 border-white/5 text-white rounded-xl text-xs focus:ring-0">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent className="bg-[#0D0F14] border-white/5 text-white">
              <SelectItem value="all">All Districts</SelectItem>
              <SelectItem value="Bengaluru Urban">Bengaluru Urban</SelectItem>
              <SelectItem value="Bengaluru Rural">Bengaluru Rural</SelectItem>
              <SelectItem value="Mysuru">Mysuru</SelectItem>
              <SelectItem value="Hubballi-Dharwad">Hubballi-Dharwad</SelectItem>
              <SelectItem value="Mangaluru">Mangaluru</SelectItem>
              <SelectItem value="Shivamogga">Shivamogga</SelectItem>
              <SelectItem value="Belagavi">Belagavi</SelectItem>
            </SelectContent>
          </Select>

          {/* Crime Type Select */}
          <Select value={crimeType} onValueChange={(v) => { setCrimeType(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="h-10 bg-slate-950 border-white/5 text-white rounded-xl text-xs focus:ring-0">
              <SelectValue placeholder="Crime Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0D0F14] border-white/5 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Theft">Theft</SelectItem>
              <SelectItem value="Burglary">Burglary</SelectItem>
              <SelectItem value="Robbery">Robbery</SelectItem>
              <SelectItem value="Cybercrime">Cybercrime</SelectItem>
              <SelectItem value="Assault">Assault</SelectItem>
              <SelectItem value="Fraud">Fraud</SelectItem>
              <SelectItem value="Vehicle Theft">Vehicle Theft</SelectItem>
              <SelectItem value="Chain Snatching">Chain Snatching</SelectItem>
              <SelectItem value="Murder">Murder</SelectItem>
            </SelectContent>
          </Select>

          {/* Status and Severity inputs */}
          <div className="flex gap-2">
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-10 bg-slate-950 border-white/5 text-white rounded-xl text-xs focus:ring-0 flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D0F14] border-white/5 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Under Investigation">Investigation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severity} onValueChange={(v) => { setSeverity(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-10 bg-slate-950 border-white/5 text-white rounded-xl text-xs focus:ring-0 flex-1">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D0F14] border-white/5 text-white">
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Registry Table */}
      <Card className="glass-panel border-white/5 bg-[#0D0F14]/75 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/40 border-b border-white/5">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">FIR Identifier</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Date</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">District</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Zonal Station</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Crime Type</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Severity</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Suspect dossier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16 bg-slate-900/60" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : firs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                    <p className="font-bold text-sm">No registry entries found</p>
                    <p className="text-[11px] mt-1">Refine your search parameters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                firs.map((fir, idx) => (
                  <TableRow
                    key={fir.id}
                    className="cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors"
                    onClick={() => setSelectedFir(fir)}
                  >
                    <TableCell className="font-mono text-xs font-bold text-white">{fir.firNumber}</TableCell>
                    <TableCell className="text-xs text-slate-300">{new Date(fir.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</TableCell>
                    <TableCell className="text-xs text-slate-300">{fir.district}</TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-[120px] truncate">{fir.station}</TableCell>
                    <TableCell className="text-xs text-slate-300 font-semibold">{fir.crimeType}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${statusBadge(fir.status)}`}>
                        {fir.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${severityBadge(fir.severity)}`}>
                        {fir.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-medium">
                      {fir.suspects.length > 0
                        ? fir.suspects.map((s) => s.person.name).join(', ')
                        : <span className="text-slate-600">—</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Console */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#08090B]/35">
            <p className="text-[10px] font-mono text-slate-500">
              LOGS: {((page - 1) * 20) + 1}–{Math.min(page * 20, total || 0)} OF {total.toLocaleString('en-IN')}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] cursor-pointer bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 text-[10px] p-0 cursor-pointer bg-slate-900 border-white/5 text-slate-400 hover:text-white active:bg-cyan-500/10 active:text-cyan-400"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] cursor-pointer bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* FIR Detail Dossier Modal */}
      <Dialog open={!!selectedFir} onOpenChange={() => setSelectedFir(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#0D0F14]/95 border border-white/5 backdrop-blur-xl text-white custom-scrollbar">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <FileText className="h-5 w-5 text-cyan-400" />
              <span className="font-mono">{selectedFir?.firNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedFir && (
            <div className="space-y-5 pt-4">
              <div className="flex gap-2">
                <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${severityBadge(selectedFir.severity)}`}>
                  {selectedFir.severity}
                </Badge>
                <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${statusBadge(selectedFir.status)}`}>
                  {selectedFir.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 border border-white/5 rounded-xl font-mono">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Record timestamp</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{new Date(selectedFir.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Type classification</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedFir.crimeType}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Zonal District</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedFir.district}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Station station</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedFir.station}</p>
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Narrative Log Details</label>
                <p className="text-xs leading-relaxed bg-slate-950/60 border border-white/5 p-4 rounded-xl mt-1 text-slate-300">{selectedFir.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500">
                    Suspects ({selectedFir.suspects.length})
                  </label>
                  <div className="space-y-2 mt-1.5">
                    {selectedFir.suspects.map((s, i) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                        <p className="text-xs font-bold text-red-400">{s.person.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Age: {s.person.age || '?'} • {s.person.address || 'Address Unknown'}</p>
                        {s.person.phone && <p className="text-[10px] text-slate-400 font-mono">Phone: {s.person.phone}</p>}
                      </div>
                    ))}
                    {selectedFir.suspects.length === 0 && <p className="text-xs text-slate-600">No suspects logged.</p>}
                  </div>
                </div>
                
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500">
                    Victims ({selectedFir.victims.length})
                  </label>
                  <div className="space-y-2 mt-1.5">
                    {selectedFir.victims.map((v, i) => (
                      <div key={i} className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl">
                        <p className="text-xs font-bold text-blue-400">{v.person.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Age: {v.person.age || '?'} • {v.person.address || 'Address Unknown'}</p>
                        {v.person.phone && <p className="text-[10px] text-slate-400 font-mono">Phone: {v.person.phone}</p>}
                      </div>
                    ))}
                    {selectedFir.victims.length === 0 && <p className="text-xs text-slate-600">No victims logged.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
