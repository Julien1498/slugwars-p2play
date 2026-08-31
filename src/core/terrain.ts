import { TerrainData } from './terrainGenerator';
import { getThemeConfig } from './terrain/themeRegistry';

export interface RaycastHitResult {
  hit: boolean;
  x: number;
  y: number;
}

export interface SurfaceNormalResult {
  nx: number;
  ny: number;
}

const _SHARED_RAY_HIT: RaycastHitResult = { hit: false, x: 0, y: 0 };
const _SHARED_NORMAL: SurfaceNormalResult = { nx: 0, ny: -1 };

export class DestructibleTerrain {
  public data: TerrainData;
  public revision: number = 0;

  constructor(data: TerrainData) {
    this.data = data;
    this.revision = 0;
  }

  public isSolid(x: number, y: number): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.data.width) return false;
    const hasCeiling = getThemeConfig(this.data.theme).physics.hasSolidCeiling;
    if (hasCeiling) {
      if (iy <= 16) return true;
      if (iy < 0) return true;
    } else {
      if (iy < 0) return false; // Above ceiling is air in open sky themes
    }
    if (iy >= this.data.height) return false; // Below floor is water/void
    return this.data.grid[iy * this.data.width + ix] > 0;
  }

  public carveExplosion(
    cx: number,
    cy: number,
    radius: number
  ): { carvedPixels: number; destroyedOilDrums: import('./types').SolidProp[] } {
    this.revision++;
    let carvedPixels = 0;
    const destroyedOilDrums: import('./types').SolidProp[] = [];
    const icx = Math.floor(cx);
    const icy = Math.floor(cy);
    const rSq = radius * radius;

    const minX = Math.max(0, Math.floor(icx - radius));
    const maxX = Math.min(this.data.width - 1, Math.ceil(icx + radius));
    const minY = Math.max(0, Math.floor(icy - radius));
    const maxY = Math.min(this.data.height - 1, Math.ceil(icy + radius));
    const hasCeiling = getThemeConfig(this.data.theme).physics.hasSolidCeiling;

    for (let y = minY; y <= maxY; y++) {
      // Indestructible bedrock ceiling protection
      if (hasCeiling && y <= 16) continue;

      const dy = y - icy;
      const dySq = dy * dy;
      const rowOffset = y * this.data.width;

      for (let x = minX; x <= maxX; x++) {
        const dx = x - icx;
        if (dx * dx + dySq <= rSq) {
          const idx = rowOffset + x;
          if (this.data.grid[idx] > 0) {
            this.data.grid[idx] = 0;
            carvedPixels++;
          }
        }
      }
    }

    // Collect exploding oil drums and remove physics hitboxes of destroyed props
    if (this.data.solidProps) {
      for (const sprop of this.data.solidProps) {
        if (sprop.destroyed) continue;

        // Check if oil drum exploded directly
        if (sprop.type === 'oil_drum') {
          const propRadius = Math.max(sprop.width, sprop.height) * 0.5;
          const dist = Math.hypot(cx - sprop.x, cy - (sprop.y - sprop.height / 2));
          if (dist <= radius + propRadius) {
            sprop.destroyed = true;
            destroyedOilDrums.push(sprop);
          }
        }

        // Check if the prop lost its ground foundation
        const halfW = Math.max(4, Math.floor(sprop.width / 2));
        let solidFoundationCount = 0;
        for (let ox = -halfW; ox <= halfW; ox += Math.max(1, Math.floor(halfW / 2))) {
          const gx = Math.floor(sprop.x + ox);
          const gy = Math.floor(sprop.y + 1);
          if (gx >= 0 && gx < this.data.width && gy >= 0 && gy < this.data.height) {
            const idx = gy * this.data.width + gx;
            if (this.data.grid[idx] > 0) {
              solidFoundationCount++;
            }
          }
        }

        if (solidFoundationCount === 0) {
          sprop.destroyed = true;
        }

        // If the prop is now destroyed, erase ALL its physics pixels from the grid so no phantom hitbox remains!
        if (sprop.destroyed) {
          const pWidth = sprop.width;
          const pHeight = sprop.height;
          const angleRad = sprop.angleRad || 0;
          const cosA = Math.cos(angleRad);
          const sinA = Math.sin(angleRad);
          const pMaxDim = Math.ceil(Math.hypot(pWidth / 2, pHeight)) + 4;

          const pMinX = Math.max(0, Math.floor(sprop.x - pMaxDim));
          const pMaxX = Math.min(this.data.width - 1, Math.ceil(sprop.x + pMaxDim));
          const pMinY = Math.max(0, Math.floor(sprop.y - pMaxDim));
          const pMaxY = Math.min(this.data.height - 1, Math.ceil(sprop.y + pMaxDim));

          for (let py = pMinY; py <= pMaxY; py++) {
            const pdy = py - sprop.y;
            const pRow = py * this.data.width;
            for (let px = pMinX; px <= pMaxX; px++) {
              const pdx = px - sprop.x;
              const localX = pdx * cosA + pdy * sinA;
              const localY = -pdx * sinA + pdy * cosA;
              if (Math.abs(localX) <= pWidth / 2 + 1 && localY >= -pHeight - 1 && localY <= 1) {
                if (this.data.grid[pRow + px] === 2) {
                  this.data.grid[pRow + px] = 0;
                }
              }
            }
          }
        }
      }
    }

    // Destroy overlapping ceiling hanging leaves / vines
    if (this.data.decorItems) {
      for (const item of this.data.decorItems) {
        if (item.destroyed) continue;
        if (item.type === 'hanging_leaf') {
          const dist = Math.hypot(cx - item.x, cy - item.y);
          if (dist <= radius + 20) {
            item.destroyed = true;
          }
        }
      }
    }

    return { carvedPixels, destroyedOilDrums };
  }

  public buildTerrain(
    cx: number,
    cy: number,
    radius: number,
    materialVal: number = 1
  ): number {
    this.revision++;
    let addedPixels = 0;
    const icx = Math.floor(cx);
    const icy = Math.floor(cy);
    const rSq = radius * radius;

    const minX = Math.max(0, Math.floor(icx - radius));
    const maxX = Math.min(this.data.width - 1, Math.ceil(icx + radius));
    const minY = Math.max(0, Math.floor(icy - radius));
    const maxY = Math.min(this.data.height - 1, Math.ceil(icy + radius));

    for (let y = minY; y <= maxY; y++) {
      const dy = y - icy;
      const dySq = dy * dy;
      const rowOffset = y * this.data.width;

      for (let x = minX; x <= maxX; x++) {
        const dx = x - icx;
        if (dx * dx + dySq <= rSq) {
          const idx = rowOffset + x;
          if (this.data.grid[idx] === 0) {
            this.data.grid[idx] = materialVal;
            addedPixels++;
          }
        }
      }
    }
    return addedPixels;
  }

  public raycastSolidInto(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    out: RaycastHitResult = _SHARED_RAY_HIT
  ): RaycastHitResult {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance);

    if (steps === 0) {
      out.hit = this.isSolid(x0, y0);
      out.x = x0;
      out.y = y0;
      return out;
    }

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const rx = x0 + dx * t;
      const ry = y0 + dy * t;
      if (this.isSolid(rx, ry)) {
        out.hit = true;
        out.x = rx;
        out.y = ry;
        return out;
      }
    }
    out.hit = false;
    out.x = x1;
    out.y = y1;
    return out;
  }

  public raycastSolid(x0: number, y0: number, x1: number, y1: number): RaycastHitResult {
    return this.raycastSolidInto(x0, y0, x1, y1, { hit: false, x: 0, y: 0 });
  }

  public getSurfaceNormalInto(
    x: number,
    y: number,
    sampleRadius: number = 4,
    out: SurfaceNormalResult = _SHARED_NORMAL
  ): SurfaceNormalResult {
    let nx = 0;
    let ny = 0;
    const r = Math.max(2, Math.floor(sampleRadius));

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx === 0 && dy === 0) continue;
        const dSq = dx * dx + dy * dy;
        if (dSq <= r * r) {
          if (this.isSolid(x + dx, y + dy)) {
            // Solid terrain pushes the normal OUTWARD away from solid mass
            const invDist = 1 / Math.sqrt(dSq);
            nx -= dx * invDist;
            ny -= dy * invDist;
          }
        }
      }
    }

    const len = Math.hypot(nx, ny);
    if (len > 0.001) {
      out.nx = nx / len;
      out.ny = ny / len;
      return out;
    }
    out.nx = 0;
    out.ny = -1;
    return out;
  }

  /**
   * Calculates the surface normal vector at a solid impact point (nx, ny).
   * Points OUTWARD from solid terrain into air/space with unit length 1.0.
   */
  public getSurfaceNormal(
    x: number,
    y: number,
    sampleRadius: number = 4
  ): SurfaceNormalResult {
    return this.getSurfaceNormalInto(x, y, sampleRadius, { nx: 0, ny: -1 });
  }
}
