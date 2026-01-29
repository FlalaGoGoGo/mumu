import { Check, Loader2, AlertCircle } from 'lucide-react';
import { SaveStatus } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry: () => void;
}

export function SaveStatusIndicator({ status, onRetry }: SaveStatusIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving…</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          <Button
            variant="link"
            size="sm"
            onClick={onRetry}
            className="h-auto p-0 text-destructive hover:text-destructive/80"
          >
            Couldn't save — Retry
          </Button>
        </>
      )}
    </div>
  );
}
