import { cn } from '@/lib/utils';

interface PreferenceChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function PreferenceChip({ label, selected, onClick, disabled }: PreferenceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        "border focus:outline-none focus:ring-2 focus:ring-primary/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      {label}
    </button>
  );
}

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  exclusiveOption?: string; // Option that deselects others when selected
}

export function MultiSelectChips({ options, selected, onChange, exclusiveOption }: MultiSelectChipsProps) {
  const handleClick = (option: string) => {
    if (option === exclusiveOption) {
      // If clicking exclusive option, toggle it and deselect others
      if (selected.includes(option)) {
        onChange([]);
      } else {
        onChange([option]);
      }
    } else {
      // Regular option clicked
      const withoutExclusive = selected.filter(s => s !== exclusiveOption);
      if (selected.includes(option)) {
        onChange(withoutExclusive.filter(s => s !== option));
      } else {
        onChange([...withoutExclusive, option]);
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <PreferenceChip
          key={option}
          label={option}
          selected={selected.includes(option)}
          onClick={() => handleClick(option)}
        />
      ))}
    </div>
  );
}

interface SingleSelectChipsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function SingleSelectChips({ options, selected, onChange }: SingleSelectChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <PreferenceChip
          key={option}
          label={option}
          selected={selected === option}
          onClick={() => onChange(option)}
        />
      ))}
    </div>
  );
}
