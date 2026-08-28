import { describe, it, expect } from 'vitest';
import { FrameLogEntry } from '../core/perfTracker';
import {
  filterPerfFrames,
  getRenderPassClassification,
  getFrameFpsBadgeColor,
  getWorstFrameLatencyColor,
  getFrameCardTheme,
  formatMemoryDelta,
  formatDeviceMemory,
} from '../components/game/metrics/capture/perfCaptureTabUtils';

describe('PerfCaptureTab: Filtering, Metrics Classification & Formatters', () => {
  const createMockFrames = (): FrameLogEntry[] => [
    {
      frameId: 1,
      timeOffsetMs: 16.6,
      frameIntervalMs: 16.6,
      renderDurationMs: 2.1,
      physicsDurationMs: 0.5,
      reactRenderDurationMs: 0,
      cpuJsMs: 2.6,
      gpuRasterMs: 1.2,
      realIdleWaitMs: 12.8,
      browserWaitMs: 0.5,
      fpsInstant: 60,
      isJank: false,
      isCriticalJank: false,
      memoryMB: 45.2,
      entities: { slugs: 4, livingSlugs: 4, projectiles: 0, explosions: 0, particles: 10, mines: 0, crates: 0 },
    },
    {
      frameId: 2,
      timeOffsetMs: 45.2,
      frameIntervalMs: 28.6,
      renderDurationMs: 5.4,
      physicsDurationMs: 0.8,
      reactRenderDurationMs: 1.2,
      cpuJsMs: 7.4,
      gpuRasterMs: 3.5,
      realIdleWaitMs: 17.7,
      browserWaitMs: 0.8,
      fpsInstant: 35,
      isJank: true,
      isCriticalJank: false,
      memoryMB: 46.1,
      entities: { slugs: 4, livingSlugs: 4, projectiles: 1, explosions: 0, particles: 25, mines: 0, crates: 0 },
    },
    {
      frameId: 3,
      timeOffsetMs: 98.4,
      frameIntervalMs: 53.2,
      renderDurationMs: 12.8,
      physicsDurationMs: 2.1,
      reactRenderDurationMs: 3.5,
      cpuJsMs: 18.4,
      gpuRasterMs: 8.2,
      realIdleWaitMs: 26.6,
      browserWaitMs: 1.2,
      fpsInstant: 18,
      isJank: true,
      isCriticalJank: true,
      memoryMB: 47.8,
      entities: { slugs: 4, livingSlugs: 4, projectiles: 1, explosions: 1, particles: 80, mines: 0, crates: 0 },
    },
  ];

  describe('filterPerfFrames()', () => {
    it('returns all frames when onlyJank is false', () => {
      const frames = createMockFrames();
      const result = filterPerfFrames(frames, false);
      expect(result).toHaveLength(3);
    });

    it('filters strictly to frames with isJank: true when onlyJank is active', () => {
      const frames = createMockFrames();
      const result = filterPerfFrames(frames, true);
      expect(result).toHaveLength(2);
      expect(result.map((f) => f.frameId)).toEqual([2, 3]);
    });

    it('handles undefined or empty frames gracefully', () => {
      expect(filterPerfFrames(undefined, false)).toEqual([]);
      expect(filterPerfFrames([], true)).toEqual([]);
    });
  });

  describe('getRenderPassClassification()', () => {
    it('classifies heavy render passes when percent >= 30 or duration >= 1.0ms', () => {
      const c1 = getRenderPassClassification(35, 0.8);
      expect(c1.isHeavy).toBe(true);
      expect(c1.barColor).toBe('bg-amber-400');

      const c2 = getRenderPassClassification(10, 1.2);
      expect(c2.isHeavy).toBe(true);
      expect(c2.barColor).toBe('bg-amber-400');
    });

    it('classifies moderate render passes when percent >= 15 or duration >= 0.4ms', () => {
      const c1 = getRenderPassClassification(18, 0.3);
      expect(c1.isModerate).toBe(true);
      expect(c1.barColor).toBe('bg-cyan-400');

      const c2 = getRenderPassClassification(8, 0.5);
      expect(c2.isModerate).toBe(true);
      expect(c2.barColor).toBe('bg-cyan-400');
    });

    it('classifies light render passes under thresholds as emerald', () => {
      const c = getRenderPassClassification(5, 0.1);
      expect(c.isHeavy).toBe(false);
      expect(c.isModerate).toBe(false);
      expect(c.barColor).toBe('bg-emerald-400');
    });
  });

  describe('getFrameFpsBadgeColor(), getWorstFrameLatencyColor(), getFrameCardTheme()', () => {
    it('returns green for >= 55 FPS, amber for 30-54 FPS, red for < 30 FPS', () => {
      expect(getFrameFpsBadgeColor(60)).toContain('emerald');
      expect(getFrameFpsBadgeColor(55)).toContain('emerald');
      expect(getFrameFpsBadgeColor(45)).toContain('amber');
      expect(getFrameFpsBadgeColor(30)).toContain('amber');
      expect(getFrameFpsBadgeColor(29)).toContain('red');
      expect(getFrameFpsBadgeColor(12)).toContain('red');
    });

    it('returns red latency text for frame intervals > 33.3ms (< 30 FPS drop), and amber otherwise', () => {
      expect(getWorstFrameLatencyColor(45.0)).toContain('text-red-400');
      expect(getWorstFrameLatencyColor(25.0)).toContain('text-amber-400');
    });

    it('returns red theme for critical jank, amber for normal jank, and dark zinc for smooth frames', () => {
      const frames = createMockFrames();
      expect(getFrameCardTheme(frames[0])).toContain('bg-zinc-950');
      expect(getFrameCardTheme(frames[1])).toContain('bg-amber-950/40');
      expect(getFrameCardTheme(frames[2])).toContain('bg-red-950/50');
    });
  });

  describe('formatMemoryDelta() and formatDeviceMemory()', () => {
    it('formats positive, negative, and null memory variations', () => {
      expect(formatMemoryDelta(3.5)).toBe('Variation: +3.5 MB');
      expect(formatMemoryDelta(-1.2)).toBe('Variation: -1.2 MB');
      expect(formatMemoryDelta(0)).toBe('Variation: +0 MB');
      expect(formatMemoryDelta(null)).toBe('Navigateur bridé');
      expect(formatMemoryDelta(undefined)).toBe('Navigateur bridé');
    });

    it('formats RAM memory in GB or falls back to N/A', () => {
      expect(formatDeviceMemory(16)).toBe('16 GB');
      expect(formatDeviceMemory(null)).toBe('N/A');
      expect(formatDeviceMemory(undefined)).toBe('N/A');
    });
  });
});
