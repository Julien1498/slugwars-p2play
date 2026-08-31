import { MapTheme } from '../types';
import { SeededRandom } from './SeededRandom';
import { getThemeConfig } from './themeRegistry';

export function carveTerrainFeatures(
  grid: Uint8Array,
  prng: SeededRandom,
  theme: MapTheme,
  width: number,
  height: number,
  waterLevel: number
) {
  const config = getThemeConfig(theme);
  const { tunnels, diggers, arches, floatingIslands } = config.topology;
  const { hasSolidCeiling } = config.physics;

  // 2. Organic Cave Tunnels & Natural Chambers
  if (tunnels > 0) {
    // A. Natural Subterranean Tunnels & Open-Air Cave Portals
    const tunnelCount = tunnels;
    for (let t = 0; t < tunnelCount; t++) {
      // 65% of tunnels start near mountain slopes/cliffs and carve inwards or breach open air
      const isSurfaceBreaching = prng.next() < 0.65;
      let tx = isSurfaceBreaching
        ? (prng.next() > 0.5 ? prng.range(width * 0.15, width * 0.38) : prng.range(width * 0.62, width * 0.85))
        : prng.range(width * 0.2, width * 0.8);
      let ty = prng.range(height * 0.3, waterLevel - 90);
      let angle = isSurfaceBreaching
        ? (tx < width * 0.5 ? prng.range(-0.4, 0.9) : prng.range(2.2, 3.5))
        : prng.range(0, Math.PI * 2);
      const steps = Math.floor(prng.range(70, 130));
      const tunnelRadius = Math.floor(prng.range(18, 28));

      for (let s = 0; s < steps; s++) {
        angle += (prng.next() - 0.5) * 0.4;
        const speed = prng.range(4.0, 6.0);
        tx += Math.cos(angle) * speed;
        ty += Math.sin(angle) * speed;

        if (tx < 60 || tx > width - 60 || ty < 35 || ty > waterLevel - 35) {
          angle += Math.PI * 0.5 + (prng.next() - 0.5) * 0.3;
          tx = Math.max(65, Math.min(width - 65, tx));
          ty = Math.max(40, Math.min(waterLevel - 40, ty));
        }

        const minX = Math.max(0, Math.floor(tx - tunnelRadius));
        const maxX = Math.min(width - 1, Math.ceil(tx + tunnelRadius));
        const minY = Math.max(hasSolidCeiling ? 17 : 0, Math.floor(ty - tunnelRadius));
        const maxY = Math.min(height - 1, Math.ceil(ty + tunnelRadius));
        const rSq = tunnelRadius * tunnelRadius;
        for (let y = minY; y <= maxY; y++) {
          const dy = y - ty;
          const dySq = dy * dy;
          if (dySq > rSq) continue;
          const dxMax = Math.sqrt(rSq - dySq);
          const startX = Math.max(0, Math.ceil(tx - dxMax));
          const endX = Math.min(width - 1, Math.floor(tx + dxMax));
          if (startX <= endX) {
            grid.fill(0, y * width + startX, y * width + endX + 1);
          }
        }
      }
    }

    // B. A Few Natural Round/Oval Pockets & Chambers
    const chamberCount = tunnels >= 8 ? 8 : 4;
    for (let i = 0; i < chamberCount; i++) {
      const cx = Math.floor(prng.range(150, width - 150));
      const cy = Math.floor(prng.range(height * 0.38, waterLevel - 90));
      const rx = Math.floor(prng.range(32, 60));
      const ry = Math.floor(prng.range(24, 45));

      const rySq = ry * ry;
      const rxOverRy = rx / ry;
      const minY = Math.max(hasSolidCeiling ? 17 : 0, cy - ry);
      const maxY = Math.min(height - 1, cy + ry);

      for (let y = minY; y <= maxY; y++) {
        const dy = y - cy;
        const dySq = dy * dy;
        if (dySq > rySq) continue;
        const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
        const startX = Math.max(0, Math.ceil(cx - dxMax));
        const endX = Math.min(width - 1, Math.floor(cx + dxMax));
        if (startX <= endX) {
          grid.fill(0, y * width + startX, y * width + endX + 1);
        }
      }
    }
  }

  // 2.5 Monumental Natural Rock Arches Carving
  if (arches > 0) {
    const archPositions = [width * 0.32, width * 0.68];
    for (const archX of archPositions) {
      const archY = height * 0.54;
      const rx = 120;
      const ry = 90;
      const rySq = ry * ry;
      const rxOverRy = rx / ry;
      const minY = Math.max(0, Math.floor(archY - ry));
      const maxY = Math.min(height - 1, Math.ceil(archY + ry + 30));

      for (let y = minY; y <= maxY; y++) {
        const dy = y - archY;
        const dySq = dy * dy;
        if (dySq > rySq) continue;
        const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
        const startX = Math.max(0, Math.ceil(archX - dxMax));
        const endX = Math.min(width - 1, Math.floor(archX + dxMax));
        if (startX <= endX) {
          grid.fill(0, y * width + startX, y * width + endX + 1);
        }
      }
    }
  }

  // 2.6 Multi-Agent Continuous Tunnel Network
  if (diggers > 0) {
    const tunnelDiggerCount = diggers;
    for (let w = 0; w < tunnelDiggerCount; w++) {
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
        const diggerRadius = Math.floor(prng.range(13, 20));
        const minY = Math.max(17, Math.floor(wy - diggerRadius)); // Preserve bedrock ceiling
        const maxY = Math.min(height - 1, Math.ceil(wy + diggerRadius));
        const rSq = diggerRadius * diggerRadius;

        for (let y = minY; y <= maxY; y++) {
          const dy = y - wy;
          const dySq = dy * dy;
          if (dySq > rSq) continue;
          const dxMax = Math.sqrt(rSq - dySq);
          const startX = Math.max(0, Math.ceil(wx - dxMax));
          const endX = Math.min(width - 1, Math.floor(wx + dxMax));
          if (startX <= endX) {
            grid.fill(0, y * width + startX, y * width + endX + 1);
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
      const hrSq = hr * hr;
      const minY = Math.max(17, Math.floor(hy - hr));
      const maxY = Math.min(height - 1, Math.ceil(hy + hr));

      for (let y = minY; y <= maxY; y++) {
        const dy = y - hy;
        const dySq = dy * dy;
        if (dySq > hrSq) continue;
        const dxMax = Math.sqrt(hrSq - dySq);
        const startX = Math.max(0, Math.ceil(hx - dxMax));
        const endX = Math.min(width - 1, Math.floor(hx + dxMax));
        if (startX <= endX) {
          grid.fill(0, y * width + startX, y * width + endX + 1);
        }
      }
    }
  }

  // 3. Tactical Cradle Floating Islands & Suspended Defensive Nests (Plateformes en cuvette protectrice)
  const stampTacticalFloatingIsland = (fx: number, fy: number, rx: number, ry: number) => {
    const minX = Math.max(0, Math.floor(fx - rx));
    const maxX = Math.min(width - 1, Math.ceil(fx + rx));
    const maxY = Math.min(waterLevel - 45, Math.ceil(fy + ry));

    for (let x = minX; x <= maxX; x++) {
      const u = (x - fx) / rx; // Normalized [-1 .. 1]
      const uSq = u * u;
      if (uSq > 1.0) continue;

      // Solid curved rock underbelly
      const bottomY = fy + Math.sqrt(1.0 - uSq) * ry;

      // Tactical cradle profile: sheltered central basin with raised defensive parapets on left & right
      const lip = Math.sin(Math.abs(u) * Math.PI) * (Math.abs(u) > 0.35 ? 0.4 : 0.0);
      const topDip = (1.0 - uSq) * 0.35 - lip;
      const topY = fy - topDip * ry;

      const rowStart = Math.max(hasSolidCeiling ? 17 : 0, Math.floor(topY));
      const rowEnd = Math.min(maxY, Math.ceil(bottomY));

      for (let y = rowStart; y <= rowEnd; y++) {
        grid[y * width + x] = 1;
      }
    }
  };

  if (floatingIslands > 0) {
    if (config.topology.heightmapType === 'CHAOS') {
      // 6 large tactical floating islands (160 to 280px wide) with deep defensive cradles
      const count = 6;
      for (let i = 0; i < count; i++) {
        const fx = Math.floor(prng.range(180, width - 180));
        const fy = Math.floor(prng.range(height * 0.25, waterLevel - 140));
        const rx = Math.floor(prng.range(80, 140));
        const ry = Math.floor(prng.range(32, 55));
        stampTacticalFloatingIsland(fx, fy, rx, ry);
      }
    } else if (hasSolidCeiling) {
      // 3 wide suspended subterranean rock shelves inside cavern
      const count = 3;
      for (let i = 0; i < count; i++) {
        const fx = Math.floor(prng.range(220, width - 220));
        const fy = Math.floor(prng.range(height * 0.42, waterLevel - 120));
        const rx = Math.floor(prng.range(75, 120));
        const ry = Math.floor(prng.range(26, 44));
        stampTacticalFloatingIsland(fx, fy, rx, ry);
      }
    } else {
      // 2 to 3 tactical defensive floating nests (130 to 210px wide) at safe mid-altitudes above the main continent
      const count = Math.floor(prng.range(2, 4));
      for (let i = 0; i < count; i++) {
        const fx = Math.floor(prng.range(200 + i * 280, 420 + i * 280));
        const fy = Math.floor(prng.range(height * 0.32, waterLevel - 160));
        const rx = Math.floor(prng.range(65, 105));
        const ry = Math.floor(prng.range(24, 38));
        stampTacticalFloatingIsland(fx, fy, rx, ry);
      }
    }
  }

  // 3.5 Enforce Solid Bedrock Ceiling for Cavern & Subterranean Maps
  if (hasSolidCeiling) {
    for (let y = 0; y <= 16; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        grid[rowOffset + x] = 1;
      }
    }
  }
}
