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
  type: 'hanging_leaf' | 'butterfly';
  x: number;
  y: number;
  scale?: number;
  variant?: number;
  destroyed?: boolean;
}

export interface SolidProp {
  id: string;
  type:
    | 'hedgehog'
    | 'chick'
    | 'mushroom'
    | 'flower'
    | 'tree'
    | 'bunker'
    | 'cactus'
    | 'crystal'
    | 'oil_drum'
    | 'totem'
    | 'lamppost';
  x: number;
  y: number;
  width: number;
  height: number;
  angleRad?: number;
  variant?: number;
  destroyed?: boolean;
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

  // 1. Precalculate 1D Terrain Heightmap in a single ultra-fast pass (<0.5ms)
  const baseGroundY = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let groundY = height * 0.52;

    if (theme === 'ISLAND') {
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.42 + noise + edgeDrop;
    } else if (theme === 'FORTRESS') {
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
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.6 + noise * 0.9;
    } else if (theme === 'ARCHIPELAGO') {
      // 3 clearly separated oceanic islands with deep sea channels
      const noise = prng.harmonicNoise(x, baseFreq * 1.3, p1, p2, p3) * 0.75;
      const islandMask = Math.pow(Math.sin((x / width) * Math.PI * 3 + p2 * 0.5), 2);
      const trench = (1 - islandMask) * 440;
      const edgeDrop = Math.pow(Math.abs(x - width / 2) / (width / 2), 3.2) * 500;
      groundY = height * 0.42 + noise + trench + edgeDrop;
    } else if (theme === 'NATURAL_ARCHES') {
      // Mountain ridges prepared for massive natural rock bridge arches
      const noise = prng.harmonicNoise(x, baseFreq * 0.9, p1, p2, p3);
      const edgeDrop = Math.pow(Math.abs(x - width / 2) / (width / 2), 2.5) * 400;
      groundY = height * 0.38 + noise + edgeDrop;
    } else if (theme === 'SPIRES') {
      // Dramatic narrow vertical stone needles and spires with deep gorges
      const noise = prng.harmonicNoise(x, baseFreq * 2.2, p1, p2, p3) * 0.6;
      const spireHarmonic = Math.pow(Math.sin((x / width) * Math.PI * 5 + p1), 6) * -260;
      const edgeDrop = Math.pow(Math.abs(x - width / 2) / (width / 2), 2.2) * 350;
      groundY = height * 0.56 + noise + spireHarmonic + edgeDrop;
    } else if (theme === 'WORM_CAVES') {
      // Solid massive subterranean rock slab
      groundY = 16;
    } else if (theme === 'FLOATING_CHAOS') {
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
    } else {
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
    }

