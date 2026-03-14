import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCountryFlag } from '@/lib/countryFlag';
import type { Artist, EnrichedArtwork } from '@/types/art';
import type { Museum } from '@/types/museum';

interface Props {
  artists: Artist[];
  artistId: string;
  onArtistChange: (id: string) => void;
  artworks: EnrichedArtwork[];
  artworkId: string | null;
  onArtworkChange: (id: string | null) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  lenderMuseums: Museum[];
  lenderMuseumId: string | null;
  onLenderMuseumChange: (id: string | null) => void;
  borrowerMuseums: Museum[];
  borrowerMuseumId: string | null;
  onBorrowerMuseumChange: (id: string | null) => void;
  showArtworkPicker: boolean;
}

export function MobilityFilters({
  artists,
  artistId,
  onArtistChange,
  artworks,
  artworkId,
  onArtworkChange,
  yearRange,
  onYearRangeChange,
  lenderMuseums,
  lenderMuseumId,
  onLenderMuseumChange,
  borrowerMuseums,
  borrowerMuseumId,
  onBorrowerMuseumChange,
  showArtworkPicker,
}: Props) {
  const [artistOpen, setArtistOpen] = useState(false);
  const [artworkOpen, setArtworkOpen] = useState(false);

  const selectedArtist = useMemo(
    () => artists.find(a => a.artist_id === artistId),
    [artists, artistId]
  );

  const selectedArtwork = useMemo(
    () => artworks.find(a => a.artwork_id === artworkId),
    [artworks, artworkId]
  );

  const sortedArtists = useMemo(
    () => [...artists].sort((a, b) => a.artist_name.localeCompare(b.artist_name)),
    [artists]
  );

  const sortedArtworks = useMemo(
    () => [...artworks].sort((a, b) => a.title.localeCompare(b.title)),
    [artworks]
  );

  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-lg border space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Artist */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Artist</Label>
          <Popover open={artistOpen} onOpenChange={setArtistOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span className="truncate">
                  {selectedArtist?.artist_name || 'Select artist'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 z-[9999]">
              <Command>
                <CommandInput placeholder="Search artist..." />
                <CommandList>
                  <CommandEmpty>No artist found.</CommandEmpty>
                  <CommandGroup>
                    {sortedArtists.map(a => (
                      <CommandItem
                        key={a.artist_id}
                        value={a.artist_name}
                        onSelect={() => { onArtistChange(a.artist_id); setArtistOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", artistId === a.artist_id ? "opacity-100" : "opacity-0")} />
                        {getCountryFlag(a.nationality)} {a.artist_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Artwork Picker */}
        {showArtworkPicker && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Artwork</Label>
            <Popover open={artworkOpen} onOpenChange={setArtworkOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-between">
                  <span className="truncate">
                    {selectedArtwork?.title || 'Select artwork'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 z-[9999]">
                <Command>
                  <CommandInput placeholder="Search artwork..." />
                  <CommandList>
                    <CommandEmpty>No artwork found.</CommandEmpty>
                    <CommandGroup>
                      {sortedArtworks.map(a => (
                        <CommandItem
                          key={a.artwork_id}
                          value={a.title}
                          onSelect={() => { onArtworkChange(a.artwork_id); setArtworkOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", artworkId === a.artwork_id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{a.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {(a as any).mobility_research_status === 'HAS_MOVEMENT_EVENTS' ? '📍' : ''}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Lender Museum */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Lender</Label>
          <Select
            value={lenderMuseumId || 'all'}
            onValueChange={v => onLenderMuseumChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All lenders" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="all">All lenders</SelectItem>
              {lenderMuseums.map(m => (
                <SelectItem key={m.museum_id} value={m.museum_id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Borrower Museum */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Borrower</Label>
          <Select
            value={borrowerMuseumId || 'all'}
            onValueChange={v => onBorrowerMuseumChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All borrowers" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="all">All borrowers</SelectItem>
              {borrowerMuseums.map(m => (
                <SelectItem key={m.museum_id} value={m.museum_id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Year Range */}
      <div className="space-y-1 max-w-sm">
        <Label className="text-xs text-muted-foreground">Year range: {yearRange[0]} – {yearRange[1]}</Label>
        <Slider
          min={1800}
          max={2030}
          step={1}
          value={yearRange}
          onValueChange={(v) => onYearRangeChange(v as [number, number])}
          className="py-2"
        />
      </div>
    </div>
  );
}
