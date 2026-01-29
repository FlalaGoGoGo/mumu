import { Map, Route, Stamp, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/plan', icon: Route, label: 'Plan' },
  { to: '/passport', icon: Stamp, label: 'Passport' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function DesktopNav() {
  return (
    <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <span className="font-display text-lg font-bold text-primary-foreground">M</span>
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">MuMu</h1>
          <p className="text-xs text-muted-foreground">Museum Guide</p>
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
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