    baseGroundY[x] = groundY;
  }

  // 1.5 Fill Terrain Grid from Heightmap (Ultra-fast direct memory write)
  for (let x = 0; x < width; x++) {
    // Cavern Roof Ceiling
    if (theme === 'CAVERN') {
      const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.8;
      const roofY = height * 0.2 + roofNoise;
      const maxRoofY = Math.min(height, Math.max(0, Math.floor(roofY)));
      for (let y = 0; y < maxRoofY; y++) {
        grid[y * width + x] = 1;
      }
    }

    if (theme === 'WORM_CAVES') {
      for (let y = 16; y < height; y++) {
        grid[y * width + x] = 1;
      }
    } else {
      const startY = Math.max(0, Math.min(height - 1, Math.floor(baseGroundY[x])));
      for (let y = startY; y < height; y++) {
        grid[y * width + x] = 1;
      }
    }
  }

  // 2. Organic Cave Networks, Tunnels & Archways
  const caveCount = theme === 'CAVERN' ? 24 : theme === 'WORM_CAVES' ? 0 : 14;
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

  // 2.5 Monumental Natural Rock Arches Carving (for NATURAL_ARCHES theme)
  if (theme === 'NATURAL_ARCHES') {
    const archPositions = [width * 0.32, width * 0.68];
    for (const archX of archPositions) {
      const archY = height * 0.54;
      const rx = 120;
      const ry = 90;
      for (let y = Math.max(0, Math.floor(archY - ry)); y <= Math.min(height - 1, Math.ceil(archY + ry + 30)); y++) {
        for (let x = Math.max(0, Math.floor(archX - rx)); x <= Math.min(width - 1, Math.ceil(archX + rx)); x++) {
          const dx = (x - archX) / rx;
          const dy = (y - archY) / ry;
          if (dx * dx + dy * dy <= 1.0) {
            grid[y * width + x] = 0;
          }
        }
      }
    }
  }

  // 2.6 Multi-Agent Continuous Perlin Worms Tunnel Network (for WORM_CAVES theme)
  if (theme === 'WORM_CAVES') {
    // Swarm of 10 narrow, winding underground worms (radius 13 to 20px) creating tight labyrinthine tunnels
    const wormCount = 10;
    for (let w = 0; w < wormCount; w++) {
      let wx = prng.range(width * 0.1, width * 0.9);
      let wy = prng.range(50, waterLevel - 60);
      let angle = prng.range(0, Math.PI * 2);
      const steps = Math.floor(prng.range(120, 220));

      for (let s = 0; s < steps; s++) {
        angle += (prng.next() - 0.5) * 0.5;
        const speed = prng.range(3.5, 6);
        wx += Math.cos(angle) * speed;
        wy += Math.sin(angle) * speed;

        if (wx < 60 || wx > width - 60 || wy < 32 || wy > waterLevel - 35) {
          angle += Math.PI * 0.5 + (prng.next() - 0.5) * 0.3;
          wx = Math.max(65, Math.min(width - 65, wx));
          wy = Math.max(35, Math.min(waterLevel - 40, wy));
        }

        // Tight tunnel radius (radius 13 to 20px -> diameter 26 to 40px)
        const wormRadius = Math.floor(prng.range(13, 20));
        const minX = Math.max(0, Math.floor(wx - wormRadius));
        const maxX = Math.min(width - 1, Math.ceil(wx + wormRadius));
        const minY = Math.max(17, Math.floor(wy - wormRadius)); // Preserve bedrock ceiling
        const maxY = Math.min(height - 1, Math.ceil(wy + wormRadius));

        for (let y = minY; y <= maxY; y++) {
          const dy = y - wy;
          const rowOffset = y * width;
          for (let x = minX; x <= maxX; x++) {
            const dx = x - wx;
            if (dx * dx + dy * dy <= wormRadius * wormRadius) {
              grid[rowOffset + x] = 0;
            }
          }
        }
      }
    }

    // 4 small intersection crossroad chambers (radius 22 to 28px)
    const hubCount = 4;
    for (let h = 0; h < hubCount; h++) {
      const hx = prng.range(width * 0.2, width * 0.8);
      const hy = prng.range(80, waterLevel - 80);
      const hr = prng.range(22, 28);
      for (let y = Math.max(17, Math.floor(hy - hr)); y <= Math.min(height - 1, Math.ceil(hy + hr)); y++) {
        const dy = y - hy;
        const rowOffset = y * width;
        for (let x = Math.max(0, Math.floor(hx - hr)); x <= Math.min(width - 1, Math.ceil(hx + hr)); x++) {
          const dx = x - hx;
          if (dx * dx + dy * dy <= hr * hr) {
            grid[rowOffset + x] = 0;
          }
        }
      }
    }
  }

  // 3. Floating Rock Islands / Ledges in Sky / Cavern
  const floatingIslandCount = theme === 'CAVERN' ? 6 : theme === 'WORM_CAVES' ? 0 : theme === 'ARCHIPELAGO' ? 5 : 4;
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

  // 3.5 Enforce Solid Bedrock Ceiling for CAVERN & WORM_CAVES Maps
  if (theme === 'CAVERN' || theme === 'WORM_CAVES') {
    for (let y = 0; y <= 16; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        grid[rowOffset + x] = 1;
      }
    }
  }

  // 4. Safe Spawn Points Generator
  const spawnPoints: Vector2D[] = [];
  const step = Math.floor((width - 240) / 14);
  const searchStartY = theme === 'CAVERN' ? 120 : theme === 'WORM_CAVES' ? 35 : 40;
  const minHeadroom = theme === 'WORM_CAVES' ? 12 : 22;

  for (let x = 120; x < width - 120; x += step) {
    for (let y = searchStartY; y < waterLevel - 30; y++) {
      if (grid[y * width + x] === 1 && grid[(y - 1) * width + x] === 0) {
        let openHeadroom = 0;
        for (let checkY = y - 1; checkY >= Math.max(0, y - 30); checkY--) {
          if (grid[checkY * width + x] === 0) openHeadroom++;
        }
        if (openHeadroom >= minHeadroom) {
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

  // 6. Solid Destructible Decor Props Generator (Trees, Bunkers, Totems, Cacti, Crystals, Oil Drums, Lampposts, Hedgehogs, Chicks, Mushrooms, Flowers)
  const solidProps: SolidProp[] = [];

  const stampSolidProp = (
    type: SolidProp['type'],
    px: number,
    py: number,
    pWidth: number,
    pHeight: number,
    variant?: number
  ) => {
    // 1. Calculate ground surface slope angle around placement point first
    let leftY = py;
    let rightY = py;
    const sampleDist = 8;
    const leftX = Math.max(0, px - sampleDist);
    const rightX = Math.min(width - 1, px + sampleDist);

    for (let y = Math.max(0, py - 35); y <= Math.min(height - 1, py + 35); y++) {
      if (grid[y * width + leftX] === 1 && (y === 0 || grid[(y - 1) * width + leftX] === 0)) {
        leftY = y;
        break;
      }
    }
    for (let y = Math.max(0, py - 35); y <= Math.min(height - 1, py + 35); y++) {
      if (grid[y * width + rightX] === 1 && (y === 0 || grid[(y - 1) * width + rightX] === 0)) {
        rightY = y;
        break;
      }
    }

    const rawSlopeAngle = Math.atan2(rightY - leftY, rightX - leftX);
    // Clamp slope angle within [-0.65, 0.65] rad (~ +-37 deg) so props stand naturally on slopes without flipping
    const angleRad = Math.max(-0.65, Math.min(0.65, rawSlopeAngle));

    // 2. Stamp Exact Tilted Hitbox into the physics collision grid
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const halfW = pWidth / 2;
    const maxDim = Math.ceil(Math.hypot(halfW, pHeight)) + 2;

    const minX = Math.max(0, px - maxDim);
    const maxX = Math.min(width - 1, px + maxDim);
    const minY = Math.max(0, py - maxDim);
    const maxY = Math.min(height - 1, py + maxDim);

    for (let y = minY; y <= maxY; y++) {
      const dy = y - py;
      const rowOffset = y * width;
      for (let x = minX; x <= maxX; x++) {
        const dx = x - px;
        // Transform world coordinate into prop's local coordinate system rotated by angleRad
        const localX = dx * cosA + dy * sinA;
        const localY = -dx * sinA + dy * cosA;

        // Check if inside prop rectangle: [-halfW .. halfW] horizontally, [-pHeight .. 0] vertically
        if (Math.abs(localX) <= halfW && localY >= -pHeight && localY <= 0) {
          if (grid[rowOffset + x] === 0) {
            grid[rowOffset + x] = 2; // Mark as IS_SOLID_PROP
          }
        }
      }
    }

    solidProps.push({
      id: `sprop_${type}_${solidProps.length}`,
      type,
      x: px,
      y: py,
      width: pWidth,
      height: pHeight,
      angleRad,
      variant,
    });
  };

  const isFarFromProps = (testX: number, minDist: number = 55) => {
    return !solidProps.some((p) => Math.abs(p.x - testX) < minDist);
  };

  // 1. Fortified Concrete Bunkers (1-2 bunkers on hills or fortresses)
  const bunkerCount = theme === 'WORM_CAVES' ? 0 : Math.floor(prng.range(1, 3));
  for (let i = 0; i < bunkerCount; i++) {
    for (let attempts = 0; attempts < 25; attempts++) {
      const bx = Math.floor(prng.range(160 + i * 420, 380 + i * 420));
      if (!isFarFromProps(bx, 75)) continue;

      let placed = false;
      for (let by = searchStartY; by < waterLevel - 50; by++) {
        if (grid[by * width + bx] === 1 && grid[(by - 1) * width + bx] === 0) {
          stampSolidProp('bunker', bx, by, 38, 26, Math.floor(prng.range(0, 2)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 2. Ancient Moai / Tiki Totem Idols (1-2 totems)
  const totemCount = theme === 'WORM_CAVES' ? 0 : Math.floor(prng.range(1, 3));
  for (let i = 0; i < totemCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const tx = Math.floor(prng.range(220 + i * 460, 460 + i * 460));
      if (!isFarFromProps(tx, 70)) continue;

      let placed = false;
      for (let ty = searchStartY; ty < waterLevel - 50; ty++) {
        if (grid[ty * width + tx] === 1 && grid[(ty - 1) * width + tx] === 0) {
          stampSolidProp('totem', tx, ty, 26, 36, Math.floor(prng.range(0, 2)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 3. Saguaro Wild West Cacti (2-4 cacti on hills)
  const cactusCount = (theme === 'CAVERN' || theme === 'WORM_CAVES') ? 0 : Math.floor(prng.range(2, 4));
  for (let i = 0; i < cactusCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const cx = Math.floor(prng.range(120, width - 120));
      if (!isFarFromProps(cx, 60)) continue;

      let placed = false;
      for (let cy = searchStartY; cy < waterLevel - 50; cy++) {
        if (grid[cy * width + cx] === 1 && grid[(cy - 1) * width + cx] === 0) {
          stampSolidProp('cactus', cx, cy, 24, 38, Math.floor(prng.range(0, 3)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 4. Luminous Crystal Geodes (3-5 glowing crystal clusters)
  const crystalCount = theme === 'WORM_CAVES' ? 6 : Math.floor(prng.range(3, 5));
  for (let i = 0; i < crystalCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const rx = Math.floor(prng.range(100, width - 100));
      if (!isFarFromProps(rx, 55)) continue;

      let placed = false;
      for (let ry = searchStartY; ry < waterLevel - 30; ry++) {
        if (grid[ry * width + rx] === 1 && grid[(ry - 1) * width + rx] === 0) {
          stampSolidProp('crystal', rx, ry, 28, 26, Math.floor(prng.range(0, 3)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 5. Industrial Hazard Oil Drums (2-3 barrels)
  const drumCount = theme === 'WORM_CAVES' ? 5 : Math.floor(prng.range(2, 4));
  for (let i = 0; i < drumCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const dx = Math.floor(prng.range(140, width - 140));
      if (!isFarFromProps(dx, 55)) continue;

      let placed = false;
      for (let dy = searchStartY; dy < waterLevel - 30; dy++) {
        if (grid[dy * width + dx] === 1 && grid[(dy - 1) * width + dx] === 0) {
          stampSolidProp('oil_drum', dx, dy, 20, 26, Math.floor(prng.range(0, 2)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 6. Vintage Street Lampposts (1-2 lampposts)
  const lampCount = (theme === 'CAVERN' || theme === 'WORM_CAVES') ? 0 : Math.floor(prng.range(1, 3));
  for (let i = 0; i < lampCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const lx = Math.floor(prng.range(150, width - 150));
      if (!isFarFromProps(lx, 65)) continue;

      let placed = false;
      for (let ly = searchStartY; ly < waterLevel - 50; ly++) {
        if (grid[ly * width + lx] === 1 && grid[(ly - 1) * width + lx] === 0) {
          stampSolidProp('lamppost', lx, ly, 18, 42);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 7. Trees (2-4 trees)
  const treeCount = (theme === 'CAVERN' || theme === 'WORM_CAVES') ? 0 : Math.floor(prng.range(2, 5));
  for (let i = 0; i < treeCount; i++) {
    for (let attempts = 0; attempts < 25; attempts++) {
      const tx = Math.floor(prng.range(120 + i * 220, 280 + i * 220));
      if (!isFarFromProps(tx, 55)) continue;

      let placed = false;
      for (let ty = searchStartY; ty < waterLevel - 60; ty++) {
        if (grid[ty * width + tx] === 1 && grid[(ty - 1) * width + tx] === 0) {
          stampSolidProp('tree', tx, ty, 32, 48, Math.floor(prng.range(0, 2)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 8. Hedgehogs (1-2 hedgehogs)
  const hedgehogCount = theme === 'WORM_CAVES' ? 0 : Math.floor(prng.range(1, 3));
  for (let i = 0; i < hedgehogCount; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const hx = Math.floor(prng.range(180 + i * 350, 320 + i * 350));
      if (!isFarFromProps(hx, 60)) continue;

      let placed = false;
      for (let hy = searchStartY; hy < waterLevel - 60; hy++) {
        if (grid[hy * width + hx] === 1 && grid[(hy - 1) * width + hx] === 0) {
          stampSolidProp('hedgehog', hx, hy, 26, 22);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 9. Chicks (1-2 chicks)
  const chickCount = theme === 'WORM_CAVES' ? 0 : Math.floor(prng.range(1, 3));
  for (let i = 0; i < chickCount; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const cx = Math.floor(prng.range(220 + i * 360, 380 + i * 360));
      if (!isFarFromProps(cx, 70)) continue;

      let placed = false;
      for (let cy = searchStartY; cy < waterLevel - 60; cy++) {
        if (grid[cy * width + cx] === 1 && grid[(cy - 1) * width + cx] === 0) {
          stampSolidProp('chick', cx, cy, 28, 24);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 10. Mushrooms (4-6 mushrooms)
  const mushroomCount = theme === 'WORM_CAVES' ? 8 : Math.floor(prng.range(4, 7));
  for (let i = 0; i < mushroomCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const rx = Math.floor(prng.range(100, width - 100));
      if (!isFarFromProps(rx, 55)) continue;

      let placed = false;
      for (let ry = searchStartY; ry < waterLevel - 20; ry++) {
        if (grid[ry * width + rx] === 1 && grid[(ry - 1) * width + rx] === 0) {
          stampSolidProp('mushroom', rx, ry, 22, 22, Math.floor(prng.range(0, 3)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 11. Flowers (5-8 flowers)
  const flowerCount = (theme === 'CAVERN' || theme === 'WORM_CAVES') ? 0 : Math.floor(prng.range(5, 9));
  for (let i = 0; i < flowerCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const fx = Math.floor(prng.range(80, width - 80));
      if (!isFarFromProps(fx, 50)) continue;

      let placed = false;
      for (let fy = searchStartY; fy < waterLevel - 20; fy++) {
        if (grid[fy * width + fx] === 1 && grid[(fy - 1) * width + fx] === 0) {
          stampSolidProp('flower', fx, fy, 20, 24, Math.floor(prng.range(0, 4)));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // 7. Visual Background Decor Items (Hanging Leaf Roots & Floating Butterflies)
  const decorItems: DecorItem[] = [];

  // Hanging Leaf Roots under ceiling overhangs (10-16 leaves)
  const leafCount = (theme === 'CAVERN' || theme === 'WORM_CAVES') ? 8 : 4;
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

  // Floating Butterflies in sky (5-8 butterflies)
  const bCount = (theme === 'CAVERN' || theme === 'WORM_CAVES') ? 0 : Math.floor(prng.range(5, 8));
  for (let i = 0; i < bCount; i++) {
    decorItems.push({
      id: `bfly_${i}`,
      type: 'butterfly',
      x: prng.range(150, width - 150),
      y: prng.range(60, 260),
      variant: Math.floor(prng.range(0, 3)),
    });
  }

  return { width, height, theme, seed, waterLevel, grid, spawnPoints, minePoints, decorItems, solidProps };
}
