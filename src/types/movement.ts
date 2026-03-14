export interface ArtworkMovement {
  movement_id: string;
  artwork_id: string;
  artist_id: string;
  artwork_title: string;
  lender_museum_id: string;
  borrower_museum_id: string;
  movement_type: string;
  start_date: string;
  end_date: string;
  date_basis: string;
  related_exhibition_name: string;
  related_exhibition_url: string;
  source_type: string;
  source_title: string;
  source_url: string;
  source_date: string;
  confidence: string;
  notes: string;
  last_verified_at: string;
}

export type MobilityResearchStatus =
  | 'HAS_MOVEMENT_EVENTS'
  | 'NO_CONFIRMED_MOVEMENT'
  | 'AMBIGUOUS_SOURCE_NEEDS_REVIEW'
  | 'NOT_RESEARCHED';

export interface MuseumFlowStats {
  museum_id: string;
  museum_name: string;
  lat: number;
  lng: number;
  inflow_count: number;
  outflow_count: number;
  net_flow: number;
  top_artworks: { artwork_id: string; title: string }[];
}
