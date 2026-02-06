import { useState, useMemo } from 'react';
import { Search, Check, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EligibilityItem, EligibilityType } from '@/types/eligibility';
import { ELIGIBILITY_CATALOG, COMMON_SCHOOLS, COMMON_LIBRARIES, COMMON_EMPLOYERS } from '@/lib/eligibilityCatalog';
import { DetailEditor } from './DetailEditor';
import { DateOfBirthEditor } from './DateOfBirthEditor';

interface AddEligibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibilities: EligibilityItem[];
  onAdd: (item: EligibilityItem) => void;
  onUpdate: (item: EligibilityItem) => void;
}

export function AddEligibilityDialog({
  open,
  onOpenChange,
  eligibilities,
  onAdd,
  onUpdate,
}: AddEligibilityDialogProps) {
  const [search, setSearch] = useState('');
  const [expandedType, setExpandedType] = useState<EligibilityType | null>(null);

  const existingTypes = new Set(eligibilities.map(e => e.type));

  const filteredCategories = useMemo(() => {
    if (!search) return ELIGIBILITY_CATALOG;
    const q = search.toLowerCase();
    return ELIGIBILITY_CATALOG.map(cat => ({
      ...cat,
      items: cat.items.filter(
        item =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          cat.label.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  const handleToggle = (type: EligibilityType, hasDetails?: string) => {
    if (existingTypes.has(type)) {
      if (hasDetails) {
        setExpandedType(expandedType === type ? null : type);
      }
      return;
    }
    const newItem: EligibilityItem = { type };
    onAdd(newItem);
    if (hasDetails) {
      setExpandedType(type);
    }
  };

  const getExistingItem = (type: EligibilityType) =>
    eligibilities.find(e => e.type === type);

  const handleDetailChange = (type: EligibilityType, field: 'schools' | 'libraries' | 'companies', values: string[]) => {
    const existing = getExistingItem(type);
    if (existing) {
      onUpdate({ ...existing, [field]: values });
    }
  };

  const handleDobChange = (type: EligibilityType, dob: string) => {
    const existing = getExistingItem(type);
    if (existing) {
      onUpdate({ ...existing, date_of_birth: dob });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-lg">Add Eligibility</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs, cards, memberships…"
              className="pl-9"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ maxHeight: '60vh' }}>
          <div className="space-y-5">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category.label}
                </p>
                <div className="space-y-1">
                  {category.items.map(item => {
                    const isAdded = existingTypes.has(item.type);
                    const isExpanded = expandedType === item.type;
                    const existing = getExistingItem(item.type);

                    return (
                      <div key={item.type}>
                        <button
                          type="button"
                          onClick={() => handleToggle(item.type, item.hasDetails)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                            isAdded
                              ? 'bg-primary/8 border border-primary/20'
                              : 'hover:bg-accent/30 border border-transparent'
                          }`}
                        >
                          <span className="text-lg flex-shrink-0 self-center">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                          <div className="flex-shrink-0 self-center">
                            {isAdded ? (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center">
                                <Plus className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Detail editor for items with details */}
                        {isAdded && item.hasDetails && isExpanded && (
                          <div className="ml-3">
                            {item.hasDetails === 'schools' && (
                              <DetailEditor
                                label="Your Schools"
                                placeholder="Search schools…"
                                addLabel="Add another school"
                                options={COMMON_SCHOOLS}
                                selected={existing?.schools || []}
                                onChange={(schools) => handleDetailChange(item.type, 'schools', schools)}
                              />
                            )}
                            {item.hasDetails === 'libraries' && (
                              <DetailEditor
                                label="Your Library Systems"
                                placeholder="Search library systems…"
                                addLabel="Add another library"
                                options={COMMON_LIBRARIES}
                                selected={existing?.libraries || []}
                                onChange={(libraries) => handleDetailChange(item.type, 'libraries', libraries)}
                              />
                            )}
                            {item.hasDetails === 'companies' && (
                              <DetailEditor
                                label="Your Employers"
                                placeholder="Search companies…"
                                addLabel="Add another employer"
                                options={COMMON_EMPLOYERS}
                                selected={existing?.companies || []}
                                onChange={(companies) => handleDetailChange(item.type, 'companies', companies)}
                                showOtherOption
                              />
                            )}
                            {item.hasDetails === 'date_of_birth' && (
                              <DateOfBirthEditor
                                value={existing?.date_of_birth || ''}
                                onChange={(dob) => handleDobChange(item.type, dob)}
                              />
                            )}
                          </div>
                        )}

                        {/* Show "tap to edit details" hint */}
                        {isAdded && item.hasDetails && !isExpanded && (
                          <p className="text-xs text-primary/70 ml-10 mt-0.5 mb-1 cursor-pointer" onClick={() => setExpandedType(item.type)}>
                            Tap to edit details
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No eligibility programs match your search.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="bg-primary hover:bg-primary/90">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
