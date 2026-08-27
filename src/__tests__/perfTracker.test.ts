import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { perfTracker } from '../core/perfTracker';

describe('PerformanceTracker: Telemetry, Profiling & Reports', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('FPS HUD & Display State Management', () => {
    it('manages standard FPS HUD state and notifies subscribers', () => {
      const listener = vi.fn();
      const unsub = perfTracker.onFpsHudToggle(listener);

      expect(listener).toHaveBeenCalledWith(perfTracker.getFpsHudEnabled());

      perfTracker.setFpsHudEnabled(true);
      expect(perfTracker.getFpsHudEnabled()).toBe(true);
      expect(listener).toHaveBeenLastCalledWith(true);

      perfTracker.setFpsHudEnabled(false);
      expect(perfTracker.getFpsHudEnabled()).toBe(false);
      expect(listener).toHaveBeenLastCalledWith(false);

      unsub();
    });

    it('manages advanced FPS HUD state and notifies subscribers', () => {
      const listener = vi.fn();
      const unsub = perfTracker.onFpsHudAdvancedToggle(listener);

      expect(listener).toHaveBeenCalledWith(perfTracker.getFpsHudAdvancedEnabled());

      perfTracker.setFpsHudAdvancedEnabled(true);
      expect(perfTracker.getFpsHudAdvancedEnabled()).toBe(true);
      expect(listener).toHaveBeenLastCalledWith(true);

      perfTracker.setFpsHudAdvancedEnabled(false);
      expect(perfTracker.getFpsHudAdvancedEnabled()).toBe(false);

      unsub();
    });

    it('configures live DPR scaling factors for background and action canvases', () => {
      perfTracker.setLiveDprs(1.5, 2.0);
      expect(perfTracker.liveBgDpr).toBe(1.5);
      expect(perfTracker.liveActionDpr).toBe(2.0);
      expect(perfTracker.liveDpr).toBe(1.5);

      perfTracker.setLiveDpr(1.0);
      expect(perfTracker.liveDpr).toBe(1.0);
      expect(perfTracker.liveBgDpr).toBe(1.0);
    });
  });

  describe('Live Profiling: Passes, Physics & React Renders', () => {
    it('records physics ticks and updates live physics duration', () => {
      perfTracker.recordPhysicsTick(1.45);
      expect(perfTracker.currentPhysicsDurationMs).toBe(1.45);

      perfTracker.recordPhysicsTick(0.82);
      expect(perfTracker.currentPhysicsDurationMs).toBe(0.82);
    });

    it('records and sorts live top slowest render passes', () => {
      perfTracker.recordRenderPass('terrain_buffer', 0.5);
      perfTracker.recordRenderPass('sky_mountains', 1.8);
      perfTracker.recordRenderPass('ocean_waves', 2.3);
      perfTracker.recordRenderPass('particles_fx', 0.2);

      const dummyEntities = {
        slugs: 4,
        livingSlugs: 4,
        projectiles: 0,
        explosions: 0,
        particles: 5,
        mines: 2,
        crates: 1,
      };

      perfTracker.markFrame(4.8, dummyEntities);

      expect(perfTracker.liveTopPasses).toHaveLength(3);
      expect(perfTracker.liveTopPasses[0].id).toBe('ocean_waves');
      expect(perfTracker.liveTopPasses[1].id).toBe('sky_mountains');
      expect(perfTracker.liveTopPasses[2].id).toBe('terrain_buffer');
    });

    it('records React component renders via onReactRender Profiler callback', () => {
      perfTracker.onReactRender('TurnHeader', 'update', 1.25);
      expect(perfTracker.currentReactDurationMs).toBe(1.25);
    });
  });

  describe('Capture Session & Comprehensive Report Generation', () => {
    it('executes a full capture session, computes metrics, and produces a complete report', () => {
      const updateListener = vi.fn();
      const unsub = perfTracker.onCaptureUpdate(updateListener);

      // Start 1 second capture session
      perfTracker.startCapture(1);
      expect(perfTracker.isRecording()).toBe(true);

      const dummyEntities = {
        slugs: 4,
        livingSlugs: 4,
        projectiles: 2,
        explosions: 1,
        particles: 20,
        mines: 3,
        crates: 2,
      };

      // Simulate 60 frames (16.6ms intervals = ~1s of 60 FPS gameplay)
      for (let i = 0; i < 60; i++) {
        perfTracker.recordPhysicsTick(0.6);
        perfTracker.recordReactRender('TurnHeader', 'update', 0.3);
        perfTracker.recordRenderPass('ocean_waves', 1.5);
        perfTracker.recordRenderPass('terrain_buffer', 0.8);
        perfTracker.markFrame(2.5, dummyEntities);
      }

      // Fast forward timers to complete the 1s session
      vi.advanceTimersByTime(1100);

      // Capture should have completed
      expect(perfTracker.isRecording()).toBe(false);

      const report = perfTracker.getLastReport();
      expect(report).not.toBeNull();
      if (!report) return;

      // 1. Frame Counts & FPS Metrics
      expect(report.totalFrames).toBe(60);
      expect(report.avgFps).toBeGreaterThan(0);
      expect(report.maxFps).toBeGreaterThan(0);
      expect(report.p1LowFps).toBeDefined();

      // 2. Physics & React Totals
      expect(report.totalPhysicsTicks).toBe(60);
      expect(report.avgPhysicsDurationMs).toBeCloseTo(0.6, 1);
      expect(report.totalReactRenders).toBe(60);
      expect(report.reactComponents).toHaveLength(1);
      expect(report.reactComponents[0].componentId).toBe('TurnHeader');

      // 3. Render Passes & Bottleneck
      expect(report.renderPasses.length).toBeGreaterThan(0);
      expect(report.topBottleneckPass?.passId).toBe('ocean_waves');

      // 4. CPU / GPU Breakdown
      expect(report.cpuGpuBreakdown).toBeDefined();
      expect(report.cpuGpuBreakdown.avgCpuJsMs).toBeGreaterThan(0);

      // 5. FPS Distribution Buckets
      expect(report.fpsDistribution).toBeDefined();
      expect(
        report.fpsDistribution.fps60PlusCount +
          report.fpsDistribution.fps50to59Count +
          report.fpsDistribution.fps30to49Count +
          report.fpsDistribution.fpsBelow30Count
      ).toBe(60);

      // 6. Diagnostic Verdict & Environment
      expect(report.diagnosticVerdict).toContain('Performance équilibrée');
      expect(report.environment).toBeDefined();
      expect(report.topWorstFrames).toBeDefined();

      unsub();
    });

    it('detects CPU bottleneck diagnostic verdict when JavaScript execution time is high', () => {
      perfTracker.startCapture(1);

      const dummyEntities = {
        slugs: 4,
        livingSlugs: 4,
        projectiles: 0,
        explosions: 0,
        particles: 0,
        mines: 0,
        crates: 0,
      };

      // Heavy JS render (e.g. 10ms per frame)
      for (let i = 0; i < 30; i++) {
        perfTracker.recordRenderPass('complex_pass', 9.5);
        perfTracker.markFrame(9.5, dummyEntities);
      }

      vi.advanceTimersByTime(1100);

      const report = perfTracker.getLastReport();
      expect(report).not.toBeNull();
      expect(report!.diagnosticVerdict).toContain("Goulot d'étranglement CPU");
      expect(report!.diagnosticVerdict).toContain('complex_pass');
    });

    it('correctly classifies Jank (>20ms) and Critical Jank (>33.3ms) frames in worst frames', () => {
      perfTracker.startCapture(1);

      const dummyEntities = {
        slugs: 4,
        livingSlugs: 4,
        projectiles: 0,
        explosions: 0,
        particles: 0,
        mines: 0,
        crates: 0,
      };

      // 10 normal frames (16.6ms)
      for (let i = 0; i < 10; i++) {
        perfTracker.markFrame(2.0, dummyEntities);
      }

      // Mark a stutter frame (25ms -> Jank)
      // performance.now will advance when timers advance
      perfTracker.markFrame(5.0, dummyEntities);

      vi.advanceTimersByTime(1100);

      const report = perfTracker.getLastReport();
      expect(report).not.toBeNull();
      expect(report!.topWorstFrames.length).toBeGreaterThan(0);
      expect(report!.topWorstFrames[0].frameIntervalMs).toBeDefined();
    });
  });
});
