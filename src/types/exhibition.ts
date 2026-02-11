export interface ExhibitionRaw {
  exhibition_id: string;
  museum_id: string;
  exhibition_name: string;
  cover_image_url: string;
  start_date: string;
  end_date: string;
  official_url: string;
  short_description: string;
  related_artworks: string;
}

export type ExhibitionStatus = 'Ongoing' | 'Upcoming' | 'Past' | 'TBD';

export interface Exhibition extends Omit<ExhibitionRaw, 'start_date' | 'end_date' | 'related_artworks'> {
  start_date: Date | null;
  end_date: Date | null;
  status: ExhibitionStatus;
  date_label: string;
  related_artwork_ids: string[];
  /** Populated from museums lookup */
  museum_name: string;
  city: string;
  state: string;
}

export function computeExhibitionStatus(
  startDate: Date | null,
  endDate: Date | null,
  today: Date = new Date()
): ExhibitionStatus {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (startDate && endDate) {
    if (todayStart < startDate) return 'Upcoming';
    if (todayStart > endDate) return 'Past';
    return 'Ongoing';
  }

  if (startDate && !endDate) {
    if (todayStart < startDate) return 'Upcoming';
    return 'Ongoing';
  }

  if (!startDate && endDate) {
    if (todayStart <= endDate) return 'Ongoing';
    return 'Past';
  }

  return 'TBD';
}

export function computeDateLabel(startDate: Date | null, endDate: Date | null): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (startDate && endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }

  if (startDate && !endDate) {
    return `From ${formatDate(startDate)}`;
  }

  if (!startDate && endDate) {
    return `Until ${formatDate(endDate)}`;
  }

  return 'Dates TBD';
}

export function parseRelatedArtworks(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) return [];
  return raw.split('|').map(id => id.trim()).filter(Boolean);
}

export function parseExhibition(raw: ExhibitionRaw): Exhibition {
  const startDate = raw.start_date ? new Date(raw.start_date) : null;
  const endDate = raw.end_date ? new Date(raw.end_date) : null;
  const { related_artworks, ...rest } = raw;

  return {
    ...rest,
    start_date: startDate,
    end_date: endDate,
    status: computeExhibitionStatus(startDate, endDate),
    date_label: computeDateLabel(startDate, endDate),
    related_artwork_ids: parseRelatedArtworks(related_artworks),
    // Will be populated from museum lookup
    museum_name: '',
    city: '',
    state: '',
  };
}
