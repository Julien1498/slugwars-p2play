# Standalone Procedural Terrain Generator

This document contains the complete, self-contained TypeScript/JavaScript source code to procedurally generate the **exact terrain shape and topology** used in **SlugWars** (excluding entities, spawn points, and props).

You can copy-paste this code into any project or environment to generate the exact same terrain geometry pixel-for-pixel from a single numerical seed.

---

## 1. Complete Standalone Source Code

```typescript
export type MapTheme = 'ISLAND' | 'CAVERN' | 'FORTRESS' | 'HILLS' | 'DEFAULT';

export interface ProceduralTerrain {
  width: number;
  height: number;
  seed: number;
  theme: MapTheme;
  waterLevel: number;
  /** 1D Flat Binary Grid: 0 = Air/Empty Sky, 1 = Solid Terrain */
  grid: Uint8Array;
}

/**
 * Deterministic Linear Congruential Generator (LCG) PRNG.
 * Guarantees identical procedural results across all platforms.
 */
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

  /**
   * 1D Multi-Harmonic Noise function with stepped terrace cliffs.
   * Combines 4 frequency bands and conditional plateau modulation.
   */
  public harmonicNoise(x: number, baseFreq: number, p1: number, p2: number, p3: number): number {
    // 4 superimposed frequency harmonics
    const wave1 = Math.sin(x * baseFreq + p1) * 160;          // Macro Mountain Contours
    const wave2 = Math.cos(x * baseFreq * 2.2 + p2) * 80;     // Medium Hill Ridges
    const wave3 = Math.sin(x * baseFreq * 4.8 + p3) * 38;     // Micro Ground Relief
    const wave4 = Math.cos(x * baseFreq * 9.5 + p1 * 2) * 18; // Surface Texture

    // Stepped vertical cliff terraces modulation
    const terrace = Math.sin(x * 0.008 + p3) > 0.5 ? Math.cos(x * 0.02 + p1) * 35 : 0;

    return wave1 + wave2 + wave3 + wave4 + terrace;
  }
}

/**
 * Generates the pure procedural terrain geometry.
 *
 * @param seed The integer seed (e.g. 4829104)
 * @param theme Biome shape archetype ('ISLAND' | 'CAVERN' | 'FORTRESS' | 'DEFAULT')
 * @param width Canvas width in pixels (default: 1400)
 * @param height Canvas height in pixels (default: 800)
 */
export function generateProceduralTerrain(
  seed: number,
  theme: MapTheme = 'ISLAND',
  width: number = 1400,
  height: number = 800
): ProceduralTerrain {
  const prng = new SeededRandom(seed);
  const grid = new Uint8Array(width * height);
  const waterLevel = height - 80; // y = 720

  const baseFreq = prng.range(0.002, 0.004);
  const p1 = prng.range(0, Math.PI * 2);
  const p2 = prng.range(0, Math.PI * 2);
  const p3 = prng.range(0, Math.PI * 2);

  // =========================================================================
  // STAGE 1: Primary Surface Heightmap & Biome Geometry Shaping
  // =========================================================================
  for (let x = 0; x < width; x++) {
    let groundY = height * 0.52;

    if (theme === 'ISLAND') {
      // Symmetric parabolic falloff curve plunging both sides into ocean
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.42 + noise + edgeDrop;
    } else if (theme === 'FORTRESS') {
      // Central raised bastion structure (+260px) and lateral moat drops (-50px)
      const centerDist = Math.abs(x - width / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260;
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -50;
      }
      const noise = prng.harmonicNoise(x, baseFreq * 0.8, p1, p2, p3) * 0.8;
      groundY = height * 0.4 + noise + castleHeight;
    } else if (theme === 'CAVERN') {
      // Lower cave floor
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.6 + noise * 0.9;

      // Independent upper ceiling roof curve
      const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.8;
      const roofY = height * 0.2 + roofNoise;

      // Rasterize ceiling from top down to roofY
      const maxRoofY = Math.min(height, Math.max(0, Math.floor(roofY)));
      for (let y = 0; y < maxRoofY; y++) {
        grid[y * width + x] = 1;
      }
    } else {
      // Classic continuous hills and valleys
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
    }

    // Rasterize solid terrain from surface groundY down to water level
    const startY = Math.max(0, Math.min(height - 1, Math.floor(groundY)));
    for (let y = startY; y < waterLevel; y++) {
      grid[y * width + x] = 1;
    }
  }

  // =========================================================================
  // STAGE 2: Volumetric Subterranean Cave Networks & Tunnels
  // =========================================================================
  const caveCount = theme === 'CAVERN' ? 24 : 14;
  for (let i = 0; i < caveCount; i++) {
    const cx = Math.floor(prng.range(140, width - 140));
    const cy = Math.floor(prng.range(180, waterLevel - 90));
    const rx = Math.floor(prng.range(40, 110));
    const ry = Math.floor(prng.range(30, 80));

    const minY = Math.max(0, cy - ry);
    const maxY = Math.min(height - 1, cy + ry);
    const minX = Math.max(0, cx - rx);
    const maxX = Math.min(width - 1, cx + rx);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) {
          grid[y * width + x] = 0; // Carve hollow cave pocket
        }
      }
    }
  }

  // =========================================================================
  // STAGE 3: Floating Sky Rock Islands
  // =========================================================================
  const floatingIslandCount = theme === 'CAVERN' ? 6 : 4;
  for (let i = 0; i < floatingIslandCount; i++) {
    const fx = Math.floor(prng.range(200, width - 200));
    const fy = Math.floor(prng.range(160, 320));
    const fRadiusX = Math.floor(prng.range(40, 90));
    const fRadiusY = Math.floor(prng.range(15, 30));

    const minY = Math.max(0, fy - fRadiusY);
    const maxY = Math.min(waterLevel - 100, fy + fRadiusY);
    const minX = Math.max(0, fx - fRadiusX);
    const maxX = Math.min(width - 1, fx + fRadiusX);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - fx) / fRadiusX;
        const dy = (y - fy) / fRadiusY;
        if (dx * dx + dy * dy <= 1.0) {
          grid[y * width + x] = 1; // Inject floating solid platform
        }
      }
    }
  }

  return {
    width,
    height,
    theme,
    seed,
    waterLevel,
    grid,
  };
}
```

