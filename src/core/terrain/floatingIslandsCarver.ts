import { SeededRandom } from './SeededRandom';

export type IslandArchetype = 'PLATEAU' | 'SLICED_MESA' | 'SKY_ARCH' | 'HANGING_SPIRE' | 'STEPPING_STONE';

interface IslandDef {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  archetype: IslandArchetype;
  p1: number;
  p2: number;
  p3: number;
  tilt: number;
  hasCave: boolean;
}

/**
 * Procedural Floating Islands Generator.
 * Stamps heavy, highly diverse sky continents, asymmetrical mesas, soaring arches,
 * and suspended stalactite spires across staggered altitude tiers.
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
  const maxBottomY = waterLevel - Math.round(25 * scaleY);
  const islands: IslandDef[] = [];

  // --- 1. SEED-DRIVEN ISLAND COMPOSITION & LAYOUT ---
  // Tier 1: Main West Continent / Mesa
  const westArchetype: IslandArchetype = prng.next() < 0.5 ? 'PLATEAU' : 'SLICED_MESA';
  islands.push({
    cx: (worldW * prng.range(0.20, 0.28)) * scaleX,
    cy: (worldH * prng.range(0.42, 0.54)) * scaleY,
    rx: prng.range(220, 340) * scaleX,
    ry: prng.range(85, 140) * scaleY,
    archetype: westArchetype,
    p1: prng.next() * Math.PI * 2,
    p2: prng.next() * Math.PI * 2,
    p3: prng.next() * Math.PI * 2,
    tilt: prng.range(-0.35, 0.35),
    hasCave: prng.next() < 0.85,
  });

  // Tier 1: Main East Continent / Arch
  const eastArchetype: IslandArchetype = prng.next() < 0.45 ? 'SKY_ARCH' : (prng.next() < 0.5 ? 'PLATEAU' : 'SLICED_MESA');
  islands.push({
    cx: (worldW * prng.range(0.72, 0.80)) * scaleX,
    cy: (worldH * prng.range(0.42, 0.54)) * scaleY,
    rx: prng.range(220, 340) * scaleX,
    ry: prng.range(85, 140) * scaleY,
    archetype: eastArchetype,
    p1: prng.next() * Math.PI * 2,
    p2: prng.next() * Math.PI * 2,
    p3: prng.next() * Math.PI * 2,
    tilt: prng.range(-0.35, 0.35),
    hasCave: prng.next() < 0.85,
  });

  // Tier 2: High Sky Bastion / Floating Spire (Center-High)
  const highArchetype: IslandArchetype = prng.next() < 0.55 ? 'HANGING_SPIRE' : 'PLATEAU';
  islands.push({
    cx: (worldW * prng.range(0.42, 0.58)) * scaleX,
    cy: (worldH * prng.range(0.20, 0.30)) * scaleY,
    rx: prng.range(130, 200) * scaleX,
    ry: prng.range(60, 110) * scaleY,
    archetype: highArchetype,
    p1: prng.next() * Math.PI * 2,
    p2: prng.next() * Math.PI * 2,
    p3: prng.next() * Math.PI * 2,
    tilt: prng.range(-0.25, 0.25),
    hasCave: prng.next() < 0.4,
  });

  // Tier 3: Central Mid Bridge / Tactical Stepping Monolith
  islands.push({
    cx: (worldW * prng.range(0.44, 0.56)) * scaleX,
    cy: (worldH * prng.range(0.56, 0.68)) * scaleY,
    rx: prng.range(110, 180) * scaleX,
    ry: prng.range(50, 85) * scaleY,
    archetype: prng.next() < 0.5 ? 'SLICED_MESA' : 'PLATEAU',
    p1: prng.next() * Math.PI * 2,
    p2: prng.next() * Math.PI * 2,
    p3: prng.next() * Math.PI * 2,
    tilt: prng.range(-0.3, 0.3),
    hasCave: prng.next() < 0.5,
  });

  // Tier 4: Dynamic Satellite Boulders & Flank Outposts (2 to 4 satellite islands)
  const satelliteCount = Math.floor(prng.range(2, 5));
  for (let s = 0; s < satelliteCount; s++) {
    const isLeft = s % 2 === 0;
    const satX = (isLeft ? prng.range(worldW * 0.08, worldW * 0.36) : prng.range(worldW * 0.64, worldW * 0.92)) * scaleX;
    const satY = (worldH * prng.range(0.28, 0.72)) * scaleY;
    islands.push({
      cx: satX,
      cy: satY,
      rx: prng.range(55, 115) * scaleX,
      ry: prng.range(30, 60) * scaleY,
      archetype: prng.next() < 0.4 ? 'HANGING_SPIRE' : 'STEPPING_STONE',
      p1: prng.next() * Math.PI * 2,
      p2: prng.next() * Math.PI * 2,
      p3: prng.next() * Math.PI * 2,
      tilt: prng.range(-0.4, 0.4),
      hasCave: false,
    });
  }

  // --- 2. RENDER PROCEDURAL ISLAND VOLUMES ---
  for (const isl of islands) {
    const minX = Math.max(0, Math.floor(isl.cx - isl.rx));
    const maxX = Math.min(width - 1, Math.ceil(isl.cx + isl.rx));

    for (let x = minX; x <= maxX; x++) {
      const u = (x - isl.cx) / (isl.rx || 1);
      const uSq = u * u;
      if (uSq > 1.0) continue;

      let topY = isl.cy;
      let bottomY = isl.cy;

      switch (isl.archetype) {
        case 'PLATEAU': {
          // Rolling undulating plateau top with natural defensive lips
          const topWave = Math.sin(u * Math.PI * 2 + isl.p1) * 0.18 + Math.cos(u * Math.PI * 4 + isl.p2) * 0.08;
          const rimLip = Math.sin(Math.abs(u) * Math.PI) * (Math.abs(u) > 0.4 ? 0.3 : 0.0);
          topY = isl.cy - isl.ry * (0.45 + topWave - rimLip + isl.tilt * u);

          // Asymmetric jagged stalactite root underside
          const rootHarmonic = Math.sin((u + 0.3) * Math.PI * 3 + isl.p3) * 0.25 + Math.cos(u * Math.PI * 5) * 0.12;
          const rootDepth = Math.sqrt(1.0 - uSq) * (1.0 + rootHarmonic);
          bottomY = isl.cy + isl.ry * (0.85 * rootDepth);
          break;
        }

        case 'SLICED_MESA': {
          // Sloping top ramp with sheer vertical cliff on one side
          const slope = isl.tilt >= 0 ? u : -u;
          topY = isl.cy - isl.ry * (0.40 + slope * 0.35 + Math.sin(u * Math.PI * 3 + isl.p1) * 0.12);

          // Heavy angular rock shelf bottom
          const rootDepth = Math.pow(Math.max(0, 1.0 - uSq), 0.6) * (1.1 - slope * 0.3);
          bottomY = isl.cy + isl.ry * (0.90 * rootDepth);
          break;
        }

        case 'SKY_ARCH': {
          // Double hump / arched surface with high bridge
          const archTop = Math.cos(u * Math.PI * 2) * 0.25 + 0.45;
          topY = isl.cy - isl.ry * (archTop + Math.sin(u * Math.PI * 4 + isl.p1) * 0.08);

          // Deep root base
          const rootDepth = Math.sqrt(1.0 - uSq) * (1.0 + Math.sin(u * Math.PI * 3 + isl.p3) * 0.2);
          bottomY = isl.cy + isl.ry * (0.95 * rootDepth);
          break;
        }

        case 'HANGING_SPIRE': {
          // Sharp downward rock tooth with narrow elevated sniper summit
          const summit = Math.pow(1.0 - uSq, 2) * 0.45;
          topY = isl.cy - isl.ry * summit;

          // Steep V-shaped jagged stalactite plunge
          const tooth = Math.pow(Math.max(0, 1.0 - Math.abs(u)), 1.3) * 1.5 * (1.0 + Math.sin(u * Math.PI * 4 + isl.p2) * 0.2);
          bottomY = isl.cy + isl.ry * tooth;
          break;
        }

        case 'STEPPING_STONE':
        default: {
          // Compact hovering boulder with varied organic shape
          const topWave = Math.sin(u * Math.PI * 2 + isl.p1) * 0.2;
          topY = isl.cy - isl.ry * (0.35 + topWave + isl.tilt * u);
          const rootDepth = Math.sqrt(1.0 - uSq) * (0.8 + Math.sin(u * Math.PI * 3 + isl.p3) * 0.25);
          bottomY = isl.cy + isl.ry * rootDepth;
          break;
        }
      }

      const rowStart = Math.max(0, Math.floor(topY));
      const rowEnd = Math.min(maxBottomY, Math.ceil(bottomY));

      for (let y = rowStart; y <= rowEnd; y++) {
        grid[y * width + x] = 1;
      }
    }

    // --- 3. CARVE ARCH HOLES & SUBTERRANEAN CAVES ---
    if (isl.archetype === 'SKY_ARCH') {
      const archHoleY = isl.cy + isl.ry * 0.15;
      const holeRx = isl.rx * 0.42;
      const holeRy = isl.ry * 0.45;
      carveEllipse(grid, width, height, isl.cx, archHoleY, holeRx, holeRy);
    } else if (isl.hasCave) {
      const caveX = isl.cx + (isl.p1 > Math.PI ? isl.rx * 0.2 : -isl.rx * 0.2);
      const caveY = isl.cy + isl.ry * 0.12;
      const caveRx = isl.rx * prng.range(0.32, 0.46);
      const caveRy = isl.ry * prng.range(0.28, 0.38);
      carveEllipse(grid, width, height, caveX, caveY, caveRx, caveRy);
    }
  }
}

function carveEllipse(
  grid: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
) {
  const minY = Math.max(0, Math.floor(cy - ry));
  const maxY = Math.min(height - 1, Math.ceil(cy + ry));
  for (let y = minY; y <= maxY; y++) {
    const dy = (y - cy) / (ry || 1);
    const dySq = dy * dy;
    if (dySq > 1.0) continue;
    const dxMax = Math.sqrt(1.0 - dySq) * rx;
    const startX = Math.max(0, Math.ceil(cx - dxMax));
    const endX = Math.min(width - 1, Math.floor(cx + dxMax));
    if (startX <= endX) {
      grid.fill(0, y * width + startX, y * width + endX + 1);
    }
  }
}
