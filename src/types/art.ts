export interface Artist {
  artist_id: string;
  artist_name: string;
  bio: string;
  portrait_url: string | null;
  nationality: string;
  birth_year: number | null;
  death_year: number | null;
  movement: string;
  notable_works: string;
  wiki_url: string | null;
}

export interface Artwork {
  artwork_id: string;
  title: string;
  artist_id: string;
  art_type: string;
  year: string;
  image_url: string;
  image_cached_url?: string;
  description: string;
  museum_id: string;
  medium: string;
  dimensions: string;
  museum_page_url: string;
  on_view: boolean;
  highlight: boolean;
}

export interface EnrichedArtwork extends Artwork {
  artist_name: string;
  artist_portrait_url: string | null;
  museum_name: string;
  museum_address: string | null;
  museum_lat: number;
  museum_lng: number;
}

// Helper to get the best available image URL for an artwork
export function getArtworkImageUrl(artwork: { image_cached_url?: string; image_url?: string }): string | null {
  // Prefer cached URL, fall back to source URL
  if (artwork.image_cached_url && artwork.image_cached_url.trim()) {
    return artwork.image_cached_url;
  }
  if (artwork.image_url && artwork.image_url.trim()) {
    return artwork.image_url;
  }
  return null;
}

// Check if artwork has a cached image (reliable for Has Image filter)
export function hasReliableImage(artwork: { image_cached_url?: string }): boolean {
  return !!(artwork.image_cached_url && artwork.image_cached_url.trim());
}
