import { Share2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import mumuLogo from '@/assets/mumu-logo.png';

interface PassportHeroProps {
  displayName: string;
  avatarUrl: string;
  passportNo: string;
  issueDate: string;
  homeCity: string;
  onShare?: () => void;
}

export function PassportHero({
  displayName,
  avatarUrl,
  passportNo,
  issueDate,
  homeCity,
  onShare,
}: PassportHeroProps) {
  const safeName = (displayName || 'EXPLORER').toUpperCase().replace(/[^A-Z ]/g, '');
  const mrzName = safeName.replace(/ /g, '<').padEnd(30, '<');
  const mrzLine1 = `P<MMU<<${mrzName}`;
  const mrzLine2 = `${passportNo.replace(/-/g, '')}<<<MUSEUM<<<<PASSPORT<<<<`;

  return (
    <div className="relative overflow-hidden rounded-t-lg border border-b-0 border-gold-border/40">
      {/* Light ivory passport background */}
      <div className="bg-card parchment-texture text-foreground">
        {/* Top gold accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gold-border to-transparent" />

        <div className="px-5 pt-5 pb-0 md:px-8 md:pt-6">
          {/* Share button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="absolute top-5 right-4 text-muted-foreground hover:text-foreground hover:bg-muted/60 z-10"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          {/* Title */}
          <div className="text-center mb-5">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide text-foreground">
              Museum Passport
            </h1>
            <p className="text-[11px] md:text-xs text-muted-foreground tracking-[0.3em] uppercase mt-1.5">
              Museums • Artworks • Achievements
            </p>
          </div>

          {/* Main passport row */}
          <div className="flex items-center gap-4 md:gap-5">
            {/* Avatar */}
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-gold-border/50 flex-shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-muted text-gold-border">
                {displayName ? (
                  <span className="text-2xl font-display font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <img src={mumuLogo} className="w-10 h-10 object-contain opacity-60" alt="MuMu" />
                )}
              </AvatarFallback>
            </Avatar>

            {/* Name + home */}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl md:text-2xl font-bold truncate text-foreground">
                {displayName || 'Explorer'}
              </h2>
              {homeCity && (
                <p className="text-sm text-muted-foreground truncate">
                  {homeCity}
                </p>
              )}
            </div>

            {/* Passport details */}
            <div className="text-right flex-shrink-0 space-y-1.5 hidden sm:block">
              <div>
                <div className="text-[9px] text-muted-foreground/70 uppercase tracking-widest">
                  Passport No.
                </div>
                <div className="font-mono text-xs md:text-sm text-foreground">{passportNo}</div>
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground/70 uppercase tracking-widest">
                  Issue Date
                </div>
                <div className="font-mono text-xs md:text-sm text-foreground">{issueDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gold MRZ strip */}
        <div className="mt-5 px-4 py-2.5 bg-gold-border border-t border-gold-border font-mono text-[9px] md:text-[11px] text-ink tracking-[0.15em] leading-relaxed overflow-hidden select-none">
          <div className="truncate">{mrzLine1}</div>
          <div className="truncate">{mrzLine2}</div>
        </div>
      </div>
    </div>
  );
}
