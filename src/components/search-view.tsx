'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, X, FileText, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-500">
          <SearchIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">FIR Records</h2>
          <p className="text-xs text-muted-foreground">Search and browse {total.toLocaleString('en-IN')} crime records</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground ml-auto cursor-pointer" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" /> Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FIR number, description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={district} onValueChange={(v) => { setDistrict(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
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
            <Select value={crimeType} onValueChange={(v) => { setCrimeType(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Crime Type" />
              </SelectTrigger>
              <SelectContent>
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
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={(v) => { setSeverity(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">FIR Number</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">District</TableHead>
                  <TableHead className="text-xs">Station</TableHead>
                  <TableHead className="text-xs">Crime Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs">Suspects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : firs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No FIRs found matching your filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  firs.map((fir) => (
                    <TableRow
                      key={fir.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedFir(fir)}
                    >
                      <TableCell className="font-mono text-xs font-medium">{fir.firNumber}</TableCell>
                      <TableCell className="text-xs">{new Date(fir.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</TableCell>
                      <TableCell className="text-xs">{fir.district}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{fir.station}</TableCell>
                      <TableCell className="text-xs">{fir.crimeType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColor(fir.status)}`}>
                          {fir.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${severityColor(fir.severity)}`}>
                          {fir.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {fir.suspects.length > 0
                          ? fir.suspects.map((s) => s.person.name).join(', ')
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total.toLocaleString('en-IN')}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs cursor-pointer"
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
                    className="h-7 w-7 text-xs p-0 cursor-pointer"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs cursor-pointer"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FIR Detail Dialog */}
      <Dialog open={!!selectedFir} onOpenChange={() => setSelectedFir(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              {selectedFir?.firNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedFir && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={severityColor(selectedFir.severity)}>{selectedFir.severity}</Badge>
                <Badge variant="outline" className={statusColor(selectedFir.status)}>{selectedFir.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Date</p>
                  <p className="font-medium">{new Date(selectedFir.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Crime Type</p>
                  <p className="font-medium">{selectedFir.crimeType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">District</p>
                  <p className="font-medium">{selectedFir.district}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Station</p>
                  <p className="font-medium">{selectedFir.station}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm leading-relaxed bg-muted p-3 rounded-lg">{selectedFir.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Suspects ({selectedFir.suspects.length})
                  </p>
                  <div className="space-y-2">
                    {selectedFir.suspects.map((s, i) => (
                      <div key={i} className="bg-red-50 p-2.5 rounded-lg">
                        <p className="text-sm font-medium text-red-900">{s.person.name}</p>
                        <p className="text-[11px] text-red-700">Age: {s.person.age || '?'} • {s.person.address || 'Address unknown'}</p>
                        {s.person.phone && <p className="text-[11px] text-red-700">Phone: {s.person.phone}</p>}
                      </div>
                    ))}
                    {selectedFir.suspects.length === 0 && <p className="text-xs text-muted-foreground">No suspects identified</p>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Victims ({selectedFir.victims.length})
                  </p>
                  <div className="space-y-2">
                    {selectedFir.victims.map((v, i) => (
                      <div key={i} className="bg-blue-50 p-2.5 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">{v.person.name}</p>
                        <p className="text-[11px] text-blue-700">Age: {v.person.age || '?'} • {v.person.address || 'Address unknown'}</p>
                        {v.person.phone && <p className="text-[11px] text-blue-700">Phone: {v.person.phone}</p>}
                      </div>
                    ))}
                    {selectedFir.victims.length === 0 && <p className="text-xs text-muted-foreground">No victims recorded</p>}
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
