import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebMCP } from 'use-webmcp-tool';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { runWebMCPTool } from '@/lib/webmcp-telemetry';

interface AppLayoutProps {
  children: ReactNode;
}

const SECTIONS: Record<string, string> = {
  museums: '/',
  art: '/art',
  exhibitions: '/exhibitions',
  shop: '/shop',
  passport: '/passport',
  settings: '/settings',
  plan: '/plan',
};

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();

  useWebMCP({
    name: 'open_section',
    description: 'Open a main MuMu section: museums, art, exhibitions, shop, passport, settings, or plan.',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: Object.keys(SECTIONS), description: 'Section to open.' },
      },
      required: ['section'],
    },
    execute: ({ section }: { section: string }) =>
      runWebMCPTool('open_section', () => {
        const path = typeof section === 'string' ? SECTIONS[section] : undefined;
        if (!path) throw new Error(`Unknown section; expected one of ${Object.keys(SECTIONS).join(', ')}.`);
        navigate(path);
        return `Opened ${section}.`;
      }),
  });

  useWebMCP({
    name: 'open_museum',
    description: 'Open a museum detail page by its museum_id (e.g. art-institute-of-chicago-us).',
    inputSchema: {
      type: 'object',
      properties: { museum_id: { type: 'string', description: 'Canonical museum id.' } },
      required: ['museum_id'],
    },
    execute: ({ museum_id }: { museum_id: string }) =>
      runWebMCPTool('open_museum', () => {
        if (typeof museum_id !== 'string' || !/^[a-z0-9-]+$/.test(museum_id)) throw new Error('Invalid museum_id.');
        navigate(`/museum/${museum_id}`);
        return 'Opened museum page.';
      }),
  });

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
