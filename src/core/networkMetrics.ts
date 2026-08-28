import {
  NetworkStats,
  PacketLogEntry,
  TrafficCaptureReport,
} from './network/metrics/networkMetricsTypes';
import { TrafficCaptureInspector } from './network/metrics/trafficCaptureInspector';
import {
  queryNativeRtcStats,
  parsePayloadBytes,
} from './network/metrics/webrtcStatsSampler';

export type { NetworkStats, PacketLogEntry, TrafficCaptureReport };

class NetworkMetricsTracker {
  // Application layer payload counters
  private appSentBytes = 0;
  private appReceivedBytes = 0;
  private appPacketCount = 0;

  // Cumulative totals
  public totalSentBytes = 0;
  public totalReceivedBytes = 0;

  // Real-time rates
  public uploadKbps = 0;
  public downloadKbps = 0;
  public uploadKBs = 0;
  public downloadKBs = 0;
  public realPingMs: number | null = null;
  public packetsPerSec = 0;

  // WebRTC Stats tracking
  private prevRtcSentBytes: number | null = null;
  private prevRtcReceivedBytes: number | null = null;
  private lastSampleTime = performance.now();
  private peerManagerRef: any = null;

  // Traffic Inspector Subsystem
  private inspector = new TrafficCaptureInspector();

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.sample();
      }, 1000);
    }
  }

  public setPeerManager(pm: any): void {
    this.peerManagerRef = pm;
  }

  public startCapture(durationSeconds: number = 5): void {
    this.inspector.startCapture(durationSeconds);
  }

  public onCaptureUpdate(cb: (report: TrafficCaptureReport | null, progressSecondsRemaining: number) => void): () => void {
    return this.inspector.onCaptureUpdate(cb);
  }

  public getLastCaptureReport(): TrafficCaptureReport | null {
    return this.inspector.getLastCaptureReport();
  }

  public isCaptureRecording(): boolean {
    return this.inspector.isCaptureRecording();
  }

  public recordUpload(bytesOrData: number | any, decodedObj?: any): void {
    const rawBytes = parsePayloadBytes(bytesOrData);
    const totalBytes = rawBytes + 64;
    this.appSentBytes += totalBytes;
    this.totalSentBytes += totalBytes;
    this.appPacketCount++;

    this.inspector.recordPacket('UPLOAD', rawBytes, decodedObj, bytesOrData);
  }

  public recordDownload(bytesOrData: number | any, decodedObj?: any): void {
    const rawBytes = parsePayloadBytes(bytesOrData);
    const totalBytes = rawBytes + 64;
    this.appReceivedBytes += totalBytes;
    this.totalReceivedBytes += totalBytes;
    this.appPacketCount++;

    this.inspector.recordPacket('DOWNLOAD', rawBytes, decodedObj, bytesOrData);
  }

  public async sample(): Promise<void> {
    const now = performance.now();
    const elapsedSeconds = Math.max(0.1, (now - this.lastSampleTime) / 1000);
    this.lastSampleTime = now;

    const { measuredSentBytes, measuredReceivedBytes, rttMs, foundRtcStats } =
      await queryNativeRtcStats(this.peerManagerRef);

    if (rttMs !== null && rttMs > 0 && rttMs < 2000) {
      this.realPingMs = rttMs;
    }

    if (foundRtcStats && this.prevRtcSentBytes !== null && this.prevRtcReceivedBytes !== null) {
      const deltaSent = Math.max(0, measuredSentBytes - this.prevRtcSentBytes);
      const deltaReceived = Math.max(0, measuredReceivedBytes - this.prevRtcReceivedBytes);

      this.uploadKBs = Math.round((deltaSent / 1024 / elapsedSeconds) * 10) / 10;
      this.downloadKBs = Math.round((deltaReceived / 1024 / elapsedSeconds) * 10) / 10;
      this.uploadKbps = Math.round((deltaSent * 8) / 1000 / elapsedSeconds);
      this.downloadKbps = Math.round((deltaReceived * 8) / 1000 / elapsedSeconds);

      this.totalSentBytes = measuredSentBytes;
      this.totalReceivedBytes = measuredReceivedBytes;
    } else {
      this.uploadKBs = Math.round((this.appSentBytes / 1024 / elapsedSeconds) * 10) / 10;
      this.downloadKBs = Math.round((this.appReceivedBytes / 1024 / elapsedSeconds) * 10) / 10;
      this.uploadKbps = Math.round((this.appSentBytes * 8) / 1000 / elapsedSeconds);
      this.downloadKbps = Math.round((this.appReceivedBytes * 8) / 1000 / elapsedSeconds);
    }

    this.packetsPerSec = Math.round(this.appPacketCount / elapsedSeconds);

    if (foundRtcStats) {
      this.prevRtcSentBytes = measuredSentBytes;
      this.prevRtcReceivedBytes = measuredReceivedBytes;
    }

    this.appSentBytes = 0;
    this.appReceivedBytes = 0;
    this.appPacketCount = 0;
  }

  public getStats(): NetworkStats {
    return {
      uploadKbps: this.uploadKbps,
      downloadKbps: this.downloadKbps,
      uploadKBs: this.uploadKBs,
      downloadKBs: this.downloadKBs,
      totalSentKB: Math.round((this.totalSentBytes / 1024) * 10) / 10,
      totalReceivedKB: Math.round((this.totalReceivedBytes / 1024) * 10) / 10,
      realPingMs: this.realPingMs,
      packetsPerSec: this.packetsPerSec,
    };
  }
}

export const netMetrics = new NetworkMetricsTracker();
