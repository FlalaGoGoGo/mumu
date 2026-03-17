import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Landmark, ArrowRightLeft, Image as ImageIcon, X, RotateCw } from 'lucide-react';
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
  total: number;
  inflow: number;
  outflow: number;
  position: [number, number, number];
  color: string;
}

interface GraphEdge {
  source: string;
  target: string;
  count: number;
  artworkIds: string[];
  width: number;
}

const GOLD = new THREE.Color('#b8860b');
const GOLD_LIGHT = new THREE.Color('#d4a84b');
const BURGUNDY = new THREE.Color('#7a2e3b');
const BURGUNDY_LIGHT = new THREE.Color('#9b4a58');

/** Simple force-directed layout in 3D */
function computeLayout(nodes: GraphNode[], edges: GraphEdge[], iterations = 80) {
  // Initialize positions based on a sphere
  const positioned = nodes.map((n, i) => {
    const phi = Math.acos(-1 + (2 * i) / Math.max(1, nodes.length));
    const theta = Math.sqrt(nodes.length * Math.PI) * phi;
    const r = 40 + Math.random() * 20;
    return {
      ...n,
      x: r * Math.cos(theta) * Math.sin(phi),
      y: r * Math.sin(theta) * Math.sin(phi),
      z: r * Math.cos(phi),
      vx: 0, vy: 0, vz: 0,
    };
  });

  const nodeIndex = new Map(positioned.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 0.3 * (1 - iter / iterations);

    // Repulsion between all nodes
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const dx = positioned[j].x - positioned[i].x;
        const dy = positioned[j].y - positioned[i].y;
        const dz = positioned[j].z - positioned[i].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const force = 600 / (dist * dist);
        const fx = (dx / dist) * force * alpha;
        const fy = (dy / dist) * force * alpha;
        const fz = (dz / dist) * force * alpha;
        positioned[i].vx -= fx; positioned[i].vy -= fy; positioned[i].vz -= fz;
        positioned[j].vx += fx; positioned[j].vy += fy; positioned[j].vz += fz;
      }
    }

    // Attraction along edges
    for (const e of edges) {
      const si = nodeIndex.get(e.source);
      const ti = nodeIndex.get(e.target);
      if (si === undefined || ti === undefined) continue;
      const s = positioned[si];
      const t = positioned[ti];
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dz = t.z - s.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const force = (dist - 25) * 0.02 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      s.vx += fx; s.vy += fy; s.vz += fz;
      t.vx -= fx; t.vy -= fy; t.vz -= fz;
    }

    // Center gravity
    for (const n of positioned) {
      n.vx -= n.x * 0.01 * alpha;
      n.vy -= n.y * 0.01 * alpha;
      n.vz -= n.z * 0.01 * alpha;
    }

    // Apply velocity with damping
    for (const n of positioned) {
      n.x += n.vx * 0.8; n.y += n.vy * 0.8; n.z += n.vz * 0.8;
      n.vx *= 0.6; n.vy *= 0.6; n.vz *= 0.6;
    }
  }

  return positioned.map(n => ({
    ...n,
    position: [n.x, n.y, n.z] as [number, number, number],
  }));
}

