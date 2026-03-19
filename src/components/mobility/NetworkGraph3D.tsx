import { useMemo, useState, useCallback, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Landmark, ArrowRightLeft, Image as ImageIcon, X, RotateCw } from 'lucide-react';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import { getArtworkImageUrl } from '@/types/art';
import { getCountryFlag } from '@/lib/countryFlag';
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

// MuMu brand colors
const GOLD = new THREE.Color('hsl(43, 60%, 45%)');
const GOLD_GLOW = new THREE.Color('hsl(43, 70%, 65%)');
const BURGUNDY = new THREE.Color('hsl(348, 45%, 32%)');
const BURGUNDY_GLOW = new THREE.Color('hsl(348, 50%, 50%)');

/** Force-directed 3D layout */
function computeLayout(nodes: GraphNode[], edges: GraphEdge[], iterations = 120) {
  const positioned = nodes.map((n, i) => {
    const phi = Math.acos(-1 + (2 * i) / Math.max(1, nodes.length));
    const theta = Math.sqrt(nodes.length * Math.PI) * phi;
    const r = 30 + Math.random() * 10;
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
    const alpha = 0.35 * (1 - iter / iterations);

    // Repulsion
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
      const force = (dist - 18) * 0.04 * alpha;
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

    // Apply velocity
    for (const n of positioned) {
      n.x += n.vx * 0.8; n.y += n.vy * 0.8; n.z += n.vz * 0.8;
      n.vx *= 0.5; n.vy *= 0.5; n.vz *= 0.5;
    }
  }

  return positioned.map(n => ({
    ...n,
    position: [n.x, n.y, n.z] as [number, number, number],
  }));
}

/** Glowing node with multi-layer atmosphere */
function NodeSphere({ node, isSelected, isHovered, onPointerOver, onPointerOut, onClick }: {
  node: GraphNode; isSelected: boolean; isHovered: boolean;
  onPointerOver: () => void; onPointerOut: () => void; onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const outerRef = useRef<THREE.Mesh>(null!);
  const netFlow = node.inflow - node.outflow;
  const baseScale = Math.max(1.2, Math.sqrt(node.total) * 0.7);
  const targetScale = (isSelected || isHovered) ? baseScale * 1.6 : baseScale;

  const coreColor = netFlow > 0 ? GOLD : BURGUNDY;
  const glowColor = netFlow > 0 ? GOLD_GLOW : BURGUNDY_GLOW;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
    if (glowRef.current) {
      const glowScale = targetScale * 1.8;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.08);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = (isSelected || isHovered) ? 0.3 : 0.1;
    }
    if (outerRef.current) {
      const outerScale = targetScale * 2.8;
      outerRef.current.scale.lerp(new THREE.Vector3(outerScale, outerScale, outerScale), 0.06);
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity = (isSelected || isHovered) ? 0.08 : 0.02;
    }
  });

  return (
    <group position={node.position}>
      {/* Outermost halo */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.02} depthWrite={false} />
      </mesh>
      {/* Inner glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
        onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={(isSelected || isHovered) ? 0.8 : 0.3}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      {/* Label — show on hover/select */}
      {(isSelected || isHovered) && (
        <Billboard position={[0, targetScale + 1.5, 0]}>
          <Text fontSize={1.5} color="white" anchorX="center" anchorY="bottom"
            outlineWidth={0.08} outlineColor="#000000">
            {node.name.length > 25 ? node.name.substring(0, 22) + '…' : node.name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

/** Edge rendered as a primitive Line */
function EdgeLine({ from, to, opacity, isActive }: { from: [number, number, number]; to: [number, number, number]; width: number; opacity: number; isActive: boolean }) {
  const lineObj = useMemo(() => {
    const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = isActive ? '#d4a84b' : '#8a6914';
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geometry, material);
  }, [from, to, opacity, isActive]);

  return <primitive object={lineObj} />;
}

/** Animated particle flowing along an edge */
function EdgeParticle({ from, to, speed = 0.12, color, size = 0.25 }: { from: [number, number, number]; to: [number, number, number]; speed?: number; color: THREE.Color; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(Math.random());

  useFrame((_, delta) => {
    progressRef.current += delta * speed;
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
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
}

/** Ambient star field for depth */
function StarField() {
  const points = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points>
      <primitive object={points} attach="geometry" />
      <pointsMaterial color="#b8860b" size={0.3} transparent opacity={0.15} sizeAttenuation />
    </points>
  );
}

/** The 3D scene */
function NetworkScene({ nodes, edges, selectedNodeId, hoveredNodeId, onNodeHover, onNodeClick, maxCount }: {
  nodes: GraphNode[]; edges: GraphEdge[]; selectedNodeId: string | null; hoveredNodeId: string | null;
  onNodeHover: (id: string | null) => void; onNodeClick: (id: string) => void; maxCount: number;
}) {
  const nodePositionMap = useMemo(() => new Map(nodes.map(n => [n.id, n.position])), [nodes]);
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedNodeId) ids.add(selectedNodeId);
    if (hoveredNodeId) ids.add(hoveredNodeId);
    return ids;
  }, [selectedNodeId, hoveredNodeId]);

  return (
    <>
      {/* Deep atmospheric lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[60, 40, 60]} intensity={1.5} color="#d4a84b" />
      <pointLight position={[-50, -30, 50]} intensity={0.8} color="#b8860b" />
      <pointLight position={[0, 70, -40]} intensity={0.4} color="#9b4a58" />
      <pointLight position={[-30, 20, -60]} intensity={0.3} color="#5a2035" />

      {/* Background fog for depth */}
      <fog attach="fog" args={['#0d0509', 60, 220]} />

      {/* Star field for spatial depth */}
      <StarField />

      {/* Edges */}
      {edges.map((e, i) => {
        const from = nodePositionMap.get(e.source);
        const to = nodePositionMap.get(e.target);
        if (!from || !to) return null;
        const intensity = e.count / maxCount;
        const isConnectedToActive = activeNodeIds.has(e.source) || activeNodeIds.has(e.target);
        const opacity = isConnectedToActive ? 0.5 + intensity * 0.4 : 0.04 + intensity * 0.15;
        return (
          <group key={`edge-${i}`}>
            <EdgeLine from={from} to={to} width={e.width} opacity={opacity} isActive={isConnectedToActive} />
            {/* Multiple particles for stronger edges */}
            {(intensity > 0.15 || isConnectedToActive) && (
              <EdgeParticle from={from} to={to} speed={0.06 + intensity * 0.1} color={isConnectedToActive ? GOLD_GLOW : GOLD} size={isConnectedToActive ? 0.35 : 0.2} />
            )}
            {isConnectedToActive && intensity > 0.3 && (
              <EdgeParticle from={from} to={to} speed={0.04 + intensity * 0.08} color={GOLD_GLOW} size={0.2} />
            )}
          </group>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => (
        <NodeSphere key={node.id} node={node}
          isSelected={selectedNodeId === node.id}
          isHovered={hoveredNodeId === node.id}
          onPointerOver={() => onNodeHover(node.id)}
          onPointerOut={() => onNodeHover(null)}
          onClick={() => onNodeClick(node.id)}
        />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={20} maxDistance={160} autoRotate autoRotateSpeed={0.2} />
    </>
  );
}

export function NetworkGraph3D({ movements, museumMap, artworks, onArtworkSelect }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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
      nodes.push({
        id, name: getMuseumDisplayName(id, museumMap), total,
        inflow: stats.inflow, outflow: stats.outflow,
        position: [0, 0, 0],
        color: (stats.inflow - stats.outflow) > 0 ? '#b8860b' : '#7a2e3b',
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

  const nodeEdges = useMemo(() => {
    if (!selectedNode) return [];
    return rawEdges
      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [selectedNode, rawEdges]);

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
    setHoveredNodeId(null);
  }, []);

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Museum Constellation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {layoutNodes.length} museums · {rawEdges.length} corridors · Drag to explore
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetView} title="Reset view">
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="relative" style={{ height: 600, background: 'linear-gradient(180deg, hsl(348, 50%, 6%) 0%, hsl(348, 40%, 4%) 50%, hsl(240, 20%, 3%) 100%)' }}>
          <Canvas camera={{ position: [0, 0, 80], fov: 55 }} dpr={[1, 2]}>
            <NetworkScene nodes={layoutNodes} edges={rawEdges} selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onNodeHover={setHoveredNodeId}
              onNodeClick={handleNodeClick} maxCount={maxCount} />
          </Canvas>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-black/70 backdrop-blur-md rounded-xl p-3 text-[10px] space-y-1.5 border border-white/5">
            <div className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mb-1">Legend</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(43, 60%, 45%)', boxShadow: '0 0 8px hsl(43, 70%, 55%)' }} />
              <span className="text-white/60">Net Importer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(348, 45%, 32%)', boxShadow: '0 0 8px hsl(348, 50%, 45%)' }} />
              <span className="text-white/60">Net Exporter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] rounded-full" style={{ background: 'hsl(43, 60%, 45%)' }} />
              <span className="text-white/60">Movement corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(43, 70%, 65%)', boxShadow: '0 0 6px hsl(43, 70%, 65%)' }} />
              <span className="text-white/60">Flow particle</span>
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredNodeId && !selectedNode && (() => {
            const hNode = layoutNodes.find(n => n.id === hoveredNodeId);
            if (!hNode) return null;
            return (
              <div className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl p-3 w-56">
                <p className="text-xs font-semibold text-white truncate">{hNode.name}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] text-green-400">↓ {hNode.inflow} in</span>
                  <span className="text-[10px] text-red-400">↑ {hNode.outflow} out</span>
                  <span className="text-[10px] text-white/50 ml-auto">Net {(hNode.inflow - hNode.outflow) > 0 ? '+' : ''}{hNode.inflow - hNode.outflow}</span>
                </div>
              </div>
            );
          })()}

          {/* Node detail panel */}
          {selectedNode && (
            <div className="absolute top-3 right-3 z-10 bg-black/85 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl w-72 max-h-[540px] overflow-y-auto">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Landmark className="h-4 w-4 text-amber-400 shrink-0" />
                      <h4 className="text-sm font-semibold text-white truncate">{selectedNode.name}</h4>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-white/10 text-white/80 border-white/10">
                        <span className="text-green-400">↓</span> {selectedNode.inflow} in
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-white/10 text-white/80 border-white/10">
                        <span className="text-red-400">↑</span> {selectedNode.outflow} out
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-white/10 text-white/70">
                        Net: {selectedNode.inflow - selectedNode.outflow > 0 ? '+' : ''}{selectedNode.inflow - selectedNode.outflow}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-white/50 hover:text-white hover:bg-white/10" onClick={() => setSelectedNodeId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Top corridors for this node */}
                {nodeEdges.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Top Corridors</h5>
                    {nodeEdges.map((e, i) => {
                      const partner = e.source === selectedNode.id ? e.target : e.source;
                      const partnerName = getMuseumDisplayName(partner, museumMap);
                      const isOutgoing = e.source === selectedNode.id;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/70 py-0.5">
                          <span className={isOutgoing ? 'text-red-400' : 'text-green-400'}>{isOutgoing ? '↑' : '↓'}</span>
                          <span className="truncate flex-1">{partnerName}</span>
                          <span className="ml-auto text-white/50 tabular-nums shrink-0">{e.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {nodeArtworks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Artworks</h5>
                    <div className="grid grid-cols-4 gap-1.5">
                      {nodeArtworks.map(artwork => {
                        const imgUrl = getArtworkImageUrl(artwork);
                        return (
                          <button key={artwork.artwork_id}
                            onClick={() => { try { onArtworkSelect(artwork.artwork_id); } catch {} }}
                            className="aspect-square rounded-md overflow-hidden border border-white/10 bg-white/5 hover:border-amber-400/40 transition-colors group">
                            {imgUrl ? (
                              <img src={imgUrl} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-3 w-3 text-white/20" /></div>
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
