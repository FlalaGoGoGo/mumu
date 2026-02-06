import { useState, useMemo, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import { X, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

interface LocationDetailEditorProps {
  selected: string[];
  onChange: (locations: string[]) => void;
}

function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  items,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal h-8 text-sm",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {value ? items.find(i => i.value === value)?.label || value : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-3 w-3", value === item.value ? "opacity-100" : "opacity-0")} />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function getStep2Label(countryCode: string): string {
  switch (countryCode) {
    case 'US': return 'State';
    case 'CN': case 'CA': return 'Province';
    case 'AU': return 'State / Territory';
    default: return 'State / Province';
  }
}

export function LocationDetailEditor({ selected, onChange }: LocationDetailEditorProps) {
  const [adding, setAdding] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [cityName, setCityName] = useState('');

  const countries = useMemo(() =>
    Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })),
    []
  );

  const states = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map(s => ({ value: s.isoCode, label: s.name }));
  }, [countryCode]);

  const cities = useMemo(() => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map(c => ({ value: c.name, label: c.name }));
  }, [countryCode, stateCode]);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setStateCode('');
    setCityName('');
  };

  const handleStateChange = (code: string) => {
    setStateCode(code);
    setCityName('');
  };

  const handleAdd = () => {
    const countryName = countries.find(c => c.value === countryCode)?.label || '';
    const stateName = states.find(s => s.value === stateCode)?.label || '';
    const parts = [cityName, stateName, countryName].filter(Boolean);
    const locationStr = parts.join(', ');
    if (locationStr && !selected.includes(locationStr)) {
      onChange([...selected, locationStr]);
    }
    setCountryCode('');
    setStateCode('');
    setCityName('');
    setAdding(false);
  };

  const handleRemove = (loc: string) => {
    onChange(selected.filter(s => s !== loc));
  };

  const step2Label = countryCode ? getStep2Label(countryCode) : 'State / Province';

  return (
    <div className="space-y-3 mt-3 pl-8 border-l-2 border-border/40">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Resident Locations</p>

      {/* Selected locations */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(loc => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
            >
              {loc}
              <button
                type="button"
                onClick={() => handleRemove(loc)}
                className="p-0.5 rounded-full hover:bg-primary/20"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add location form */}
      {adding ? (
        <div className="space-y-2 p-3 rounded-md border border-border/40 bg-background/50">
          <SearchableSelect
            label="Region"
            placeholder="Select region…"
            searchPlaceholder="Search regions…"
            items={countries}
            value={countryCode}
            onChange={handleCountryChange}
          />

          {countryCode && states.length > 0 && (
            <SearchableSelect
              label={step2Label}
              placeholder={`Select ${step2Label.toLowerCase()}…`}
              searchPlaceholder={`Search…`}
              items={states}
              value={stateCode}
              onChange={handleStateChange}
            />
          )}

          {countryCode && stateCode && cities.length > 0 && (
            <SearchableSelect
              label="City"
              placeholder="Select city…"
              searchPlaceholder="Search cities…"
              items={cities}
              value={cityName}
              onChange={setCityName}
            />
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={!countryCode}
              className="h-7 text-xs"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setAdding(false); setCountryCode(''); setStateCode(''); setCityName(''); }}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add a resident location
        </button>
      )}
    </div>
  );
}
