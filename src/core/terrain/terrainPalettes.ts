import { MapTheme } from '../types';

export interface TerrainPalette {
  highlight: number;
  surfaceBody: number;
  surfaceShadow: number;
  surfaceDeep: number;
  soilLight: number;
  strataA: number;
  strataB: number;
  denseRock: number;
  bedrock: number;
  seam: number;
}

export const THEME_PALETTES: Record<MapTheme, TerrainPalette> = {
  ISLAND: {
    highlight: 0xff35e6a3,    // #a3e635 Lime top edge
    surfaceBody: 0xff5ec522,  // #22c55e Rich grass green
    surfaceShadow: 0xff3d8015,// #15803d Dark forest green
    surfaceDeep: 0xff2d5314,  // #14532d Deep undercoat shadow
    soilLight: 0xff172e4e,    // #4e2e17 Balanced rich soil
    strataA: 0xff0e131e,      // #1e130e Clay sandstone band
    strataB: 0xff0c1019,      // #19100c Sedimentary band
    denseRock: 0xff0a0c12,    // #120c0a Deep subterranean rock
    bedrock: 0xff08070b,      // #0b0708 Abyssal bedrock
    seam: 0xff070507,         // #070507 Dark soil crack
  },
  ARCHIPELAGO: {
    highlight: 0xff4ade80,    // #80de4a Tropical palm lime
    surfaceBody: 0xff22c55e,  // #5ec522 Vibrant lagoon green
    surfaceShadow: 0xff16a34a,// #4aa316 Rich tropical shadow
    surfaceDeep: 0xff166534,  // #346516 Deep coastal foliage
    soilLight: 0xff203c56,    // #563c20 Coastal loam
    strataA: 0xff0e1824,      // #24180e Sandstone reef band
    strataB: 0xff0c131d,      // #1d130c Oceanic strata
    denseRock: 0xff090d14,    // #140d09 Volcanic trench rock
    bedrock: 0xff06070b,      // #0b0706 Abyssal reef bedrock
    seam: 0xff040407,         // #070404 Coral seam
  },
  NATURAL_ARCHES: {
    highlight: 0xff2bf0f5,    // #f5f02b Sunlit golden sand rim
    surfaceBody: 0xff089bf5,  // #f59b08 Rich orange sandstone
    surfaceShadow: 0xff0c41c2,// #c2410c Terracotta red
    surfaceDeep: 0xff122d7c,  // #7c2d12 Deep ironstone
    soilLight: 0xff162854,    // #542816 Desert clay
    strataA: 0xff0a1224,      // #24120a Canyon sandstone band
    strataB: 0xff080e1e,      // #1e0e08 Canyon stratum
    denseRock: 0xff060a15,    // #150a06 Heavy iron rock
    bedrock: 0xff04060c,      // #0c0604 Canyon bedrock
    seam: 0xff020307,         // #070302 Mineral seam
  },
  SPIRES: {
    highlight: 0xff86efac,    // #acef86 Alpine grass rim
    surfaceBody: 0xff22c55e,  // #5ec522 Mountain meadow green
    surfaceShadow: 0xff15803d,// #3d8015 Rich pine forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff605248,    // #485260 Granite mountain stone
    strataA: 0xff26201c,      // #1c2026 Mountain slate band
    strataB: 0xff201a17,      // #171a20 Mountain stratum
    denseRock: 0xff1e293b,    // #3b291e Deep mountain root
    bedrock: 0xff0d0b09,      // #090b0d Abyssal mountain core
    seam: 0xff080706,         // #060708 Granite fissure
  },
  CAVERN: {
    highlight: 0xffcbd5e1,    // #e1d5cb Pale subterranean crust
    surfaceBody: 0xff64748b,  // #8b7464 Cool cavern slate
    surfaceShadow: 0xff475569,// #695547 Dark slate
    surfaceDeep: 0xff334155,  // #554133 Damp rock
    soilLight: 0xff382632,    // #322638 Amethyst loam
    strataA: 0xff20141b,      // #1b1420 Purple strata band
    strataB: 0xff1a1016,      // #16101a Cavern stratum
    denseRock: 0xff130b10,    // #100b13 Heavy subterranean rock
    bedrock: 0xff0c070a,      // #0a070c Charcoal bedrock
    seam: 0xff070406,         // #060407 Cave fissure
  },
  ORGANIC_CAVES: {
    highlight: 0xff24bffb,    // #fbbf24 Golden amber highlight rim
    surfaceBody: 0xff0677d9,  // #d97706 Warm amber ochre tunnel floor
    surfaceShadow: 0xff0953b4,// #b45309 Warm terracotta shadow
    surfaceDeep: 0xff0f3578,  // #78350f Warm subterranean edge
    soilLight: 0xff10244e,    // #4e2410 Amber subterranean earth
    strataA: 0xff061022,      // #221006 Warm rock band
    strataB: 0xff050d1c,      // #1c0d05 Warm rock stratum
    denseRock: 0xff040913,    // #130904 Deep warm stone
    bedrock: 0xff02050b,      // #0b0502 Solid dark bedrock
    seam: 0xff010307,         // #070301 Dark crevice
  },
  FORTRESS: {
    highlight: 0xffa3e635,    // #35e6a3 Rampart moss
    surfaceBody: 0xff94a3b8,  // #b8a394 Ashlar castle stone
    surfaceShadow: 0xff64748b,// #8b7464 Heavy stone masonry
    surfaceDeep: 0xff475569,  // #695547 Deep foundation
    soilLight: 0xff483c34,    // #343c48 Moat loam
    strataA: 0xff241d18,      // #181d24 Fortress bedrock band
    strataB: 0xff1d1714,      // #14171d Dungeon rock
    denseRock: 0xff15110e,    // #0e1115 Heavy granite base
    bedrock: 0xff0c0a08,      // #080a0c Keep bedrock
    seam: 0xff070605,         // #050607 Mortar seam
  },
  FLOATING_CHAOS: {
    highlight: 0xfff472b6,    // #b672f4 Cosmic stardust magenta
    surfaceBody: 0xff8b5cf6,  // #f65c8b Astral nebula purple
    surfaceShadow: 0xff6d28d9,// #d9286d Deep void shadow
    surfaceDeep: 0xff4c1d95,  // #951d4c Abyssal cosmos edge
    soilLight: 0xff281c3e,    // #3e1c28 Floating core loam
    strataA: 0xff1c1228,      // #28121c Astral sandstone band
    strataB: 0xff160c20,      // #200c16 Gravity distortion stratum
    denseRock: 0xff100818,    // #180810 Deep obsidian root
    bedrock: 0xff0a0410,      // #10040a Singularity bedrock
    seam: 0xff06020c,         // #0c0206 Cosmic rift seam
  },
};