/** A single node sphere */
function NodeSphere({ node, isSelected, onClick }: { node: GraphNode; isSelected: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const baseScale = Math.max(0.8, Math.sqrt(node.total) * 0.5);
  const scale = isSelected ? baseScale * 1.6 : baseScale;
  const netFlow = node.inflow - node.outflow;
  const color = netFlow > 0 ? GOLD : netFlow < 0 ? BURGUNDY : BURGUNDY_LIGHT;
  const emissive = isSelected ? (netFlow > 0 ? GOLD_LIGHT : BURGUNDY_LIGHT) : new THREE.Color('#000000');

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={node.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={isSelected ? 0.5 : 0.1} roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

/** Edge line between two nodes */
function EdgeLine({ from, to, width, opacity }: { from: [number, number, number]; to: [number, number, number]; width: number; opacity: number }) {
  const points = useMemo(() => [new THREE.Vector3(...from), new THREE.Vector3(...to)], [from, to]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#b8860b" transparent opacity={opacity} linewidth={1} />
    </line>
  );
}

/** Animated particles along edges */
function EdgeParticle({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(Math.random());

  useFrame((_, delta) => {
    progressRef.current += delta * 0.15;
    if (progressRef.current > 1) progressRef.current = 0;
    const t = progressRef.current;
    if (meshRef.current) {
      meshRef.current.position.set(
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.25, 8, 8]} />
      <meshStandardMaterial color={GOLD_LIGHT} emissive={GOLD_LIGHT} emissiveIntensity={0.8} />
    </mesh>
  );
}

/** Slow auto-rotation */
function AutoRotate() {
  const { camera } = useThree();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    angleRef.current += delta * 0.05;
    const radius = camera.position.length();
    camera.position.x = Math.sin(angleRef.current) * radius * 0.3 + camera.position.x * 0.7;
    camera.position.z = Math.cos(angleRef.current) * radius * 0.3 + camera.position.z * 0.7;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/** The 3D scene content */
function NetworkScene({ nodes, edges, selectedNodeId, onNodeClick, maxCount }: {
  nodes: GraphNode[]; edges: GraphEdge[]; selectedNodeId: string | null;
  onNodeClick: (id: string) => void; maxCount: number;
}) {
  const nodePositionMap = useMemo(() => new Map(nodes.map(n => [n.id, n.position])), [nodes]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[50, 50, 50]} intensity={0.8} />
      <pointLight position={[-50, -30, 30]} intensity={0.4} color="#d4a84b" />

      {/* Edges */}
      {edges.map((e, i) => {
        const from = nodePositionMap.get(e.source);
        const to = nodePositionMap.get(e.target);
        if (!from || !to) return null;
        const intensity = e.count / maxCount;
        return (
          <group key={`edge-${i}`}>
            <EdgeLine from={from} to={to} width={e.width} opacity={0.1 + intensity * 0.5} />
            {intensity > 0.3 && <EdgeParticle from={from} to={to} />}
          </group>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => (
        <NodeSphere key={node.id} node={node} isSelected={selectedNodeId === node.id}
          onClick={() => onNodeClick(node.id)} />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={20} maxDistance={200} />
    </>
  );
}

export function NetworkGraph3D({ movements, museumMap, artworks, onArtworkSelect }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const { rawNodes, rawEdges, maxCount } = useMemo(() => {
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
      nodes.push({
        id, name: getMuseumDisplayName(id, museumMap), total,
        inflow: stats.inflow, outflow: stats.outflow,
        position: [0, 0, 0],
        color: netFlow > 0 ? '#b8860b' : '#7a2e3b',
      });
    }

    let maxCount = 1;
    const edges: GraphEdge[] = [];
    for (const [key, data] of linkMap) {
      const [source, target] = key.split('__');
      if (!nodes.find(n => n.id === source) || !nodes.find(n => n.id === target)) continue;
      if (data.count > maxCount) maxCount = data.count;
      edges.push({
        source, target, count: data.count,
        artworkIds: Array.from(data.artworkIds),
        width: Math.max(0.5, (data.count / maxCount) * 3),
      });
    }

    return { rawNodes: nodes, rawEdges: edges, maxCount };
  }, [movements, museumMap]);

  const layoutNodes = useMemo(() => computeLayout(rawNodes, rawEdges), [rawNodes, rawEdges]);

  const selectedNode = useMemo(() => selectedNodeId ? layoutNodes.find(n => n.id === selectedNodeId) || null : null, [selectedNodeId, layoutNodes]);

  const nodeArtworks = useMemo(() => {
    if (!selectedNode) return [];
    const ids = new Set<string>();
    for (const m of movements) {
      if (m.lender_museum_id === selectedNode.id || m.borrower_museum_id === selectedNode.id) ids.add(m.artwork_id);
    }
    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));
    return Array.from(ids).slice(0, 8).map(id => artworkMap.get(id)).filter(Boolean) as EnrichedArtwork[];
  }, [selectedNode, movements, artworks]);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId(prev => prev === id ? null : id);
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdge(null);
  }, []);

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">3D Mobility Network</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {layoutNodes.length} museums · {rawEdges.length} corridors · Drag to rotate
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetView} title="Reset view">
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="relative" style={{ height: 500, background: 'hsl(39, 33%, 96%)' }}>
          <Canvas camera={{ position: [0, 0, 100], fov: 60 }} dpr={[1, 2]}>
            <NetworkScene nodes={layoutNodes} edges={rawEdges} selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick} maxCount={maxCount} />
          </Canvas>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-2.5 text-[10px] space-y-1 border border-border/60 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#b8860b' }} />
              <span className="text-muted-foreground">Net Importer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#7a2e3b' }} />
              <span className="text-muted-foreground">Net Exporter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] rounded-full" style={{ background: '#b8860b' }} />
              <span className="text-muted-foreground">Movement corridor</span>
            </div>
          </div>

          {/* Node detail panel */}
          {selectedNode && (
            <div className="absolute top-3 right-3 z-10 bg-background/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-lg w-72 max-h-[440px] overflow-y-auto">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
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
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSelectedNodeId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {nodeArtworks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Artworks</h5>
                    <div className="grid grid-cols-4 gap-1.5">
                      {nodeArtworks.map(artwork => {
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
