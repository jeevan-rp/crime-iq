'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Layers, Filter, Shield, Info, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'

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
  description?: string
}

interface MapStation {
  id: string
  name: string
  district: string
  latitude: number
  longitude: number
  officers: number
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

const severityColors: Record<string, string> = {
  Critical: '#FF3B30',
  High: '#F59E0B',
  Medium: '#00F0FF',
  Low: '#10B981',
}

const severityOpacity: Record<string, number> = {
  Critical: 0.9,
  High: 0.7,
  Medium: 0.6,
  Low: 0.45,
}

const crimeTypeColors: Record<string, string> = {
  'Theft': '#F59E0B',
  'Burglary': '#FF3B30',
  'Robbery': '#DC2626',
  'Cybercrime': '#8B5CF6',
  'Assault': '#EC4899',
  'Fraud': '#6366F1',
  'Vehicle Theft': '#14B8A6',
  'Chain Snatching': '#F59E0B',
  'Murder': '#FF3B30',
  'Kidnapping': '#BE185D',
  'Drug Trafficking': '#7C3AED',
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
    if (filterMode === 'severity') return severityColors[fir.severity] || '#F59E0B'
    return crimeTypeColors[fir.crimeType] || '#F59E0B'
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946], // Center on Bengaluru
      zoom: 10,
      zoomControl: false,
    })

    // Beautiful premium dark tiles (CartoDB DarkMatter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).addTo(map)

    // Move zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

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

    stations.forEach((s) => {
      const stationIcon = L.divIcon({
        html: `<div class="radar-pulse shrink-0 flex items-center justify-center" style="width:24px;height:24px;background:#0066FF;border:2px solid #00F0FF;border-radius:50%;box-shadow:0 0 10px #0066FF"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: '',
      })

      L.marker([s.latitude, s.longitude], { icon: stationIcon })
        .addTo(stationLayerRef.current!)
        .bindPopup(
          `<div style="font-family:monospace;min-width:180px;background:#0d0f14;color:#fff;border-radius:8px;padding:4px">
            <strong style="font-size:12px;color:#00F0FF">${s.name}</strong><br/>
            <span style="color:#8a94a6;font-size:10px">${s.district}</span><br/>
            <span style="font-size:10px;color:#10B981">Officers on Duty: ${s.officers}</span>
          </div>`,
          { className: 'custom-popup-dark' }
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
      const isCritical = fir.severity === 'Critical' || fir.severity === 'High'
      const size = isCritical ? 16 : 10

      const htmlContent = isCritical
        ? `<div class="radar-pulse" style="width:${size}px;height:${size}px;background:${color};border:1.5px solid #fff;border-radius:50%;box-shadow: 0 0 8px ${color}"></div>`
        : `<div style="width:${size}px;height:${size}px;background:${color};opacity:${opacity};border:1px solid rgba(255,255,255,0.4);border-radius:50%"></div>`

      const icon = L.divIcon({
        html: htmlContent,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        className: '',
      })

      const marker = L.marker([fir.latitude, fir.longitude], { icon })
      marker.on('click', () => {
        setSelectedFir(fir)
        if (mapRef.current) {
          mapRef.current.panTo([fir.latitude, fir.longitude])
        }
      })
      
      crimeLayerRef.current!.addLayer(marker)
    })
  }, [filteredFirs, filterMode, getMarkerColor])

  if (isLoading) return <MapSkeleton />

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/5 bg-[#08090B] h-[600px] cyber-grid">
      {/* Edge to Edge Map */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Header details */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-2 bg-[#0D0F14]/80 shadow-xl border-white/5">
          <Shield className="h-4.5 w-4.5 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold text-white font-mono">STATE CRIME MONITOR</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">KA-Police Bureau Broadcast</p>
          </div>
        </div>
      </div>

      {/* Floating Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-4 z-10 w-80 max-w-sm pointer-events-auto">
        <Card className="glass-panel border-white/5 bg-[#0D0F14]/75 shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-cyan-400" /> Filters
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              Incidents: {filteredFirs.length} / {firs.length}
            </span>
          </div>

          <div className="flex gap-1 mb-3">
            {(['severity', 'crimeType', 'status'] as FilterMode[]).map((mode) => (
              <Button
                key={mode}
                variant={filterMode === mode ? 'default' : 'outline'}
                size="sm"
                className="text-[10px] h-7 flex-1 cursor-pointer bg-slate-900 border-white/5 hover:border-white/10"
                onClick={() => { setFilterMode(mode); setActiveFilters(new Set()) }}
              >
                {mode === 'crimeType' ? 'Type' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto custom-scrollbar">
            {filterOptions.map((opt) => {
              const isActive = activeFilters.has(opt)
              const color = filterMode === 'severity'
                ? severityColors[opt] || '#6b7280'
                : filterMode === 'crimeType'
                  ? crimeTypeColors[opt] || '#F59E0B'
                  : opt === 'Open' ? '#FF3B30' : opt === 'Closed' ? '#10B981' : '#F59E0B'
              return (
                <button
                  key={opt}
                  onClick={() => toggleFilter(opt)}
                  className="text-[9px] px-2 py-1 rounded border transition-all cursor-pointer font-bold"
                  style={{
                    borderColor: isActive ? color : 'rgba(255,255,255,0.05)',
                    backgroundColor: isActive ? `${color}15` : 'rgba(255,255,255,0.02)',
                    color: isActive ? color : '#8a94a6',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Floating Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <Card className="glass-panel border-white/5 bg-[#0D0F14]/75 px-3 py-2.5 rounded-xl shadow-xl">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 font-mono">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 border border-cyan-400 shrink-0" />
              STATION
            </div>
            {Object.entries(severityColors).map(([sev, color]) => (
              <div key={sev} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 font-mono">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {sev.toUpperCase()}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Slide-out Incident Telemetry Drawer (Right Side overlay) */}
      <AnimatePresence>
        {selectedFir && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-0 right-0 h-full w-80 bg-[#0D0F14]/90 border-l border-white/5 backdrop-blur-xl z-20 p-6 flex flex-col justify-between shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4.5 w-4.5 text-cyan-400" />
                  <span className="text-xs font-bold text-white font-mono">TELEMETRY DETAILS</span>
                </div>
                <button
                  onClick={() => setSelectedFir(null)}
                  className="h-6 w-6 rounded hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Case Identifier</label>
                  <p className="text-base font-extrabold text-white font-mono mt-0.5">{selectedFir.firNumber}</p>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold tracking-wider uppercase bg-slate-900 border-white/5" style={{ color: getMarkerColor(selectedFir) }}>
                    {selectedFir.crimeType}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] font-bold tracking-wider uppercase ${severityBadge(selectedFir.severity)}`}>
                    {selectedFir.severity}
                  </Badge>
                </div>

                <div className="border border-white/5 bg-slate-950/40 rounded-xl p-3.5">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Incident Narrative</label>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{selectedFir.description || 'No case logs reported.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Zonal Station</span>
                    <p className="text-xs text-white font-semibold mt-0.5">{selectedFir.station}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">District</span>
                    <p className="text-xs text-white font-semibold mt-0.5">{selectedFir.district}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <Button
                onClick={() => setSelectedFir(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-white/5 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
              >
                Dismiss Panel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 bg-slate-900/60" />
      <Skeleton className="w-full h-[520px] rounded-2xl bg-slate-900/60" />
    </div>
  )
}
