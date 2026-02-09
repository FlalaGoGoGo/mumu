import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Ticket } from 'lucide-react';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { getMuseumConfig } from '@/config/museumConfig';
import { MuseumDetailHeader } from '@/components/museum/MuseumDetailHeader';
import { MuseumQuickActions } from '@/components/museum/MuseumQuickActions';
import { RoutePlannerDrawer } from '@/components/museum/RoutePlannerDrawer';
import { TicketsDiscountsDrawer } from '@/components/museum/TicketsDiscountsDrawer';
import { MuseumArtworkCard } from '@/components/museum/MuseumArtworkCard';
import { MuseumHoursCard } from '@/components/museum/MuseumHoursCard';
import { ArtworkDetailSheet } from '@/components/art/ArtworkDetailSheet';
import { getArtworkImageUrl, type EnrichedArtwork } from '@/types/art';
import { useImageLoad } from '@/contexts/ImageLoadContext';

export default function MuseumDetailPage() {
  const { museum_id } = useParams<{ museum_id: string }>();
  const navigate = useNavigate();
  const { data: artworks, artists, isLoading } = useEnrichedArtworks();
  const { hasVerifiedImage } = useImageLoad();
  
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const [ticketsDrawerOpen, setTicketsDrawerOpen] = useState(false);
  const [hasImageOnly, setHasImageOnly] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<EnrichedArtwork | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const config = museum_id ? getMuseumConfig(museum_id) : null;

  const museumArtworks = useMemo(() => {
    if (!museum_id) return [];
    return artworks.filter(a => a.museum_id === museum_id);
  }, [artworks, museum_id]);

  const filteredArtworks = useMemo(() => {
    if (!hasImageOnly) return museumArtworks;
    return museumArtworks.filter(a => 
      hasVerifiedImage(a.artwork_id) || !!getArtworkImageUrl(a)
    );
  }, [museumArtworks, hasImageOnly, hasVerifiedImage]);

  const displayArtworks = filteredArtworks.slice(0, 12);

  const artistMovements = useMemo(() => {
    const map = new Map<string, string>();
    artists.forEach(a => {
      if (a.movement) map.set(a.artist_id, a.movement);
    });
    return map;
  }, [artists]);

  const handleArtworkClick = (artwork: EnrichedArtwork) => {
    setSelectedArtwork(artwork);
    setDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container max-w-6xl py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Museum Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This museum does not have a detailed guide available yet.
        </p>
        <Button onClick={() => navigate('/')}>Back to Map</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sticky Frosted Header */}
      <MuseumDetailHeader config={config} />

      <div className="container max-w-6xl py-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <MuseumQuickActions
            onPlanVisit={() => setRoutePlannerOpen(true)}
            onTickets={() => setTicketsDrawerOpen(true)}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Key Info Panel */}
          <div className="md:col-span-1 space-y-6">

            {/* Hours (interactive calendar) */}
            <MuseumHoursCard hours={config.hours} />

            {/* Admission */}
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Admission
              </h3>
              <div className="space-y-1.5">
                {config.admission.map((a) => (
                  <div key={a.category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{a.category}</span>
                    <span className="font-medium">{a.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Free Admission Note */}
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Free Admission</p>
              <p className="text-sm text-muted-foreground">{config.freeAdmissionNote}</p>
            </div>

            {/* Member Note */}
            <p className="text-xs text-muted-foreground px-1">{config.memberNote}</p>
          </div>

          {/* Artworks Section */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">
                What's in this museum
              </h2>
              <div className="flex items-center gap-2">
                <Switch
                  id="has-image"
                  checked={hasImageOnly}
                  onCheckedChange={setHasImageOnly}
                />
                <Label htmlFor="has-image" className="text-sm text-muted-foreground">
                  Has Image
                </Label>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {filteredArtworks.length} artworks
              {hasImageOnly && ` (${museumArtworks.length} total)`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayArtworks.map((artwork) => (
                <MuseumArtworkCard
                  key={artwork.artwork_id}
                  artwork={artwork}
                  movement={artistMovements.get(artwork.artist_id)}
                  onClick={() => handleArtworkClick(artwork)}
                />
              ))}
            </div>

            {filteredArtworks.length > 12 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/art')}
                >
                  View All {filteredArtworks.length} Artworks
                </Button>
              </div>
            )}

            {filteredArtworks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No artworks found.</p>
                {hasImageOnly && (
                  <Button
                    variant="link"
                    onClick={() => setHasImageOnly(false)}
                    className="mt-2"
                  >
                    Show all artworks
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Planner Drawer */}
      <RoutePlannerDrawer
        open={routePlannerOpen}
        onOpenChange={setRoutePlannerOpen}
        artworks={museumArtworks}
        artistMovements={artistMovements}
      />

      {/* Tickets & Discounts Drawer */}
      <TicketsDiscountsDrawer
        open={ticketsDrawerOpen}
        onOpenChange={setTicketsDrawerOpen}
        config={config}
      />

      {/* Artwork Detail Sheet */}
      <ArtworkDetailSheet
        artwork={selectedArtwork}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
