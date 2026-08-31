import { MapTheme, Vector2D } from '../types';
import { SeededRandom } from './SeededRandom';
import { getThemeConfig } from './themeRegistry';

export interface DecorItem {
  id: string;
  type: 'hanging_leaf' | 'butterfly';
  x: number;
  y: number;
  scale?: number;
  variant?: number;
  destroyed?: boolean;
}

export function createFloorFinder(
  grid: Uint8Array,
  width: number,
  searchStartY: number,
  waterLevel: number
): (x: number, minY?: number, maxY?: number) => number[] {
  const cache = new Map<number, number[]>();
  const defaultMaxY = waterLevel - 25;

  return (x: number, minY: number = searchStartY, maxY: number = defaultMaxY): number[] => {
    const isDefaultRange = minY === searchStartY && maxY === defaultMaxY;
    if (isDefaultRange) {
      const cached = cache.get(x);
      if (cached) return cached;
    }

    const floors: number[] = [];
    for (let y = minY; y <= maxY; y++) {
      const idx = y * width + x;
      if (grid[idx] === 1 && grid[idx - width] === 0) {
        let clear = true;
        for (let h = 1; h <= 16; h++) {
          if (y - h < 0 || grid[idx - h * width] !== 0) {
            clear = false;
            break;
          }
        }
        if (clear) {
          floors.push(y);
        }
      }
    }

    if (isDefaultRange) {
      cache.set(x, floors);
    }
    return floors;
  };
}

export function generateSpawnPoints(
  grid: Uint8Array,
  theme: MapTheme,
  width: number,
  height: number,
  waterLevel: number,
  searchStartY: number,
  minHeadroom: number
): Vector2D[] {
  // 4. Safe Spawn Points Generator (Guarantees wide, stable footholds and avoids tiny fragile floating sky islands)
  const spawnPoints: Vector2D[] = [];
  const step = Math.floor((width - 240) / 14);

  for (let x = 120; x < width - 120; x += step) {
    let fallbackSpawn: Vector2D | null = null;

    for (let y = searchStartY; y < waterLevel - 30; y++) {
      if (grid[y * width + x] === 1 && grid[(y - 1) * width + x] === 0) {
        let openHeadroom = 0;
        for (let checkY = y - 1; checkY >= Math.max(0, y - 30); checkY--) {
          if (grid[checkY * width + x] === 0) openHeadroom++;
        }
        if (openHeadroom < minHeadroom) continue;

        if (!fallbackSpawn) {
          fallbackSpawn = { x, y: y - 10 };
        }

        // Anti-Fragile / Anti-Tiny-Island Check:
        // Ensure platform width is wide (at least 32px solid platform around x)
        let solidPlatformWidth = 0;
        const checkSpan = 16;
        for (let dx = -checkSpan; dx <= checkSpan; dx++) {
          const px = x + dx;
          if (px >= 0 && px < width && grid[y * width + px] === 1) {
            solidPlatformWidth++;
          }
        }

        // Platform thickness check (ensure solid rock under slug is at least 12px deep)
        let platformThickness = 0;
        for (let dy = 0; dy < 14; dy++) {
          if (y + dy < height && grid[(y + dy) * width + x] === 1) {
            platformThickness++;
          }
        }

        // Avoid tiny sky islands with high drop danger, keep scanning down for the main continent or wide plateau!
        if (solidPlatformWidth < 22 || platformThickness < 8) {
          continue;
        }

        spawnPoints.push({ x, y: y - 10 });
        fallbackSpawn = null;
        break;
      }
    }

    if (fallbackSpawn && !spawnPoints.some((sp) => Math.abs(sp.x - x) < step * 0.7)) {
      spawnPoints.push(fallbackSpawn);
    }
  }

  // Fallback pass: ensure we always have ample spawn points across all seeds & archetypes
  if (spawnPoints.length < 6) {
    for (let x = 80; x < width - 80; x += 40) {
      if (spawnPoints.some((sp) => Math.abs(sp.x - x) < 30)) continue;
      for (let y = searchStartY; y < waterLevel - 20; y++) {
        if (grid[y * width + x] === 1 && grid[(y - 1) * width + x] === 0) {
          spawnPoints.push({ x, y: y - 10 });
          break;
        }
      }
    }
  }

  return spawnPoints;
}

export function generateMinePoints(
  grid: Uint8Array,
  prng: SeededRandom,
  width: number,
  searchStartY: number,
  waterLevel: number,
  findAllFloorsAt: (x: number, minY?: number, maxY?: number) => number[]
): Vector2D[] {
  // 5. Landmine Spawn Points Generator (Distributed across all depths: surface, tunnels, caves & ledges)
  const minePoints: Vector2D[] = [];
  const mineCount = Math.floor(prng.range(8, 14));
  for (let i = 0; i < mineCount; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const mx = Math.floor(prng.range(120, width - 120));
      if (minePoints.some((mp) => Math.abs(mp.x - mx) < 40)) continue;

      const floors = findAllFloorsAt(mx, searchStartY, waterLevel - 20);
      if (floors.length > 0) {
        const my = floors[Math.floor(prng.range(0, floors.length))];
        minePoints.push({ x: mx, y: my - 3 });
        break;
      }
    }
  }
  return minePoints;
}

export function generateDecorItems(
  grid: Uint8Array,
  prng: SeededRandom,
  theme: MapTheme,
  width: number,
  searchStartY: number,
  waterLevel: number
): DecorItem[] {
  // 7. Visual Background Decor Items (Hanging Leaf Roots & Floating Butterflies)
  const decorItems: DecorItem[] = [];
  const config = getThemeConfig(theme);

  // Hanging Leaf Roots under ceiling overhangs
  const leafCount = config.decor.hangingLeaves;
  for (let i = 0; i < leafCount; i++) {
    const lx = Math.floor(prng.range(100, width - 100));
    for (let ly = searchStartY + 40; ly < waterLevel - 100; ly++) {
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

  // Floating Butterflies in sky
  const bCount = config.decor.butterflies > 0 ? Math.floor(prng.range(5, 8)) : 0;
  for (let i = 0; i < bCount; i++) {
    decorItems.push({
      id: `bfly_${i}`,
      type: 'butterfly',
      x: prng.range(150, width - 150),
      y: prng.range(60, 260),
      variant: Math.floor(prng.range(0, 3)),
    });
  }

  return decorItems;
}
