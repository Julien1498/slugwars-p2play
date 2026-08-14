export interface NetworkStats {
  uploadKbps: number;
  downloadKbps: number;
  uploadKBs: number;
  downloadKBs: number;
  totalSentKB: number;
  totalReceivedKB: number;
  realPingMs: number | null;
  packetsPerSec: number;
}

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

  constructor() {
    // Start continuous background sampling every 1000ms
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.sample();
      }, 1000);
    }
  }

  public setPeerManager(pm: any) {
    this.peerManagerRef = pm;
  }

  public recordUpload(bytesOrData: number | any): void {
    const rawBytes = typeof bytesOrData === 'number'
      ? bytesOrData
      : (typeof bytesOrData === 'string' ? bytesOrData.length : JSON.stringify(bytesOrData).length);
    // Add realistic WebRTC / SCTP / DTLS transport packet overhead (~64 bytes per message)
    const totalBytes = rawBytes + 64;
    this.appSentBytes += totalBytes;
    this.totalSentBytes += totalBytes;
    this.appPacketCount++;
  }

  public recordDownload(bytesOrData: number | any): void {
    const rawBytes = typeof bytesOrData === 'number'
      ? bytesOrData
      : (typeof bytesOrData === 'string' ? bytesOrData.length : JSON.stringify(bytesOrData).length);
    const totalBytes = rawBytes + 64;
    this.appReceivedBytes += totalBytes;
    this.totalReceivedBytes += totalBytes;
    this.appPacketCount++;
  }

  public async sample(): Promise<void> {
    const now = performance.now();
    const elapsedSeconds = Math.max(0.1, (now - this.lastSampleTime) / 1000);
    this.lastSampleTime = now;

    let measuredSentBytes = 0;
    let measuredReceivedBytes = 0;
    let foundRtcStats = false;
    let rttMs: number | null = null;

    // 1. Try querying native WebRTC RTCPeerConnection statistics
    try {
      const pm = this.peerManagerRef;
      const connections = pm?.connections ? Array.from(pm.connections.values()) : [];

      if (connections.length > 0) {
        for (const conn of connections as any[]) {
          const pc: RTCPeerConnection | undefined = conn?.peerConnection || conn?._peerConnection;
          if (pc && typeof pc.getStats === 'function') {
            const stats = await pc.getStats();
            stats.forEach((report: any) => {
              if (report.type === 'candidate-pair' && (report.state === 'succeeded' || report.nominated)) {
                if (typeof report.bytesSent === 'number') measuredSentBytes += report.bytesSent;
                if (typeof report.bytesReceived === 'number') measuredReceivedBytes += report.bytesReceived;
                if (typeof report.currentRoundTripTime === 'number') {
                  rttMs = Math.round(report.currentRoundTripTime * 1000);
                }
                foundRtcStats = true;
              } else if (report.type === 'data-channel') {
                if (!foundRtcStats) {
                  if (typeof report.bytesSent === 'number') measuredSentBytes += report.bytesSent;
                  if (typeof report.bytesReceived === 'number') measuredReceivedBytes += report.bytesReceived;
                  foundRtcStats = true;
                }
              }
            });
          }
        }
      }
    } catch {
      // Fallback to application level tracking
    }

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
      // Use Application layer packet accounting
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
