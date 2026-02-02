import { useState, useMemo } from 'react';
import { Artist } from '@/types/art';
import { Museum } from '@/types/museum';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { X, ChevronDown, Check, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArtFiltersState {
  artType: string | null;
  artistId: string | null;
  museumId: string | null;
  onViewOnly: boolean;
}

export type SortOrder = 'asc' | 'desc';

interface ArtFiltersProps {
  filters: ArtFiltersState;
  onFiltersChange: (filters: ArtFiltersState) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  artists: Artist[];
  museums: Museum[];
  artTypes: string[];
  artistCounts: Map<string, number>;
  museumCounts: Map<string, number>;
  totalArtistCount: number;
  totalMuseumCount: number;
}

export function ArtFilters({
  filters,
  onFiltersChange,
  sortOrder,
  onSortOrderChange,
  artists,
  museums,
  artTypes,
  artistCounts,
  museumCounts,
  totalArtistCount,
  totalMuseumCount,
}: ArtFiltersProps) {
  const { t } = useLanguage();
  const [artistOpen, setArtistOpen] = useState(false);
  const [museumOpen, setMuseumOpen] = useState(false);

  // Sort artists alphabetically by name, only those with count > 0
  const sortedArtists = useMemo(() => {
    return artists
      .filter(a => (artistCounts.get(a.artist_id) || 0) > 0)
      .sort((a, b) => a.artist_name.localeCompare(b.artist_name, undefined, { sensitivity: 'base' }));
  }, [artists, artistCounts]);

  // Sort museums alphabetically by name, only those with count > 0
  const sortedMuseums = useMemo(() => {
    return museums
      .filter(m => (museumCounts.get(m.museum_id) || 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [museums, museumCounts]);

  const selectedArtist = useMemo(
    () => artists.find(a => a.artist_id === filters.artistId),
    [artists, filters.artistId]
  );

  const selectedMuseum = useMemo(
    () => museums.find(m => m.museum_id === filters.museumId),
    [museums, filters.museumId]
  );

  const hasActiveFilters = filters.artType || filters.artistId || filters.museumId || filters.onViewOnly;

  const clearFilters = () => {
    onFiltersChange({
      artType: null,
      artistId: null,
      museumId: null,
      onViewOnly: false,
    });
  };

  const removeFilter = (key: keyof ArtFiltersState) => {
    onFiltersChange({
      ...filters,
      [key]: key === 'onViewOnly' ? false : null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Left side filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Art Type Filter */}
        <Select
          value={filters.artType || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, artType: value === 'all' ? null : value })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('art.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('art.allTypes')}</SelectItem>
            {artTypes.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Artist Filter (Searchable) */}
        <Popover open={artistOpen} onOpenChange={setArtistOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={artistOpen}
              className="w-[180px] justify-between"
            >
              <span className="truncate">
                {selectedArtist?.artist_name || t('art.artist')}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0">
            <Command>
              <CommandInput placeholder={t('art.searchArtist')} />
              <CommandList>
                <CommandEmpty>{t('art.noArtistFound')}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onFiltersChange({ ...filters, artistId: null });
                      setArtistOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !filters.artistId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{t('art.allArtists')}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({totalArtistCount})</span>
                  </CommandItem>
                  {sortedArtists.map((artist) => (
                    <CommandItem
                      key={artist.artist_id}
                      value={artist.artist_name}
                      onSelect={() => {
                        onFiltersChange({ ...filters, artistId: artist.artist_id });
                        setArtistOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.artistId === artist.artist_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{artist.artist_name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({artistCounts.get(artist.artist_id) || 0})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Museum Filter (Searchable) */}
        <Popover open={museumOpen} onOpenChange={setMuseumOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={museumOpen}
              className="w-[200px] justify-between"
            >
              <span className="truncate">
                {selectedMuseum?.name || t('art.museum')}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0">
            <Command>
              <CommandInput placeholder={t('art.searchMuseum')} />
              <CommandList>
                <CommandEmpty>{t('art.noMuseumFound')}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onFiltersChange({ ...filters, museumId: null });
                      setMuseumOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !filters.museumId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{t('art.allMuseums')}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({totalMuseumCount})</span>
                  </CommandItem>
                  {sortedMuseums.map((museum) => (
                    <CommandItem
                      key={museum.museum_id}
                      value={museum.name}
                      onSelect={() => {
                        onFiltersChange({ ...filters, museumId: museum.museum_id });
                        setMuseumOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.museumId === museum.museum_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{museum.name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({museumCounts.get(museum.museum_id) || 0})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* On View Toggle */}
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Switch
            id="on-view-filter"
            checked={filters.onViewOnly}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, onViewOnly: checked })
            }
          />
          <Label htmlFor="on-view-filter" className="cursor-pointer text-sm">
            {t('art.onViewOnly')}
          </Label>
        </div>
        </div>

        {/* Sort Control - Right aligned */}
        <Select
          value={sortOrder}
          onValueChange={(value) => onSortOrderChange(value as SortOrder)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">
              <span className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                {t('art.sortAZ')}
              </span>
            </SelectItem>
            <SelectItem value="desc">
              <span className="flex items-center gap-2">
                <ArrowUpAZ className="h-4 w-4" />
                {t('art.sortZA')}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.artType && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filters.artType}
              <button onClick={() => removeFilter('artType')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedArtist && (
            <Badge variant="secondary" className="gap-1">
              {selectedArtist.artist_name}
              <button onClick={() => removeFilter('artistId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedMuseum && (
            <Badge variant="secondary" className="gap-1">
              {selectedMuseum.name}
              <button onClick={() => removeFilter('museumId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.onViewOnly && (
            <Badge variant="secondary" className="gap-1">
              {t('art.onViewOnly')}
              <button onClick={() => removeFilter('onViewOnly')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
