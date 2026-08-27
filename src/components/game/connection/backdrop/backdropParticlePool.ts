export interface CloudItem {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
}

export interface StarItem {
  x: number;
  y: number;
  size: number;
  blinkRate: number;
  alpha: number;
}

export function createCloudPool(width: number, height: number): CloudItem[] {
  return Array.from({ length: 6 }, () => ({
    x: Math.random() * width,
    y: 40 + Math.random() * (height * 0.35),
    speed: 0.15 + Math.random() * 0.3,
    size: 45 + Math.random() * 60,
    opacity: 0.12 + Math.random() * 0.2,
  }));
}

export function updateAndRenderClouds(ctx: CanvasRenderingContext2D, clouds: CloudItem[], width: number) {
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

export function createStarPool(width: number, height: number): StarItem[] {
  return Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.55),
    size: Math.random() * 2 + 0.8,
    blinkRate: 0.02 + Math.random() * 0.04,
    alpha: Math.random(),
  }));
}

export function updateAndRenderStars(ctx: CanvasRenderingContext2D, stars: StarItem[], t: number) {
  for (const star of stars) {
    star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
    ctx.fillStyle = `rgba(216, 180, 254, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class SmokeParticlePool {
  private particles: { x: number; y: number; vx: number; vy: number; life: number; size: number; active: boolean }[];
  private readonly maxCount: number;

  constructor(maxCount: number = 30) {
    this.maxCount = maxCount;
    this.particles = Array.from({ length: maxCount }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      size: 0,
      active: false,
    }));
  }

  spawn(x: number, y: number, vx: number, vy: number, size: number) {
    const p = this.particles.find((item) => !item.active);
    if (!p) return;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.life = 1;
    p.active = true;
  }

  updateAndRender(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      p.size += 0.25;
      if (p.life <= 0) {
        p.active = false;
      } else {
        ctx.fillStyle = `rgba(212, 212, 216, ${p.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  getActiveCount(): number {
    return this.particles.filter((p) => p.active).length;
  }
}
