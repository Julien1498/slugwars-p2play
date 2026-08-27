export interface LobbyStar {
  x: number;
  y: number;
  size: number;
  blinkRate: number;
  alpha: number;
}

export interface NebulaCloud {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
}

export function createLobbyStarPool(width: number, height: number): LobbyStar[] {
  return Array.from({ length: 55 }, () => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.65),
    size: Math.random() * 2 + 0.6,
    blinkRate: 0.02 + Math.random() * 0.04,
    alpha: Math.random(),
  }));
}

export function updateAndRenderLobbyStars(ctx: CanvasRenderingContext2D, stars: LobbyStar[], t: number) {
  for (const star of stars) {
    star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
    ctx.fillStyle = `rgba(192, 132, 252, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createNebulaCloudPool(width: number, height: number): NebulaCloud[] {
  return Array.from({ length: 5 }, () => ({
    x: Math.random() * width,
    y: 30 + Math.random() * (height * 0.35),
    speed: 0.1 + Math.random() * 0.2,
    size: 55 + Math.random() * 65,
    opacity: 0.12 + Math.random() * 0.15,
  }));
}

export function updateAndRenderNebulaClouds(ctx: CanvasRenderingContext2D, clouds: NebulaCloud[], width: number) {
  for (const cloud of clouds) {
    cloud.x += cloud.speed;
    if (cloud.x > width + 150) cloud.x = -150;
    ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface FlareParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  active: boolean;
  trail: { x: number; y: number }[];
  trailHead: number;
  trailLength: number;
}

export class FlarePool {
  private flares: FlareParticle[];
  private readonly maxCount: number;
  private readonly maxTrail: number = 12;

  constructor(maxCount: number = 3) {
    this.maxCount = maxCount;
    this.flares = Array.from({ length: maxCount }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      color: '#f59e0b',
      active: false,
      trail: Array.from({ length: this.maxTrail }, () => ({ x: 0, y: 0 })),
      trailHead: 0,
      trailLength: 0,
    }));
  }

  trySpawn(width: number, height: number) {
    if (Math.random() >= 0.018) return;
    const f = this.flares.find((item) => !item.active);
    if (!f) return;

    f.x = Math.random() < 0.5 ? -20 : width + 20;
    f.y = height * 0.4 + Math.random() * (height * 0.2);
    f.vx = (Math.random() * 4 + 3) * (Math.random() < 0.5 ? 1 : -1);
    f.vy = -(Math.random() * 5 + 4);
    f.life = 1;
    f.color = Math.random() < 0.5 ? '#f59e0b' : '#ec4899';
    f.trailHead = 0;
    f.trailLength = 0;
    f.active = true;
  }

  updateAndRender(ctx: CanvasRenderingContext2D, height: number) {
    for (const f of this.flares) {
      if (!f.active) continue;

      f.trail[f.trailHead] = { x: f.x, y: f.y };
      f.trailHead = (f.trailHead + 1) % this.maxTrail;
      if (f.trailLength < this.maxTrail) f.trailLength++;

      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.12;
      f.life -= 0.014;

      for (let j = 0; j < f.trailLength; j++) {
        const idx = (f.trailHead - f.trailLength + j + this.maxTrail) % this.maxTrail;
        const tr = f.trail[idx];
        ctx.fillStyle = `${f.color}${Math.floor((j / f.trailLength) * 180).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, (j / f.trailLength) * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
      ctx.fill();

      if (f.life <= 0 || f.y > height) {
        f.active = false;
      }
    }
  }

  getActiveCount(): number {
    return this.flares.filter((f) => f.active).length;
  }
}
