import { useQuery } from '@tanstack/react-query';
import type { ArtworkMovement } from '@/types/movement';

function countQuotes(str: string): number {
  return (str.match(/"/g) || []).length;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
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

async function parseMovementsCSV(): Promise<ArtworkMovement[]> {
  const response = await fetch('/data/artwork_movements.csv');
  const text = await response.text();
  const lines = text.split('\n');
  if (lines.length === 0) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
  const headers = parseCSVLine(headerLine);

  const results: ArtworkMovement[] = [];
  let i = 1;
  while (i < lines.length) {
    let currentLine = lines[i];
    if (!currentLine.trim()) { i++; continue; }
    while (i < lines.length - 1 && countQuotes(currentLine) % 2 !== 0) {
      i++;
      currentLine += '\n' + lines[i];
    }
    const values = parseCSVLine(currentLine);
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => { obj[header] = values[idx] ?? ''; });
    if (obj.movement_id) results.push(obj as unknown as ArtworkMovement);
    i++;
  }
  return results;
}

export function useArtworkMovements() {
  return useQuery({
    queryKey: ['artwork-movements'],
    queryFn: parseMovementsCSV,
    staleTime: Infinity,
  });
}
