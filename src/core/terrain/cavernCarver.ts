import { SeededRandom } from './SeededRandom';

/**
 * High-diversity, seed-sensitive cavern feature carver.
 * Procedurally carves tactical multi-level flank balconies, organic pocket alcoves,
 * and natural rock columns/pillars varying significantly with each seed.
 */
export function carveCavernFlanksAndPillars(
  grid: Uint8Array,
  prng: SeededRandom,
  width: number,
  height: number,
  worldW: number,
  worldH: number,
  scaleX: number,
  scaleY: number
): void {
  // 1. Asymmetric Multi-Tier Flank Balconies (2 to 3 tiers per side)
  const leftTiers = Math.floor(prng.range(2, 4));
  const rightTiers = Math.floor(prng.range(2, 4));

  const leftYs = leftTiers === 3 ? [worldH * 0.30, worldH * 0.46, worldH * 0.64] : [worldH * 0.36, worldH * 0.58];
  const rightYs = rightTiers === 3 ? [worldH * 0.30, worldH * 0.46, worldH * 0.64] : [worldH * 0.36, worldH * 0.58];

  // Left Flank Alcoves
  for (let i = 0; i < leftYs.length; i++) {
    const rawX = prng.range(50, 120);
    const rawY = leftYs[i] + prng.range(-18, 18);
    const cx = rawX * scaleX;
    const cy = rawY * scaleY;
    const rx = prng.range(36, 60) * scaleX;
    const ry = prng.range(18, 30) * scaleY;
    const rySq = ry * ry;
    const rxOverRy = rx / ry;
    const minY = Math.max(Math.round(20 * scaleY), Math.floor(cy - ry));
    const maxY = Math.min(height - 1, Math.ceil(cy + ry));

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const dySq = dy * dy;
      if (dySq > rySq) continue;
      const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
      const startX = Math.max(Math.round(16 * scaleX), Math.ceil(cx - dxMax));
      const endX = Math.min(width - 1, Math.floor(cx + dxMax + 30 * scaleX));
      if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
    }
  }

  // Right Flank Alcoves
  for (let i = 0; i < rightYs.length; i++) {
    const rawX = worldW - prng.range(50, 120);
    const rawY = rightYs[i] + prng.range(-18, 18);
    const cx = rawX * scaleX;
    const cy = rawY * scaleY;
    const rx = prng.range(36, 60) * scaleX;
    const ry = prng.range(18, 30) * scaleY;
    const rySq = ry * ry;
    const rxOverRy = rx / ry;
    const minY = Math.max(Math.round(20 * scaleY), Math.floor(cy - ry));
    const maxY = Math.min(height - 1, Math.ceil(cy + ry));

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const dySq = dy * dy;
      if (dySq > rySq) continue;
      const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
      const startX = Math.max(0, Math.ceil(cx - dxMax - 30 * scaleX));
      const endX = Math.min(width - Math.round(16 * scaleX), Math.floor(cx + dxMax));
      if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
    }
  }

  // 2. Occasional Natural Rock Pillar / Column (In 65% of seeds)
  const hasPillars = prng.next() < 0.65;
  if (hasPillars) {
    const pillarCount = Math.floor(prng.range(1, 3));
    for (let p = 0; p < pillarCount; p++) {
      const px = prng.range(worldW * 0.28 + p * 280, worldW * 0.45 + p * 280) * scaleX;
      const pWidth = prng.range(28, 52) * scaleX;
      const halfPW = pWidth * 0.5;
      const minX = Math.max(0, Math.floor(px - halfPW));
      const maxX = Math.min(width - 1, Math.ceil(px + halfPW));

      // Stamp solid vertical column connecting ceiling to floor
      for (let y = Math.round(16 * scaleY); y < height - Math.round(40 * scaleY); y++) {
        const rowOffset = y * width;
        const wave = Math.sin(y * 0.08 + p) * 6 * scaleX;
        const colStart = Math.max(0, Math.floor(minX + wave));
        const colEnd = Math.min(width - 1, Math.ceil(maxX + wave));
        if (colStart <= colEnd) {
          grid.fill(1, rowOffset + colStart, rowOffset + colEnd + 1);
        }
      }

      // Carve a tactical central breach through the pillar so players can shoot or crawl through
      if (prng.next() < 0.75) {
        const breachY = prng.range(worldH * 0.38, worldH * 0.56) * scaleY;
        const breachR = prng.range(16, 26) * scaleX;
        const bMinY = Math.max(0, Math.floor(breachY - breachR));
        const bMaxY = Math.min(height - 1, Math.ceil(breachY + breachR));
        for (let by = bMinY; by <= bMaxY; by++) {
          const dy = by - breachY;
          if (Math.abs(dy) > breachR) continue;
          const bMinX = Math.max(0, Math.floor(px - breachR * 1.4));
          const bMaxX = Math.min(width - 1, Math.ceil(px + breachR * 1.4));
          grid.fill(0, by * width + bMinX, by * width + bMaxX + 1);
        }
      }
    }
  }
}
