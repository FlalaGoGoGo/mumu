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
  description: string;
  museum_id: string;
  medium: string;
  dimensions: string;
  museum_page_url: string;
  on_view: boolean;
}

export interface EnrichedArtwork extends Artwork {
  artist_name: string;
  artist_portrait_url: string | null;
  museum_name: string;
  museum_address: string | null;
  museum_lat: number;
  museum_lng: number;
}
