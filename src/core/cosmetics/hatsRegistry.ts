export interface HatDefinition {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export const HATS: readonly HatDefinition[] = [
  { id: 'military', name: 'Béret Militaire', icon: '??', desc: "Casquette d'officier avec galon doré" },
  { id: 'cowboy', name: 'Stetson Cowboy', icon: '??', desc: 'Chapeau de shérif en cuir avec étoile' },
  { id: 'bandana', name: 'Bandeau Commando', icon: '??', desc: 'Bandeau rouge de guérilla flottant au vent' },
  { id: 'cyber', name: 'Visière Cybernétique', icon: '??', desc: 'Lunettes HUD tactiques à verres néon' },
  { id: 'crown', name: 'Couronne Royale', icon: '??', desc: 'Couronne dorée sertie de rubis' },
  { id: 'pirate', name: 'Tricorne Pirate', icon: '?????', desc: 'Chapeau de flibustier avec emblème tête de mort' },
  { id: 'tophat', name: 'Haut-de-forme', icon: '??', desc: 'Haut-de-forme rétro victorien élégant' },
  { id: 'ninja', name: 'Bandeau Ninja', icon: '??', desc: 'Bandeau noir de shinobi avec rubans' },
  { id: 'viking', name: 'Casque Viking', icon: '??', desc: 'Casque en fer forgé avec cornes' },
  { id: 'sombrero', name: 'Sombrero', icon: '??', desc: 'Large chapeau mexicain festif' },
  { id: 'none', name: 'Aucun', icon: '??', desc: 'Tête nue' },
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
