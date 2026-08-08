import { GameState } from '../../../core/types';
import { TerrainData } from '../../../core/terrainGenerator';

export function renderLightmap(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  terrainData: TerrainData,
  lightmapCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  occlusionCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>
): void {
  const { width, height } = terrainData;
  const isDay = gameState.config.dayNightCycle === 'DAY';

  if (!lightmapCanvasRef.current) {
    lightmapCanvasRef.current = document.createElement('canvas');
  }
  const lightCanvas = lightmapCanvasRef.current;
  if (lightCanvas.width !== width || lightCanvas.height !== height) {
    lightCanvas.width = width;
    lightCanvas.height = height;
  }
  const lCtx = lightCanvas.getContext('2d');
  if (!lCtx) return;

  lCtx.clearRect(0, 0, width, height);

  // Fill Base Dynamic Occlusion Darkness Overlay
  if (!isDay) {
    const nightGrad = lCtx.createLinearGradient(0, 0, 0, height);
    nightGrad.addColorStop(0, 'rgba(3, 7, 18, 0.0)');
    nightGrad.addColorStop(0.2, 'rgba(3, 7, 18, 0.0)');
    nightGrad.addColorStop(0.4, 'rgba(3, 7, 18, 0.50)');
    nightGrad.addColorStop(1.0, 'rgba(3, 7, 18, 0.88)');
    lCtx.fillStyle = nightGrad;
    lCtx.fillRect(0, 0, width, height);
  } else if (occlusionCanvasRef.current) {
    lCtx.drawImage(occlusionCanvasRef.current, 0, 0);
  }

  // Cut out darkness in real-time for active dynamic light sources!
  lCtx.globalCompositeOperation = 'destination-out';

  // A. Helicopter Searchlight Spotlight Punch
  if (gameState.helicopters) {
    for (const heli of gameState.helicopters) {
      const hDir = heli.facing === 'right' ? 1 : -1;
      const lX = heli.x + 12 * hDir;
      const lY = heli.y + 4;
      const coneGrad = lCtx.createRadialGradient(lX, lY, 5, lX + 25 * hDir, lY + 60, 110);
      coneGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      coneGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)');
      coneGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      lCtx.fillStyle = coneGrad;
      lCtx.beginPath();
      lCtx.moveTo(lX, lY);
      lCtx.lineTo(lX + -35 * hDir, lY + 130);
      lCtx.lineTo(lX + 75 * hDir, lY + 130);
      lCtx.closePath();
      lCtx.fill();
    }
  }

  // C. Living Slugs Ambient Halo Punch
  for (const slug of gameState.slugs) {
    if (slug.isAlive && slug.isPlaced) {
      const sGrad = lCtx.createRadialGradient(slug.x, slug.y - 8, 2, slug.x, slug.y - 8, 30);
      sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      sGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      lCtx.fillStyle = sGrad;
      lCtx.beginPath();
      lCtx.arc(slug.x, slug.y - 8, 30, 0, Math.PI * 2);
      lCtx.fill();
    }
  }

  // D. Active Explosions Blinding Light Burst Punch
  for (const ex of gameState.explosions) {
    const exGrad = lCtx.createRadialGradient(ex.x, ex.y, 5, ex.x, ex.y, ex.radius * 2.5);
    exGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    exGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    lCtx.fillStyle = exGrad;
    lCtx.beginPath();
    lCtx.arc(ex.x, ex.y, ex.radius * 2.5, 0, Math.PI * 2);
    lCtx.fill();
  }

  lCtx.globalCompositeOperation = 'source-over';

  // Blit lightmap overlay to main canvas
  ctx.drawImage(lightCanvas, 0, 0);
}
