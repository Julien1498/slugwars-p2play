import { SeededRandom } from './SeededRandom';

/**
 * Procedural Floating Islands Generator.
 * Stamps distinct sky landmasses, sniper perches, and tactical stepping stones
 * suspended high above the open ocean abyss with organic root geometry.
 */
export function stampFloatingArchipelagoIslands(
  grid: Uint8Array,
  prng: SeededRandom,
  width: number,
  height: number,
  waterLevel: number,
  worldW: number,
  worldH: number,
  scaleX: number,
  scaleY: number
): void {
  const stampIsland = (
    fx: number,
    fy: number,
    rx: number,
    ry: number,
    rootTaper: number = 1.0,
    seedJitter: number = 0
  ) => {
    const minX = Math.max(0, Math.floor(fx - rx));
    const maxX = Math.min(width - 1, Math.ceil(fx + rx));
    const maxY = Math.min(waterLevel - Math.round(35 * scaleY), Math.ceil(fy + ry * rootTaper));

    for (let x = minX; x <= maxX; x++) {
      const u = (x - fx) / (rx || 1);
      const uSq = u * u;
      if (uSq > 1.0) continue;

      // Organic root bottom with rocky stalactite ridges
      const rootHarmonic = Math.sin(Math.abs(u) * Math.PI * 3 + seedJitter) * 0.18;
      const bottomY = fy + Math.sqrt(1.0 - uSq) * (ry * rootTaper) * (1.0 + rootHarmonic);

      // Plateau top with natural lips / battlements on the edges
      const lip = Math.sin(Math.abs(u) * Math.PI) * (Math.abs(u) > 0.35 ? 0.35 : 0.0);
      const topDip = (1.0 - uSq) * 0.30 - lip;
      const topY = fy - topDip * ry;

      const rowStart = Math.max(0, Math.floor(topY));
      const rowEnd = Math.min(maxY, Math.ceil(bottomY));

      for (let y = rowStart; y <= rowEnd; y++) {
        grid[y * width + x] = 1;
      }
    }
  };

  // 1. West Main Combat Base (Left Island)
  const leftX = (worldW * 0.22 + prng.range(-25, 25)) * scaleX;
  const leftY = (worldH * 0.44 + prng.range(-20, 20)) * scaleY;
  const leftRx = prng.range(130, 185) * scaleX;
  const leftRy = prng.range(50, 75) * scaleY;
  stampIsland(leftX, leftY, leftRx, leftRy, 1.25, prng.next() * 5);

  // 2. East Main Combat Base (Right Island)
  const rightX = (worldW * 0.78 + prng.range(-25, 25)) * scaleX;
  const rightY = (worldH * 0.44 + prng.range(-20, 20)) * scaleY;
  const rightRx = prng.range(130, 185) * scaleX;
  const rightRy = prng.range(50, 75) * scaleY;
  stampIsland(rightX, rightY, rightRx, rightRy, 1.25, prng.next() * 5);

  // 3. High Celestial Island (Sniper Bastion)
  const topX = (worldW * 0.50 + prng.range(-60, 60)) * scaleX;
  const topY = (worldH * 0.24 + prng.range(-15, 15)) * scaleY;
  const topRx = prng.range(85, 125) * scaleX;
  const topRy = prng.range(36, 52) * scaleY;
  stampIsland(topX, topY, topRx, topRy, 1.4, prng.next() * 5);

  // 4. Intermediate Stepping Islands & Bridges (2 to 3 tactical stepping stones)
  const stepCount = Math.floor(prng.range(2, 4));
  for (let i = 0; i < stepCount; i++) {
    const stepX = (worldW * (0.34 + i * 0.16) + prng.range(-25, 25)) * scaleX;
    const stepY = (worldH * 0.60 + prng.range(-25, 25)) * scaleY;
    const stepRx = prng.range(48, 80) * scaleX;
    const stepRy = prng.range(24, 40) * scaleY;
    stampIsland(stepX, stepY, stepRx, stepRy, 1.3, prng.next() * 5);
  }

  // 5. Tactical Subterranean Caves / Breaches in Main Bases
  for (const base of [{ cx: leftX, cy: leftY, rx: leftRx, ry: leftRy }, { cx: rightX, cy: rightY, rx: rightRx, ry: rightRy }]) {
    if (prng.next() < 0.75) {
      const caveY = base.cy + base.ry * 0.15;
      const caveRx = base.rx * 0.38;
      const caveRy = base.ry * 0.32;
      const cMinY = Math.max(0, Math.floor(caveY - caveRy));
      const cMaxY = Math.min(height - 1, Math.ceil(caveY + caveRy));
      for (let y = cMinY; y <= cMaxY; y++) {
        const dy = (y - caveY) / (caveRy || 1);
        if (dy * dy > 1.0) continue;
        const dxMax = Math.sqrt(1.0 - dy * dy) * caveRx;
        const startX = Math.max(0, Math.ceil(base.cx - dxMax));
        const endX = Math.min(width - 1, Math.floor(base.cx + dxMax));
        if (startX <= endX) {
          grid.fill(0, y * width + startX, y * width + endX + 1);
        }
      }
    }
  }
}
