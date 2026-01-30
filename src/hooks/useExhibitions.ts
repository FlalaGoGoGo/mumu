import { useQuery } from '@tanstack/react-query';
import type { Exhibition, ExhibitionRaw } from '@/types/exhibition';
import { parseExhibition } from '@/types/exhibition';

function parseCSV(csvText: string): ExhibitionRaw[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Remove BOM if present and parse headers
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

async function fetchExhibitions(): Promise<Exhibition[]> {
  const response = await fetch('/data/exhibitions.csv');
  if (!response.ok) {
    throw new Error('Failed to load exhibitions');
  }

  const csvText = await response.text();
  const rawExhibitions = parseCSV(csvText);
  return rawExhibitions.map(parseExhibition);
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
