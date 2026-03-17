import { useMemo, useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCw, ZoomIn, ZoomOut, Landmark, ArrowRightLeft, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import { getArtworkImageUrl } from '@/types/art';
import type { ArtworkMovement } from '@/types/movement';
import type { EnrichedArtwork } from '@/types/art';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  artworks: EnrichedArtwork[];
  onArtworkSelect: (artworkId: string) => void;
}

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  lat: number;
  lng: number;
  inflow: number;
  outflow: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  artworkCount: number;
  artworkIds: string[];
  color: string;
}

/** MuMu gold tones */
const GOLD = '#b8860b';
const GOLD_LIGHT = '#d4a84b';
const BURGUNDY = '#7a2e3b';
const BURGUNDY_LIGHT = '#9b4a58';

export function NetworkGraph3D({ movements, museumMap, artworks, onArtworkSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [ForceGraph, setForceGraph] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lazy load react-force-graph-3d
  useEffect(() => {
    import('react-force-graph-3d').then(mod => {
      setForceGraph(() => mod.default);
      setIsLoaded(true);
    }).catch(() => {
      // Silently fail - show fallback
    });
  }, []);

  const graphData = useMemo(() => {
    const nodeMap = new Map<string, { inflow: number; outflow: number }>();
    const linkMap = new Map<string, { count: number; artworkIds: Set<string> }>();

    for (const m of movements) {
      if (!nodeMap.has(m.lender_museum_id)) nodeMap.set(m.lender_museum_id, { inflow: 0, outflow: 0 });
      if (!nodeMap.has(m.borrower_museum_id)) nodeMap.set(m.borrower_museum_id, { inflow: 0, outflow: 0 });
      nodeMap.get(m.lender_museum_id)!.outflow++;
      nodeMap.get(m.borrower_museum_id)!.inflow++;

      const linkKey = `${m.lender_museum_id}__${m.borrower_museum_id}`;
      if (!linkMap.has(linkKey)) linkMap.set(linkKey, { count: 0, artworkIds: new Set() });
      const link = linkMap.get(linkKey)!;
      link.count++;
      link.artworkIds.add(m.artwork_id);
    }

    const nodes: GraphNode[] = [];
    for (const [id, stats] of nodeMap) {
      const museum = museumMap.get(id);
      if (!museum || (museum.lat === 0 && museum.lng === 0)) continue;
      const total = stats.inflow + stats.outflow;
      const netFlow = stats.inflow - stats.outflow;
      // Color: net importer = gold, net exporter = burgundy, balanced = blend
      const color = netFlow > 0 ? GOLD : netFlow < 0 ? BURGUNDY : BURGUNDY_LIGHT;
      nodes.push({
        id, name: getMuseumDisplayName(id, museumMap),
        val: Math.max(2, Math.sqrt(total) * 3),
        color, lat: museum.lat, lng: museum.lng,
        inflow: stats.inflow, outflow: stats.outflow,
      });
    }

    const maxCount = Math.max(1, ...Array.from(linkMap.values()).map(l => l.count));
    const links: GraphLink[] = [];
    for (const [key, data] of linkMap) {
      const [source, target] = key.split('__');
      if (!nodes.find(n => n.id === source) || !nodes.find(n => n.id === target)) continue;
      const intensity = data.count / maxCount;
      links.push({
        source, target,
        value: Math.max(0.5, intensity * 4),
        artworkCount: data.artworkIds.size,
        artworkIds: Array.from(data.artworkIds),
        color: `rgba(184, 134, 11, ${0.15 + intensity * 0.6})`,
      });
    }

    return { nodes, links };
  }, [movements, museumMap]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as GraphNode);
    setSelectedLink(null);
    // Zoom camera to node
    if (graphRef.current && node.x !== undefined) {
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      graphRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node, 1000,
      );
    }
  }, []);

  const handleLinkClick = useCallback((link: any) => {
    setSelectedLink(link as GraphLink);
    setSelectedNode(null);
  }, []);

  const handleResetCamera = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
    }
    setSelectedNode(null);
    setSelectedLink(null);
  }, []);

  // Selected link artwork previews
  const linkArtworks = useMemo(() => {
    if (!selectedLink) return [];
    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));
    return selectedLink.artworkIds.slice(0, 8).map(id => artworkMap.get(id)).filter(Boolean) as EnrichedArtwork[];
  }, [selectedLink, artworks]);

  // Node artwork previews
  const nodeArtworks = useMemo(() => {
    if (!selectedNode) return [];
    const relevantIds = new Set<string>();
    for (const m of movements) {
      if (m.lender_museum_id === selectedNode.id || m.borrower_museum_id === selectedNode.id) {
        relevantIds.add(m.artwork_id);
      }
    }
    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));
    return Array.from(relevantIds).slice(0, 8).map(id => artworkMap.get(id)).filter(Boolean) as EnrichedArtwork[];
  }, [selectedNode, movements, artworks]);

  if (!isLoaded || !ForceGraph) {
    return (
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-sm font-semibold">3D Mobility Network</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Loading interactive network…</p>
          </div>
          <div className="flex items-center justify-center" style={{ height: 500 }}>
            <Skeleton className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">3D Mobility Network</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {graphData.nodes.length} museums · {graphData.links.length} corridors · Click & drag to explore
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetCamera} title="Reset view">
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="relative" style={{ height: 500 }} ref={containerRef}>
          <ForceGraph
            ref={graphRef}
            graphData={graphData}
            backgroundColor="hsl(39, 33%, 96%)"
            nodeLabel={(node: GraphNode) => `${node.name}\nInflow: ${node.inflow} · Outflow: ${node.outflow}`}
            nodeColor={(node: GraphNode) => selectedNode?.id === node.id ? GOLD_LIGHT : node.color}
            nodeVal={(node: GraphNode) => selectedNode?.id === node.id ? node.val * 1.8 : node.val}
            nodeOpacity={0.92}
            nodeResolution={16}
            linkColor={(link: GraphLink) => {
              if (selectedLink && (link as any).source?.id === (selectedLink as any).source?.id && (link as any).target?.id === (selectedLink as any).target?.id) return GOLD_LIGHT;
              return link.color;
            }}
            linkWidth={(link: GraphLink) => link.value}
            linkOpacity={0.6}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleColor={() => GOLD}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            enableNodeDrag={true}
            enableNavigationControls={true}
            showNavInfo={false}
            width={containerRef.current?.clientWidth || 800}
            height={500}
            warmupTicks={50}
            cooldownTicks={100}
          />

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-2.5 text-[10px] space-y-1 border border-border/60 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: GOLD }} />
              <span className="text-muted-foreground">Net Importer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: BURGUNDY }} />
              <span className="text-muted-foreground">Net Exporter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] rounded-full" style={{ background: GOLD }} />
              <span className="text-muted-foreground">Flow (particles = direction)</span>
            </div>
          </div>

          {/* Detail Panel */}
          {(selectedNode || selectedLink) && (
            <div className="absolute top-3 right-3 z-10 bg-background/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-lg w-72 max-h-[460px] overflow-y-auto">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {selectedNode && (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Landmark className="h-4 w-4 text-accent shrink-0" />
                          <h4 className="text-sm font-semibold truncate">{selectedNode.name}</h4>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <span className="text-green-600">↓</span> {selectedNode.inflow} in
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <span className="text-red-500">↑</span> {selectedNode.outflow} out
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            Net: {selectedNode.inflow - selectedNode.outflow > 0 ? '+' : ''}{selectedNode.inflow - selectedNode.outflow}
                          </Badge>
                        </div>
                      </>
                    )}
                    {selectedLink && (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowRightLeft className="h-4 w-4 text-accent shrink-0" />
                          <h4 className="text-sm font-semibold">Route Detail</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getMuseumDisplayName((selectedLink as any).source?.id || '', museumMap)} →{' '}
                          {getMuseumDisplayName((selectedLink as any).target?.id || '', museumMap)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px]">{Math.round(selectedLink.value / 4 * Math.max(1, ...graphData.links.map(l => l.value)))} events</Badge>
                          <Badge variant="secondary" className="text-[10px]">{selectedLink.artworkCount} artworks</Badge>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setSelectedNode(null); setSelectedLink(null); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Artwork previews */}
                {(selectedNode ? nodeArtworks : linkArtworks).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Artworks</h5>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(selectedNode ? nodeArtworks : linkArtworks).map(artwork => {
                        const imgUrl = getArtworkImageUrl(artwork);
                        return (
                          <button key={artwork.artwork_id}
                            onClick={() => onArtworkSelect(artwork.artwork_id)}
                            className="aspect-square rounded-md overflow-hidden border border-border/60 bg-muted hover:border-accent/60 transition-colors group">
                            {imgUrl ? (
                              <img src={imgUrl} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-3 w-3 text-muted-foreground/30" /></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
