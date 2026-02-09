import { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink, Navigation, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MuseumConfig } from '@/config/museumConfig';

// Social icon SVGs as tiny components
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function XiaohongshuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 14h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v7a.5.5 0 01-.5.5z" />
    </svg>
  );
}

interface MuseumDetailHeaderProps {
  config: MuseumConfig;
}

export function MuseumDetailHeader({ config }: MuseumDetailHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const fullAddress = config.country
    ? `${config.address}, ${config.country}`
    : config.address;

  const socialLinks = [
    {
      key: 'website',
      url: config.socialLinks.websiteUrl,
      icon: <ExternalLink className="h-4 w-4" />,
      label: 'Official Website',
    },
    {
      key: 'instagram',
      url: config.socialLinks.instagramUrl,
      icon: <InstagramIcon className="h-4 w-4" />,
      label: 'Instagram',
    },
    {
      key: 'x',
      url: config.socialLinks.xUrl,
      icon: <XIcon className="h-4 w-4" />,
      label: 'X (Twitter)',
    },
    {
      key: 'xiaohongshu',
      url: config.socialLinks.xiaohongshuUrl,
      icon: <XiaohongshuIcon className="h-4 w-4" />,
      label: 'Xiaohongshu',
    },
  ].filter((s) => !!s.url);

  return (
    <>
      {/* Sentinel element for sticky detection */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />

      <div
        className={cn(
          'sticky top-0 z-[1500] border-b border-border transition-all duration-200',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
          isSticky && 'shadow-sm'
        )}
      >
        <div className="container max-w-6xl">
          <div
            className={cn(
              'flex items-center gap-4 transition-all duration-200',
              isSticky ? 'py-2.5' : 'py-5'
            )}
          >
            {/* Logo */}
            <div
              className={cn(
                'flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center transition-all duration-200',
                isSticky ? 'h-10 w-10' : 'h-14 w-14'
              )}
            >
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={`${config.name} logo`}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Landmark className={cn('text-muted-foreground', isSticky ? 'h-5 w-5' : 'h-7 w-7')} />
              )}
            </div>

            {/* Name + Address */}
            <div className="flex-1 min-w-0">
              <h1
                className={cn(
                  'font-display font-bold text-foreground truncate transition-all duration-200',
                  isSticky ? 'text-lg' : 'text-2xl md:text-3xl'
                )}
              >
                {config.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{fullAddress}</span>
              </p>
            </div>

            {/* Social Icons + Open in Maps */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <TooltipProvider delayDuration={200}>
                {socialLinks.map((link) => (
                  <Tooltip key={link.key}>
                    <TooltipTrigger asChild>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'inline-flex items-center justify-center rounded-full border border-border',
                          'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground',
                          'transition-colors',
                          isSticky ? 'h-8 w-8' : 'h-9 w-9'
                        )}
                        aria-label={link.label}
                      >
                        {link.icon}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{link.label}</TooltipContent>
                  </Tooltip>
                ))}

                {/* Open in Maps button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={config.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center justify-center rounded-full border border-border',
                        'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground',
                        'transition-colors',
                        isSticky ? 'h-8 w-8' : 'h-9 w-9'
                      )}
                      aria-label="Open in Maps"
                    >
                      <Navigation className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Open in Maps</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
