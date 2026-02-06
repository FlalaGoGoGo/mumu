import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, MapPin, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { getCountryFlag } from '@/lib/countryFlag';
import { Input } from '@/components/ui/input';

export interface ExhibitionLocation {
  country: string;
  state: string | null;
  city: string;
}

interface ExhibitionLocationFilterProps {
  availableLocations: ExhibitionLocation[];
  selectedRegion: string | null;
  selectedStateProvince: string | null;
  selectedCity: string | null;
  onSelectionChange: (region: string | null, stateProvince: string | null, city: string | null) => void;
  /** When true, button fills parent width */
  fullWidth?: boolean;
}

type Level = 'region' | 'state' | 'city';

function getStateLabel(region: string | null): string {
  if (!region) return 'State / Province';
  switch (region) {
    case 'United States': return 'State';
    case 'Canada': return 'Province';
    case 'Australia': return 'State / Territory';
    case 'China':
    case 'Japan':
      return 'Province';
    default:
      return 'State / Province';
  }
}

export function ExhibitionLocationFilter({
  availableLocations,
  selectedRegion,
  selectedStateProvince,
  selectedCity,
  onSelectionChange,
  fullWidth = false,
}: ExhibitionLocationFilterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<Level>('region');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const regions = useMemo(() => {
    const unique = [...new Set(availableLocations.map(l => l.country))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [availableLocations]);

  const statesProvinces = useMemo(() => {
    if (!selectedRegion) return [];
    const filtered = availableLocations
      .filter(l => l.country === selectedRegion && l.state)
      .map(l => l.state as string);
    return [...new Set(filtered)].sort((a, b) => a.localeCompare(b));
  }, [availableLocations, selectedRegion]);

  const cities = useMemo(() => {
    let filtered = availableLocations;
    if (selectedRegion) {
      filtered = filtered.filter(l => l.country === selectedRegion);
    }
    if (selectedStateProvince) {
      filtered = filtered.filter(l => l.state === selectedStateProvince);
    }
    const unique = [...new Set(filtered.map(l => l.city))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [availableLocations, selectedRegion, selectedStateProvince]);

  const handleRegionSelect = (region: string | null) => {
    if (region === null) {
      onSelectionChange(null, null, null);
      setIsOpen(false);
    } else {
      onSelectionChange(region, null, null);
      const hasStates = availableLocations.some(l => l.country === region && l.state);
      if (hasStates) {
        setCurrentLevel('state');
      } else {
        // Check if there are multiple cities
        const regionCities = [...new Set(availableLocations.filter(l => l.country === region).map(l => l.city))];
        if (regionCities.length > 1) {
          setCurrentLevel('city');
        } else {
          setIsOpen(false);
        }
      }
    }
    setSearchQuery('');
  };

  const handleStateSelect = (state: string | null) => {
    if (state === null) {
      onSelectionChange(selectedRegion, null, null);
      setCurrentLevel('region');
    } else {
      onSelectionChange(selectedRegion, state, null);
      // Check if there are multiple cities in this state
      const stateCities = [...new Set(
        availableLocations.filter(l => l.country === selectedRegion && l.state === state).map(l => l.city)
      )];
      if (stateCities.length > 1) {
        setCurrentLevel('city');
      } else {
        setIsOpen(false);
      }
    }
    setSearchQuery('');
  };

  const handleCitySelect = (city: string | null) => {
    if (city === null) {
      if (statesProvinces.length > 0) {
        onSelectionChange(selectedRegion, selectedStateProvince, null);
        setCurrentLevel('state');
      } else {
        onSelectionChange(selectedRegion, null, null);
        setCurrentLevel('region');
      }
    } else {
      onSelectionChange(selectedRegion, selectedStateProvince, city);
      setIsOpen(false);
    }
    setSearchQuery('');
  };

  const clearFilter = () => {
    onSelectionChange(null, null, null);
    setCurrentLevel('region');
    setSearchQuery('');
    setIsOpen(false);
  };

  const hasSelection = selectedRegion !== null;

  const getButtonLabel = () => {
    const parts: string[] = [];
    if (selectedRegion) parts.push(selectedRegion);
    if (selectedStateProvince) parts.push(selectedStateProvince);
    if (selectedCity) parts.push(selectedCity);

    if (parts.length === 0) return t('exhibitions.allRegions' as any) || 'All Regions';
    if (parts.length === 1) return parts[0];
    return parts.join(' · ');
  };

  const getFilteredItems = (items: string[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const stateLabel = getStateLabel(selectedRegion);

  const renderLevel = () => {
    switch (currentLevel) {
      case 'region': {
        const filteredRegions = getFilteredItems(regions);
        return (
          <>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                onClick={() => handleRegionSelect(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  !selectedRegion && "bg-primary/10 font-medium"
                )}
              >
                <span className="w-5 text-center">🌍</span>
                <span>All Regions</span>
              </button>
              {filteredRegions.map(region => (
                <button
                  key={region}
                  onClick={() => handleRegionSelect(region)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedRegion === region && "bg-primary/10 font-medium"
                  )}
                >
                  <span className="w-5 text-center">{getCountryFlag(region)}</span>
                  <span className="flex-1 text-left">{region}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        );
      }

      case 'state': {
        const filteredStates = getFilteredItems(statesProvinces);
        return (
          <>
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <button
                onClick={() => { setCurrentLevel('region'); setSearchQuery(''); }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                ← {selectedRegion}
              </button>
            </div>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={`Search ${stateLabel.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                onClick={() => {
                  setCurrentLevel('city');
                  onSelectionChange(selectedRegion, null, null);
                  setSearchQuery('');
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  !selectedStateProvince && "bg-primary/10 font-medium"
                )}
              >
                <span>All {stateLabel}s</span>
              </button>
              {filteredStates.map(state => (
                <button
                  key={state}
                  onClick={() => handleStateSelect(state)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedStateProvince === state && "bg-primary/10 font-medium"
                  )}
                >
                  <span className="flex-1 text-left">{state}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        );
      }

      case 'city': {
        const filteredCities = getFilteredItems(cities);
        const backLabel = selectedStateProvince || selectedRegion;
        return (
          <>
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <button
                onClick={() => { setCurrentLevel(statesProvinces.length > 0 ? 'state' : 'region'); setSearchQuery(''); }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                ← {backLabel}
              </button>
            </div>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                onClick={() => handleCitySelect(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  !selectedCity && "bg-primary/10 font-medium"
                )}
              >
                <span>All Cities</span>
              </button>
              {filteredCities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedCity === city && "bg-primary/10 font-medium"
                  )}
                >
                  <span className="flex-1 text-left">{city}</span>
                </button>
              ))}
            </div>
          </>
        );
      }
    }
  };

  return (
    <div className={cn("relative", fullWidth ? "w-full" : "flex-shrink-0")} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            if (selectedCity) setCurrentLevel('city');
            else if (selectedStateProvince) setCurrentLevel('state');
            else setCurrentLevel('region');
          }
        }}
        className={cn(
          "inline-flex items-center gap-1.5 h-10 px-3 rounded-md text-sm font-medium transition-all",
          "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          fullWidth && "w-full",
          hasSelection
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className={cn("truncate", fullWidth ? "flex-1 text-left" : "max-w-[160px]")}>{getButtonLabel()}</span>
        {hasSelection && (
          <X
            className="w-3.5 h-3.5 flex-shrink-0 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); clearFilter(); }}
          />
        )}
        {!hasSelection && (
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Location
            </span>
            {hasSelection && (
              <button
                onClick={clearFilter}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t('common.clear')}
              </button>
            )}
          </div>

          {renderLevel()}
        </div>
      )}
    </div>
  );
}
