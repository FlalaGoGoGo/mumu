import { useState } from 'react';
import { Map, ExternalLink, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MuseumFloorPlanProps {
  museumId: string;
}

const AIC_FLOOR_PLAN_URL = 'https://www.artic.edu/visit/explore-on-your-own/museum-floor-plan';
const AIC_INTERACTIVE_MAP = 'https://maps.artic.edu';

// Static floor plan image from AIC
const AIC_FLOOR_PLAN_IMAGE = 'https://www.artic.edu/iiif/2/b6b3e00e-07e9-40ee-8a09-a0a14ff3fa56/full/1200,/0/default.jpg';

export function MuseumFloorPlan({ museumId }: MuseumFloorPlanProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (museumId !== 'art-institute-of-chicago-us') return null;

  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Floor Plan</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Embedded map preview */}
          <div className="relative rounded-lg overflow-hidden bg-muted border border-border">
            <iframe
              src={AIC_INTERACTIVE_MAP}
              title="Art Institute of Chicago Interactive Map"
              className="w-full h-64 sm:h-80 border-0"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
            <a
              href={AIC_INTERACTIVE_MAP}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] bg-background/90 backdrop-blur rounded border border-border hover:bg-background transition-colors text-foreground"
            >
              <Maximize2 className="w-3 h-3" /> Full screen
            </a>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
              <a href={AIC_FLOOR_PLAN_URL} target="_blank" rel="noopener noreferrer">
                <Map className="w-3.5 h-3.5" /> Floor Plan PDF
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
              <a href={AIC_INTERACTIVE_MAP} target="_blank" rel="noopener noreferrer">
                <Map className="w-3.5 h-3.5" /> Interactive Map
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>

          <p className="text-[0.65rem] text-muted-foreground">
            Interactive map provided by the Art Institute of Chicago.
          </p>
        </div>
      )}
    </section>
  );
}
