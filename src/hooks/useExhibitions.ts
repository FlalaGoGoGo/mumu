import { useQuery } from '@tanstack/react-query';
import type { Exhibition, ExhibitionRaw } from '@/types/exhibition';
import { parseExhibition } from '@/types/exhibition';
import type { Museum } from '@/types/museum';

function parseCSV(csvText: string): ExhibitionRaw[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);

  const exhibitions: ExhibitionRaw[] = [];
  let i = 1;

  while (i < lines.length) {
    let currentLine = lines[i];

    // Handle multi-line fields (quoted strings with newlines)
    while (i < lines.length - 1 && countQuotes(currentLine) % 2 !== 0) {
      i++;
      currentLine += '\n' + lines[i];
    }

    const values = parseCSVLine(currentLine);

    if (values.length >= headers.length) {
      const exhibition: Record<string, string> = {};
      headers.forEach((header, index) => {
        exhibition[header.trim()] = (values[index] || '').trim();
      });

      exhibitions.push(exhibition as unknown as ExhibitionRaw);
    }

    i++;
  }

  return exhibitions;
}

function countQuotes(str: string): number {
  return (str.match(/"/g) || []).length;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseMuseumsCSVLine(line: string): string[] {
  return parseCSVLine(line);
}

async function fetchMuseumsMap(): Promise<Map<string, Museum>> {
  const response = await fetch('/data/museums.csv');
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return new Map();

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseMuseumsCSVLine(headerLine);
  const map = new Map<string, Museum>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseMuseumsCSVLine(lines[i]);
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      let value: unknown = values[index] ?? '';
      const key = header === 'hightlight' ? 'highlight' : header;
      if (key === 'has_full_content' || key === 'highlight') {
        value = value === 'TRUE' || value === 'true';
      } else if (key === 'lat' || key === 'lng') {
        const num = parseFloat(value as string);
        value = isNaN(num) ? 0 : num;
      }
      obj[key] = value;
    });
    if (obj.museum_id) {
      map.set(obj.museum_id as string, obj as unknown as Museum);
    }
  }

  return map;
}

async function fetchExhibitions(): Promise<Exhibition[]> {
  const [exhibitionResponse, museumMap] = await Promise.all([
    fetch('/data/exhibitions.csv'),
    fetchMuseumsMap(),
  ]);

  if (!exhibitionResponse.ok) {
    throw new Error('Failed to load exhibitions');
  }

  const csvText = await exhibitionResponse.text();
  const rawExhibitions = parseCSV(csvText);

  return rawExhibitions.map(raw => {
    const exhibition = parseExhibition(raw);
    // Enrich with museum data
    const museum = museumMap.get(exhibition.museum_id);
    if (museum) {
      exhibition.museum_name = museum.name;
      exhibition.city = museum.city;
      exhibition.state = museum.state || '';
    } else {
      exhibition.museum_name = 'Unknown Museum';
      exhibition.city = '';
      exhibition.state = '';
    }
    return exhibition;
  });
}

export function useExhibitions() {
  return useQuery({
    queryKey: ['exhibitions'],
    queryFn: fetchExhibitions,
  });
}

export function useExhibition(exhibitionId: string | null) {
  const { data: exhibitions, isLoading, error } = useExhibitions();

  return {
    data: exhibitions?.find((e) => e.exhibition_id === exhibitionId) || null,
    isLoading,
    error,
  };
}
