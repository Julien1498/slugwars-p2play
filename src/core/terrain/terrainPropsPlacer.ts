import { MapTheme, SolidProp } from '../types';
import { SeededRandom } from './SeededRandom';
import { getThemeConfig } from './themeRegistry';

export function generateSolidProps(
  grid: Uint8Array,
  prng: SeededRandom,
  theme: MapTheme,
  width: number,
  height: number,
  waterLevel: number,
  searchStartY: number,
  findAllFloorsAt: (x: number, minY?: number, maxY?: number) => number[]
): SolidProp[] {
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

  const config = getThemeConfig(theme);
  const { decor } = config;

  const isFarFromProps = (testX: number, minDist: number = 55) => {
    return !solidProps.some((p) => Math.abs(p.x - testX) < minDist);
  };

  // 1. Fortified Concrete Bunkers (1-2 bunkers on hills or fortresses)
  const bunkerCount = decor.bunkers > 0 ? Math.floor(prng.range(1, 3)) : 0;
  for (let i = 0; i < bunkerCount; i++) {
    for (let attempts = 0; attempts < 25; attempts++) {
      const bx = Math.floor(prng.range(160 + i * 420, 380 + i * 420));
      if (!isFarFromProps(bx, 75)) continue;

      const floors = findAllFloorsAt(bx, searchStartY, waterLevel - 50);
      if (floors.length > 0) {
        const by = floors[0]; // Top exterior surface
        stampSolidProp('bunker', bx, by, 38, 26, Math.floor(prng.range(0, 2)));
        break;
      }
    }
  }

  // 2. Ancient Moai / Tiki Totem Idols (1-2 totems placed on hills or cave alcoves)
  const totemCount = decor.totems > 0 ? Math.floor(prng.range(1, 3)) : 0;
  for (let i = 0; i < totemCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const tx = Math.floor(prng.range(220 + i * 460, 460 + i * 460));
      if (!isFarFromProps(tx, 70)) continue;

      const floors = findAllFloorsAt(tx, searchStartY, waterLevel - 50);
      if (floors.length > 0) {
        const ty = floors[Math.floor(prng.range(0, floors.length))];
        stampSolidProp('totem', tx, ty, 26, 36, Math.floor(prng.range(0, 2)));
        break;
      }
    }
  }

  // 3. Saguaro Wild West Cacti (2-4 cacti on hills)
  const cactusCount = decor.cacti > 0 ? Math.floor(prng.range(2, 4)) : 0;
  for (let i = 0; i < cactusCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const cx = Math.floor(prng.range(120, width - 120));
      if (!isFarFromProps(cx, 60)) continue;

      const floors = findAllFloorsAt(cx, searchStartY, waterLevel - 50);
      if (floors.length > 0) {
        const cy = floors[0];
        stampSolidProp('cactus', cx, cy, 24, 38, Math.floor(prng.range(0, 3)));
        break;
      }
    }
  }

  // 4. Luminous Crystal Geodes (3-5 glowing crystal clusters across subterranean tunnels & chambers)
  const crystalCount = decor.crystals > 0 ? (decor.crystals >= 6 ? 6 : Math.floor(prng.range(3, 5))) : 0;
  for (let i = 0; i < crystalCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const rx = Math.floor(prng.range(100, width - 100));
      if (!isFarFromProps(rx, 55)) continue;

      const floors = findAllFloorsAt(rx, searchStartY, waterLevel - 30);
      if (floors.length > 0) {
        const ry = floors[Math.floor(prng.range(0, floors.length))];
        stampSolidProp('crystal', rx, ry, 28, 26, Math.floor(prng.range(0, 3)));
        break;
      }
    }
  }

  // 5. Industrial Hazard Oil Drums (2-4 barrels on surfaces and tunnel routes)
  const drumCount = decor.oilDrums > 0 ? (decor.oilDrums >= 5 ? 5 : Math.floor(prng.range(2, 4))) : 0;
  for (let i = 0; i < drumCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const dx = Math.floor(prng.range(140, width - 140));
      if (!isFarFromProps(dx, 55)) continue;

      const floors = findAllFloorsAt(dx, searchStartY, waterLevel - 30);
      if (floors.length > 0) {
        const dy = floors[Math.floor(prng.range(0, floors.length))];
        stampSolidProp('oil_drum', dx, dy, 20, 26, Math.floor(prng.range(0, 2)));
        break;
      }
    }
  }

  // 6. Vintage Street Lampposts (1-2 lampposts)
  const lampCount = decor.lampposts > 0 ? Math.floor(prng.range(1, 3)) : 0;
  for (let i = 0; i < lampCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const lx = Math.floor(prng.range(150, width - 150));
      if (!isFarFromProps(lx, 65)) continue;

      const floors = findAllFloorsAt(lx, searchStartY, waterLevel - 50);
      if (floors.length > 0) {
        const ly = floors[0];
        stampSolidProp('lamppost', lx, ly, 18, 42);
        break;
      }
    }
  }

  // 7. Trees (2-4 trees on upper contours)
  const treeCount = decor.trees > 0 ? Math.floor(prng.range(2, 5)) : 0;
  for (let i = 0; i < treeCount; i++) {
    for (let attempts = 0; attempts < 25; attempts++) {
      const tx = Math.floor(prng.range(120 + i * 220, 280 + i * 220));
      if (!isFarFromProps(tx, 55)) continue;

      const floors = findAllFloorsAt(tx, searchStartY, waterLevel - 60);
      if (floors.length > 0) {
        const ty = floors[0];
        stampSolidProp('tree', tx, ty, 32, 48, Math.floor(prng.range(0, 2)));
        break;
      }
    }
  }

  // 8. Hedgehogs (1-2 hedgehogs)
  const hedgehogCount = decor.hedgehogs > 0 ? Math.floor(prng.range(1, 3)) : 0;
  for (let i = 0; i < hedgehogCount; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const hx = Math.floor(prng.range(180 + i * 350, 320 + i * 350));
      if (!isFarFromProps(hx, 60)) continue;

      const floors = findAllFloorsAt(hx, searchStartY, waterLevel - 60);
      if (floors.length > 0) {
        const hy = floors[Math.floor(prng.range(0, floors.length))];
        stampSolidProp('hedgehog', hx, hy, 26, 22);
        break;
      }
    }
  }

  // 9. Chicks (1-2 chicks)
  const chickCount = decor.chicks > 0 ? Math.floor(prng.range(1, 3)) : 0;
  for (let i = 0; i < chickCount; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const cx = Math.floor(prng.range(220 + i * 360, 380 + i * 360));
      if (!isFarFromProps(cx, 70)) continue;

      const floors = findAllFloorsAt(cx, searchStartY, waterLevel - 60);
      if (floors.length > 0) {
        const cy = floors[Math.floor(prng.range(0, floors.length))];
        stampSolidProp('chick', cx, cy, 28, 24);
        break;
      }
    }
  }

  // 10. Mushrooms (4-6 mushrooms in caves and subterranean tunnels)
  const mushroomCount = decor.mushrooms > 0 ? (decor.mushrooms >= 8 ? 8 : Math.floor(prng.range(4, 7))) : 0;
  for (let i = 0; i < mushroomCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const rx = Math.floor(prng.range(100, width - 100));
      if (!isFarFromProps(rx, 55)) continue;

      const floors = findAllFloorsAt(rx, searchStartY, waterLevel - 20);
      if (floors.length > 0) {
        const ry = floors[Math.floor(prng.range(0, floors.length))];
        stampSolidProp('mushroom', rx, ry, 22, 22, Math.floor(prng.range(0, 3)));
        break;
      }
    }
  }

  // 11. Flowers (5-8 flowers)
  const flowerCount = decor.flowers > 0 ? Math.floor(prng.range(5, 9)) : 0;
  for (let i = 0; i < flowerCount; i++) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const fx = Math.floor(prng.range(80, width - 80));
      if (!isFarFromProps(fx, 50)) continue;

      const floors = findAllFloorsAt(fx, searchStartY, waterLevel - 20);
      if (floors.length > 0) {
        const fy = floors[0];
        stampSolidProp('flower', fx, fy, 20, 24, Math.floor(prng.range(0, 4)));
        break;
      }
    }
  }

  return solidProps;
}
