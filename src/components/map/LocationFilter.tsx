import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, MapPin, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { getCountryFlag } from '@/lib/countryFlag';
import { Input } from '@/components/ui/input';

interface LocationFilterProps {
  availableLocations: {
    country: string;
    state: string | null;
    city: string;
  }[];
  selectedCountry: string | null;
  selectedState: string | null;
  selectedCity: string | null;
  onSelectionChange: (country: string | null, state: string | null, city: string | null) => void;
}

type Level = 'country' | 'state' | 'city';

export function LocationFilter({
  availableLocations,
  selectedCountry,
  selectedState,
  selectedCity,
  onSelectionChange,
}: LocationFilterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<Level>('country');
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

  // Get unique countries
  const countries = useMemo(() => {
    const unique = [...new Set(availableLocations.map(l => l.country))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [availableLocations]);

  // Get states for selected country
  const states = useMemo(() => {
    if (!selectedCountry) return [];
    const filtered = availableLocations
      .filter(l => l.country === selectedCountry && l.state)
      .map(l => l.state as string);
    return [...new Set(filtered)].sort((a, b) => a.localeCompare(b));
  }, [availableLocations, selectedCountry]);

  // Get cities for selected state (or country if no states)
  const cities = useMemo(() => {
    let filtered = availableLocations;
    if (selectedCountry) {
      filtered = filtered.filter(l => l.country === selectedCountry);
    }
    if (selectedState) {
      filtered = filtered.filter(l => l.state === selectedState);
    }
    const unique = [...new Set(filtered.map(l => l.city))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [availableLocations, selectedCountry, selectedState]);

  const handleCountrySelect = (country: string | null) => {
    if (country === null) {
      onSelectionChange(null, null, null);
      setIsOpen(false);
    } else {
      onSelectionChange(country, null, null);
      // Check if this country has states
      const hasStates = availableLocations.some(l => l.country === country && l.state);
      if (hasStates) {
        setCurrentLevel('state');
      } else {
        setCurrentLevel('city');
      }
    }
    setSearchQuery('');
  };

  const handleStateSelect = (state: string | null) => {
    if (state === null) {
      onSelectionChange(selectedCountry, null, null);
      setCurrentLevel('country');
    } else {
      onSelectionChange(selectedCountry, state, null);
      setCurrentLevel('city');
    }
    setSearchQuery('');
  };

  const handleCitySelect = (city: string | null) => {
    if (city === null) {
      if (states.length > 0) {
        onSelectionChange(selectedCountry, selectedState, null);
        setCurrentLevel('state');
      } else {
        onSelectionChange(selectedCountry, null, null);
        setCurrentLevel('country');
      }
    } else {
      onSelectionChange(selectedCountry, selectedState, city);
      setIsOpen(false);
    }
    setSearchQuery('');
  };

  const clearFilter = () => {
    onSelectionChange(null, null, null);
    setCurrentLevel('country');
    setSearchQuery('');
    setIsOpen(false);
  };

  const hasSelection = selectedCountry !== null;

  const getButtonLabel = () => {
    const parts: string[] = [];
    if (selectedCountry) parts.push(selectedCountry);
    if (selectedState) parts.push(selectedState);
    if (selectedCity) parts.push(selectedCity);
    
    if (parts.length === 0) return t('map.state'); // Using 'Location' would need new key
    if (parts.length === 1) return parts[0];
    return parts.join(' · ');
  };

  const getFilteredItems = (items: string[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderLevel = () => {
    switch (currentLevel) {
      case 'country':
        const filteredCountries = getFilteredItems(countries);
        return (
          <>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-sm"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                onClick={() => handleCountrySelect(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  !selectedCountry && "bg-primary/10 font-medium"
                )}
              >
                <span className="w-5 text-center">🌍</span>
                <span>All Countries</span>
              </button>
              {filteredCountries.map(country => (
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedCountry === country && "bg-primary/10 font-medium"
                  )}
                >
                  <span className="w-5 text-center">{getCountryFlag(country)}</span>
                  <span className="flex-1 text-left">{country}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        );

      case 'state':
        const filteredStates = getFilteredItems(states);
        return (
          <>
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <button
                onClick={() => setCurrentLevel('country')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                ← {selectedCountry}
              </button>
            </div>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search states..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-sm"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                onClick={() => {
                  setCurrentLevel('city');
                  onSelectionChange(selectedCountry, null, null);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  !selectedState && "bg-primary/10 font-medium"
                )}
              >
                <span>All States</span>
              </button>
              {filteredStates.map(state => (
                <button
                  key={state}
                  onClick={() => handleStateSelect(state)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedState === state && "bg-primary/10 font-medium"
                  )}
                >
                  <span className="flex-1 text-left">{state}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        );

      case 'city':
        const filteredCities = getFilteredItems(cities);
        const backLabel = selectedState || selectedCountry;
        return (
          <>
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <button
                onClick={() => setCurrentLevel(states.length > 0 ? 'state' : 'country')}
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
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Reset to appropriate level when opening
            if (selectedCity) setCurrentLevel('city');
            else if (selectedState) setCurrentLevel('state');
            else setCurrentLevel('country');
          }
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          hasSelection
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
        )}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="max-w-[150px] truncate">{getButtonLabel()}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
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
