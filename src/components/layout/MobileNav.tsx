import { Map, Route, Stamp, Settings, Palette } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { TranslationKey } from '@/lib/i18n/translations';

const navItems: { to: string; icon: React.ComponentType<{ className?: string }>; labelKey: TranslationKey }[] = [
  { to: '/', icon: Map, labelKey: 'nav.map' },
  { to: '/exhibitions', icon: Palette, labelKey: 'nav.exhibitions' },
  { to: '/plan', icon: Route, labelKey: 'nav.plan' },
  { to: '/passport', icon: Stamp, labelKey: 'nav.passport' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function MobileNav() {
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-sm transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
