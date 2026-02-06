import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface DateOfBirthEditorProps {
  value: string;
  onChange: (dob: string) => void;
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function DateOfBirthEditor({ value, onChange }: DateOfBirthEditorProps) {
  const [dob, setDob] = useState(value);
  const age = dob ? calculateAge(dob) : null;

  const handleChange = (val: string) => {
    setDob(val);
    if (val) {
      onChange(val);
    }
  };

  return (
    <div className="space-y-3 mt-3 pl-8 border-l-2 border-border/40">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date of Birth</p>
      <Input
        type="date"
        value={dob}
        onChange={(e) => handleChange(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className="h-8 text-sm w-48"
      />
      {age !== null && age >= 0 && (
        <p className="text-sm text-foreground">
          Age: <span className="font-semibold">{age}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Your age is calculated automatically and used to check for applicable discounts.
      </p>
    </div>
  );
}
