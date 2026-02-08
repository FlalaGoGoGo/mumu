import { useMemo } from 'react';
import { useUserEvents, useAddEvent, useRemoveEvent, type UserEvent } from './useUserEvents';
import { useMuseums } from './useMuseums';
import { useEnrichedArtworks } from './useArtworks';
import { useExhibitions } from './useExhibitions';
import type { Museum } from '@/types/museum';
import type { EnrichedArtwork } from '@/types/art';
import type { Exhibition } from '@/types/exhibition';

export type MuseumStatus = 'planned' | 'visited' | 'completed';
export type ArtworkStatus = 'planned' | 'seen' | 'completed';
export type ExhibitionPassportStatus = 'planned' | 'attended' | 'completed';

export interface PassportMuseum {
  museum: Museum;
  status: MuseumStatus;
  wishDate?: string;
  visitDate?: string;
  artworkCount: number;
  latestEventDate: string;
}

export interface PassportArtwork {
  artwork: EnrichedArtwork;
  status: ArtworkStatus;
  wishDate?: string;
  seenDate?: string;
  latestEventDate: string;
}

export interface PassportExhibition {
  exhibition: Exhibition;
  status: ExhibitionPassportStatus;
  wishDate?: string;
  attendedDate?: string;
  latestEventDate: string;
}

function latestDate(dates: string[]): string {
  return dates
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || '';
}

export function usePassportData() {
  const { data: events = [], isLoading: eventsLoading } = useUserEvents();
  const { data: museums = [] } = useMuseums();
  const { data: enrichedArtworks = [] } = useEnrichedArtworks();
  const { data: exhibitions = [] } = useExhibitions();
  const addEvent = useAddEvent();
  const removeEvent = useRemoveEvent();

  const museumMap = useMemo(() => new Map(museums.map(m => [m.museum_id, m])), [museums]);
  const artworkMap = useMemo(() => new Map(enrichedArtworks.map(a => [a.artwork_id, a])), [enrichedArtworks]);
  const exhibitionMap = useMemo(() => new Map((exhibitions || []).map(e => [e.exhibition_id, e])), [exhibitions]);

  // Group events by item
  const groupedEvents = useMemo(() => {
    const museumEvts = new Map<string, { wishes: UserEvent[]; visits: UserEvent[] }>();
    const artworkEvts = new Map<string, { wishes: UserEvent[]; seen: UserEvent[] }>();
    const exhibitionEvts = new Map<string, { wishes: UserEvent[]; attended: UserEvent[] }>();
    const artworksByMuseum = new Map<string, number>();

    events.forEach(e => {
      if (e.item_type === 'museum') {
        const existing = museumEvts.get(e.item_id) || { wishes: [], visits: [] };
        if (e.event_type === 'wishlist_add') existing.wishes.push(e);
        if (e.event_type === 'visit_museum') existing.visits.push(e);
        museumEvts.set(e.item_id, existing);
      } else if (e.item_type === 'artwork') {
        const existing = artworkEvts.get(e.item_id) || { wishes: [], seen: [] };
        if (e.event_type === 'wishlist_add') existing.wishes.push(e);
        if (e.event_type === 'see_artwork') existing.seen.push(e);
        artworkEvts.set(e.item_id, existing);
        if (e.event_type === 'see_artwork') {
          const artwork = artworkMap.get(e.item_id);
          if (artwork) {
            artworksByMuseum.set(artwork.museum_id, (artworksByMuseum.get(artwork.museum_id) || 0) + 1);
          }
        }
      } else if (e.item_type === 'exhibition') {
        const existing = exhibitionEvts.get(e.item_id) || { wishes: [], attended: [] };
        if (e.event_type === 'wishlist_add') existing.wishes.push(e);
        if (e.event_type === 'attend_exhibition') existing.attended.push(e);
        exhibitionEvts.set(e.item_id, existing);
      }
    });

    return { museumEvts, artworkEvts, exhibitionEvts, artworksByMuseum };
  }, [events, artworkMap]);

  // Derive museum statuses
  const passportMuseums = useMemo(() => {
    const result: PassportMuseum[] = [];
    groupedEvents.museumEvts.forEach((data, museumId) => {
      const museum = museumMap.get(museumId);
      if (!museum) return;

      const hasWish = data.wishes.length > 0;
      const hasVisit = data.visits.length > 0;
      let status: MuseumStatus;
      if (hasWish && hasVisit) status = 'completed';
      else if (hasVisit) status = 'visited';
      else status = 'planned';

      const visitDates = data.visits.map(v => v.event_date).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
      );

      result.push({
        museum,
        status,
        wishDate: data.wishes[0]?.event_date,
        visitDate: visitDates[0],
        artworkCount: groupedEvents.artworksByMuseum.get(museumId) || 0,
        latestEventDate: latestDate([
          ...data.wishes.map(w => w.event_date),
          ...data.visits.map(v => v.event_date),
        ]),
      });
    });
    return result;
  }, [groupedEvents, museumMap]);

  // Derive artwork statuses
  const passportArtworks = useMemo(() => {
    const result: PassportArtwork[] = [];
    groupedEvents.artworkEvts.forEach((data, artworkId) => {
      const artwork = artworkMap.get(artworkId);
      if (!artwork) return;

      const hasWish = data.wishes.length > 0;
      const hasSeen = data.seen.length > 0;
      let status: ArtworkStatus;
      if (hasWish && hasSeen) status = 'completed';
      else if (hasSeen) status = 'seen';
      else status = 'planned';

      result.push({
        artwork,
        status,
        wishDate: data.wishes[0]?.event_date,
        seenDate: data.seen[0]?.event_date,
        latestEventDate: latestDate([
          ...data.wishes.map(w => w.event_date),
          ...data.seen.map(s => s.event_date),
        ]),
      });
    });
    return result;
  }, [groupedEvents, artworkMap]);

  // Derive exhibition statuses
  const passportExhibitions = useMemo(() => {
    const result: PassportExhibition[] = [];
    groupedEvents.exhibitionEvts.forEach((data, exhibitionId) => {
      const exhibition = exhibitionMap.get(exhibitionId);
      if (!exhibition) return;

      const hasWish = data.wishes.length > 0;
      const hasAttended = data.attended.length > 0;
      let status: ExhibitionPassportStatus;
      if (hasWish && hasAttended) status = 'completed';
      else if (hasAttended) status = 'attended';
      else status = 'planned';

      result.push({
        exhibition,
        status,
        wishDate: data.wishes[0]?.event_date,
        attendedDate: data.attended[0]?.event_date,
        latestEventDate: latestDate([
          ...data.wishes.map(w => w.event_date),
          ...data.attended.map(a => a.event_date),
        ]),
      });
    });
    return result;
  }, [groupedEvents, exhibitionMap]);

  // Available years from events
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    events.forEach(e => {
      const year = new Date(e.event_date).getFullYear();
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [events]);

  // Countries from visited museums
  const countries = useMemo(() => {
    const visited = passportMuseums.filter(m => m.status === 'visited' || m.status === 'completed');
    const set = new Set(visited.map(m => m.museum.country));
    return Array.from(set).sort();
  }, [passportMuseums]);

  return {
    passportMuseums,
    passportArtworks,
    passportExhibitions,
    countries,
    availableYears,
    isLoading: eventsLoading,
    addEvent,
    removeEvent,
  };
}
