import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  positions: [number, number][];
  color: string;
  weight: number;
  opacity: number;
  highlighted?: boolean;
  animated?: boolean;
  /** Unique key for this polyline */
  id: string;
  children?: React.ReactNode;
}

/**
 * Leaflet polyline with optional dash-offset animation.
 * Falls back to static line when prefers-reduced-motion or animated=false.
 */
export function AnimatedPolyline({
  positions,
  color,
  weight,
  opacity,
  highlighted = false,
  animated = false,
  id,
}: Props) {
  const map = useMap();
  const polylineRef = useRef<L.Polyline | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const effectiveWeight = highlighted ? weight + 2 : weight;
    const effectiveOpacity = highlighted ? Math.min(1, opacity + 0.3) : opacity;

    const polyline = L.polyline(positions, {
      color,
      weight: effectiveWeight,
      opacity: effectiveOpacity,
      dashArray: animated || highlighted ? '8 6' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    });

    polyline.addTo(map);
    polylineRef.current = polyline;

    // Animate dash offset for highlighted/animated lines
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if ((animated || highlighted) && !prefersReducedMotion) {
      let offset = 0;
      const animate = () => {
        offset -= 0.5;
        const el = polyline.getElement();
        if (el) {
          el.style.strokeDashoffset = `${offset}`;
        }
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      polyline.remove();
    };
  }, [map, positions, color, weight, opacity, highlighted, animated, id]);

  return null;
}
