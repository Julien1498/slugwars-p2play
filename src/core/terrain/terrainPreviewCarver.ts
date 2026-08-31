import { SeededRandom } from './SeededRandom';
import { ThemeConfig } from './themeRegistry';

interface PreviewScaleContext {
  grid: Uint8Array;
  prng: SeededRandom;
  config: ThemeConfig;
  previewWidth: number;
  previewHeight: number;
  nominalWidth: number;
  nominalHeight: number;
  scaleX: number;
  scaleY: number;
  waterLevel: number;
}

export function carvePreviewFeatures(ctx: PreviewScaleContext) {
  const { grid, prng, config, previewWidth, previewHeight, nominalWidth, nominalHeight, scaleX, scaleY, waterLevel } = ctx;
  const { tunnels, diggers, arches, floatingIslands, heightmapType } = config.topology;
  const { hasSolidCeiling } = config.physics;

  // 1. Cave Tunnels & Chambers
  if (tunnels > 0) {
    for (let t = 0; t < tunnels; t++) {
      const isSurfaceBreaching = prng.next() < 0.65;
      let tx = isSurfaceBreaching
        ? (prng.next() > 0.5 ? prng.range(nominalWidth * 0.15, nominalWidth * 0.38) : prng.range(nominalWidth * 0.62, nominalWidth * 0.85))
        : prng.range(nominalWidth * 0.2, nominalWidth * 0.8);
      let ty = prng.range(nominalHeight * 0.3, nominalHeight - 170);
      let angle = isSurfaceBreaching
        ? (tx < nominalWidth * 0.5 ? prng.range(-0.4, 0.9) : prng.range(2.2, 3.5))
        : prng.range(0, Math.PI * 2);
      const steps = Math.floor(prng.range(70, 130));
      const tunnelRadius = prng.range(18, 28) * scaleX;

      let ptx = tx * scaleX;
      let pty = ty * scaleY;

      for (let s = 0; s < steps; s++) {
        angle += (prng.next() - 0.5) * 0.4;
        const speed = prng.range(4.0, 6.0) * scaleX;
        ptx += Math.cos(angle) * speed;
        pty += Math.sin(angle) * speed;

        if (ptx < 4 || ptx > previewWidth - 4 || pty < 2 || pty > waterLevel - 2) {
          angle += Math.PI * 0.5 + (prng.next() - 0.5) * 0.3;
          ptx = Math.max(4, Math.min(previewWidth - 4, ptx));
          pty = Math.max(2, Math.min(waterLevel - 2, pty));
        }

        const minX = Math.max(0, Math.floor(ptx - tunnelRadius));
        const maxX = Math.min(previewWidth - 1, Math.ceil(ptx + tunnelRadius));
        const minY = Math.max(hasSolidCeiling ? Math.ceil(17 * scaleY) : 0, Math.floor(pty - tunnelRadius));
        const maxY = Math.min(previewHeight - 1, Math.ceil(pty + tunnelRadius));
        const rSq = tunnelRadius * tunnelRadius;

        for (let y = minY; y <= maxY; y++) {
          const dy = y - pty;
          const rowOffset = y * previewWidth;
          for (let x = minX; x <= maxX; x++) {
            const dx = x - ptx;
            if (dx * dx + dy * dy <= rSq) {
              grid[rowOffset + x] = 0;
            }
          }
        }
      }
    }

    const chamberCount = tunnels >= 8 ? 8 : 4;
    for (let i = 0; i < chamberCount; i++) {
      const cx = prng.range(150, nominalWidth - 150) * scaleX;
      const cy = prng.range(nominalHeight * 0.38, nominalHeight - 170) * scaleY;
      const rx = prng.range(32, 60) * scaleX;
      const ry = prng.range(24, 45) * scaleY;

      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(previewHeight - 1, Math.ceil(cy + ry)); y++) {
        for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(previewWidth - 1, Math.ceil(cx + rx)); x++) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1.0) {
            grid[y * previewWidth + x] = 0;
          }
        }
      }
    }
  }

  // 2. Monumental Rock Arches
  if (arches > 0) {
    const archPositions = [previewWidth * 0.32, previewWidth * 0.68];
    for (const archX of archPositions) {
      const archY = previewHeight * 0.54;
      const rx = 120 * scaleX;
      const ry = 90 * scaleY;
      for (let y = Math.max(0, Math.floor(archY - ry)); y <= Math.min(previewHeight - 1, Math.ceil(archY + ry)); y++) {
        for (let x = Math.max(0, Math.floor(archX - rx)); x <= Math.min(previewWidth - 1, Math.ceil(archX + rx)); x++) {
          const dx = (x - archX) / rx;
          const dy = (y - archY) / ry;
          if (dx * dx + dy * dy <= 1.0) {
            grid[y * previewWidth + x] = 0;
          }
        }
      }
    }
  }

  // 3. Multi-Digger Network
  if (diggers > 0) {
    for (let w = 0; w < diggers; w++) {
      let wx = prng.range(nominalWidth * 0.1, nominalWidth * 0.9) * scaleX;
      let wy = prng.range(50, nominalHeight - 140) * scaleY;
      let angle = prng.range(0, Math.PI * 2);
      const steps = Math.floor(prng.range(120, 220));

      for (let s = 0; s < steps; s++) {
        angle += (prng.next() - 0.5) * 0.5;
        const speed = prng.range(3.5, 6) * scaleX;
        wx += Math.cos(angle) * speed;
        wy += Math.sin(angle) * speed;

        if (wx < 4 || wx > previewWidth - 4 || wy < 2 || wy > waterLevel - 2) {
          angle += Math.PI * 0.5 + (prng.next() - 0.5) * 0.3;
          wx = Math.max(4, Math.min(previewWidth - 4, wx));
          wy = Math.max(2, Math.min(waterLevel - 2, wy));
        }

        const diggerRadius = prng.range(13, 20) * scaleX;
        const minX = Math.max(0, Math.floor(wx - diggerRadius));
        const maxX = Math.min(previewWidth - 1, Math.ceil(wx + diggerRadius));
        const minY = Math.max(Math.ceil(17 * scaleY), Math.floor(wy - diggerRadius));
        const maxY = Math.min(previewHeight - 1, Math.ceil(wy + diggerRadius));

        for (let y = minY; y <= maxY; y++) {
          const dy = y - wy;
          const rowOffset = y * previewWidth;
          for (let x = minX; x <= maxX; x++) {
            const dx = x - wx;
            if (dx * dx + dy * dy <= diggerRadius * diggerRadius) {
              grid[rowOffset + x] = 0;
            }
          }
        }
      }
    }

    for (let h = 0; h < 4; h++) {
      const hx = prng.range(nominalWidth * 0.2, nominalWidth * 0.8) * scaleX;
      const hy = prng.range(80, nominalHeight - 160) * scaleY;
      const hr = prng.range(22, 28) * scaleX;
      for (let y = Math.max(0, Math.floor(hy - hr)); y <= Math.min(previewHeight - 1, Math.ceil(hy + hr)); y++) {
        for (let x = Math.max(0, Math.floor(hx - hr)); x <= Math.min(previewWidth - 1, Math.ceil(hx + hr)); x++) {
          const dx = x - hx;
          const dy = y - hy;
          if (dx * dx + dy * dy <= hr * hr) {
            grid[y * previewWidth + x] = 0;
          }
        }
      }
    }
  }

  // 4. Tactical Floating Islands
  const stampIsland = (fx: number, fy: number, rx: number, ry: number) => {
    const minX = Math.max(0, Math.floor(fx - rx));
    const maxX = Math.min(previewWidth - 1, Math.ceil(fx + rx));
    const maxY = Math.min(waterLevel - 2, Math.ceil(fy + ry));

    for (let x = minX; x <= maxX; x++) {
      const u = (x - fx) / (rx || 1);
      const uSq = u * u;
      if (uSq > 1.0) continue;

      const bottomY = fy + Math.sqrt(1.0 - uSq) * ry;
      const lip = Math.sin(Math.abs(u) * Math.PI) * (Math.abs(u) > 0.35 ? 0.4 : 0.0);
      const topDip = (1.0 - uSq) * 0.35 - lip;
      const topY = fy - topDip * ry;

      const rowStart = Math.max(hasSolidCeiling ? Math.ceil(17 * scaleY) : 0, Math.floor(topY));
      const rowEnd = Math.min(maxY, Math.ceil(bottomY));

      for (let y = rowStart; y <= rowEnd; y++) {
        grid[y * previewWidth + x] = 1;
      }
    }
  };

  if (floatingIslands > 0) {
    if (heightmapType === 'CHAOS') {
      for (let i = 0; i < 6; i++) {
        const fx = prng.range(180, nominalWidth - 180) * scaleX;
        const fy = prng.range(nominalHeight * 0.25, nominalHeight - 220) * scaleY;
        const rx = prng.range(80, 140) * scaleX;
        const ry = prng.range(32, 55) * scaleY;
        stampIsland(fx, fy, rx, ry);
      }
    } else if (hasSolidCeiling) {
      for (let i = 0; i < 3; i++) {
        const fx = prng.range(220, nominalWidth - 220) * scaleX;
        const fy = prng.range(nominalHeight * 0.42, nominalHeight - 200) * scaleY;
        const rx = prng.range(75, 120) * scaleX;
        const ry = prng.range(26, 44) * scaleY;
        stampIsland(fx, fy, rx, ry);
      }
    } else {
      const count = Math.floor(prng.range(2, 4));
      for (let i = 0; i < count; i++) {
        const fx = prng.range(200 + i * 280, 420 + i * 280) * scaleX;
        const fy = prng.range(nominalHeight * 0.32, nominalHeight - 240) * scaleY;
        const rx = prng.range(65, 105) * scaleX;
        const ry = prng.range(24, 38) * scaleY;
        stampIsland(fx, fy, rx, ry);
      }
    }
  }
}
