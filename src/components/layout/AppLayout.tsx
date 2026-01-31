import { ReactNode } from 'react';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background parchment-texture">
      <DesktopNav />
      <MobileHeader />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
