import { useNavigate } from 'react-router-dom';
import { Scroll } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollButtonProps {
  className?: string;
}

export function ScrollButton({ className }: ScrollButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/art-chronicle')}
      className={cn(
        "group relative inline-flex items-center gap-2 px-5 py-2.5",
        // Parchment styling
        "bg-gradient-to-b from-[hsl(var(--parchment))] to-[hsl(var(--parchment-dark))]",
        // Rolled edges effect using pseudo elements
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-3",
        "before:bg-gradient-to-r before:from-[hsl(var(--parchment-edge))] before:to-transparent",
        "before:rounded-l-full before:shadow-[inset_2px_0_4px_rgba(0,0,0,0.15)]",
        "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-3",
        "after:bg-gradient-to-l after:from-[hsl(var(--parchment-edge))] after:to-transparent",
        "after:rounded-r-full after:shadow-[inset_-2px_0_4px_rgba(0,0,0,0.15)]",
        // Gold outline
        "border border-[hsl(var(--gold-border))]",
        "rounded-sm",
        // Shadow and texture
        "shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]",
        // Hover effects
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]",
        "hover:-translate-y-0.5 hover:border-[hsl(var(--gold-border-light))]",
        "transition-all duration-200",
        className
      )}
    >
      <Scroll className="h-4 w-4 text-[hsl(var(--ink-muted))] group-hover:text-[hsl(var(--ink))] transition-colors" />
      <span className="font-display text-sm font-semibold text-[hsl(var(--ink))] tracking-wide">
        Art Chronicle
      </span>
    </button>
  );
}
