import { describe, it, expect, vi, beforeEach } from 'vitest';
import { netMetrics } from '../core/networkMetrics';

describe('networkMetrics - Bandwidth, Latency & Traffic Inspector', () => {
  beforeEach(() => {
    // Reset tracker state
    netMetrics.setPeerManager(null);
  });

  it('records upload and download packets and returns formatted stats', async () => {
    // Record uploads
    netMetrics.recordUpload(512);
    netMetrics.recordUpload(new Uint8Array(128));
    netMetrics.recordUpload('test-string-payload');

    // Record downloads
    netMetrics.recordDownload(1024);
    netMetrics.recordDownload({ type: 'STATE_UPDATE', phase: 'AIMING' });

    // Trigger sample
    await netMetrics.sample();

    const stats = netMetrics.getStats();
    expect(stats.uploadKbps).toBeGreaterThanOrEqual(0);
    expect(stats.downloadKbps).toBeGreaterThanOrEqual(0);
    expect(stats.packetsPerSec).toBeGreaterThanOrEqual(0);
    expect(stats.totalSentKB).toBeGreaterThan(0);
    expect(stats.totalReceivedKB).toBeGreaterThan(0);
  });

  it('samples WebRTC RTCPeerConnection statistics when available', async () => {
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

    // First sample establishes baseline
    await netMetrics.sample();
    expect(netMetrics.realPingMs).toBe(42);

    // Second sample calculates delta rates
    mockGetStats.mockResolvedValue([
      {
        type: 'candidate-pair',
        state: 'succeeded',
        nominated: true,
        bytesSent: 60000,
        bytesReceived: 100000,
        currentRoundTripTime: 0.038, // 38ms
      },
    ]);

    await netMetrics.sample();
    expect(netMetrics.realPingMs).toBe(38);
    expect(netMetrics.totalSentBytes).toBe(60000);
    expect(netMetrics.totalReceivedBytes).toBe(100000);
  });

  it('runs a traffic capture session and generates a structured TrafficCaptureReport', async () => {
    vi.useFakeTimers();

    const listener = vi.fn();
    const unsubscribe = netMetrics.onCaptureUpdate(listener);

    netMetrics.startCapture(1); // 1-second capture
    expect(netMetrics.isCaptureRecording()).toBe(true);

    // Send mock packets during capture
    netMetrics.recordUpload(256, { turnTimer: 45, phase: 'AIMING', slugs: [{ idx: 0 }] });
    netMetrics.recordDownload(512, { type: 'ACTION', actionName: 'FIRE_WEAPON' });

    // Advance 1000ms
    vi.advanceTimersByTime(1100);

    expect(netMetrics.isCaptureRecording()).toBe(false);
    const report = netMetrics.getLastCaptureReport();

    expect(report).not.toBeNull();
    if (report) {
      expect(report.uploadCount).toBeGreaterThanOrEqual(1);
      expect(report.downloadCount).toBeGreaterThanOrEqual(1);
      expect(report.packets.length).toBeGreaterThanOrEqual(2);
      expect(report.packets[0].summary).toContain('Timer 45s');
      expect(report.packets[1].summary).toContain('Action: FIRE_WEAPON');
    }

    unsubscribe();
    vi.useRealTimers();
  });
});
