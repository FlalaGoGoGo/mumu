export interface Museum {
  museum_id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  lat: number;
  lng: number;
  address: string | null;
  website_url: string | null;
  opening_hours: string | null;
  has_full_content: boolean;
  hero_image_url: string | null;
  tags: string | null;
}

export interface AicHighlight {
  artic_id: string;
  title: string;
  artist: string | null;
  year: string | null;
  image_url: string | null;
  route_1h_order: number | null;
  route_full_group: number | null;
  floor: number | null;
  gallery: number | null;
}

export interface UserVisit {
  id: string;
  museum_id: string;
  visited_at: string;
  notes: string | null;
  session_id: string;
}

export interface UserHighlightCompletion {
  id: string;
  artic_id: string;
  completed_at: string;
  session_id: string;
}
