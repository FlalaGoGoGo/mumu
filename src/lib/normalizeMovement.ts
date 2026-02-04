/**
 * Normalize movement names to avoid duplicates and fix typos
 */
const MOVEMENT_NORMALIZATIONS: Record<string, string> = {
  'High Renaissanc': 'High Renaissance',
  'high renaissance': 'High Renaissance',
  'POST-IMPRESSIONISM': 'Post-Impressionism',
  'post-impressionism': 'Post-Impressionism',
  'POST-Impressionism': 'Post-Impressionism',
  'IMPRESSIONISM': 'Impressionism',
  'impressionism': 'Impressionism',
  'CUBISM': 'Cubism',
  'cubism': 'Cubism',
  'BAROQUE': 'Baroque',
  'baroque': 'Baroque',
  'ROMANTICISM': 'Romanticism',
  'romanticism': 'Romanticism',
  'REALISM': 'Realism',
  'realism': 'Realism',
  'ROCOCO': 'Rococo',
  'rococo': 'Rococo',
  'FAUVISM': 'Fauvism',
  'fauvism': 'Fauvism',
  'EXPRESSIONISM': 'Expressionism',
  'expressionism': 'Expressionism',
  'SYMBOLISM': 'Symbolism',
  'symbolism': 'Symbolism',
  'De stijl': 'De Stijl',
  'de stijl': 'De Stijl',
  'DE STIJL': 'De Stijl',
  'dutch golden age': 'Dutch Golden Age',
  'DUTCH GOLDEN AGE': 'Dutch Golden Age',
  'barbizon school': 'Barbizon School',
  'BARBIZON SCHOOL': 'Barbizon School',
  'northern renaissance': 'Northern Renaissance',
  'NORTHERN RENAISSANCE': 'Northern Renaissance',
};

export function normalizeMovement(movement: string): string {
  const trimmed = movement.trim();
  return MOVEMENT_NORMALIZATIONS[trimmed] || trimmed;
}

/**
 * Parse movement string (can contain multiple movements separated by |)
 * Returns array of normalized movement names
 */
export function parseMovements(movementStr: string | undefined | null): string[] {
  if (!movementStr || typeof movementStr !== 'string') {
    return [];
  }

  return movementStr
    .split('|')
    .map(m => normalizeMovement(m))
    .filter(m => m.length > 0);
}
