import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  museums: string[];
  selectedMuseum: string;
  onMuseumChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: ExhibitionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Past', label: 'Past' },
  { value: 'TBD', label: 'TBD' },
];

export function ExhibitionFilters({
  searchQuery,
  onSearchChange,
  museums,
  selectedMuseum,
  onMuseumChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
}: ExhibitionFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exhibitions or museums..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Museum Filter */}
        <Select value={selectedMuseum} onValueChange={onMuseumChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Museums" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Museums</SelectItem>
            {museums.map((museum) => (
              <SelectItem key={museum} value={museum}>
                {museum}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
