import { useState, useMemo } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DetailEditorProps {
  label: string;
  placeholder: string;
  addLabel: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  showOtherOption?: boolean;
}

export function DetailEditor({ label, placeholder, addLabel, options, selected, onChange, showOtherOption }: DetailEditorProps) {
  const [search, setSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const filtered = useMemo(() => {
    if (!search) return options.filter(o => !selected.includes(o)).slice(0, 8);
    const q = search.toLowerCase();
    return options.filter(o => 
      o.toLowerCase().includes(q) && !selected.includes(o)
    ).slice(0, 10);
  }, [search, options, selected]);

  const handleAdd = (value: string) => {
    if (value && !selected.includes(value)) {
      onChange([...selected, value]);
    }
    setSearch('');
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter(s => s !== value));
  };

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-3 mt-3 pl-8 border-l-2 border-border/40">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      
      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="p-0.5 rounded-full hover:bg-primary/20"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + suggestions */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {(search || filtered.length > 0) && (
        <div className="max-h-[140px] overflow-y-auto space-y-0.5 rounded-md border border-border/40 bg-popover">
          {showOtherOption && !search && (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full text-left px-3 py-1.5 text-sm text-primary font-medium hover:bg-accent/50 transition-colors border-b border-border/30"
            >
              Other / Not listed — type your company
            </button>
          )}
          {filtered.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleAdd(option)}
              className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
            >
              {option}
            </button>
          ))}
          {filtered.length === 0 && search && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No matches found</p>
          )}
        </div>
      )}

      {/* Custom entry */}
      {showCustomInput ? (
        <div className="flex items-center gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter custom name…"
            className="h-8 text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
              if (e.key === 'Escape') setShowCustomInput(false);
            }}
            autoFocus
          />
          <Button size="sm" variant="outline" onClick={handleAddCustom} className="h-8 text-xs">
            Add
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}
