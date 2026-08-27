import { MapTheme, Vector2D, SolidProp } from './types';
import { SeededRandom } from './terrain/SeededRandom';
import { generate1DHeightmap, fillInitialTerrainGrid } from './terrain/heightmapGenerator';
import { carveTerrainFeatures } from './terrain/terrainCarver';
import {
  DecorItem,
  createFloorFinder,
  generateSpawnPoints,
  generateMinePoints,
  generateDecorItems,
} from './terrain/terrainEntityPlacer';
import { generateSolidProps } from './terrain/terrainPropsPlacer';

export { SeededRandom };
export type { DecorItem, SolidProp };

export interface TerrainData {
  width: number;
  height: number;
  theme: MapTheme;
  seed: number;
  waterLevel: number;
  grid: Uint8Array;
  spawnPoints: Vector2D[];
  minePoints: Vector2D[];
  decorItems: DecorItem[];
  solidProps: SolidProp[];
}

export function generateProceduralTerrain(
  seed: number,
  theme: MapTheme,
  width: number = 1400,
  height: number = 800
): TerrainData {
  const prng = new SeededRandom(seed);
  const grid = new Uint8Array(width * height);
  const waterLevel = height - 80;

  const baseFreq = prng.range(0.002, 0.004);
  const p1 = prng.range(0, Math.PI * 2);
  const p2 = prng.range(0, Math.PI * 2);
  const p3 = prng.range(0, Math.PI * 2);

  // 1. Precalculate 1D Terrain Heightmap & Fill 2D Grid with Overhangs
  const baseGroundY = generate1DHeightmap(prng, theme, width, height, baseFreq, p1, p2, p3);
  fillInitialTerrainGrid(grid, baseGroundY, prng, theme, width, height, baseFreq, p1, p2, p3, waterLevel);

  // 2. Carve Subterranean Features (Perlin Tactical Artillery, Arches, Caves, Bedrock Ceiling, Tactical Floating Islands)
  carveTerrainFeatures(grid, prng, theme, width, height, waterLevel);

  // 3. Place Entities (Safe Spawns, Mines, Destructible Props & Background Decor)
  const searchStartY = theme === 'CAVERN' ? 120 : theme === 'ORGANIC_CAVES' ? 35 : 40;
  const minHeadroom = theme === 'ORGANIC_CAVES' ? 12 : 22;
  const findAllFloorsAt = createFloorFinder(grid, width, searchStartY, waterLevel);

  const spawnPoints = generateSpawnPoints(grid, theme, width, height, waterLevel, searchStartY, minHeadroom);
  const minePoints = generateMinePoints(grid, prng, width, searchStartY, waterLevel, findAllFloorsAt);
  const solidProps = generateSolidProps(grid, prng, theme, width, height, waterLevel, searchStartY, findAllFloorsAt);
  const decorItems = generateDecorItems(grid, prng, theme, width, searchStartY, waterLevel);

  return { width, height, theme, seed, waterLevel, grid, spawnPoints, minePoints, decorItems, solidProps };
}
