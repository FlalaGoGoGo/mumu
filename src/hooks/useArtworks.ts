import { useQuery } from '@tanstack/react-query';
import { useMuseums } from '@/hooks/useMuseums';
import type { Artist, Artwork, EnrichedArtwork } from '@/types/art';
import type { Museum } from '@/types/museum';

function countQuotes(str: string): number {
  return (str.match(/"/g) || []).length;
}

async function parseCSV<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.split('\n');
  
  if (lines.length === 0) return [];
  
  // Parse header - handle BOM character
  const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
  const headers = parseCSVLine(headerLine);
  
  const results: T[] = [];
  let i = 1;
  while (i < lines.length) {
    let currentLine = lines[i];
    if (!currentLine.trim()) { i++; continue; }

    // Handle multi-line fields (quoted strings with newlines)
    while (i < lines.length - 1 && countQuotes(currentLine) % 2 !== 0) {
      i++;
      currentLine += '\n' + lines[i];
    }

    const values = parseCSVLine(currentLine);
    const obj: Record<string, unknown> = {};
    
    headers.forEach((header, index) => {
      let value: unknown = values[index] ?? '';
      
      // Handle boolean fields
      if (header === 'on_view' || header === 'highlight') {
        value = value === 'TRUE' || value === 'true';
      }
      // Handle numeric fields
      else if (['birth_year', 'death_year', 'lat', 'lng'].includes(header)) {
        const num = parseFloat(value as string);
        value = isNaN(num) ? null : num;
      }
      
      obj[header] = value;
    });
    
    results.push(obj as T);
    i++;
  }
  
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: async (): Promise<Artist[]> => {
      return parseCSV<Artist>('/data/artists.csv');
    },
    staleTime: Infinity,
  });
}

export function useArtworksRaw() {
  return useQuery({
    queryKey: ['artworks-raw'],
    queryFn: async (): Promise<Artwork[]> => {
      const all = await parseCSV<Artwork>('/data/artworks.csv');
      // Filter out empty rows (trailing rows with no artwork_id)
      return all.filter(a => a.artwork_id && String(a.artwork_id).trim() !== '');
    },
    staleTime: Infinity,
  });
}

export function useMuseumsForArt() {
  return useMuseums();
}

export function useEnrichedArtworks() {
  const { data: artists, isLoading: artistsLoading } = useArtists();
  const { data: artworks, isLoading: artworksLoading } = useArtworksRaw();
  const { data: museums, isLoading: museumsLoading } = useMuseumsForArt();
  
  const isLoading = artistsLoading || artworksLoading || museumsLoading;
  
  const enrichedArtworks: EnrichedArtwork[] = [];
  
  if (artists && artworks && museums) {
    const artistById = new Map(artists.map(a => [a.artist_id, a]));
    const museumById = new Map(museums.map(m => [m.museum_id, m]));
    
    for (const artwork of artworks) {
      const artist = artistById.get(artwork.artist_id);
      const museum = museumById.get(artwork.museum_id);
      
      enrichedArtworks.push({
        ...artwork,
        artist_name: artist?.artist_name || 'Unknown Artist',
        artist_portrait_url: artist?.portrait_url || null,
        museum_name: museum?.name || 'Unknown Museum',
        museum_address: museum?.address || null,
        museum_lat: museum?.lat || 0,
        museum_lng: museum?.lng || 0,
      });
    }
  }
  
  return {
    data: enrichedArtworks,
    artists: artists || [],
    museums: museums || [],
    isLoading,
  };
}
