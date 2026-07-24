'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Layers, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapFir {
  id: string
  firNumber: string
  crimeType: string
  severity: string
  date: string
  latitude: number
  longitude: number
  district: string
  station: string
  status: string
}

interface MapStation {
  id: string
  name: string
  district: string
  latitude: number
  longitude: number
  officers: number
}

const severityColors: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

const severityOpacity: Record<string, number> = {
  Critical: 0.9,
  High: 0.7,
  Medium: 0.5,
  Low: 0.35,
}

const crimeTypeColors: Record<string, string> = {
  'Theft': '#f97316',
  'Burglary': '#ef4444',
  'Robbery': '#dc2626',
  'Cybercrime': '#8b5cf6',
  'Assault': '#ec4899',
  'Fraud': '#6366f1',
  'Vehicle Theft': '#14b8a6',
  'Chain Snatching': '#f59e0b',
  'Murder': '#991b1b',
  'Kidnapping': '#be185d',
  'Drug Trafficking': '#7c3aed',
}

type FilterMode = 'severity' | 'crimeType' | 'status'

export function MapView() {
  const { data, isLoading } = useQuery({
    queryKey: ['map'],
    queryFn: () => fetch('/api/map').then((r) => r.json()),
  })

  const [filterMode, setFilterMode] = useState<FilterMode>('severity')
  const [selectedFir, setSelectedFir] = useState<MapFir | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const crimeLayerRef = useRef<L.LayerGroup | null>(null)
  const stationLayerRef = useRef<L.LayerGroup | null>(null)

  const firs: MapFir[] = data?.firs || []
  const stations: MapStation[] = data?.stations || []

  const filterOptions = useMemo(() => {
    if (filterMode === 'severity') return ['Critical', 'High', 'Medium', 'Low']
    if (filterMode === 'crimeType') return [...new Set(firs.map((f) => f.crimeType))].sort()
    return ['Open', 'Under Investigation', 'Closed']
  }, [filterMode, firs])

  const toggleFilter = (val: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(val)) next.delete(val)
      else next.add(val)
      return next
    })
  }

  const filteredFirs = useMemo(() => {
    if (activeFilters.size === 0) return firs
    return firs.filter((f) => {
      if (filterMode === 'severity') return activeFilters.has(f.severity)
      if (filterMode === 'crimeType') return activeFilters.has(f.crimeType)
      return activeFilters.has(f.status)
    })
  }, [firs, activeFilters, filterMode])

  const getMarkerColor = (fir: MapFir) => {
    if (filterMode === 'severity') return severityColors[fir.severity] || '#f97316'
    return crimeTypeColors[fir.crimeType] || '#f97316'
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [13.0, 77.5],
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    const crimeLayer = L.layerGroup().addTo(map)
    const stationLayer = L.layerGroup().addTo(map)

    mapRef.current = map
    crimeLayerRef.current = crimeLayer
    stationLayerRef.current = stationLayer

    return () => {
      map.remove()
      mapRef.current = null
      crimeLayerRef.current = null
      stationLayerRef.current = null
    }
  }, [])

  // Update station markers when data loads
  useEffect(() => {
    if (!stationLayerRef.current || stations.length === 0) return

    stationLayerRef.current.clearLayers()

    const stationIcon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:#1e40af;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      className: '',
    })

    stations.forEach((s) => {
      L.marker([s.latitude, s.longitude], { icon: stationIcon })
        .addTo(stationLayerRef.current!)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:180px">
            <strong style="font-size:13px">${s.name}</strong><br/>
            <span style="color:#666;font-size:11px">${s.district}</span><br/>
            <span style="font-size:11px">Officers: ${s.officers}</span>
          </div>`,
          { className: 'custom-popup' }
        )
    })
  }, [stations])

  // Update crime markers when filters change
  useEffect(() => {
    if (!crimeLayerRef.current) return

    crimeLayerRef.current.clearLayers()

    filteredFirs.forEach((fir) => {
      const color = getMarkerColor(fir)
      const opacity = severityOpacity[fir.severity] || 0.5
      const isCritical = fir.severity === 'Critical'
      const size = isCritical ? 16 : 12

      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};opacity:${opacity};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        className: '',
      })

      const marker = L.marker([fir.latitude, fir.longitude], { icon })
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:200px">
          <strong style="font-size:13px">${fir.firNumber}</strong><br/>
          <span style="display:inline-block;margin-top:4px;padding:1px 6px;background:${color}20;color:${color};border-radius:4px;font-size:10px;font-weight:600">${fir.crimeType}</span>
          <span style="display:inline-block;margin-top:4px;margin-left:4px;padding:1px 6px;background:${severityColors[fir.severity]}20;color:${severityColors[fir.severity]};border-radius:4px;font-size:10px;font-weight:600">${fir.severity}</span><br/>
          <span style="color:#666;font-size:11px">${fir.station}, ${fir.district}</span><br/>
          <span style="color:#666;font-size:11px">${new Date(fir.date).toLocaleDateString('en-IN')}</span>
        </div>`,
        { className: 'custom-popup' }
      )
      marker.on('click', () => setSelectedFir(fir))
      crimeLayerRef.current!.addLayer(marker)
    })
  }, [filteredFirs, filterMode, getMarkerColor])

  if (isLoading) return <MapSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crime Hotspot Map</h2>
          <p className="text-xs text-muted-foreground">Karnataka State — Interactive crime visualization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <Card className="lg:col-span-3 p-0 overflow-hidden">
          <div ref={mapContainerRef} className="w-full" style={{ height: '520px' }} />
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter by
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-1">
                {(['severity', 'crimeType', 'status'] as FilterMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={filterMode === mode ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs flex-1 cursor-pointer"
                    onClick={() => { setFilterMode(mode); setActiveFilters(new Set()) }}
                  >
                    {mode === 'crimeType' ? 'Type' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.map((opt) => {
                  const isActive = activeFilters.has(opt)
                  const color = filterMode === 'severity'
                    ? severityColors[opt] || '#6b7280'
                    : filterMode === 'crimeType'
                      ? crimeTypeColors[opt] || '#f97316'
                      : opt === 'Open' ? '#ef4444' : opt === 'Closed' ? '#22c55e' : '#eab308'
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleFilter(opt)}
                      className="text-[11px] px-2 py-1 rounded-md border transition-all cursor-pointer"
                      style={{
                        borderColor: isActive ? color : 'transparent',
                        backgroundColor: isActive ? `${color}15` : 'var(--muted)',
                        color: isActive ? color : 'var(--muted-foreground)',
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Showing {filteredFirs.length} of {firs.length} incidents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-blue-700 border-2 border-white shadow" />
                <span>Police Station</span>
              </div>
              {Object.entries(severityColors).map(([sev, color]) => (
                <div key={sev} className="flex items-center gap-2 text-xs">
                  <div className="rounded-full border-2 border-white shadow" style={{ width: sev === 'Critical' ? 14 : 10, height: sev === 'Critical' ? 14 : 10, backgroundColor: color }} />
                  <span>{sev}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-red-600">{firs.filter((f) => f.severity === 'Critical').length}</p>
                  <p className="text-[10px] text-muted-foreground">Critical</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{firs.filter((f) => f.severity === 'High').length}</p>
                  <p className="text-[10px] text-muted-foreground">High</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{firs.filter((f) => f.severity === 'Medium').length}</p>
                  <p className="text-[10px] text-muted-foreground">Medium</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{firs.filter((f) => f.severity === 'Low').length}</p>
                  <p className="text-[10px] text-muted-foreground">Low</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected FIR Detail */}
      {selectedFir && (
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-bold">{selectedFir.firNumber}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: crimeTypeColors[selectedFir.crimeType] || '#f97316', color: crimeTypeColors[selectedFir.crimeType] || '#f97316' }}>
                    {selectedFir.crimeType}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: severityColors[selectedFir.severity] || '#f97316', color: severityColors[selectedFir.severity] || '#f97316' }}>
                    {selectedFir.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]" style={{ color: selectedFir.status === 'Open' ? '#ef4444' : selectedFir.status === 'Closed' ? '#22c55e' : '#eab308' }}>
                    {selectedFir.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {selectedFir.station} • {selectedFir.district} • {new Date(selectedFir.date).toLocaleDateString('en-IN')}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs cursor-pointer" onClick={() => setSelectedFir(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Skeleton className="lg:col-span-3 h-[520px] rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
