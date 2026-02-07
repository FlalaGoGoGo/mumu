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
    <div className="relative overflow-hidden rounded-lg">
      {/* Background */}
      <div className="bg-gradient-to-br from-[hsl(var(--chronicle-bg))] via-[hsl(var(--chronicle-bg-deep))] to-[hsl(var(--chronicle-bg))] text-[hsl(var(--parchment))]">
        {/* Top gold line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-gold-border to-transparent" />

        <div className="px-5 pt-5 pb-0 md:px-8 md:pt-6">
          {/* Share button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="absolute top-5 right-4 text-[hsl(var(--parchment)/0.6)] hover:text-[hsl(var(--parchment))] hover:bg-[hsl(var(--parchment)/0.1)] z-10"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          {/* Title */}
          <div className="text-center mb-5">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide">
              Museum Passport
            </h1>
            <p className="text-[11px] md:text-xs text-[hsl(var(--parchment)/0.45)] tracking-[0.3em] uppercase mt-1.5">
              Museums • Artworks • Achievements
            </p>
          </div>

          {/* Main passport row */}
          <div className="flex items-center gap-4 md:gap-5">
            {/* Avatar */}
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-[hsl(var(--gold-border)/0.5)] flex-shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-[hsl(var(--chronicle-bg-deep))] text-[hsl(var(--gold-border))]">
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
              <h2 className="font-display text-xl md:text-2xl font-bold truncate">
                {displayName || 'Explorer'}
              </h2>
              {homeCity && (
                <p className="text-sm text-[hsl(var(--parchment)/0.55)] truncate">
                  {homeCity}
                </p>
              )}
            </div>

            {/* Passport details */}
            <div className="text-right flex-shrink-0 space-y-1.5 hidden sm:block">
              <div>
                <div className="text-[9px] text-[hsl(var(--parchment)/0.35)] uppercase tracking-widest">
                  Passport No.
                </div>
                <div className="font-mono text-xs md:text-sm">{passportNo}</div>
              </div>
              <div>
                <div className="text-[9px] text-[hsl(var(--parchment)/0.35)] uppercase tracking-widest">
                  Issue Date
                </div>
                <div className="font-mono text-xs md:text-sm">{issueDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MRZ strip */}
        <div className="mt-5 px-4 py-2.5 bg-black/30 border-t border-[hsl(var(--gold-border)/0.15)] font-mono text-[9px] md:text-[11px] text-[hsl(var(--parchment)/0.3)] tracking-[0.15em] leading-relaxed overflow-hidden select-none">
          <div className="truncate">{mrzLine1}</div>
          <div className="truncate">{mrzLine2}</div>
        </div>
      </div>
    </div>
  );
}
