import { useState, useMemo, useEffect } from 'react';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LocationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: string;
  region: string;
  city: string;
  onSave: (loc: { location_country: string; location_region: string; location_city: string }) => void;
}

// Searchable combobox for selecting from a list
function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  items,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal h-10",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {value ? items.find(i => i.value === value)?.label || value : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="max-h-[200px]">
                  {items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                      {item.label}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function LocationEditDialog({
  open,
  onOpenChange,
  country,
  region,
  city,
  onSave,
}: LocationEditDialogProps) {
  const { t } = useLanguage();

  // Find initial country/state codes from saved names
  const findCountryCode = (name: string): string => {
    if (!name) return '';
    const found = Country.getAllCountries().find(
      c => c.name.toLowerCase() === name.toLowerCase() || c.isoCode.toLowerCase() === name.toLowerCase()
    );
    return found?.isoCode || '';
  };

  const findStateCode = (countryCode: string, name: string): string => {
    if (!countryCode || !name) return '';
    const found = State.getStatesOfCountry(countryCode).find(
      s => s.name.toLowerCase() === name.toLowerCase() || s.isoCode.toLowerCase() === name.toLowerCase()
    );
    return found?.isoCode || '';
  };

  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const cc = findCountryCode(country);
      const sc = findStateCode(cc, region);
      setSelectedCountryCode(cc);
      setSelectedStateCode(sc);
      setSelectedCityName(city || '');
    }
  }, [open, country, region, city]);

  const countries = useMemo(() =>
    Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })),
    []
  );

  const states = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode).map(s => ({ value: s.isoCode, label: s.name }));
  }, [selectedCountryCode]);

  const cities = useMemo(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode).map(c => ({ value: c.name, label: c.name }));
  }, [selectedCountryCode, selectedStateCode]);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    setSelectedStateCode('');
    setSelectedCityName('');
  };

  const handleStateChange = (code: string) => {
    setSelectedStateCode(code);
    setSelectedCityName('');
  };

  const handleSave = () => {
    const countryName = countries.find(c => c.value === selectedCountryCode)?.label || '';
    const stateName = states.find(s => s.value === selectedStateCode)?.label || '';
    onSave({
      location_country: countryName,
      location_region: stateName,
      location_city: selectedCityName,
    });
    toast({ title: t('profile.profileUpdated') });
    onOpenChange(false);
  };

  const handleClear = () => {
    onSave({ location_country: '', location_region: '', location_city: '' });
    toast({ title: t('profile.profileUpdated') });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{t('profile.editLocation')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SearchableSelect
            label={t('profile.country')}
            placeholder={t('profile.selectCountry')}
            searchPlaceholder={t('profile.searchCountry')}
            emptyText={t('profile.noCountryFound')}
            items={countries}
            value={selectedCountryCode}
            onChange={handleCountryChange}
          />
          <SearchableSelect
            label={t('profile.region')}
            placeholder={t('profile.selectRegion')}
            searchPlaceholder={t('profile.searchRegion')}
            emptyText={t('profile.noRegionFound')}
            items={states}
            value={selectedStateCode}
            onChange={handleStateChange}
            disabled={!selectedCountryCode}
          />
          {cities.length > 0 ? (
            <SearchableSelect
              label={t('profile.city')}
              placeholder={t('profile.selectCity')}
              searchPlaceholder={t('profile.searchCity')}
              emptyText={t('profile.noCityFound')}
              items={cities}
              value={selectedCityName}
              onChange={setSelectedCityName}
              disabled={!selectedStateCode}
            />
          ) : selectedStateCode ? (
            <div className="space-y-1.5">
              <Label className="text-sm">{t('profile.city')}</Label>
              <Input
                value={selectedCityName}
                onChange={(e) => setSelectedCityName(e.target.value)}
                placeholder={t('profile.cityPlaceholder')}
                maxLength={60}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('profile.city')}</Label>
              <Button variant="outline" disabled className="w-full justify-start font-normal text-muted-foreground h-10">
                {t('profile.selectCity')}
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground mr-auto">
            <X className="w-4 h-4 mr-1" />
            {t('profile.clearLocation')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
