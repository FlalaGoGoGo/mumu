import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PreferenceCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function PreferenceCard({ title, children, className }: PreferenceCardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="px-5 py-4 border-b border-border/40">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
      </div>
      <div className="px-5 py-5 space-y-6">
        {children}
      </div>
    </div>
  );
}

interface PreferenceFieldProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function PreferenceField({ label, description, children }: PreferenceFieldProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
