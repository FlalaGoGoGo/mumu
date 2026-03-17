import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ExternalLink, MapPin, AlertCircle, HelpCircle, Heart, Navigation,
  Eye, EyeOff, User, Volume2, Pause, Square, ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getArtworkImageUrl } from '@/types/art';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import { useLanguage } from '@/lib/i18n';
import { useCollectedArtworks } from '@/hooks/useCollectedArtworks';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { EnrichedArtwork } from '@/types/art';
import type { ArtworkMovement, MobilityResearchStatus } from '@/types/movement';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: EnrichedArtwork | null;
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  mobilityStatus: MobilityResearchStatus;
  mobilityNote: string;
}

const statusLabels: Record<MobilityResearchStatus, string> = {
  HAS_MOVEMENT_EVENTS: 'Has Movement Data',
  NO_CONFIRMED_MOVEMENT: 'No Confirmed Movement',
  AMBIGUOUS_SOURCE_NEEDS_REVIEW: 'Needs Review',
  NOT_RESEARCHED: 'Not Researched',
};

const statusColors: Record<MobilityResearchStatus, string> = {
  HAS_MOVEMENT_EVENTS: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  NO_CONFIRMED_MOVEMENT: 'bg-muted text-muted-foreground',
  AMBIGUOUS_SOURCE_NEEDS_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  NOT_RESEARCHED: 'bg-muted text-muted-foreground',
};

