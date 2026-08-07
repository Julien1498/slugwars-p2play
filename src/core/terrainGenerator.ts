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

  // Multi-harmonic 1D noise for organic terrain relief with steep hills and cliffs
  public harmonicNoise(x: number, baseFreq: number, p1: number, p2: number, p3: number): number {
    const wave1 = Math.sin(x * baseFreq + p1) * 160;
    const wave2 = Math.cos(x * baseFreq * 2.2 + p2) * 80;
    const wave3 = Math.sin(x * baseFreq * 4.8 + p3) * 38;
    const wave4 = Math.cos(x * baseFreq * 9.5 + p1 * 2) * 18;

    // Stepped terrace cliffs modulation for dramatic non-flat relief
    const terrace = Math.sin(x * 0.008 + p3) > 0.5 ? Math.cos(x * 0.02 + p1) * 35 : 0;
    return wave1 + wave2 + wave3 + wave4 + terrace;
  }
}

export interface DecorItem {
  id: string;
  type: 'mole' | 'snail' | 'mushroom' | 'flower' | 'hanging_leaf' | 'butterfly';
  x: number;
  y: number;
  scale?: number;
  variant?: number;
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
  decorItems: DecorItem[];
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
    let groundY = height * 0.52;

    if (theme === 'ISLAND') {
      // Twin-peak Island with central valley and steep sea cliffs
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.42 + noise + edgeDrop;
    } else if (theme === 'FORTRESS') {
      // Two opposing high cliff castles divided by a deep central ravine with a center pillar
      const centerDist = Math.abs(x - width / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260; // Deep center ravine
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -50; // Ramparts wall
      }
      const noise = prng.harmonicNoise(x, baseFreq * 0.8, p1, p2, p3) * 0.8;
      groundY = height * 0.4 + noise + castleHeight;
    } else if (theme === 'CAVERN') {
      // Underground Cavern with complex roof stalactites & floor stalagmites
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.6 + noise * 0.9;

      const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.8;
      const roofY = height * 0.2 + roofNoise;

      for (let y = 0; y < Math.min(height, Math.max(0, Math.floor(roofY))); y++) {
        grid[y * width + x] = 1;
      }
    } else {
      // Archipelago / Wacky: Multi-peak islands divided by natural channels
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
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

  // 5. Landmine Spawn Points Generator
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

  // 6. Procedural Decorative Elements Generator (Moles, Snails, Mushrooms, Flowers, Hanging Leaves, Butterflies)
  const decorItems: DecorItem[] = [];

  // Moles (1-2 big moles in background hills)
  const moleCount = Math.floor(prng.range(1, 3));
  for (let i = 0; i < moleCount; i++) {
    const moleX = Math.floor(prng.range(200 + i * 400, 350 + i * 400));
    for (let my = searchStartY; my < waterLevel - 50; my++) {
      if (grid[my * width + moleX] === 1 && grid[(my - 1) * width + moleX] === 0) {
        decorItems.push({
          id: `mole_${i}`,
          type: 'mole',
          x: moleX,
          y: my,
          scale: prng.range(0.9, 1.2),
        });
        break;
      }
    }
  }

  // Giant Snail (1 on a high cliff)
  const snailX = Math.floor(prng.range(width * 0.6, width * 0.8));
  for (let sy = searchStartY; sy < waterLevel - 80; sy++) {
    if (grid[sy * width + snailX] === 1 && grid[(sy - 1) * width + snailX] === 0) {
      decorItems.push({
        id: 'snail_0',
        type: 'snail',
        x: snailX,
        y: sy,
        scale: 1.1,
      });
      break;
    }
  }

  // Mushrooms (6-10 mushrooms on top ground)
  const mushroomCount = Math.floor(prng.range(6, 10));
  for (let i = 0; i < mushroomCount; i++) {
    const rx = Math.floor(prng.range(100, width - 100));
    for (let ry = searchStartY; ry < waterLevel - 20; ry++) {
      if (grid[ry * width + rx] === 1 && grid[(ry - 1) * width + rx] === 0) {
        decorItems.push({
          id: `shroom_${i}`,
          type: 'mushroom',
          x: rx,
          y: ry,
          variant: Math.floor(prng.range(0, 3)),
          scale: prng.range(0.8, 1.3),
        });
        break;
      }
    }
  }

  // Flowers (12-18 colorful flowers on top grass)
  const flowerCount = Math.floor(prng.range(12, 18));
  for (let i = 0; i < flowerCount; i++) {
    const fx = Math.floor(prng.range(80, width - 80));
    for (let fy = searchStartY; fy < waterLevel - 20; fy++) {
      if (grid[fy * width + fx] === 1 && grid[(fy - 1) * width + fx] === 0) {
        decorItems.push({
          id: `flower_${i}`,
          type: 'flower',
          x: fx,
          y: fy,
          variant: Math.floor(prng.range(0, 4)),
        });
        break;
      }
    }
  }

  // Hanging Leaf Roots under ceiling overhangs (10-16 leaves)
  const leafCount = Math.floor(prng.range(10, 16));
  for (let i = 0; i < leafCount; i++) {
    const lx = Math.floor(prng.range(100, width - 100));
    for (let ly = searchStartY + 40; ly < waterLevel - 100; ly++) {
      // Find a ceiling: air below, solid above
      if (grid[ly * width + lx] === 0 && grid[(ly - 1) * width + lx] === 1) {
        decorItems.push({
          id: `hleaf_${i}`,
          type: 'hanging_leaf',
          x: lx,
          y: ly,
          scale: prng.range(0.8, 1.4),
        });
        break;
      }
    }
  }

  // Floating Butterflies in sky (5-8 butterflies)
  const bCount = Math.floor(prng.range(5, 8));
  for (let i = 0; i < bCount; i++) {
    decorItems.push({
      id: `bfly_${i}`,
      type: 'butterfly',
      x: prng.range(150, width - 150),
      y: prng.range(60, 260),
      variant: Math.floor(prng.range(0, 3)),
    });
  }

  return { width, height, theme, seed, waterLevel, grid, spawnPoints, minePoints, decorItems };
}
