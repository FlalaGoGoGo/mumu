import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMuseums } from '@/hooks/useMuseums';
import { useVisits, useAddVisit, useRemoveVisit } from '@/hooks/usePassport';
import { MuseumMap } from '@/components/map/MuseumMap';
import { MuseumCard } from '@/components/museum/MuseumCard';
import { MobileBottomSheet } from '@/components/layout/MobileBottomSheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Museum } from '@/types/museum';

export default function MapPage() {
  const navigate = useNavigate();
  const { data: museums = [], isLoading } = useMuseums();
  const { data: visits = [] } = useVisits();
  const addVisit = useAddVisit();
  const removeVisit = useRemoveVisit();
  
  const [selectedMuseum, setSelectedMuseum] = useState<Museum | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const visitedIds = new Set(visits.map(v => v.museum_id));
  
  const filteredMuseums = museums.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkVisited = (museumId: string) => {
    if (visitedIds.has(museumId)) {
      removeVisit.mutate(museumId);
    } else {
      addVisit.mutate(museumId);
    }
  };

  const handleViewPlan = () => {
    navigate('/plan');
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-32 h-32 rounded-full mx-auto mb-4" />
          <Skeleton className="w-48 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-73px)] flex flex-col md:flex-row">
      {/* Desktop: Side Panel */}
      <div className="hidden md:flex md:w-96 lg:w-[420px] flex-col border-r border-border bg-background">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search museums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {filteredMuseums.length} museums • {visitedIds.size} visited
          </p>
        </div>

        {/* Museum List or Selected Detail */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {selectedMuseum ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedMuseum(null)}
                  className="text-sm text-primary hover:underline"
                >
                  ← Back to list
                </button>
                <MuseumCard
                  museum={selectedMuseum}
                  isVisited={visitedIds.has(selectedMuseum.museum_id)}
                  onMarkVisited={() => handleMarkVisited(selectedMuseum.museum_id)}
                  onViewPlan={selectedMuseum.has_full_content ? handleViewPlan : undefined}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMuseums.map((museum) => (
                  <div 
                    key={museum.museum_id}
                    onClick={() => setSelectedMuseum(museum)}
                  >
                    <MuseumCard museum={museum} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MuseumMap
          museums={museums}
          selectedMuseum={selectedMuseum}
          onSelectMuseum={setSelectedMuseum}
          className="w-full h-full"
        />

        {/* Mobile: Quick info overlay when museum selected */}
        {selectedMuseum && (
          <div className="md:hidden absolute top-4 left-4 right-4">
            <div className="gallery-card">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold truncate">
                    {selectedMuseum.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMuseum.city}
                  </p>
                </div>
                {selectedMuseum.has_full_content && (
                  <span className="museum-chip">Guide</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Bottom Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedMuseum}
        onClose={() => setSelectedMuseum(null)}
        title={selectedMuseum?.name}
      >
        {selectedMuseum && (
          <MuseumCard
            museum={selectedMuseum}
            isVisited={visitedIds.has(selectedMuseum.museum_id)}
            onMarkVisited={() => handleMarkVisited(selectedMuseum.museum_id)}
            onViewPlan={selectedMuseum.has_full_content ? handleViewPlan : undefined}
          />
        )}
      </MobileBottomSheet>
    </div>
  );
}