---

## 2. How the Shape is Formed

### 1. Multi-Harmonic Wave Superposition
The organic surface profile avoids repetitive sine waves by superimposing 4 distinct frequency harmonics:
- **Wave 1 (Base $f \approx 0.003$)**: Large $160\text{px}$ elevation shifts creating mountain ridges and deep valleys.
- **Wave 2 ($2.2 \times f$)**: Medium $80\text{px}$ secondary hills and slopes.
- **Wave 3 ($4.8 \times f$)**: Small $38\text{px}$ crests and indentations.
- **Wave 4 ($9.5 \times f$)**: Fine $18\text{px}$ micro-bumps.
- **Terrace Modulator**: Injects sharp vertical cliff faces when the low-frequency trigger wave crosses threshold $0.5$.

### 2. Biome Shaping Formulations
- **`ISLAND`**: Multiplies the distance from the map center by an exponential power curve $(\text{dist} / 700)^{2.8} \times 550\text{px}$, causing the left and right shorelines to plunge under the water level ($y = 720$).
- **`CAVERN`**: Generates two simultaneous noise functions—one for the floor surface and another for the ceiling roof—creating an enclosed cave with hanging stalactite columns.
- **`FORTRESS`**: Injects rectangular plateau offsets creating a center stronghold with moat depressions.

### 3. Volumetric Elliptical Carving & Sky Islands
- **Caves**: Subterranean ellipses ($r_x \in [40, 110], r_y \in [30, 80]$) carve out tunnels, archways, and interior hollows.
- **Sky Islands**: Floating rock masses are stamped into the sky space ($y \in [160, 320]$) providing elevated platforms.

---

## 3. Quick Visual Preview (Canvas 2D)

To render the generated grid onto an HTML `<canvas>`:

```typescript
export function previewTerrain(terrain: ProceduralTerrain, canvas: HTMLCanvasElement): void {
  canvas.width = terrain.width;
  canvas.height = terrain.height;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(terrain.width, terrain.height);
  const pixels = new Uint32Array(imgData.data.buffer);

  for (let y = 0; y < terrain.height; y++) {
    const row = y * terrain.width;
    for (let x = 0; x < terrain.width; x++) {
      const idx = row + x;
      if (terrain.grid[idx] === 1) {
        pixels[idx] = 0xff1e3a5f; // Solid Terrain (Brown ABGR)
      } else {
        pixels[idx] = 0x00000000; // Transparent Sky
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Water Level Line
  ctx.fillStyle = 'rgba(2, 132, 199, 0.5)';
  ctx.fillRect(0, terrain.waterLevel, terrain.width, terrain.height - terrain.waterLevel);
}
```
