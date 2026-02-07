import { useState, useMemo } from 'react';
import { Artist } from '@/types/art';
import { Museum } from '@/types/museum';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Search, SlidersHorizontal, X, ChevronDown, Check, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCountryFlag } from '@/lib/countryFlag';
import { ArtViewToggle, type ArtView } from './ArtViewToggle';

export interface ArtFiltersState {
  artType: string | null;
  artistId: string | null;
  museumId: string | null;
  onViewOnly: boolean;
  mustSeeOnly: boolean;
  hasImageOnly: boolean;
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
  typeCounts: Map<string, number>;
  totalArtistCount: number;
  totalMuseumCount: number;
  totalTypeCount: number;
  onViewCount: number;
  mustSeeCount: number;
  hasImageCount: number;
  // New props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  view: ArtView;
  onViewChange: (view: ArtView) => void;
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
  typeCounts,
  totalArtistCount,
  totalMuseumCount,
  totalTypeCount,
  onViewCount,
  mustSeeCount,
  hasImageCount,
  searchQuery,
  onSearchChange,
  view,
  onViewChange,
}: ArtFiltersProps) {
  const { t } = useLanguage();
  const [artistOpen, setArtistOpen] = useState(false);
  const [museumOpen, setMuseumOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

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

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.artType) count++;
    if (filters.artistId) count++;
    if (filters.museumId) count++;
    if (filters.onViewOnly) count++;
    if (filters.mustSeeOnly) count++;
    if (filters.hasImageOnly) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    onFiltersChange({
      artType: null,
      artistId: null,
      museumId: null,
      onViewOnly: false,
      mustSeeOnly: false,
      hasImageOnly: false,
    });
  };

  const handleSortToggle = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar Row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('art.searchPlaceholder' as any) || 'Search...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters toggle */}
        <Button
          variant="outline"
          className="gap-2 h-10 flex-shrink-0"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t('art.filters' as any) || 'Filters'}</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* View Toggle */}
        <ArtViewToggle view={view} onViewChange={onViewChange} />

        {/* Sort Title Toggle */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={handleSortToggle}
              >
                {sortOrder === 'asc' ? (
                  <ArrowDownAZ className="w-4 h-4" />
                ) : (
                  <ArrowUpAZ className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{sortOrder === 'asc' ? t('art.sortAZ') : t('art.sortZA')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Collapsible Filter Panel */}
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        <CollapsibleContent>
          <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Art Type Filter */}
              <Select
                value={filters.artType || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, artType: value === 'all' ? null : value })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('art.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('art.allTypes')} <span className="text-muted-foreground">({totalTypeCount})</span>
                  </SelectItem>
                  {artTypes
                    .filter(type => (typeCounts.get(type) || 0) > 0)
                    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                    .map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type} <span className="text-muted-foreground">({typeCounts.get(type) || 0})</span>
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
                            <span>{getCountryFlag(artist.nationality)} {artist.artist_name}</span>
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
                          <span>🌍 {t('art.allMuseums')}</span>
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
                            <span>{getCountryFlag(museum.country)} {museum.name}</span>
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
                <Label htmlFor="on-view-filter" className="cursor-pointer text-sm whitespace-nowrap">
                  {t('art.onView')} <span className="text-muted-foreground">({onViewCount})</span>
                </Label>
              </div>

              {/* Must-See Toggle */}
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <Switch
                  id="must-see-filter"
                  checked={filters.mustSeeOnly}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, mustSeeOnly: checked })
                  }
                />
                <Label htmlFor="must-see-filter" className="cursor-pointer text-sm whitespace-nowrap">
                  {t('art.mustSeeLabel')} <span className="text-muted-foreground">({mustSeeCount})</span>
                </Label>
              </div>

              {/* Has Image Toggle */}
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <Switch
                  id="has-image-filter"
                  checked={filters.hasImageOnly}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, hasImageOnly: checked })
                  }
                />
                <Label htmlFor="has-image-filter" className="cursor-pointer text-sm whitespace-nowrap">
                  {t('art.hasImage')} <span className="text-muted-foreground">({hasImageCount})</span>
                </Label>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" />
                  {t('art.clearAllFilters' as any) || 'Clear all filters'}
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
