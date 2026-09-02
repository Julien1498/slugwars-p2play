export interface HatDefinition {
  id: string;
  name: string;
}

export const HATS: readonly HatDefinition[] = [
  { id: 'military', name: 'Béret Militaire' },
  { id: 'cowboy', name: 'Stetson Cowboy' },
  { id: 'bandana', name: 'Bandeau Commando' },
  { id: 'cyber', name: 'Visière Cybernétique' },
  { id: 'crown', name: 'Couronne Royale' },
  { id: 'pirate', name: 'Tricorne Pirate' },
  { id: 'tophat', name: 'Haut-de-forme' },
  { id: 'ninja', name: 'Bandeau Ninja' },
  { id: 'viking', name: 'Casque Viking' },
  { id: 'sombrero', name: 'Sombrero' },
  { id: 'none', name: 'Aucun (Tête nue)' },
] as const;

export const DEFAULT_HATS_BY_INDEX: readonly string[] = [
  'military',
  'bandana',
  'cyber',
  'cowboy',
  'crown',
  'pirate',
];

export function getHat(id?: string | null): HatDefinition {
  if (!id) return HATS[0];
  const found = HATS.find((h) => h.id === id);
  return found || HATS[0];
}

export function getDefaultHatForTeam(teamIndex: number): string {
  return DEFAULT_HATS_BY_INDEX[teamIndex % DEFAULT_HATS_BY_INDEX.length] || 'military';
}
