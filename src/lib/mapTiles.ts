import type { Language } from '@/lib/i18n/translations';

/**
 * Map tile configuration utility for language-aware basemaps.
 * 
 * Priority:
 * 1. MapTiler (if MAPTILER_API_KEY is set) - best language support
 * 2. CartoDB Positron - fallback (limited language support)
 */

// MapTiler language codes (ISO 639-1 with some variations)
const MAPTILER_LANGUAGE_MAP: Record<Language, string> = {
  'English': 'en',
  'Simplified Chinese': 'zh',
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
 * Uses MapTiler if API key is available, otherwise falls back to CartoDB.
 */
export function getTileConfig(language: Language, apiKey?: string | null): TileConfig {
  // If MapTiler API key is provided, use MapTiler with language support
  if (apiKey) {
    const langCode = MAPTILER_LANGUAGE_MAP[language] || 'en';
    return {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}&lang=${langCode}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
  }

  // Fallback to CartoDB Positron (no language control, but free and reliable)
  return {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  };
}

/**
 * Get a simplified tile config for the minimap (no labels version for cleaner look).
 */
export function getMiniMapTileConfig(language: Language, apiKey?: string | null): TileConfig {
  // If MapTiler API key is provided, use MapTiler basic style
  if (apiKey) {
    const langCode = MAPTILER_LANGUAGE_MAP[language] || 'en';
    return {
      url: `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${apiKey}&lang=${langCode}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
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
