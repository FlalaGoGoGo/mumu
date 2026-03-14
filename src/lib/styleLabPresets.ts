export interface StylePreset {
  key: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  bestFor: string;
  thumbnailEmoji: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    key: 'madame-x',
    title: 'Portrait of Madame X',
    artist: 'John Singer Sargent',
    year: '1884',
    description: 'Dramatic dark sophistication with polished brushwork',
    bestFor: 'Solo portraits',
    thumbnailEmoji: '🖤',
  },
  {
    key: 'pearl-earring',
    title: 'Girl with a Pearl Earring',
    artist: 'Johannes Vermeer',
    year: 'c. 1665',
    description: 'Luminous skin tones with delicate, intimate light',
    bestFor: 'Close-up portraits',
    thumbnailEmoji: '✨',
  },
  {
    key: 'mona-lisa',
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    year: 'c. 1503',
    description: 'Balanced Renaissance realism with subtle sfumato',
    bestFor: 'Classic portraits',
    thumbnailEmoji: '🎨',
  },
  {
    key: 'rembrandt',
    title: 'Rembrandt Self-Portrait',
    artist: 'Rembrandt van Rijn',
    year: '1660',
    description: 'Dramatic chiaroscuro with warm earth tones',
    bestFor: 'Expressive portraits',
    thumbnailEmoji: '🕯️',
  },
  {
    key: 'van-gogh',
    title: 'Van Gogh Self-Portrait',
    artist: 'Vincent van Gogh',
    year: '1889',
    description: 'Vivid brushstrokes with bold, expressive texture',
    bestFor: 'Vibrant portraits',
    thumbnailEmoji: '🌻',
  },
  {
    key: 'adele-bloch-bauer',
    title: 'Portrait of Adele Bloch-Bauer I',
    artist: 'Gustav Klimt',
    year: '1907',
    description: 'Gilded luxury with ornamental elegance',
    bestFor: 'Fashion portraits',
    thumbnailEmoji: '👑',
  },
  {
    key: 'the-kiss',
    title: 'The Kiss',
    artist: 'Gustav Klimt',
    year: '1908',
    description: 'Romantic warmth with gilded decorative patterning',
    bestFor: 'Couple portraits',
    thumbnailEmoji: '💛',
  },
  {
    key: 'birth-of-venus',
    title: 'The Birth of Venus',
    artist: 'Sandro Botticelli',
    year: 'c. 1485',
    description: 'Graceful classical beauty with a romantic palette',
    bestFor: 'Elegant portraits',
    thumbnailEmoji: '🐚',
  },
  {
    key: 'arnolfini',
    title: 'The Arnolfini Portrait',
    artist: 'Jan van Eyck',
    year: '1434',
    description: 'Rich interior atmosphere with ceremonial oil-painting detail',
    bestFor: 'Couple & formal portraits',
    thumbnailEmoji: '🪞',
  },
  {
    key: 'las-meninas',
    title: 'Las Meninas',
    artist: 'Diego Velázquez',
    year: '1656',
    description: 'Grand court portrait with layered interior space',
    bestFor: 'Group & family portraits',
    thumbnailEmoji: '🏛️',
  },
];
