'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import CytoscapeComponent from 'react-cytoscapejs'
import Cytoscape from 'cytoscape'
import { Network, Info, Maximize2, Minimize2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  suspect: '#ef4444',
  victim: '#3b82f6',
  both: '#a855f7',
  other: '#6b7280',
}

const groupLabels: Record<string, string> = {
  suspect: 'Suspect',
  victim: 'Victim',
  both: 'Suspect / Victim',
  other: 'Person',
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
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        gravity: 0.3,
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
          'font-size': '10px',
          'text-valign': 'center',
          'text-halign': 'center',
          color: '#fff',
          'text-outline-width': 2,
          'text-outline-color': '#000',
          'font-weight': 600,
          width: (ele: Cytoscape.NodeSingular) => {
            const d = ele.data()
            return 20 + (d.suspectCount + d.victimCount) * 12
          },
          height: (ele: Cytoscape.NodeSingular) => {
            const d = ele.data()
            return 20 + (d.suspectCount + d.victimCount) * 12
          },
          'background-color': (ele: Cytoscape.NodeSingular) =>
            groupColors[ele.data().group] || '#6b7280',
          'border-width': 2,
          'border-color': '#fff',
          opacity: 0.9,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#f97316',
          opacity: 1,
          'z-index': 999,
        },
      },
      {
        selector: 'edge',
        style: {
          width: (ele: Cytoscape.EdgeSingular) => 1 + (ele.data().weight || 1) * 1.5,
          'line-color': '#94a3b8',
          'target-arrow-color': '#94a3b8',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 0.8,
          label: 'data(label)',
          'font-size': '8px',
          'text-rotation': 'autorotate',
          'text-background-color': '#fff',
          'text-background-opacity': 0.8,
          'text-background-padding': '2px',
          color: '#64748b',
        },
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#f97316',
          'target-arrow-color': '#f97316',
          width: 3,
        },
      },
    ],
    []
  )

  const suspectCount = nodes.filter((n) => n.group === 'suspect' || n.group === 'both').length
  const victimCount = nodes.filter((n) => n.group === 'victim' || n.group === 'both').length

  if (isLoading) return <NetworkSkeleton />

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Criminal Network Analysis</h2>
            <p className="text-xs text-muted-foreground">
              {nodes.length} entities • {edges.length} relationships
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 mr-2">
            {(['cose', 'breadthfirst', 'circle', 'concentric'] as const).map((l) => (
              <Button
                key={l}
                variant={layoutName === l ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] cursor-pointer"
                onClick={() => setLayoutName(l)}
              >
                {l === 'breadthfirst' ? 'Tree' : l.charAt(0).toUpperCase() + l.slice(1)}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <Card className={`lg:col-span-3 p-0 overflow-hidden ${isFullscreen ? 'flex-1' : ''}`}>
          <div style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '520px' }}>
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
              wheelSensitivity={0.3}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Network Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Entities</span>
                <span className="text-sm font-bold">{nodes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Relationships</span>
                <span className="text-sm font-bold">{edges.length}</span>
              </div>
              <div className="h-px bg-border" />
              {Object.entries(groupLabels).map(([key, label]) => {
                const count = nodes.filter((n) => n.group === key).length
                if (count === 0) return null
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: groupColors[key] }} />
                      <span className="text-xs">{label}</span>
                    </div>
                    <span className="text-xs font-bold">{count}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-3.5 w-3.5" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground space-y-1.5">
              <p>• Click a node to see details</p>
              <p>• Drag nodes to rearrange</p>
              <p>• Scroll to zoom in/out</p>
              <p>• Switch layouts above</p>
              <p>• Edge thickness = link strength</p>
            </CardContent>
          </Card>

          {/* Top connected entities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Most Connected</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nodes
                .sort((a, b) => (b.suspectCount + b.victimCount) - (a.suspectCount + a.victimCount))
                .slice(0, 5)
                .map((n, i) => (
                  <button
                    key={n.id}
                    className="w-full flex items-center gap-2 text-left cursor-pointer hover:bg-muted rounded px-1.5 py-1 -mx-1.5 transition-colors"
                    onClick={() => setSelectedNode(n)}
                  >
                    <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: groupColors[n.group] }} />
                    <span className="text-xs flex-1 truncate">{n.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1">
                      {n.suspectCount + n.victimCount}
                    </Badge>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Node Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode ? groupColors[selectedNode.group] : '#666' }} />
              {selectedNode?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-3">
              <Badge variant="outline" style={{ color: groupColors[selectedNode.group], borderColor: groupColors[selectedNode.group] }}>
                {groupLabels[selectedNode.group]}
              </Badge>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedNode.age || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedNode.phone || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedNode.address || 'Unknown'}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{selectedNode.suspectCount}</p>
                  <p className="text-[10px] text-muted-foreground">As Suspect</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{selectedNode.victimCount}</p>
                  <p className="text-[10px] text-muted-foreground">As Victim</p>
                </div>
              </div>
              {/* Related edges */}
              {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <p className="text-xs font-semibold">Connections</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                    {edges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((e, i) => {
                        const isSource = e.source === selectedNode.id
                        const otherName = isSource ? e.targetName : e.sourceName
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{isSource ? '→' : '←'}</span>
                            <span className="font-medium">{otherName}</span>
                            <Badge variant="secondary" className="text-[9px]">{e.label}</Badge>
                          </div>
                        )
                      })}
                  </div>
                </>
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
