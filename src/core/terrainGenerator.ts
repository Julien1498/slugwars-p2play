import { MapTheme, Vector2D } from './types';

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Multi-harmonic 1D noise for organic terrain relief
  public harmonicNoise(x: number, baseFreq: number, p1: number, p2: number, p3: number): number {
    const wave1 = Math.sin(x * baseFreq + p1) * 120;
    const wave2 = Math.cos(x * baseFreq * 2.3 + p2) * 55;
    const wave3 = Math.sin(x * baseFreq * 5.1 + p3) * 25;
    const wave4 = Math.cos(x * baseFreq * 11.7 + p1 * 2) * 10;
    return wave1 + wave2 + wave3 + wave4;
  }
}

export interface TerrainData {
  width: number;
  height: number;
  theme: MapTheme;
  seed: number;
  waterLevel: number;
  grid: Uint8Array;
  spawnPoints: Vector2D[];
  minePoints: Vector2D[];
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

  // 1. Primary Terrain Heightmap Generation
  for (let x = 0; x < width; x++) {
    let groundY = height * 0.55;

    if (theme === 'ISLAND') {
      // Twin-peak Island with central valley and steep sea cliffs
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.45 + noise + edgeDrop;
    } else if (theme === 'FORTRESS') {
      // Two opposing high cliff castles divided by a deep central ravine with a center pillar
      const centerDist = Math.abs(x - width / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260; // Deep center ravine
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -40; // Ramparts wall
      }
      const noise = prng.harmonicNoise(x, baseFreq * 0.8, p1, p2, p3) * 0.7;
      groundY = height * 0.42 + noise + castleHeight;
    } else if (theme === 'CAVERN') {
      // Underground Cavern with complex roof stalactites & floor stalagmites
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.62 + noise * 0.8;

      const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.7;
      const roofY = height * 0.22 + roofNoise;

      for (let y = 0; y < Math.min(height, Math.max(0, Math.floor(roofY))); y++) {
        grid[y * width + x] = 1;
      }
    } else {
      // Archipelago / Wacky: Multi-peak islands divided by natural channels
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 180;
      groundY = height * 0.5 + noise + channel;
    }

    const startY = Math.max(0, Math.min(height - 1, Math.floor(groundY)));
    for (let y = startY; y < waterLevel; y++) {
      grid[y * width + x] = 1;
    }
  }

  // 2. Organic Cave Networks, Tunnels & Archways
  const caveCount = theme === 'CAVERN' ? 24 : 14;
  for (let i = 0; i < caveCount; i++) {
    const cx = Math.floor(prng.range(140, width - 140));
    const cy = Math.floor(prng.range(180, waterLevel - 90));
    const rx = Math.floor(prng.range(40, 110));
    const ry = Math.floor(prng.range(30, 80));

    for (let y = Math.max(0, cy - ry); y <= Math.min(height - 1, cy + ry); y++) {
      for (let x = Math.max(0, cx - rx); x <= Math.min(width - 1, cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) {
          grid[y * width + x] = 0;
        }
      }
    }
  }

  // 3. Floating Rock Islands / Ledges in Sky / Cavern
  const floatingIslandCount = theme === 'CAVERN' ? 6 : 4;
  for (let i = 0; i < floatingIslandCount; i++) {
    const fx = Math.floor(prng.range(200, width - 200));
    const fy = Math.floor(prng.range(160, 320));
    const fRadiusX = Math.floor(prng.range(40, 90));
    const fRadiusY = Math.floor(prng.range(15, 30));

    for (let y = Math.max(0, fy - fRadiusY); y <= Math.min(waterLevel - 100, fy + fRadiusY); y++) {
      for (let x = Math.max(0, fx - fRadiusX); x <= Math.min(width - 1, fx + fRadiusX); x++) {
        const dx = (x - fx) / fRadiusX;
        const dy = (y - fy) / fRadiusY;
        if (dx * dx + dy * dy <= 1.0) {
          grid[y * width + x] = 1;
        }
      }
    }
  }

  // 4. Safe Spawn Points Generator
  const spawnPoints: Vector2D[] = [];
  const step = Math.floor((width - 240) / 14);
  const searchStartY = theme === 'CAVERN' ? 120 : 40;

  for (let x = 120; x < width - 120; x += step) {
    for (let y = searchStartY; y < waterLevel - 30; y++) {
      if (grid[y * width + x] === 1 && grid[(y - 1) * width + x] === 0) {
        let openHeadroom = 0;
        for (let checkY = y - 1; checkY >= Math.max(0, y - 30); checkY--) {
          if (grid[checkY * width + x] === 0) openHeadroom++;
        }
        if (openHeadroom >= 22) {
          spawnPoints.push({ x, y: y - 10 });
          break;
        }
      }
    }
  }

  // 5. Landmine Spawn Points Generator (8-12 landmines placed on ground surfaces across map)
  const minePoints: Vector2D[] = [];
  const mineCount = Math.floor(prng.range(8, 12));
  for (let i = 0; i < mineCount; i++) {
    const mx = Math.floor(prng.range(150, width - 150));
    for (let my = searchStartY; my < waterLevel - 20; my++) {
      if (grid[my * width + mx] === 1 && grid[(my - 1) * width + mx] === 0) {
        minePoints.push({ x: mx, y: my - 3 });
        break;
      }
    }
  }

  return { width, height, theme, seed, waterLevel, grid, spawnPoints, minePoints };
}
