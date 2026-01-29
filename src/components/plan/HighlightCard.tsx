import { Check } from 'lucide-react';
import type { AicHighlight } from '@/types/museum';

interface HighlightCardProps {
  highlight: AicHighlight;
  order: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export function HighlightCard({ highlight, order, isCompleted, onToggleComplete }: HighlightCardProps) {
  return (
    <div 
      className={`gallery-card flex gap-4 cursor-pointer transition-all ${
        isCompleted ? 'opacity-75 bg-muted/50' : ''
      }`}
      onClick={onToggleComplete}
    >
      {/* Order Number */}
      <div className={`route-step flex-shrink-0 ${isCompleted ? 'bg-accent' : ''}`}>
        {isCompleted ? <Check className="w-4 h-4" /> : order}
      </div>

      {/* Artwork Image */}
      {highlight.image_url && (
        <div className="w-20 h-20 flex-shrink-0 artwork-frame rounded-sm overflow-hidden">
          <img 
            src={highlight.image_url} 
            alt={highlight.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-display text-base font-semibold leading-tight mb-1 ${
          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
        }`}>
          {highlight.title}
        </h3>
        {highlight.artist && (
          <p className="text-sm text-muted-foreground truncate">
            {highlight.artist}
          </p>
        )}
        {highlight.year && (
          <p className="text-xs text-muted-foreground/70">
            {highlight.year}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="museum-chip text-[10px]">Floor {highlight.floor}</span>
          <span className="museum-chip text-[10px]">Gallery {highlight.gallery}</span>
        </div>
      </div>
    </div>
  );
}
