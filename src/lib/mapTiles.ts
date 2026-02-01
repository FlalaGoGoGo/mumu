import type { Language } from '@/lib/i18n/translations';

/**
 * Map tile configuration utility for language-aware basemaps.
 * 
 * Priority:
 * 1. Mapbox (if VITE_MAPBOX_ACCESS_TOKEN is set) - best language support
 * 2. CartoDB Voyager - fallback (limited language support)
 */

// Mapbox language codes (ISO 639-1)
const MAPBOX_LANGUAGE_MAP: Record<Language, string> = {
  'English': 'en',
  'Simplified Chinese': 'zh-Hans',
  'Traditional Chinese': 'zh-Hant',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Portuguese': 'pt',
  'Italian': 'it',
};

export interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
}

/**
 * Get the tile configuration for the given language.
 * Uses Mapbox if access token is available, otherwise falls back to CartoDB.
 */
export function getTileConfig(_language: Language, accessToken?: string | null): TileConfig {
  // If Mapbox access token is provided, use Mapbox with English labels only
  if (accessToken) {
    // Always use English for map labels regardless of app language
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${accessToken}&language=en`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    };
  }

  // Fallback to CartoDB Voyager (no language control, but free and reliable)
  return {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  };
}

/**
 * Get a simplified tile config for the minimap (lighter style for cleaner look).
 */
export function getMiniMapTileConfig(_language: Language, accessToken?: string | null): TileConfig {
  // If Mapbox access token is provided, use Mapbox light style with English labels
  if (accessToken) {
    // Always use English for map labels regardless of app language
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}&language=en`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
      maxZoom: 19,
    };
  }

  // Fallback to CartoDB Positron (lighter style for minimap)
  return {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  };
}
