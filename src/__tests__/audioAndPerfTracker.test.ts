import { describe, it, expect, vi } from 'vitest';
import { sfx, SoundEffectType } from '../core/audio';
import { perfTracker } from '../core/perfTracker';

describe('Audio Engine & Performance Telemetry', () => {
  it('dispatches all registered sound effects without throwing errors', () => {
    const soundKeys: SoundEffectType[] = [
      'fire',
      'explosion',
      'jump',
      'splash',
      'baah',
      'donkey',
      'victory',
      'tick',
      'melee',
      'bounce',
      'teleport',
      'rope_shoot',
      'rope_attach',
      'girder',
      'airdrop',
      'ouch',
    ];

    for (const key of soundKeys) {
      expect(() => sfx.play(key)).not.toThrow();
    }
  });

  it('runs performance capture session and computes metrics accurately', () => {
    perfTracker.setFpsHudEnabled(true);
    expect(perfTracker.getFpsHudEnabled()).toBe(true);

    const listener = vi.fn();
    const unsub = perfTracker.onCaptureUpdate(listener);

    // Start a 1 second capture
    perfTracker.startCapture(1);
    expect(perfTracker.isRecording()).toBe(true);

    const dummyEntities = {
      slugs: 4,
      livingSlugs: 4,
      projectiles: 1,
      explosions: 0,
      particles: 10,
      mines: 2,
      crates: 1,
    };

    // Feed 30 simulated frames (16.6ms intervals, 2.5ms render) with pass measurements
    for (let i = 0; i < 30; i++) {
      perfTracker.recordRenderPass('sky_atmosphere', 0.8);
      perfTracker.recordRenderPass('ocean_waves', 1.4);
      perfTracker.recordRenderPass('terrain_buffer', 0.3);
      perfTracker.markFrame(2.5, dummyEntities);
    }

    // Record mock React Profiler renders
    perfTracker.recordReactRender('TurnHeader', 'update', 1.2);
    perfTracker.recordReactRender('SlugWarsCanvas', 'update', 0.4);

    expect(perfTracker.liveTopPasses.length).toBeGreaterThan(0);
    expect(perfTracker.liveTopPasses[0].id).toBe('ocean_waves');

    unsub();
  });
});
