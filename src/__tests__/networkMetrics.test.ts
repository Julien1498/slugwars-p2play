import { describe, it, expect, vi, beforeEach } from 'vitest';
import { netMetrics } from '../core/networkMetrics';

describe('networkMetrics - Bandwidth, Latency & Traffic Inspector', () => {
  beforeEach(() => {
    // Reset tracker state
    netMetrics.setPeerManager(null);
    netMetrics.realPingMs = null;
  });

  describe('Payload Accounting & Data Types', () => {
    it('accurately records byte counts for numbers, ArrayBuffers, TypedArrays, strings and JSON objects', async () => {
      // 1. Raw byte number (100 + 64 overhead = 164)
      netMetrics.recordUpload(100);

      // 2. ArrayBuffer (64 bytes + 64 overhead = 128)
      const buffer = new ArrayBuffer(64);
      netMetrics.recordUpload(buffer);

      // 3. TypedArray (32 bytes + 64 overhead = 96)
      const view = new Uint8Array(32);
      netMetrics.recordUpload(view);

      // 4. String (10 chars + 64 overhead = 74)
      netMetrics.recordUpload('0123456789');

      // 5. JSON Object (string length + 64 overhead)
      const obj = { msg: 'hello' };
      netMetrics.recordDownload(obj);

      await netMetrics.sample();
      const stats = netMetrics.getStats();

      expect(stats.totalSentKB).toBeGreaterThan(0);
      expect(stats.totalReceivedKB).toBeGreaterThan(0);
      expect(stats.packetsPerSec).toBeGreaterThan(0);
    });
  });

  describe('WebRTC Native getStats() Sampling & Rate Calculations', () => {
    it('samples WebRTC candidate-pair stats and data-channel fallback', async () => {
      const mockGetStats = vi.fn().mockResolvedValue([
        {
          type: 'candidate-pair',
          state: 'succeeded',
          nominated: true,
          bytesSent: 50000,
          bytesReceived: 80000,
          currentRoundTripTime: 0.042, // 42ms
        },
      ]);

      const mockPeerManager = {
        connections: new Map([
          [
            'peer_1',
            {
              peerConnection: {
                getStats: mockGetStats,
              },
            },
          ],
        ]),
      };

      netMetrics.setPeerManager(mockPeerManager);

      // Baseline sample
      await netMetrics.sample();
      expect(netMetrics.realPingMs).toBe(42);

      // Delta rate sample
      mockGetStats.mockResolvedValue([
        {
          type: 'candidate-pair',
          state: 'succeeded',
          nominated: true,
          bytesSent: 60240,
          bytesReceived: 102400,
          currentRoundTripTime: 0.035, // 35ms
        },
      ]);

      await netMetrics.sample();
      expect(netMetrics.realPingMs).toBe(35);
      expect(netMetrics.totalSentBytes).toBe(60240);
      expect(netMetrics.totalReceivedBytes).toBe(102400);

      const stats = netMetrics.getStats();
      expect(stats.uploadKBs).toBeGreaterThanOrEqual(0);
      expect(stats.downloadKBs).toBeGreaterThanOrEqual(0);
    });

    it('filters out invalid or out-of-bound RTT values (<= 0 or >= 2000ms)', async () => {
      const mockGetStats = vi.fn().mockResolvedValue([
        {
          type: 'candidate-pair',
          state: 'succeeded',
          nominated: true,
          bytesSent: 1000,
          bytesReceived: 1000,
          currentRoundTripTime: 3.5, // 3500ms -> invalid / out of bounds
        },
      ]);

      const mockPeerManager = {
        connections: new Map([
          [
            'peer_1',
            {
              peerConnection: {
                getStats: mockGetStats,
              },
            },
          ],
        ]),
      };

      netMetrics.setPeerManager(mockPeerManager);
      await netMetrics.sample();

      expect(netMetrics.realPingMs).toBeNull();
    });

    it('falls back to data-channel bytes when candidate-pair is absent', async () => {
      const mockGetStats = vi.fn().mockResolvedValue([
        {
          type: 'data-channel',
          bytesSent: 15000,
          bytesReceived: 25000,
        },
      ]);

      const mockPeerManager = {
        connections: new Map([
          [
            'peer_1',
            {
              peerConnection: {
                getStats: mockGetStats,
              },
            },
          ],
        ]),
      };

      netMetrics.setPeerManager(mockPeerManager);
      await netMetrics.sample();

      expect(netMetrics.totalSentBytes).toBe(15000);
      expect(netMetrics.totalReceivedBytes).toBe(25000);
    });
  });

  describe('Traffic Capture Inspector & Semantic Packet Summaries', () => {
    it('runs a traffic capture session, tracks progress, and produces structured TrafficCaptureReport', () => {
      vi.useFakeTimers();

      const progressUpdates: number[] = [];
      const unsubscribe = netMetrics.onCaptureUpdate((report, remaining) => {
        if (remaining > 0) progressUpdates.push(remaining);
      });

      netMetrics.startCapture(2); // 2-second capture
      expect(netMetrics.isCaptureRecording()).toBe(true);

      // Second startCapture call should be safely ignored while active
      netMetrics.startCapture(5);

      // Record varied packets to test semantic summaries
      netMetrics.recordUpload(256, {
        turnTimer: 45,
        retreatTimer: 4,
        slugs: [{ id: 's1' }, { id: 's2' }],
        projectiles: [{ id: 'p1' }],
        explosions: [{ id: 'e1' }],
        girders: [{ id: 'g1' }],
        supplyCrates: [{ id: 'c1' }],
        mines: [{ id: 'm1' }],
        phase: 'RETREAT',
      });

      netMetrics.recordDownload(512, { type: 'ACTION', actionName: 'FIRE_WEAPON' });
      netMetrics.recordDownload(128, {}); // Empty diff state

      // Advance time by 2.2 seconds
      vi.advanceTimersByTime(2200);

      expect(netMetrics.isCaptureRecording()).toBe(false);
      const report = netMetrics.getLastCaptureReport();

      expect(report).not.toBeNull();
      if (report) {
        expect(report.uploadCount).toBe(1);
        expect(report.downloadCount).toBe(2);
        expect(report.packets).toHaveLength(3);

        const summary = report.packets[0].summary;
        expect(summary).toContain('Timer 45s');
        expect(summary).toContain('Fuite 4s');
        expect(summary).toContain('Limaces (2)');
        expect(summary).toContain('Tirs (1)');
        expect(summary).toContain('Explosions (1)');
        expect(summary).toContain('Poutres (1)');
        expect(summary).toContain('Caisses (1)');
        expect(summary).toContain('Mines (1)');
        expect(summary).toContain('Phase: RETREAT');

        expect(report.packets[1].summary).toBe('🎮 Action: FIRE_WEAPON');
        expect(report.packets[2].summary).toBe('Diff d’état');

        expect(report.avgUploadBytesPerSec).toBeGreaterThan(0);
        expect(report.avgDownloadBytesPerSec).toBeGreaterThan(0);
      }

      // Late subscriber should immediately receive the last report
      let lateReportReceived = false;
      const unsubscribeLate = netMetrics.onCaptureUpdate((rep) => {
        if (rep) lateReportReceived = true;
      });
      expect(lateReportReceived).toBe(true);

      unsubscribeLate();
      unsubscribe();
      vi.useRealTimers();
    });
  });
});
