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
  { id: 'west_coast_bandana', name: 'Bandana Légende West Coast' },

  // Dessins Animés & Univers Culte
  { id: 'marine_cook_cap', name: 'Toque de Cuistot Subaquatique' },
  { id: 'porous_yellow_dome', name: "Calotte d'Éponge Alvéolée" },
  { id: 'starfish_pink_cone', name: "Pointe d'Étoile Pastel" },
  { id: 'soda_dispenser_cap', name: 'Casquette Soda du Premier' },
  { id: 'crimson_hero_ribbon', name: 'Grand Nœud Papillon Écarlate' },
  { id: 'bouncy_blonde_twintails', name: 'Couettes Blondes Élastiques' },
  { id: 'rebel_raven_crop', name: 'Coupe Ébouriffée Noire' },
  { id: 'trio_colored_hearts', name: 'Diadème aux Trois Cœurs' },
  { id: 'adventurer_fringe_bob', name: 'Coupe au Bol Aventurière' },
  { id: 'playful_monkey_crest', name: 'Houppette du Petit Compagnon' },
  { id: 'cheerful_satchel', name: 'Besace Souriante Perchée' },
  { id: 'safari_field_hat', name: "Chapeau Toile d'Exploration" },

  // Créatures & Compagnons Animés
  { id: 'mono_goggle_tuft', name: 'Optique Cyclope & Trois Épis' },
  { id: 'binocular_spectacles', name: "Bésicles d'Atelier & Palmier" },
  { id: 'cozy_striped_beanie', name: 'Bonnet Laine à Pompon' },
  { id: 'builders_safety_helmet', name: 'Casque de Chantier Protecteur' },
  { id: 'specimen_blue_ears', name: 'Grandes Oreilles Galactiques' },
  { id: 'cosmic_charmer_antennas', name: "Antennes & Pavillons d'Angelot" },
  { id: 'island_hibiscus_garland', name: "Couronne Tropicale d'Hibiscus" },
  { id: 'alien_companion_hood', name: "Passe-Montagne Bleuté d'Alien" },
  { id: 'braided_cowboy_stetson', name: 'Stetson Shérif à Surpiqûres' },
  { id: 'cosmo_ranger_cowl', name: "Cagoule d'Astronaute Galactique" },
  { id: 'tri_ocular_antenna', name: 'Triple-Regard & Sonde Spatiale' },
  { id: 'toy_black_derby', name: 'Chapeau Melon Jouet Lustré' },

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
