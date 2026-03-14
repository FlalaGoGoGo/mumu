import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
}

export function TimePlaybackControl({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  isPlaying,
  onPlayPause,
  onReset,
}: Props) {
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/80 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={prefersReducedMotion.current}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onReset}
          aria-label="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 min-w-[120px]">
        <Slider
          min={minYear}
          max={maxYear}
          step={1}
          value={[currentYear]}
          onValueChange={([v]) => onYearChange(v)}
          className="py-1"
        />
      </div>

      <span className="text-sm font-semibold tabular-nums text-foreground shrink-0 min-w-[40px] text-right">
        {currentYear}
      </span>
    </div>
  );
}

/** Hook to drive year-based playback */
export function useTimePlayback(minYear: number, maxYear: number) {
  const [currentYear, setCurrentYear] = useState(maxYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (currentYear >= maxYear) {
      setCurrentYear(minYear);
    }
    setIsPlaying(true);
  }, [currentYear, maxYear, minYear]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, stop, play]);

  const reset = useCallback(() => {
    stop();
    setCurrentYear(maxYear);
  }, [stop, maxYear]);

  useEffect(() => {
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setCurrentYear(prev => {
        if (prev >= maxYear) {
          stop();
          return maxYear;
        }
        return prev + 1;
      });
    }, 300);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxYear, stop]);

  return {
    currentYear,
    setCurrentYear,
    isPlaying,
    toggle,
    reset,
    isAtEnd: currentYear >= maxYear,
  };
}
