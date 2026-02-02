import { Artist } from '@/types/art';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ArtistPanelProps {
  artist: Artist | null;
}

export function ArtistPanel({ artist }: ArtistPanelProps) {
  const { t } = useLanguage();

  if (!artist) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
        <p className="text-sm">{t('art.selectArtist')}</p>
      </div>
    );
  }

  const notableWorks = artist.notable_works?.split('|').map(w => w.trim()).filter(Boolean) || [];
  const lifespan = artist.death_year 
    ? `${artist.birth_year} – ${artist.death_year}`
    : artist.birth_year 
      ? `${artist.birth_year} – ${t('art.present')}`
      : null;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Portrait */}
        {artist.portrait_url && (
          <div className="overflow-hidden rounded-lg border border-border">
            <img
              src={artist.portrait_url}
              alt={artist.artist_name}
              className="aspect-square w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Name */}
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            {artist.artist_name}
          </h2>
          {lifespan && (
            <p className="text-sm text-muted-foreground">{lifespan}</p>
          )}
        </div>

        {/* Nationality & Movement */}
        <div className="flex flex-wrap gap-2">
          {artist.nationality && (
            <Badge variant="outline" className="text-xs">
              {artist.nationality}
            </Badge>
          )}
          {artist.movement && (
            <Badge variant="secondary" className="text-xs">
              {artist.movement}
            </Badge>
          )}
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {artist.bio}
          </p>
        )}

        {/* Notable Works */}
        {notableWorks.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('art.notableWorks')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {notableWorks.map((work, index) => (
                <Badge key={index} variant="outline" className="text-xs font-normal">
                  {work}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Wikipedia Link */}
        {artist.wiki_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a href={artist.wiki_url} target="_blank" rel="noopener noreferrer">
              {t('art.learnMore')}
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </ScrollArea>
  );
}
