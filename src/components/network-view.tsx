'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import CytoscapeComponent from 'react-cytoscapejs'
import Cytoscape from 'cytoscape'
import { Network, Info, Maximize2, Minimize2, Users, Compass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'

interface NetworkNode {
  id: string
  name: string
  label: string
  group: string
  age: number | null
  address: string | null
  phone: string | null
  suspectCount: number
  victimCount: number
}

interface NetworkEdge {
  source: string
  target: string
  label: string
  weight: number
  sourceName: string
  targetName: string
}

const groupColors: Record<string, string> = {
  suspect: '#FF3B30', // Crimson red for suspects
  victim: '#0066FF',  // Electric blue for victims
  both: '#00F0FF',    // Cyan for both
  other: '#8a94a6',
}

const groupLabels: Record<string, string> = {
  suspect: 'Suspect',
  victim: 'Victim',
  both: 'Suspect & Victim',
  other: 'Person of Interest',
}

export function NetworkView() {
  const { data, isLoading } = useQuery({
    queryKey: ['network'],
    queryFn: () => fetch('/api/network').then((r) => r.json()),
  })

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layoutName, setLayoutName] = useState<'cose' | 'breadthfirst' | 'circle' | 'concentric'>('cose')

  const nodes: NetworkNode[] = data?.nodes || []
  const edges: NetworkEdge[] = data?.edges || []

  const cyElements = useMemo(() => {
    const cyNodes = nodes.map((n) => ({
      data: {
        id: n.id,
        label: n.name,
        group: n.group,
        suspectCount: n.suspectCount,
        victimCount: n.victimCount,
      },
    }))
    const cyEdges = edges.map((e, i) => ({
      data: {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        weight: e.weight,
      },
    }))
    return [...cyNodes, ...cyEdges]
  }, [nodes, edges])

  const getLayout = useCallback(() => {
    const layouts: Record<string, Cytoscape.LayoutOptions> = {
      cose: {
        name: 'cose',
        animate: true,
        animationDuration: 800,
        nodeRepulsion: 10000,
        idealEdgeLength: 120,
        gravity: 0.25,
      },
      breadthfirst: {
        name: 'breadthfirst',
        animate: true,
        animationDuration: 600,
        spacingFactor: 1.5,
      },
      circle: {
        name: 'circle',
        animate: true,
        animationDuration: 600,
      },
      concentric: {
        name: 'concentric',
        animate: true,
        animationDuration: 600,
        concentric: (node: Cytoscape.NodeSingular) => {
          const d = node.data()
          return d.suspectCount * 2 - d.victimCount
        },
      },
    }
    return layouts[layoutName]
  }, [layoutName])

  const stylesheet = useMemo(
    () => [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'font-size': '9px',
          'font-family': 'monospace',
          'text-valign': 'bottom',
          'text-margin-y': 4,
          color: '#8a94a6',
          'font-weight': 'bold',
          width: (ele: Cytoscape.NodeSingular) => {
            const d = ele.data()
            return 16 + (d.suspectCount + d.victimCount) * 8
          },
          height: (ele: Cytoscape.NodeSingular) => {
            const d = ele.data()
            return 16 + (d.suspectCount + d.victimCount) * 8
          },
          'background-color': (ele: Cytoscape.NodeSingular) =>
            groupColors[ele.data().group] || '#8a94a6',
          'border-width': 1.5,
          'border-color': '#08090B',
          opacity: 0.9,
          'shadow-blur': 10,
          'shadow-color': (ele: Cytoscape.NodeSingular) =>
            groupColors[ele.data().group] || '#8a94a6',
          'shadow-opacity': 0.6,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#00F0FF',
          opacity: 1,
          'z-index': 999,
          'shadow-blur': 20,
          'shadow-color': '#00F0FF',
        },
      },
      {
        selector: 'edge',
        style: {
          width: (ele: Cytoscape.EdgeSingular) => 1.5 + (ele.data().weight || 1) * 1.5,
          'line-color': 'rgba(255, 255, 255, 0.08)',
          'target-arrow-color': 'rgba(255, 255, 255, 0.08)',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 0.8,
          label: 'data(label)',
          'font-size': '8px',
          'font-family': 'monospace',
          'text-rotation': 'autorotate',
          'text-background-color': '#08090B',
          'text-background-opacity': 0.85,
          'text-background-padding': '3px',
          color: '#5b6575',
        },
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#00F0FF',
          'target-arrow-color': '#00F0FF',
          width: 3.5,
        },
      },
    ],
    []
  )

  const suspectCount = nodes.filter((n) => n.group === 'suspect' || n.group === 'both').length
  const victimCount = nodes.filter((n) => n.group === 'victim' || n.group === 'both').length

  if (isLoading) return <NetworkSkeleton />

  return (
    <div className={`flex flex-col space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#08090B] p-8' : ''}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-purple-500/10">
            <Network className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Entity Link Graph
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              {nodes.length} Targets Tracked • {edges.length} Decrypted Vectors
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-center">
          <div className="flex gap-1 mr-2 bg-slate-950/40 p-1 border border-white/5 rounded-xl">
            {(['cose', 'breadthfirst', 'circle', 'concentric'] as const).map((l) => (
              <Button
                key={l}
                variant={layoutName === l ? 'default' : 'ghost'}
                size="sm"
                className="text-[10px] h-7 cursor-pointer uppercase font-bold tracking-widest text-slate-400 hover:text-white"
                onClick={() => setLayoutName(l)}
              >
                {l === 'breadthfirst' ? 'Tree' : l}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer bg-slate-900 border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">
        {/* Cytoscape Container */}
        <Card className={`lg:col-span-3 p-0 overflow-hidden glass-panel border-white/5 bg-[#0D0F14]/40 cyber-grid relative ${isFullscreen ? 'h-[calc(100vh-160px)]' : 'h-[520px]'}`}>
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="glass-panel border-white/5 bg-[#0D0F14]/75 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Spatial Coordinate Grid</span>
            </div>
          </div>

          <div className="w-full h-full">
            <CytoscapeComponent
              cy={(cy) => {
                cy.on('tap', 'node', (evt) => {
                  const nodeData = evt.target.data()
                  const fullNode = nodes.find((n) => n.id === nodeData.id)
                  if (fullNode) setSelectedNode(fullNode)
                })
                cy.on('tap', (evt) => {
                  if (evt.target === cy) setSelectedNode(null)
                })
              }}
              elements={cyElements}
              layout={getLayout()}
              stylesheet={stylesheet}
              style={{ width: '100%', height: '100%' }}
              wheelSensitivity={0.2}
            />
          </div>
        </Card>

        {/* Informational sidebar */}
        <div className="space-y-6">
          <Card className="glass-panel border-white/5 p-5">
            <div className="flex items-center gap-2 text-cyan-400 mb-3 border-b border-white/5 pb-2">
              <Users className="h-4.5 w-4.5" />
              <h3 className="text-xs uppercase tracking-widest font-black text-slate-300">Zonal Vectors</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Tracked Entities</span>
                <span className="font-mono font-bold text-white">{nodes.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Links</span>
                <span className="font-mono font-bold text-white">{edges.length}</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              {Object.entries(groupLabels).map(([key, label]) => {
                const count = nodes.filter((n) => n.group === key).length
                if (count === 0) return null
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: groupColors[key] }} />
                      <span className="text-slate-300">{label}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-400">{count}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="glass-panel border-white/5 p-5">
            <div className="flex items-center gap-2 text-blue-400 mb-3 border-b border-white/5 pb-2">
              <Compass className="h-4.5 w-4.5" />
              <h3 className="text-xs uppercase tracking-widest font-black text-slate-300">Telemetry Info</h3>
            </div>
            <div className="text-[10px] text-slate-400 space-y-2 leading-relaxed">
              <p>• Click any node target to decrypt full profile dossier.</p>
              <p>• Drag targets to manually rearrange layout spatial vectors.</p>
              <p>• Vector thickness is directly proportional to link weight.</p>
            </div>
          </Card>

          {/* Top connected entities */}
          <Card className="glass-panel border-white/5 p-5">
            <h3 className="text-xs uppercase tracking-widest font-black text-slate-300 mb-3 border-b border-white/5 pb-2">Critical Relational Hubs</h3>
            <div className="space-y-2">
              {nodes
                .sort((a, b) => (b.suspectCount + b.victimCount) - (a.suspectCount + a.victimCount))
                .slice(0, 4)
                .map((n, i) => (
                  <button
                    key={n.id}
                    className="w-full flex items-center gap-2 text-left cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors border border-transparent hover:border-white/5"
                    onClick={() => setSelectedNode(n)}
                  >
                    <span className="font-mono text-[10px] text-slate-500 w-3">{i + 1}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: groupColors[n.group] }} />
                    <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{n.name}</span>
                    <Badge variant="outline" className="text-[9px] font-bold font-mono px-1.5 py-0 bg-slate-900 border-white/5 text-cyan-400">
                      {n.suspectCount + n.victimCount}
                    </Badge>
                  </button>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Selected Node Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-md bg-[#0D0F14]/90 border border-white/5 backdrop-blur-xl text-white">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="w-3.5 h-3.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: selectedNode ? groupColors[selectedNode.group] : '#666' }} />
              {selectedNode?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNode && (
            <div className="space-y-4 pt-4">
              <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase bg-slate-950 border-white/5" style={{ color: groupColors[selectedNode.group] }}>
                {groupLabels[selectedNode.group].toUpperCase()}
              </Badge>
              
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 border border-white/5 rounded-xl">
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Age dossier</p>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedNode.age || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Secure Phone</p>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedNode.phone || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Known Coordinates / Address</p>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedNode.address || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl">
                  <p className="text-2xl font-black text-red-500">{selectedNode.suspectCount}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Suspect links</p>
                </div>
                <div className="text-center p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-xl">
                  <p className="text-2xl font-black text-blue-400">{selectedNode.victimCount}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Victim links</p>
                </div>
              </div>

              {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Decrypted Vector Relations</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {edges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((e, i) => {
                        const isSource = e.source === selectedNode.id
                        const otherName = isSource ? e.targetName : e.sourceName
                        return (
                          <div key={i} className="flex items-center justify-between text-xs bg-slate-950/20 border border-white/5 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-mono">{isSource ? '→' : '←'}</span>
                              <span className="font-semibold text-slate-200">{otherName}</span>
                            </div>
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border border-white/5">{e.label}</Badge>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NetworkSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 bg-slate-900/60" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Skeleton className="lg:col-span-3 h-[520px] rounded-2xl bg-slate-900/60" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl bg-slate-900/60" />
          <Skeleton className="h-36 rounded-2xl bg-slate-900/60" />
        </div>
      </div>
    </div>
  )
}
