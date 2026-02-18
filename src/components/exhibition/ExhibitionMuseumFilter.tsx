import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { getCountryFlag } from '@/lib/countryFlag';

export interface MuseumOption {
  museum_id: string;
  name: string;
  city?: string;
  country?: string;
}

interface ExhibitionMuseumFilterProps {
  museums: MuseumOption[];
  selectedMuseumId: string | null;
  onMuseumChange: (museumId: string | null) => void;
}

export function ExhibitionMuseumFilter({
  museums,
  selectedMuseumId,
  onMuseumChange,
}: ExhibitionMuseumFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const filtered = useMemo(() => {
    if (!searchQuery) return museums;
    const q = searchQuery.toLowerCase();
    return museums.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.city && m.city.toLowerCase().includes(q)) ||
      (m.country && m.country.toLowerCase().includes(q))
    );
  }, [museums, searchQuery]);

  const selectedMuseum = useMemo(
    () => museums.find(m => m.museum_id === selectedMuseumId),
    [museums, selectedMuseumId]
  );

  const hasSelection = selectedMuseumId !== null;

  const buttonLabel = selectedMuseum
    ? selectedMuseum.name
    : 'All Museums';

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearchQuery(''); }}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap",
          "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          hasSelection
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate max-w-[140px]">{buttonLabel}</span>
        {hasSelection ? (
          <X
            className="w-3.5 h-3.5 flex-shrink-0 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onMuseumChange(null); setIsOpen(false); }}
          />
        ) : (
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search museums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-7 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              onClick={() => { onMuseumChange(null); setIsOpen(false); setSearchQuery(''); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                !selectedMuseumId && "bg-primary/10 font-medium"
              )}
            >
              <span>All Museums</span>
            </button>
            {filtered.map(museum => {
              const flag = museum.country ? getCountryFlag(museum.country) : '🌍';
              return (
                <button
                  key={museum.museum_id}
                  onClick={() => { onMuseumChange(museum.museum_id); setIsOpen(false); setSearchQuery(''); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedMuseumId === museum.museum_id && "bg-primary/10 font-medium"
                  )}
                >
                  <span className="w-4 text-center text-xs">{flag}</span>
                  <span className="flex-1 text-left truncate">{museum.name}</span>
                  {museum.city && (
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">{museum.city}</span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No museums found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
