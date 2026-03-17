import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Popover, PopoverContent, PopoverTrigger,
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
  artists, artistId, onArtistChange, artworks, artworkId, onArtworkChange,
  yearRange, onYearRangeChange,
  lenderMuseums, lenderMuseumId, onLenderMuseumChange,
  borrowerMuseums, borrowerMuseumId, onBorrowerMuseumChange,
  showArtworkPicker,
}: Props) {
  const [artistOpen, setArtistOpen] = useState(false);
  const [artworkOpen, setArtworkOpen] = useState(false);
  const [lenderOpen, setLenderOpen] = useState(false);
  const [borrowerOpen, setBorrowerOpen] = useState(false);

  const selectedArtist = useMemo(() => artists.find(a => a.artist_id === artistId), [artists, artistId]);
  const selectedArtwork = useMemo(() => artworks.find(a => a.artwork_id === artworkId), [artworks, artworkId]);

  const sortedArtists = useMemo(() => [...artists].sort((a, b) => a.artist_name.localeCompare(b.artist_name)), [artists]);
  const sortedArtworks = useMemo(() => [...artworks].sort((a, b) => a.title.localeCompare(b.title)), [artworks]);

  // Sort museums by name (ignoring flag emoji)
  const sortedLenders = useMemo(() => [...lenderMuseums].sort((a, b) => a.name.localeCompare(b.name)), [lenderMuseums]);
  const sortedBorrowers = useMemo(() => [...borrowerMuseums].sort((a, b) => a.name.localeCompare(b.name)), [borrowerMuseums]);

  const selectedLender = useMemo(() => lenderMuseums.find(m => m.museum_id === lenderMuseumId), [lenderMuseums, lenderMuseumId]);
  const selectedBorrower = useMemo(() => borrowerMuseums.find(m => m.museum_id === borrowerMuseumId), [borrowerMuseums, borrowerMuseumId]);

  return (
    <div className="space-y-5 rounded-xl border border-border/60 bg-card/50 p-5">
      {/* Row 1: Artist + Artwork picker */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artist</Label>
          <Popover open={artistOpen} onOpenChange={setArtistOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-11 text-sm font-medium">
                <span className="truncate">{selectedArtist ? `${getCountryFlag(selectedArtist.nationality)} ${selectedArtist.artist_name}` : 'Select artist'}</span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 z-[9999]" align="start">
              <Command>
                <CommandInput placeholder="Search artist..." />
                <CommandList>
                  <CommandEmpty>No artist found.</CommandEmpty>
                  <CommandGroup>
                    {sortedArtists.map(a => (
                      <CommandItem key={a.artist_id} value={a.artist_name} onSelect={() => { onArtistChange(a.artist_id); setArtistOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 shrink-0", artistId === a.artist_id ? "opacity-100" : "opacity-0")} />
                        {getCountryFlag(a.nationality)} {a.artist_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {showArtworkPicker && (
          <div className="space-y-2 min-w-0 flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artwork</Label>
            <Popover open={artworkOpen} onOpenChange={setArtworkOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-11 text-sm font-medium">
                  <span className="truncate">{selectedArtwork?.title || 'Select artwork'}</span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0 z-[9999]" align="start">
                <Command>
                  <CommandInput placeholder="Search artwork..." />
                  <CommandList>
                    <CommandEmpty>No artwork found.</CommandEmpty>
                    <CommandGroup>
                      {sortedArtworks.map(a => (
                        <CommandItem key={a.artwork_id} value={a.title} onSelect={() => { onArtworkChange(a.artwork_id); setArtworkOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4 shrink-0", artworkId === a.artwork_id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{a.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground shrink-0">
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
      </div>

      {/* Row 2: Lender, Borrower (searchable with flags), Year range */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lender Museum</Label>
          <Popover open={lenderOpen} onOpenChange={setLenderOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-11 text-sm font-medium">
                <span className="truncate">{selectedLender ? `${getCountryFlag(selectedLender.country)} ${selectedLender.name}` : 'All lenders'}</span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0 z-[9999]" align="start">
              <Command>
                <CommandInput placeholder="Search lender museum..." />
                <CommandList>
                  <CommandEmpty>No museum found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="all-lenders" onSelect={() => { onLenderMuseumChange(null); setLenderOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4 shrink-0", !lenderMuseumId ? "opacity-100" : "opacity-0")} />
                      All lenders
                    </CommandItem>
                    {sortedLenders.map(m => (
                      <CommandItem key={m.museum_id} value={m.name} onSelect={() => { onLenderMuseumChange(m.museum_id); setLenderOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 shrink-0", lenderMuseumId === m.museum_id ? "opacity-100" : "opacity-0")} />
                        {getCountryFlag(m.country)} {m.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 min-w-0 flex-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Borrower Museum</Label>
          <Popover open={borrowerOpen} onOpenChange={setBorrowerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-11 text-sm font-medium">
                <span className="truncate">{selectedBorrower ? `${getCountryFlag(selectedBorrower.country)} ${selectedBorrower.name}` : 'All borrowers'}</span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0 z-[9999]" align="start">
              <Command>
                <CommandInput placeholder="Search borrower museum..." />
                <CommandList>
                  <CommandEmpty>No museum found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="all-borrowers" onSelect={() => { onBorrowerMuseumChange(null); setBorrowerOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4 shrink-0", !borrowerMuseumId ? "opacity-100" : "opacity-0")} />
                      All borrowers
                    </CommandItem>
                    {sortedBorrowers.map(m => (
                      <CommandItem key={m.museum_id} value={m.name} onSelect={() => { onBorrowerMuseumChange(m.museum_id); setBorrowerOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 shrink-0", borrowerMuseumId === m.museum_id ? "opacity-100" : "opacity-0")} />
                        {getCountryFlag(m.country)} {m.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 flex-1 min-w-[200px]">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Year range: {yearRange[0]} – {yearRange[1]}
          </Label>
          <div className="pt-1 pb-1">
            <Slider min={1800} max={2030} step={1} value={yearRange} onValueChange={(v) => onYearRangeChange(v as [number, number])} className="py-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
