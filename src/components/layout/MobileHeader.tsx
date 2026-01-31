import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/i18n/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import mumuLogo from '@/assets/mumu-logo.png';

export function MobileHeader() {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img 
          src={mumuLogo} 
          alt="MuMu" 
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">{t('app.title')}</h1>
        </div>
      </div>

      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{currentLang?.nativeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuItem 
              key={lang.code} 
              onClick={() => setLanguage(lang.code as Language)}
              className={language === lang.code ? 'bg-accent' : ''}
            >
              <span>{lang.nativeLabel}</span>
              {lang.nativeLabel !== lang.label && (
                <span className="text-muted-foreground text-xs ml-2">({lang.label})</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
