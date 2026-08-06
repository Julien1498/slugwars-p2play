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
}

export interface TerrainData {
  width: number;
  height: number;
  theme: MapTheme;
  seed: number;
  waterLevel: number;
  grid: Uint8Array;
  spawnPoints: Vector2D[];
}

export function generateProceduralTerrain(
  seed: number,
  theme: MapTheme,
  width: number = 1000,
  height: number = 600
): TerrainData {
  const prng = new SeededRandom(seed);
  const grid = new Uint8Array(width * height);
  const waterLevel = height - 70;

  const baseFreq1 = prng.range(0.003, 0.007);
  const baseFreq2 = prng.range(0.01, 0.02);
  const phase1 = prng.range(0, Math.PI * 2);
  const phase2 = prng.range(0, Math.PI * 2);

  for (let x = 0; x < width; x++) {
    let groundY = height * 0.65;

    if (theme === 'ISLAND') {
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.5) * 350;
      const noise =
        Math.sin(x * baseFreq1 + phase1) * 80 +
        Math.sin(x * baseFreq2 + phase2) * 30;
      groundY = height * 0.5 + noise + edgeDrop;
    } else if (theme === 'FORTRESS') {
      const middleGap = Math.abs(x - width / 2) < 120 ? 150 : 0;
      const noise = Math.sin(x * baseFreq1 + phase1) * 60;
      groundY = height * 0.45 + noise + middleGap;
    } else if (theme === 'CAVERN') {
      const noise = Math.sin(x * baseFreq1 + phase1) * 70;
      groundY = height * 0.6 + noise;
      const roofY = height * 0.25 + Math.cos(x * baseFreq1 + phase2) * 50;
      for (let y = 0; y < Math.min(height, Math.max(0, Math.floor(roofY))); y++) {
        grid[y * width + x] = 1;
      }
    } else {
      const islandWave = Math.sin(x * 0.015 + phase1) * 120;
      groundY = height * 0.55 + islandWave;
      if (Math.floor(x / 150) % 2 === 0) groundY += 200;
    }

    const startY = Math.max(0, Math.min(height - 1, Math.floor(groundY)));
    for (let y = startY; y < waterLevel; y++) {
      grid[y * width + x] = 1;
    }
  }

  const caveCount = theme === 'CAVERN' ? 12 : 6;
  for (let i = 0; i < caveCount; i++) {
    const cx = Math.floor(prng.range(100, width - 100));
    const cy = Math.floor(prng.range(200, waterLevel - 60));
    const radius = Math.floor(prng.range(30, 65));

    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            grid[y * width + x] = 0;
          }
        }
      }
    }
  }

  const spawnPoints: Vector2D[] = [];
  const step = Math.floor((width - 200) / 12);
  for (let x = 100; x < width - 100; x += step) {
    for (let y = 50; y < waterLevel - 20; y++) {
      if (grid[y * width + x] === 1) {
        spawnPoints.push({ x, y: y - 18 });
        break;
      }
    }
  }

  return { width, height, theme, seed, waterLevel, grid, spawnPoints };
}
