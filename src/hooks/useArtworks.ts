import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Artist, Artwork, EnrichedArtwork } from '@/types/art';
import type { Museum } from '@/types/museum';

async function parseCSV<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  // Parse header - handle BOM character
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);
  
  const results: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, unknown> = {};
    
    headers.forEach((header, index) => {
      let value: unknown = values[index] ?? '';
      
      // Handle boolean fields
      if (header === 'on_view') {
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
      return parseCSV<Artwork>('/data/artworks.csv');
    },
    staleTime: Infinity,
  });
}

export function useMuseumsForArt() {
  return useQuery({
    queryKey: ['museums'],
    queryFn: async (): Promise<Museum[]> => {
      const { data, error } = await supabase
        .from('museums')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
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
      
      if (artist && museum) {
        enrichedArtworks.push({
          ...artwork,
          artist_name: artist.artist_name,
          artist_portrait_url: artist.portrait_url,
          museum_name: museum.name,
          museum_address: museum.address,
          museum_lat: museum.lat,
          museum_lng: museum.lng,
        });
      }
    }
  }
  
  return {
    data: enrichedArtworks,
    artists: artists || [],
    museums: museums || [],
    isLoading,
  };
}
