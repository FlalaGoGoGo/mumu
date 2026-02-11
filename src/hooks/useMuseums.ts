import { useQuery } from '@tanstack/react-query';
import type { Museum } from '@/types/museum';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchMuseumsFromCSV(): Promise<Museum[]> {
  const response = await fetch('/data/museums.csv');
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);

  const museums: Museum[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      let value: unknown = values[index] ?? '';

      // Map the CSV typo "hightlight" to "highlight"
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
      museums.push(obj as unknown as Museum);
    }
  }

  return museums.sort((a, b) => a.name.localeCompare(b.name));
}

export function useMuseums() {
  return useQuery({
    queryKey: ['museums'],
    queryFn: fetchMuseumsFromCSV,
    staleTime: Infinity,
  });
}

export function useMuseum(museumId: string | null) {
  const { data: museums, isLoading, error } = useMuseums();

  return {
    data: museums?.find(m => m.museum_id === museumId) || null,
    isLoading,
    error,
  };
}
