import { MapTheme } from '../types';
import { SeededRandom } from './SeededRandom';
import { getThemeConfig } from './themeRegistry';
import { carveCavernFlanksAndPillars } from './cavernCarver';

export function carveTerrainFeatures(
  grid: Uint8Array,
  prng: SeededRandom,
  theme: MapTheme,
  width: number,
  height: number,
  waterLevel: number,
  worldW: number = width,
  worldH: number = height
) {
  const config = getThemeConfig(theme);
  const { tunnels, diggers, arches, floatingIslands } = config.topology;
  const { hasSolidCeiling } = config.physics;
  const scaleX = width / worldW;
  const scaleY = height / worldH;
  const scaleR = (scaleX + scaleY) * 0.5;

  // 1. Organic Tunnels & Chambers
  if (tunnels > 0) {
    for (let t = 0; t < tunnels; t++) {
      const isSurfaceBreaching = prng.next() < 0.65;
      let rawTx = isSurfaceBreaching
        ? (prng.next() > 0.5 ? prng.range(worldW * 0.15, worldW * 0.38) : prng.range(worldW * 0.62, worldW * 0.85))
        : prng.range(worldW * 0.2, worldW * 0.8);
      let rawTy = prng.range(worldH * 0.3, (worldH - 80) - 90);
      let tx = rawTx * scaleX;
      let ty = rawTy * scaleY;
      let angle = isSurfaceBreaching
        ? (rawTx < worldW * 0.5 ? prng.range(-0.4, 0.9) : prng.range(2.2, 3.5))
        : prng.range(0, Math.PI * 2);
      const steps = Math.floor(prng.range(70, 130));
      const tunnelRadius = Math.max(1.5, prng.range(18, 28) * scaleR);

      for (let s = 0; s < steps; s++) {
        angle += (prng.next() - 0.5) * 0.4;
        const speed = prng.range(4.0, 6.0) * scaleR;
        tx += Math.cos(angle) * speed;
        ty += Math.sin(angle) * speed;

        if (tx < 60 * scaleX || tx > width - 60 * scaleX || ty < 35 * scaleY || ty > waterLevel - 35 * scaleY) {
          angle += Math.PI * 0.5 + (prng.next() - 0.5) * 0.3;
          tx = Math.max(65 * scaleX, Math.min(width - 65 * scaleX, tx));
          ty = Math.max(40 * scaleY, Math.min(waterLevel - 40 * scaleY, ty));
        }

        const minX = Math.max(0, Math.floor(tx - tunnelRadius));
        const maxX = Math.min(width - 1, Math.ceil(tx + tunnelRadius));
        const minY = Math.max(hasSolidCeiling ? Math.round(17 * scaleY) : 0, Math.floor(ty - tunnelRadius));
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

    const chamberCount = tunnels >= 8 ? 8 : 4;
    for (let i = 0; i < chamberCount; i++) {
      const cx = prng.range(150, worldW - 150) * scaleX;
      const cy = prng.range(worldH * 0.38, (worldH - 80) - 90) * scaleY;
      const rx = Math.max(2, prng.range(32, 60) * scaleX);
      const ry = Math.max(2, prng.range(24, 45) * scaleY);
      const rySq = ry * ry;
      const rxOverRy = rx / ry;
      const minY = Math.max(hasSolidCeiling ? Math.round(17 * scaleY) : 0, Math.floor(cy - ry));
      const maxY = Math.min(height - 1, Math.ceil(cy + ry));

      for (let y = minY; y <= maxY; y++) {
        const dy = y - cy;
        const dySq = dy * dy;
        if (dySq > rySq) continue;
        const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
        const startX = Math.max(0, Math.ceil(cx - dxMax));
        const endX = Math.min(width - 1, Math.floor(cx + dxMax));
        if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
      }
    }
  }

  // 2. Rock Arches
  if (arches > 0) {
    const archPositions = [width * 0.32, width * 0.68];
    for (const archX of archPositions) {
      const archY = height * 0.54;
      const rx = 120 * scaleX;
      const ry = 90 * scaleY;
      const rySq = ry * ry;
      const rxOverRy = rx / ry;
      const minY = Math.max(0, Math.floor(archY - ry));
      const maxY = Math.min(height - 1, Math.ceil(archY + ry + 30 * scaleY));

      for (let y = minY; y <= maxY; y++) {
        const dy = y - archY;
        const dySq = dy * dy;
        if (dySq > rySq) continue;
        const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
        const startX = Math.max(0, Math.ceil(archX - dxMax));
        const endX = Math.min(width - 1, Math.floor(archX + dxMax));
        if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
      }
    }
  }

  // 3. Diggers
  if (diggers > 0) {
    for (let w = 0; w < diggers; w++) {
      let wx = prng.range(worldW * 0.1, worldW * 0.9) * scaleX;
      let wy = prng.range(50, (worldH - 80) - 60) * scaleY;
      let angle = prng.range(0, Math.PI * 2);
      const steps = Math.floor(prng.range(120, 220));

      for (let s = 0; s < steps; s++) {
        angle += (prng.next() - 0.5) * 0.5;
        const speed = prng.range(3.5, 6) * scaleR;
        wx += Math.cos(angle) * speed;
        wy += Math.sin(angle) * speed;

        if (wx < 60 * scaleX || wx > width - 60 * scaleX || wy < 32 * scaleY || wy > waterLevel - 35 * scaleY) {
          angle += Math.PI * 0.5 + (prng.next() - 0.5) * 0.3;
          wx = Math.max(65 * scaleX, Math.min(width - 65 * scaleX, wx));
          wy = Math.max(35 * scaleY, Math.min(waterLevel - 40 * scaleY, wy));
        }

        const diggerRadius = Math.max(1.2, prng.range(13, 20) * scaleR);
        const minY = Math.max(hasSolidCeiling ? Math.round(17 * scaleY) : 0, Math.floor(wy - diggerRadius));
        const maxY = Math.min(height - 1, Math.ceil(wy + diggerRadius));
        const rSq = diggerRadius * diggerRadius;

        for (let y = minY; y <= maxY; y++) {
          const dy = y - wy;
          const dySq = dy * dy;
          if (dySq > rSq) continue;
          const dxMax = Math.sqrt(rSq - dySq);
          const startX = Math.max(0, Math.ceil(wx - dxMax));
          const endX = Math.min(width - 1, Math.floor(wx + dxMax));
          if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
        }
      }
    }

    const hubCount = 4;
    for (let h = 0; h < hubCount; h++) {
      const hx = prng.range(worldW * 0.2, worldW * 0.8) * scaleX;
      const hy = prng.range(80, (worldH - 80) - 80) * scaleY;
      const hr = Math.max(2, prng.range(22, 28) * scaleR);
      const hrSq = hr * hr;
      const minY = Math.max(hasSolidCeiling ? Math.round(17 * scaleY) : 0, Math.floor(hy - hr));
      const maxY = Math.min(height - 1, Math.ceil(hy + hr));

      for (let y = minY; y <= maxY; y++) {
        const dy = y - hy;
        const dySq = dy * dy;
        if (dySq > hrSq) continue;
        const dxMax = Math.sqrt(hrSq - dySq);
        const startX = Math.max(0, Math.ceil(hx - dxMax));
        const endX = Math.min(width - 1, Math.floor(hx + dxMax));
        if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
      }
    }
  }

  // 4. Floating Islands
  const stampTacticalFloatingIsland = (fx: number, fy: number, rx: number, ry: number) => {
    const minX = Math.max(0, Math.floor(fx - rx));
    const maxX = Math.min(width - 1, Math.ceil(fx + rx));
    const maxY = Math.min(waterLevel - Math.round(45 * scaleY), Math.ceil(fy + ry));

    for (let x = minX; x <= maxX; x++) {
      const u = (x - fx) / (rx || 1);
      const uSq = u * u;
      if (uSq > 1.0) continue;
      const bottomY = fy + Math.sqrt(1.0 - uSq) * ry;
      const lip = Math.sin(Math.abs(u) * Math.PI) * (Math.abs(u) > 0.35 ? 0.4 : 0.0);
      const topDip = (1.0 - uSq) * 0.35 - lip;
      const topY = fy - topDip * ry;
      const rowStart = Math.max(hasSolidCeiling ? Math.round(17 * scaleY) : 0, Math.floor(topY));
      const rowEnd = Math.min(maxY, Math.ceil(bottomY));

      for (let y = rowStart; y <= rowEnd; y++) {
        grid[y * width + x] = 1;
      }
    }
  };

  if (floatingIslands > 0) {
    if (config.topology.heightmapType === 'OPAL_ISLAND') {
      for (let i = 0; i < 6; i++) {
        const fx = prng.range(180, worldW - 180) * scaleX;
        const fy = prng.range(worldH * 0.25, (worldH - 80) - 140) * scaleY;
        const rx = prng.range(80, 140) * scaleX;
        const ry = prng.range(32, 55) * scaleY;
        stampTacticalFloatingIsland(fx, fy, rx, ry);
      }
    } else if (hasSolidCeiling) {
      for (let i = 0; i < 3; i++) {
        const fx = prng.range(220, worldW - 220) * scaleX;
        const fy = prng.range(worldH * 0.42, (worldH - 80) - 120) * scaleY;
        const rx = prng.range(75, 120) * scaleX;
        const ry = prng.range(26, 44) * scaleY;
        stampTacticalFloatingIsland(fx, fy, rx, ry);
      }
    } else {
      const count = Math.floor(prng.range(2, 4));
      for (let i = 0; i < count; i++) {
        const fx = prng.range(200 + i * 280, 420 + i * 280) * scaleX;
        const fy = prng.range(worldH * 0.32, (worldH - 80) - 160) * scaleY;
        const rx = prng.range(65, 105) * scaleX;
        const ry = prng.range(24, 38) * scaleY;
        stampTacticalFloatingIsland(fx, fy, rx, ry);
      }
    }
  }

  // 5. Bedrock Ceiling
  if (hasSolidCeiling) {
    const ceilingH = Math.max(1, Math.round(16 * scaleY));
    for (let y = 0; y <= ceilingH; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        grid[rowOffset + x] = 1;
      }
    }
  }

  // 6. Cavern Flank Tactical Balconies, Alcoves & Natural Rock Columns
  if (config.topology.heightmapType === 'CAVERN') {
    carveCavernFlanksAndPillars(grid, prng, width, height, worldW, worldH, scaleX, scaleY);
  }

  // 7. Fortress Subterranean Artillery Vaults & Canyon Firing Embrasures
  if (config.topology.heightmapType === 'FORTRESS') {
    const leftVaultX = prng.range(worldW * 0.16, worldW * 0.25) * scaleX;
    const rightVaultX = prng.range(worldW * 0.75, worldW * 0.84) * scaleX;
    const vaultY = (worldH * 0.52 + prng.range(-15, 15)) * scaleY;
    const rx = prng.range(42, 65) * scaleX;
    const ry = prng.range(22, 34) * scaleY;

    for (const vx of [leftVaultX, rightVaultX]) {
      const minX = Math.max(0, Math.floor(vx - rx));
      const maxX = Math.min(width - 1, Math.ceil(vx + rx));
      const minY = Math.max(0, Math.floor(vaultY - ry));
      const maxY = Math.min(height - 1, Math.ceil(vaultY + ry));
      const rySq = ry * ry;
      const rxOverRy = rx / ry;

      for (let y = minY; y <= maxY; y++) {
        const dy = y - vaultY;
        const dySq = dy * dy;
        if (dySq > rySq) continue;
        const dxMax = Math.sqrt(rySq - dySq) * rxOverRy;
        const startX = Math.max(0, Math.ceil(vx - dxMax));
        const endX = Math.min(width - 1, Math.floor(vx + dxMax));
        if (startX <= endX) grid.fill(0, y * width + startX, y * width + endX + 1);
      }

      // Canyon firing embrasure slit
      const isLeft = vx < width * 0.5;
      const slitYMin = Math.max(0, Math.floor(vaultY - 8 * scaleY));
      const slitYMax = Math.min(height - 1, Math.ceil(vaultY + 8 * scaleY));
      const slitStartX = isLeft ? Math.floor(vx) : Math.max(0, Math.floor(vx - rx - 55 * scaleX));
      const slitEndX = isLeft ? Math.min(width - 1, Math.ceil(vx + rx + 55 * scaleX)) : Math.floor(vx);
      for (let y = slitYMin; y <= slitYMax; y++) {
        grid.fill(0, y * width + slitStartX, y * width + slitEndX + 1);
      }
    }
  }
}
