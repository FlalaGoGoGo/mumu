import { useState, useEffect } from 'react';
import type {
  MuseumDetailOverview,
  ArtworkRef,
  ExhibitionRef,
  TicketRecommendation,
  RoutePlan,
  KnowledgeContent,
} from '@/types/museumDetail';

interface MuseumDetailData {
  overview: MuseumDetailOverview;
  artworks: ArtworkRef[];
  exhibitions: ExhibitionRef[];
  ticketRecommendation: TicketRecommendation;
  routePlan: RoutePlan;
  knowledge: KnowledgeContent;
}

/**
 * Resolves museum detail data.
 * For the AIC prototype, loads from the seed JSON.
 * Future museums will use API/DB resolution.
 */
export function useMuseumDetail(museumId: string | undefined) {
  const [data, setData] = useState<MuseumDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!museumId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // For AIC prototype, load the seed data
        if (museumId === 'art-institute-of-chicago-us') {
          const res = await fetch('/data/aic_seed.json');
          if (!res.ok) throw new Error('Failed to load seed data');
          const seed = await res.json();

          if (cancelled) return;

          const knowledge = buildKnowledgeFromSeed(seed);

          setData({
            overview: seed.museumOverview,
            artworks: seed.artworks || [],
            exhibitions: seed.exhibitions || [],
            ticketRecommendation: seed.sampleTicketRecommendation,
            routePlan: seed.sampleRoutePlan,
            knowledge,
          });
        } else {
          // Future: resolve from DB/API
          setError('Museum detail not available yet');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load museum data');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [museumId]);

  return { data, isLoading, error };
}

function buildKnowledgeFromSeed(seed: any): KnowledgeContent {
  return {
    family: {
      items: [
        { title: 'Ryan Learning Center', description: 'Free drop-in activities for families in the Modern Wing, no registration needed.' },
        { title: 'Strollers', description: 'Single and double strollers are welcome in most galleries. Oversized strollers must be checked.' },
        { title: 'Infant Care', description: 'Nursing rooms and changing stations are available near the Family entrance and lower level.' },
        { title: 'Family Restrooms', description: 'Family-accessible restrooms are located on multiple floors.' },
      ],
      citations: seed.museumOverview?.citations?.filter((c: any) => c.id === 'visit-main') || [],
    },
    accessibility: {
      items: [
        { title: 'Wheelchairs', description: 'Free wheelchairs are available at both entrances on a first-come, first-served basis.' },
        { title: 'Service Animals', description: 'Service animals are welcome throughout the museum.' },
        { title: 'Elevators', description: 'Elevators are available in the main building and the Modern Wing for all floors.' },
        { title: 'Accessible Entrances', description: 'Both the Michigan Avenue and Modern Wing entrances are fully accessible.' },
      ],
      citations: seed.museumOverview?.citations?.filter((c: any) => c.id === 'accessibility') || [],
    },
    dining: {
      venues: [
        { name: 'Terzo Piano', description: 'Full-service restaurant in the Modern Wing with Italian-inspired seasonal cuisine.', location: 'Modern Wing, 3rd Floor' },
        { name: 'Café Moderno', description: 'Counter-service café with sandwiches, salads, and pastries.', location: 'Modern Wing, Lower Level' },
        { name: 'Modern Bar', description: 'Wine, beer, and light snacks with gallery views.', location: 'Modern Wing, 2nd Floor' },
      ],
      citations: seed.museumOverview?.citations?.filter((c: any) => c.id === 'dining-shopping') || [],
    },
    quietSpaces: {
      tips: [
        'The lower-level galleries and Asian art wing tend to be quieter, especially on weekdays.',
        'Benches are placed throughout most galleries for resting.',
        'The Bluhm Family Terrace (seasonal, Modern Wing) offers a quiet outdoor option.',
      ],
      citations: [],
    },
    shop: {
      shops: [
        { name: 'Museum Shop', description: 'Main shop near the Michigan Avenue entrance with books, prints, and gifts.' },
        { name: 'Modern Shop', description: 'Design-focused shop in the Modern Wing with contemporary items.' },
      ],
      citations: seed.museumOverview?.citations?.filter((c: any) => c.id === 'dining-shopping') || [],
    },
    knowBeforeYouGo: {
      policies: [
        { title: 'Bag Policy', description: 'Bags larger than 13 × 17 × 4 inches are not permitted in galleries and must be checked for free.' },
        { title: 'Photography', description: 'Non-flash photography for personal use is generally permitted. No tripods or selfie sticks.' },
        { title: 'Water Bottles', description: 'Sealed water bottles are allowed. No other food or drinks in galleries.' },
        { title: 'Coat Check', description: 'Free checkroom service is available at both entrances.' },
        { title: 'Member-Only Hour', description: 'The first hour of every open day (10–11 AM) is reserved for member-only viewing.' },
      ],
      citations: seed.museumOverview?.citations?.filter((c: any) => c.id === 'visitor-policies') || [],
    },
  };
}
