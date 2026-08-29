import { FrameLogEntry } from './perfTypes';

export function buildFrameLogEntry(
  nextFrameId: number,
  timeOffsetMs: number,
  frameIntervalMs: number,
  renderDurationMs: number,
  physicsDurationMs: number,
  reactDuration: number,
  fpsInstant: number,
  sampledIdle: number,
  entities: {
    slugs: number;
    livingSlugs: number;
    projectiles: number;
    explosions: number;
    particles: number;
    mines: number;
    crates: number;
  },
  framePasses: Record<string, number>
): FrameLogEntry {
  const isJank = frameIntervalMs > 20.0;
  const isCriticalJank = frameIntervalMs > 33.3;

  let memoryMB: number | null = null;
  const mem = (performance as any)?.memory;
  if (mem?.usedJSHeapSize) {
    memoryMB = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
  }

  const cpuJsMs = Math.round((renderDurationMs + physicsDurationMs + reactDuration) * 100) / 100;
  const maxPossibleIdle = Math.max(0, frameIntervalMs - cpuJsMs);
  const realIdleWaitMs = Math.min(
    sampledIdle > 0 ? sampledIdle : frameIntervalMs > 15 ? Math.max(0, 16.6 - cpuJsMs - 4) : 0,
    maxPossibleIdle
  );
  const gpuRasterMs = Math.max(0, Math.round((frameIntervalMs - cpuJsMs - realIdleWaitMs) * 100) / 100);
  const browserWaitMs = Math.max(0, Math.round((frameIntervalMs - cpuJsMs) * 100) / 100);

  return {
    frameId: nextFrameId,
    timeOffsetMs,
    frameIntervalMs: Math.round(frameIntervalMs * 100) / 100,
    renderDurationMs: Math.round(renderDurationMs * 100) / 100,
    physicsDurationMs,
    reactRenderDurationMs: reactDuration,
    cpuJsMs,
    gpuRasterMs,
    realIdleWaitMs,
    browserWaitMs,
    fpsInstant,
    isJank,
    isCriticalJank,
    memoryMB,
    entities: { ...entities },
    renderPasses: framePasses,
  };
}