const statusIcons: Record<MobilityResearchStatus, React.ReactNode> = {
  HAS_MOVEMENT_EVENTS: <MapPin className="h-4 w-4 text-green-600" />,
  NO_CONFIRMED_MOVEMENT: <MapPin className="h-4 w-4 text-muted-foreground" />,
  AMBIGUOUS_SOURCE_NEEDS_REVIEW: <AlertCircle className="h-4 w-4 text-amber-600" />,
  NOT_RESEARCHED: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

const languageToLocale: Record<string, string> = {
  'English': 'en-US', 'Simplified Chinese': 'zh-CN', 'Traditional Chinese': 'zh-TW',
  'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE', 'Japanese': 'ja-JP',
  'Korean': 'ko-KR', 'Portuguese': 'pt-BR', 'Italian': 'it-IT',
};

export function ArtworkDetailDrawer({
  open, onOpenChange, artwork, movements, museumMap, mobilityStatus, mobilityNote,
}: Props) {
  const { t, language } = useLanguage();
  const { isCollected, toggleCollect } = useCollectedArtworks();
  const locale = languageToLocale[language] || 'en-US';
  const { speak, stop, isSpeaking, isPaused, toggle, progress, isSupported } = useSpeechSynthesis({ lang: locale });
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused'>('idle');

  useEffect(() => {
    if (!open) { stop(); setAudioState('idle'); }
  }, [open, stop]);

  useEffect(() => {
    stop(); setAudioState('idle');
  }, [artwork?.artwork_id, stop]);

  useEffect(() => {
    if (!isSpeaking && !isPaused && audioState !== 'idle') setAudioState('idle');
    else if (isSpeaking && !isPaused) setAudioState('playing');
    else if (isPaused) setAudioState('paused');
  }, [isSpeaking, isPaused, audioState]);

  const handleCollectToggle = useCallback((e: React.MouseEvent) => {
    if (!artwork) return;
    e.stopPropagation();
    toggleCollect({
      artwork_id: artwork.artwork_id, title: artwork.title,
      artist_name: artwork.artist_name, year: artwork.year,
      image_url: getArtworkImageUrl(artwork), museum_name: artwork.museum_name,
    });
  }, [artwork, toggleCollect]);

  const handleNavigate = useCallback(() => {
    if (!artwork) return;
    const query = artwork.museum_name
      ? encodeURIComponent(artwork.museum_name)
      : `${artwork.museum_lat},${artwork.museum_lng}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }, [artwork]);

  const handlePlayPause = useCallback(() => {
    if (!artwork?.description) return;
    if (audioState === 'idle') { speak(artwork.description); setAudioState('playing'); }
    else if (audioState === 'playing') { toggle(); setAudioState('paused'); }
    else if (audioState === 'paused') { toggle(); setAudioState('playing'); }
  }, [artwork?.description, audioState, speak, toggle]);

  const handleStop = useCallback(() => { stop(); setAudioState('idle'); }, [stop]);

  if (!artwork) return null;

  const collected = isCollected(artwork.artwork_id);
  const imageUrl = getArtworkImageUrl(artwork);
  const homeMuseum = museumMap.get(artwork.museum_id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg z-[9200] p-0" overlayClassName="z-[9150]">
        <SheetHeader className="sr-only">
          <SheetTitle>{artwork.title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-2rem)]">
          <div className="space-y-6 pb-8">
            {/* Image */}
            {imageUrl && (
              <div className="aspect-[16/10] bg-muted overflow-hidden relative">
                <img src={imageUrl} alt={artwork.title} className="w-full h-full object-contain bg-muted" loading="lazy" />
                {/* Collect button overlay */}
                <button
                  onClick={handleCollectToggle}
                  className={cn(
                    "absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur transition-colors",
                    collected ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Heart className={cn("w-5 h-5", collected && "fill-current")} />
                </button>
              </div>
            )}

            <div className="px-6 space-y-6">
              {/* Title & Artist */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{artwork.title}</h2>
                <div className="mt-1 flex items-center gap-1.5 text-base text-primary">
                  <User className="h-4 w-4" />
                  {artwork.artist_name}
                </div>
                {artwork.year && <p className="mt-1 text-sm text-muted-foreground">{artwork.year}</p>}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">{artwork.art_type}</Badge>
                <Badge variant={artwork.on_view ? "default" : "secondary"} className="flex items-center gap-1">
                  {artwork.on_view ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {artwork.on_view ? t('art.onView') : t('art.notOnView')}
                </Badge>
              </div>

              {/* Description */}
              {artwork.description && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('art.description')}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{artwork.description}</p>
                </div>
              )}

              {/* Audio Guide */}
              {artwork.description && isSupported && (
                <div className="border-t border-border pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('art.audioGuide')}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant={audioState !== 'idle' ? 'default' : 'outline'} size="sm" onClick={handlePlayPause} className="gap-1.5">
                      {audioState === 'playing' ? <><Pause className="h-3.5 w-3.5" />{t('art.audioPause')}</> :
                       audioState === 'paused' ? <><Volume2 className="h-3.5 w-3.5" />{t('art.audioResume')}</> :
                       <><Volume2 className="h-3.5 w-3.5" />{t('art.audioPlay')}</>}
                    </Button>
                    {audioState !== 'idle' && (
                      <Button variant="ghost" size="sm" onClick={handleStop} className="gap-1.5 text-muted-foreground">
                        <Square className="h-3.5 w-3.5" />{t('art.audioStop')}
                      </Button>
                    )}
                    {audioState !== 'idle' && (
                      <span className="text-xs text-muted-foreground ml-auto tabular-nums">{Math.round(progress)}%</span>
                    )}
                  </div>
                </div>
              )}

              {/* Medium & Dimensions */}
              <div className="grid gap-4 sm:grid-cols-2">
                {artwork.medium && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('art.medium')}</h3>
                    <p className="text-sm text-foreground">{artwork.medium}</p>
                  </div>
                )}
                {artwork.dimensions && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('art.dimensions')}</h3>
                    <p className="text-sm text-foreground">{artwork.dimensions}</p>
                  </div>
                )}
              </div>

              {/* Museum */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('art.museum')}</h3>
                <p className="font-medium text-foreground">{homeMuseum?.name || artwork.museum_name}</p>
                {artwork.museum_address && <p className="text-sm text-muted-foreground">{artwork.museum_address}</p>}
              </div>

              {/* Mobility Section */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artwork Mobility</h3>
                </div>

                <div className="flex items-center gap-3">
                  {statusIcons[mobilityStatus]}
                  <Badge variant="secondary" className={statusColors[mobilityStatus]}>
                    {statusLabels[mobilityStatus]}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">{movements.length} events</span>
                </div>

                {mobilityNote && (
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-3">{mobilityNote}</p>
                )}

                {/* Movement Timeline */}
                {movements.length > 0 && (
                  <div className="space-y-0 relative">
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
                    {movements.map((m, i) => {
                      const lender = museumMap.get(m.lender_museum_id);
                      const borrower = museumMap.get(m.borrower_museum_id);
                      return (
                        <div key={m.movement_id} className="flex gap-3 py-2.5 relative">
                          <div className="shrink-0 z-10">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border-2 border-background">
                              {i + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-medium truncate">
                              {getMuseumDisplayName(m.lender_museum_id, museumMap)} → {getMuseumDisplayName(m.borrower_museum_id, museumMap)}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">{m.start_date} – {m.end_date}</p>
                            {m.related_exhibition_name && (
                              <p className="text-xs italic text-muted-foreground truncate">{m.related_exhibition_name}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                m.confidence === 'HIGH' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                  : m.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-muted text-muted-foreground'
                              )}>
                                {m.confidence}
                              </span>
                              <span className="text-muted-foreground capitalize">{m.movement_type}</span>
                              {m.source_url && (
                                <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-primary hover:underline ml-auto">
                                  Source <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {movements.length === 0 && mobilityStatus !== 'HAS_MOVEMENT_EVENTS' && (
                  <div className="rounded-lg border bg-muted/30 p-5 text-center space-y-2">
                    {statusIcons[mobilityStatus]}
                    <p className="text-sm text-muted-foreground">
                      {mobilityStatus === 'NO_CONFIRMED_MOVEMENT'
                        ? 'This artwork appears to remain at its home museum.'
                        : mobilityStatus === 'AMBIGUOUS_SOURCE_NEEDS_REVIEW'
                        ? 'Ambiguous sources — mobility data needs review.'
                        : 'Mobility research has not started for this artwork yet.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                {artwork.museum_page_url && (
                  <Button variant="outline" asChild>
                    <a href={artwork.museum_page_url} target="_blank" rel="noopener noreferrer">
                      {t('art.viewOnMuseumSite')}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={handleNavigate}>
                  {t('art.navigate')}
                  <Navigation className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
