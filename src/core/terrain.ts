import { TerrainData } from './terrainGenerator';

export class DestructibleTerrain {
  public data: TerrainData;

  constructor(data: TerrainData) {
    this.data = data;
  }

  public isSolid(x: number, y: number): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.data.width) return false;
    if (iy < 0) return false; // Above ceiling is air
    if (iy >= this.data.height) return false; // Below floor is water/void
    return this.data.grid[iy * this.data.width + ix] === 1;
  }

  public carveExplosion(cx: number, cy: number, radius: number): number {
    let carvedPixels = 0;
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
          if (this.data.grid[idx] === 1) {
            this.data.grid[idx] = 0;
            carvedPixels++;
          }
        }
      }
    }
    return carvedPixels;
  }

  public raycastSolid(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): { hit: boolean; x: number; y: number } {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance);

    if (steps === 0) return { hit: this.isSolid(x0, y0), x: x0, y: y0 };

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const rx = x0 + dx * t;
      const ry = y0 + dy * t;
      if (this.isSolid(rx, ry)) {
        return { hit: true, x: rx, y: ry };
      }
    }
    return { hit: false, x: x1, y: y1 };
  }
}
