import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isolateBenchmark,
  ISOLATE_STEPS,
  IsolateBenchmarkReport,
} from '../core/perf/isolateBenchmark';

describe('IsolateBenchmarkManager - Automated GPU Bottleneck Isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    isolateBenchmark.cancel();
  });

  afterEach(() => {
    isolateBenchmark.cancel();
    vi.useRealTimers();
  });

  it('starts at bypass NONE and is not running initially', () => {
    expect(isolateBenchmark.getActiveBypass()).toBe('NONE');
    expect(isolateBenchmark.getIsRunning()).toBe(false);
  });

  it('has 9 defined test steps starting with baseline and ending with TOTAL_BLACK', () => {
    expect(ISOLATE_STEPS.length).toBe(9);
    expect(ISOLATE_STEPS[0].target).toBe('NONE');
    expect(ISOLATE_STEPS[1].target).toBe('TERRAIN');
    expect(ISOLATE_STEPS[2].target).toBe('PROPS');
    expect(ISOLATE_STEPS[3].target).toBe('WATER');
    expect(ISOLATE_STEPS[4].target).toBe('SKY');
    expect(ISOLATE_STEPS[5].target).toBe('DECOR');
    expect(ISOLATE_STEPS[6].target).toBe('ENTITIES');
    expect(ISOLATE_STEPS[7].target).toBe('ALL_FOUR');
    expect(ISOLATE_STEPS[8].target).toBe('TOTAL_BLACK');
  });

  it('transitions sequentially through all bypass targets', () => {
    isolateBenchmark.start();

    expect(isolateBenchmark.getIsRunning()).toBe(true);
    expect(isolateBenchmark.getActiveBypass()).toBe('NONE');

    for (let s = 0; s < ISOLATE_STEPS.length; s++) {
      expect(isolateBenchmark.getActiveBypass()).toBe(ISOLATE_STEPS[s].target);
      for (let i = 0; i < 50; i++) {
        isolateBenchmark.recordFrame(16.6);
      }
      vi.advanceTimersByTime(2100);
    }

    expect(isolateBenchmark.getIsRunning()).toBe(false);
    expect(isolateBenchmark.getActiveBypass()).toBe('NONE');
  });

  it('correctly calculates deltaFps, savedMs and culprit ranking with ALL_FOUR and TOTAL_BLACK', () => {
    let report: IsolateBenchmarkReport | null = null;
    isolateBenchmark.start(undefined, (r) => {
      report = r;
    });

    // 0. Baseline (20.8ms, 48 FPS)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(20.8);
    vi.advanceTimersByTime(2100);

    // 1. Terrain (16.6ms -> saved 4.2ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(16.6);
    vi.advanceTimersByTime(2100);

    // 2. Props (17.5ms -> saved 3.3ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(17.5);
    vi.advanceTimersByTime(2100);

    // 3. Water (20.0ms -> saved 0.8ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(20.0);
    vi.advanceTimersByTime(2100);

    // 4. Sky (20.5ms -> saved 0.3ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(20.5);
    vi.advanceTimersByTime(2100);

    // 5. Decor (20.4ms -> saved 0.4ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(20.4);
    vi.advanceTimersByTime(2100);

    // 6. Entities (20.2ms -> saved 0.6ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(20.2);
    vi.advanceTimersByTime(2100);

    // 7. ALL_FOUR (8.0ms -> saved 12.8ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(8.0);
    vi.advanceTimersByTime(2100);

    // 8. TOTAL_BLACK (6.9ms -> saved 13.9ms)
    for (let i = 0; i < 50; i++) isolateBenchmark.recordFrame(6.9);
    vi.advanceTimersByTime(2100);

    expect(report).not.toBeNull();
    if (report) {
      const rep = report as IsolateBenchmarkReport;
      expect(rep.baseline.avgFps).toBeCloseTo(48.1, 0);
      expect(rep.baseline.avgFrameMs).toBe(20.8);

      const allFourStep = rep.steps.find((s) => s.target === 'ALL_FOUR');
      expect(allFourStep).toBeDefined();
      expect(allFourStep!.savedMs).toBeCloseTo(12.8, 1);

      const blackStep = rep.steps.find((s) => s.target === 'TOTAL_BLACK');
      expect(blackStep).toBeDefined();
      expect(blackStep!.savedMs).toBeCloseTo(13.9, 1);

      // Culprit ranking should exclude both ALL_FOUR and TOTAL_BLACK
      expect(rep.culpritRanking[0].target).toBe('TERRAIN');
      expect(rep.culpritRanking[1].target).toBe('PROPS');
      expect(rep.culpritRanking.some((c) => c.target === 'ALL_FOUR')).toBe(false);
      expect(rep.culpritRanking.some((c) => c.target === 'TOTAL_BLACK')).toBe(false);
    }
  });
});
