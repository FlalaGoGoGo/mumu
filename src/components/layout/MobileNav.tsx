import { Map, Route, Stamp, Settings, Palette } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/exhibitions', icon: Palette, label: 'Exhibitions' },
  { to: '/plan', icon: Route, label: 'Plan' },
  { to: '/passport', icon: Stamp, label: 'Passport' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
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
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
