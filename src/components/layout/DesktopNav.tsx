import { Map, Route, Stamp, Settings, Palette } from 'lucide-react';
import mumuLogo from '@/assets/mumu-logo.png';
import { NavLink } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/lib/i18n';
import { TranslationKey } from '@/lib/i18n/translations';

const navItems: { to: string; icon: React.ComponentType<{ className?: string }>; labelKey: TranslationKey }[] = [
  { to: '/', icon: Map, labelKey: 'nav.map' },
  { to: '/exhibitions', icon: Palette, labelKey: 'nav.exhibitions' },
  { to: '/plan', icon: Route, labelKey: 'nav.plan' },
  { to: '/passport', icon: Stamp, labelKey: 'nav.passport' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function DesktopNav() {
  const { t } = useLanguage();

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img 
          src={mumuLogo} 
          alt="MuMu" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">{t('app.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      <LanguageSelector variant="compact" />
    </header>
  );
}
