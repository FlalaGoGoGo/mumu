import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarRange, Pencil, Trash2, Copy, MapPin, Clock, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisitPlans, generateVisitName } from '@/hooks/useVisitPlans';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MyVisitsList() {
  const navigate = useNavigate();
  const { visits, createVisit, deleteVisit, duplicateVisit } = useVisitPlans();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleNew = () => {
    const visit = createVisit();
    navigate(`/plan/${visit.id}/edit`);
  };

  const handleCardClick = (visit: typeof visits[0]) => {
    if (visit.generatedAt) {
      navigate(`/plan/${visit.id}`);
    } else {
      navigate(`/plan/${visit.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteVisit(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-73px)]">
      <div className="container max-w-3xl py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Visits</h1>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" />
            New Visit
          </Button>
        </div>

        {/* Visit List or Empty State */}
        {visits.length === 0 ? (
          <div className="gallery-card text-center py-16">
            <CalendarRange className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">No visits planned yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first visit to get personalized museum itineraries, ticket strategies, and route maps.
            </p>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Create your first visit
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map(visit => (
              <button
                key={visit.id}
                onClick={() => handleCardClick(visit)}
                className="gallery-card w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold truncate">
                      {visit.name || generateVisitName(visit)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                      {/* Date info */}
                      <span className="flex items-center gap-1">
                        <CalendarRange className="w-3.5 h-3.5" />
                        {visit.dateMode === 'fixed' && visit.startDate && visit.endDate
                          ? `${visit.startDate} – ${visit.endDate}`
                          : visit.flexibleDays
                            ? `${visit.flexibleDays} days (flexible)`
                            : 'Flexible dates'}
                      </span>
                      {/* Stops count */}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {visit.stops.length} {visit.stops.length === 1 ? 'place' : 'places'}
                      </span>
                      {/* Time budget */}
                      {visit.timeBudgetMode === 'time_window' && visit.dailyTimeWindow && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {visit.dailyTimeWindow.start}–{visit.dailyTimeWindow.end}
                        </span>
                      )}
                    </div>
                    {/* Stop cities */}
                    {visit.stops.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {visit.stops.slice(0, 4).map(stop => (
                          <span key={stop.id} className="museum-chip text-[10px]">
                            {stop.city || stop.state || stop.country || stop.region || '?'}
                          </span>
                        ))}
                        {visit.stops.length > 4 && (
                          <span className="museum-chip text-[10px]">+{visit.stops.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side: mode badge + actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`museum-chip text-[10px] ${visit.mode === 'money' ? '!bg-green-50 !text-green-700 !border-green-200' : '!bg-blue-50 !text-blue-700 !border-blue-200'}`}>
                      {visit.mode === 'money' ? '💰 Save Money' : '⚡ Save Time'}
                    </span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/plan/${visit.id}/edit`)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => duplicateVisit(visit.id)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(visit.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {visit.generatedAt && (
                  <div className="mt-3 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Plan generated • Click to view results
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The visit plan and any generated results will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
