import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeMode = 'active' | 'all';
type PlaybackSpeed = 0.5 | 1 | 2 | 4;

interface Props {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  activeYears?: number[];
  onPrev?: () => void;
  onNext?: () => void;
  speed?: PlaybackSpeed;
  onSpeedChange?: (s: PlaybackSpeed) => void;
  timeMode?: TimeMode;
  onTimeModeChange?: (m: TimeMode) => void;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

export function TimePlaybackControl({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  isPlaying,
  onPlayPause,
  onReset,
  activeYears,
  onPrev,
  onNext,
  speed = 1,
  onSpeedChange,
  timeMode = 'active',
  onTimeModeChange,
}: Props) {
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  const activeCount = activeYears?.length ?? 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur space-y-3 px-4 py-4 sm:px-5">
      {/* Row 1: Controls + Slider + Year */}
      <div className="flex items-center gap-3">
        {/* Transport controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={onReset} aria-label="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {onPrev && (
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={onPrev} aria-label="Previous year"
              disabled={isPlaying}
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={prefersReducedMotion.current}
          >
            {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
          </Button>
          {onNext && (
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={onNext} aria-label="Next year"
              disabled={isPlaying}
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Slider */}
        <div className="flex-1 min-w-[100px]">
          <Slider
            min={minYear}
            max={maxYear}
            step={1}
            value={[currentYear]}
            onValueChange={([v]) => onYearChange(v)}
            className="py-1"
          />
        </div>

        {/* Current year badge */}
        <div className="shrink-0 rounded-md bg-primary/10 px-3 py-1">
          <span className="text-sm font-bold tabular-nums text-primary">{currentYear}</span>
        </div>
      </div>

      {/* Row 2: Speed + Time Mode + Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Speed */}
        {onSpeedChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Speed:</span>
            <div className="flex gap-0.5 rounded-md border border-border/60 p-0.5">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                    speed === s
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time mode toggle */}
        {onTimeModeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Step:</span>
            <div className="flex gap-0.5 rounded-md border border-border/60 p-0.5">
              <button
                onClick={() => onTimeModeChange('active')}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                  timeMode === 'active'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                Active Years{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <button
                onClick={() => onTimeModeChange('all')}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                  timeMode === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                All Years
              </button>
            </div>
          </div>
        )}

        {/* Year range info */}
        <span className="text-muted-foreground ml-auto tabular-nums">
          {minYear}–{maxYear}
        </span>
      </div>
    </div>
  );
}

/** Hook to drive year-based playback with active-years-only mode */
export function useTimePlayback(minYear: number, maxYear: number, activeYears: number[] = []) {
  const [currentYear, setCurrentYear] = useState(maxYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [timeMode, setTimeMode] = useState<TimeMode>('active');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sortedActive = useMemo(() => [...new Set(activeYears)].sort((a, b) => a - b), [activeYears]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (currentYear >= maxYear) {
      setCurrentYear(timeMode === 'active' && sortedActive.length > 0 ? sortedActive[0] : minYear);
    }
    setIsPlaying(true);
  }, [currentYear, maxYear, minYear, timeMode, sortedActive]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, stop, play]);

  const reset = useCallback(() => {
    stop();
    setCurrentYear(maxYear);
  }, [stop, maxYear]);

  const getNextYear = useCallback((prev: number): number | null => {
    if (timeMode === 'active' && sortedActive.length > 0) {
      const idx = sortedActive.findIndex(y => y > prev);
      if (idx === -1) return null; // at end
      return sortedActive[idx];
    }
    if (prev >= maxYear) return null;
    return prev + 1;
  }, [timeMode, sortedActive, maxYear]);

  const getPrevYear = useCallback((prev: number): number | null => {
    if (timeMode === 'active' && sortedActive.length > 0) {
      // Find last active year < prev
      for (let i = sortedActive.length - 1; i >= 0; i--) {
        if (sortedActive[i] < prev) return sortedActive[i];
      }
      return null;
    }
    if (prev <= minYear) return null;
    return prev - 1;
  }, [timeMode, sortedActive, minYear]);

  const next = useCallback(() => {
    setCurrentYear(prev => {
      const n = getNextYear(prev);
      return n ?? prev;
    });
  }, [getNextYear]);

  const prev = useCallback(() => {
    setCurrentYear(prev => {
      const p = getPrevYear(prev);
      return p ?? prev;
    });
  }, [getPrevYear]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = Math.round(300 / speed);
    intervalRef.current = setInterval(() => {
      setCurrentYear(prev => {
        const n = getNextYear(prev);
        if (n === null) {
          stop();
          return maxYear;
        }
        return n;
      });
    }, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, getNextYear, maxYear, stop]);

  return {
    currentYear,
    setCurrentYear,
    isPlaying,
    toggle,
    reset,
    next,
    prev,
    speed,
    setSpeed,
    timeMode,
    setTimeMode,
    isAtEnd: currentYear >= maxYear,
    sortedActiveYears: sortedActive,
  };
}
