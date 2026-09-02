export interface HatDefinition {
  id: string;
  name: string;
}

export const HATS: readonly HatDefinition[] = [
  // Classiques & Historiques
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

  // Métiers & Fantaisie
  { id: 'chef', name: 'Toque de Chef' },
  { id: 'wizard', name: 'Chapeau de Mage' },
  { id: 'hard_hat', name: 'Casque de Chantier' },
  { id: 'detective', name: 'Fedora Détective' },

  // Absurde & Fun
  { id: 'snorkel', name: 'Masque & Tuba' },
  { id: 'duck', name: 'Caneton de Bain' },
  { id: 'propeller', name: 'Casquette à Hélice' },
  { id: 'arrow', name: 'Flèche Traversante' },
  { id: 'colander', name: 'Passoire en Inox' },

  // Tactique, Combat & Sci-Fi
  { id: 'astronaut', name: "Bulle d'Astronaute" },
  { id: 'gas_mask', name: 'Masque à Gaz' },
  { id: 'boxer', name: 'Casque de Boxe' },
  { id: 'camo_helmet', name: 'Casque Filet Camo' },

  // Nature & Animaux
  { id: 'mushroom', name: 'Chapeau Champignon' },
  { id: 'frog', name: 'Bonnet Grenouille' },
  { id: 'unicorn', name: 'Corne de Licorne' },

  // Parodies & Légendes Culte
  { id: 'swamp_ears', name: 'Trompes du Marais' },
  { id: 'feline_plume', name: 'Feutre du Matou Mousquetaire' },
  { id: 'mini_coronet', name: 'Mini-Couronne Tyran' },
  { id: 'patriot_helmet', name: 'Casque du Super-Patriote' },
  { id: 'titanium_mask', name: 'Masque de Titane Doré' },
  { id: 'mischief_horns', name: 'Cornes de la Malice' },
  { id: 'thunder_wings', name: 'Ailes du Dieu du Tonnerre' },
  { id: 'supersonic_quills', name: 'Pointes Supersoniques' },
  { id: 'twinfox_ears', name: 'Oreilles de Renard Turbo' },
  { id: 'mad_scientist', name: 'Bacchantes du Savant Fou' },
  { id: 'village_headband', name: 'Bandeau du Village Caché' },
  { id: 'super_shinobi_hair', name: 'Tignasse Démon Renard' },
  { id: 'renegade_straw', name: 'Paille des Déserteurs' },
  { id: 'shadow_mask', name: 'Masque des Forces Secrètes' },
  { id: 'bandit_balaclava', name: 'Cagoule de Braqueur' },
  { id: 'swat_helmet', name: "Casque d'Assaut Tactique" },
  { id: 'tactical_chicken', name: 'Poulet Tactique' },
  { id: 'arachnid_mask', name: "Masque de l'Arachnide Rouge" },
  { id: 'alien_symbiote', name: 'Masque du Parasite Obscur' },
  { id: 'bio_electric_mask', name: 'Masque Volt-Arachnéen' },

  // Naturel
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
