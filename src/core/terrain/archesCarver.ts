import { SeededRandom } from './SeededRandom';

export type ArchArchetype = 'GRAND_SPAN' | 'TWIN_VIADUCT' | 'DOUBLE_DECKER' | 'CANTILEVER_ARCH';

interface BridgeDeck {
  x1: number;
  x2: number;
  deckY: number;
  thickness: number;
  camber: number;
  archRise: number;
}

/**
 * Procedural Natural Arches & Rock Bridges Carver.
 * Stamps solid walkable bridge spans, carves vaulted catenary under-arches,
 * multi-tier viaducts, natural sniper windows (oculi), and coastal promontories.
 */
export function carveNaturalArchesAndBridges(
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
  const archetypeIndex = Math.floor(prng.range(0, 4));
  const archetypes: ArchArchetype[] = ['GRAND_SPAN', 'TWIN_VIADUCT', 'DOUBLE_DECKER', 'CANTILEVER_ARCH'];
  const archetype = archetypes[archetypeIndex];

  const bridges: BridgeDeck[] = [];

  // --- 1. ARCHETYPE-BASED BRIDGE LAYOUTS ---
  if (archetype === 'GRAND_SPAN') {
    // One colossal landscape arch spanning across the deep central gorge
    const x1 = prng.range(worldW * 0.18, worldW * 0.28) * scaleX;
    const x2 = prng.range(worldW * 0.72, worldW * 0.82) * scaleX;
    const deckY = prng.range(worldH * 0.30, worldH * 0.40) * scaleY;
    const thickness = prng.range(28, 42) * scaleY;
    const camber = prng.range(-15, 25) * scaleY;
    const archRise = prng.range(120, 190) * scaleY;

    bridges.push({ x1, x2, deckY, thickness, camber, archRise });
  } else if (archetype === 'TWIN_VIADUCT') {
    // Two adjacent soaring arches meeting on a solid central pillar
    const midX = (worldW * prng.range(0.48, 0.52)) * scaleX;
    const leftX = (worldW * prng.range(0.16, 0.24)) * scaleX;
    const rightX = (worldW * prng.range(0.76, 0.84)) * scaleX;
    const deckY1 = prng.range(worldH * 0.32, worldH * 0.42) * scaleY;
    const deckY2 = deckY1 + prng.range(-20, 20) * scaleY;
    const thick = prng.range(26, 38) * scaleY;

    bridges.push({
      x1: leftX,
      x2: midX,
      deckY: deckY1,
      thickness: thick,
      camber: prng.range(5, 22) * scaleY,
      archRise: prng.range(90, 140) * scaleY,
    });
    bridges.push({
      x1: midX,
      x2: rightX,
      deckY: deckY2,
      thickness: thick,
      camber: prng.range(5, 22) * scaleY,
      archRise: prng.range(90, 140) * scaleY,
    });
  } else if (archetype === 'DOUBLE_DECKER') {
    // Multi-tier viaduct: High sky bridge + Lower coastal sea arch
    const leftX = (worldW * prng.range(0.18, 0.28)) * scaleX;
    const rightX = (worldW * prng.range(0.72, 0.82)) * scaleX;

    // High Sky Bridge
    bridges.push({
      x1: leftX,
      x2: rightX,
      deckY: (worldH * prng.range(0.22, 0.28)) * scaleY,
      thickness: prng.range(24, 34) * scaleY,
      camber: prng.range(-10, 15) * scaleY,
      archRise: prng.range(70, 110) * scaleY,
    });

    // Lower Sea Arch
    bridges.push({
      x1: leftX + 40 * scaleX,
      x2: rightX - 40 * scaleX,
      deckY: (worldH * prng.range(0.52, 0.60)) * scaleY,
      thickness: prng.range(26, 36) * scaleY,
      camber: prng.range(10, 25) * scaleY,
      archRise: prng.range(80, 130) * scaleY,
    });
  } else {
    // Cantilever Promontory + Main Canyon Arch
    const leftX = (worldW * prng.range(0.20, 0.30)) * scaleX;
    const rightX = (worldW * prng.range(0.68, 0.78)) * scaleX;

    bridges.push({
      x1: leftX,
      x2: rightX,
      deckY: (worldH * prng.range(0.34, 0.44)) * scaleY,
      thickness: prng.range(28, 40) * scaleY,
      camber: prng.range(5, 20) * scaleY,
      archRise: prng.range(100, 150) * scaleY,
    });

    // Outer Cantilever Wing
    const isLeftWing = prng.next() < 0.5;
    if (isLeftWing) {
      bridges.push({
        x1: 40 * scaleX,
        x2: leftX,
        deckY: (worldH * prng.range(0.40, 0.48)) * scaleY,
        thickness: prng.range(22, 32) * scaleY,
        camber: prng.range(0, 15) * scaleY,
        archRise: prng.range(60, 95) * scaleY,
      });
    } else {
      bridges.push({
        x1: rightX,
        x2: width - 40 * scaleX,
        deckY: (worldH * prng.range(0.40, 0.48)) * scaleY,
        thickness: prng.range(22, 32) * scaleY,
        camber: prng.range(0, 15) * scaleY,
        archRise: prng.range(60, 95) * scaleY,
      });
    }
  }

  // --- 2. STAMP BRIDGE DECKS & CARVE OPEN VAULTED ARCHES ---
  for (const b of bridges) {
    const spanW = b.x2 - b.x1;
    const midX = (b.x1 + b.x2) * 0.5;
    const halfW = spanW * 0.5;

    const startCol = Math.max(0, Math.floor(b.x1));
    const endCol = Math.min(width - 1, Math.ceil(b.x2));

    for (let x = startCol; x <= endCol; x++) {
      const normX = (x - midX) / halfW;
      const parabola = Math.max(0, 1 - normX * normX);

      // Deck top curve with natural rocky roughness
      const noise = Math.sin(x * 0.05) * 3.5 * scaleY + Math.cos(x * 0.12) * 2.0 * scaleY;
      const topY = b.deckY - b.camber * parabola + noise;

      // Solid deck thickness
      const botDeckY = topY + b.thickness;

      // Vaulted under-arch curve
      const archVaultY = botDeckY + b.archRise * Math.pow(parabola, 1.25);

      const minDeckY = Math.max(0, Math.floor(topY));
      const maxDeckY = Math.min(height - 1, Math.ceil(botDeckY));

      // 1. Stamp solid walkable bridge deck
      for (let y = minDeckY; y <= maxDeckY; y++) {
        grid[y * width + x] = 1;
      }

      // 2. Carve open vault underneath down to the sea / gorge
      const carveStartY = Math.max(maxDeckY + 1, Math.floor(botDeckY));
      const carveEndY = Math.min(height - 1, Math.ceil(Math.min(archVaultY, waterLevel - 5 * scaleY)));

      for (let y = carveStartY; y <= carveEndY; y++) {
        grid[y * width + x] = 0;
      }
    }
  }

  // --- 3. NATURAL ROCK WINDOWS & OCULI (SNIPER SLITS) ---
  const oculusCount = Math.floor(prng.range(1, 4));
  for (let o = 0; o < oculusCount; o++) {
    const isLeftPillar = o % 2 === 0;
    const ox = (isLeftPillar ? prng.range(worldW * 0.18, worldW * 0.30) : prng.range(worldW * 0.70, worldW * 0.82)) * scaleX;
    const oy = prng.range(worldH * 0.35, worldH * 0.58) * scaleY;
    const rx = prng.range(22, 38) * scaleX;
    const ry = prng.range(20, 36) * scaleY;

    const minX = Math.max(0, Math.floor(ox - rx));
    const maxX = Math.min(width - 1, Math.ceil(ox + rx));
    const minY = Math.max(0, Math.floor(oy - ry));
    const maxY = Math.min(height - 1, Math.ceil(oy + ry));
    const rySq = ry * ry;
    const rxOverRy = rx / ry;

    for (let y = minY; y <= maxY; y++) {
      const dy = y - oy;
      const dySq = dy * dy;
      if (dySq > rySq) continue;
      const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
      const startX = Math.max(0, Math.ceil(ox - dxMax));
      const endX = Math.min(width - 1, Math.floor(ox + dxMax));
      if (startX <= endX) {
        grid.fill(0, y * width + startX, y * width + endX + 1);
      }
    }
  }
}
