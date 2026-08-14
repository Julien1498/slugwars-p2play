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

export interface PacketLogEntry {
  id: number;
  timeOffsetMs: number;
  direction: 'UPLOAD' | 'DOWNLOAD';
  rawBytes: number;
  summary: string;
  decodedData?: any;
}

export interface TrafficCaptureReport {
  durationMs: number;
  packets: PacketLogEntry[];
  uploadCount: number;
  downloadCount: number;
  totalUploadBytes: number;
  totalDownloadBytes: number;
  avgUploadBytesPerSec: number;
  avgDownloadBytesPerSec: number;
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

  // Traffic Capture System (5-second Inspector)
  private isCapturing = false;
  private captureStartTime = 0;
  private capturePackets: PacketLogEntry[] = [];
  private nextPacketId = 1;
  private captureListeners: ((report: TrafficCaptureReport | null, progressSecondsRemaining: number) => void)[] = [];
  private lastReport: TrafficCaptureReport | null = null;

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

  public startCapture(durationSeconds: number = 5): void {
    if (this.isCapturing) return;
    this.isCapturing = true;
    this.captureStartTime = performance.now();
    this.capturePackets = [];
    this.nextPacketId = 1;
    this.lastReport = null;

    let remaining = durationSeconds;
    this.notifyCaptureProgress(remaining);

    const timer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        this.finishCapture(durationSeconds * 1000);
      } else {
        this.notifyCaptureProgress(remaining);
      }
    }, 1000);
  }

  private finishCapture(plannedDurationMs: number): void {
    this.isCapturing = false;
    const actualDurationMs = performance.now() - this.captureStartTime;

    let totalUpload = 0;
    let totalDownload = 0;
    let uploadCount = 0;
    let downloadCount = 0;

    for (const p of this.capturePackets) {
      if (p.direction === 'UPLOAD') {
        totalUpload += p.rawBytes;
        uploadCount++;
      } else {
        totalDownload += p.rawBytes;
        downloadCount++;
      }
    }

    const durationSec = Math.max(0.1, actualDurationMs / 1000);
    const report: TrafficCaptureReport = {
      durationMs: Math.round(actualDurationMs),
      packets: [...this.capturePackets],
      uploadCount,
      downloadCount,
      totalUploadBytes: totalUpload,
      totalDownloadBytes: totalDownload,
      avgUploadBytesPerSec: Math.round((totalUpload / durationSec) * 10) / 10,
      avgDownloadBytesPerSec: Math.round((totalDownload / durationSec) * 10) / 10,
    };

    this.lastReport = report;
    for (const listener of this.captureListeners) {
      listener(report, 0);
    }
  }

  private notifyCaptureProgress(secondsRemaining: number): void {
    for (const listener of this.captureListeners) {
      listener(null, secondsRemaining);
    }
  }

  public onCaptureUpdate(cb: (report: TrafficCaptureReport | null, progressSecondsRemaining: number) => void): () => void {
    this.captureListeners.push(cb);
    if (this.lastReport) {
      cb(this.lastReport, 0);
    }
    return () => {
      this.captureListeners = this.captureListeners.filter((l) => l !== cb);
    };
  }

  public getLastCaptureReport(): TrafficCaptureReport | null {
    return this.lastReport;
  }

  public isCaptureRecording(): boolean {
    return this.isCapturing;
  }

  private summarize(decodedData?: any): string {
    if (!decodedData) return 'Paquet Binaire';
    const parts: string[] = [];

    if (decodedData.type === 'ACTION') {
      return `🎮 Action: ${decodedData.actionName || 'Custom'}`;
    }

    if (decodedData.turnTimer !== undefined) {
      parts.push(`⏱️ Timer ${decodedData.turnTimer}s`);
    }
    if (decodedData.retreatTimer !== undefined) {
      parts.push(`🏃 Fuite ${decodedData.retreatTimer}s`);
    }
    if (decodedData.slugs && decodedData.slugs.length > 0) {
      parts.push(`🐌 Limaces (${decodedData.slugs.length})`);
    }
    if (decodedData.projectiles && decodedData.projectiles.length > 0) {
      parts.push(`🚀 Tirs (${decodedData.projectiles.length})`);
    }
    if (decodedData.explosions && decodedData.explosions.length > 0) {
      parts.push(`💥 Explosions (${decodedData.explosions.length})`);
    }
    if (decodedData.girders && decodedData.girders.length > 0) {
      parts.push(`🏗️ Poutres (${decodedData.girders.length})`);
    }
    if (decodedData.supplyCrates && decodedData.supplyCrates.length > 0) {
      parts.push(`📦 Caisses (${decodedData.supplyCrates.length})`);
    }
    if (decodedData.mines && decodedData.mines.length > 0) {
      parts.push(`💣 Mines (${decodedData.mines.length})`);
    }
    if (decodedData.phase) {
      parts.push(`🚩 Phase: ${decodedData.phase}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Diff d’état';
  }

  public recordUpload(bytesOrData: number | any, decodedObj?: any): void {
    let rawBytes = 0;
    if (typeof bytesOrData === 'number') {
      rawBytes = bytesOrData;
    } else if (bytesOrData instanceof ArrayBuffer) {
      rawBytes = bytesOrData.byteLength;
    } else if (ArrayBuffer.isView(bytesOrData)) {
      rawBytes = bytesOrData.byteLength;
    } else if (typeof bytesOrData === 'string') {
      rawBytes = bytesOrData.length;
    } else {
      rawBytes = JSON.stringify(bytesOrData).length;
    }
    const totalBytes = rawBytes + 64;
    this.appSentBytes += totalBytes;
    this.totalSentBytes += totalBytes;
    this.appPacketCount++;

    if (this.isCapturing) {
      const timeOffsetMs = Math.round(performance.now() - this.captureStartTime);
      this.capturePackets.push({
        id: this.nextPacketId++,
        timeOffsetMs,
        direction: 'UPLOAD',
        rawBytes,
        summary: this.summarize(decodedObj || bytesOrData),
        decodedData: decodedObj || (typeof bytesOrData === 'object' ? bytesOrData : undefined),
      });
    }
  }

  public recordDownload(bytesOrData: number | any, decodedObj?: any): void {
    let rawBytes = 0;
    if (typeof bytesOrData === 'number') {
      rawBytes = bytesOrData;
    } else if (bytesOrData instanceof ArrayBuffer) {
      rawBytes = bytesOrData.byteLength;
    } else if (ArrayBuffer.isView(bytesOrData)) {
      rawBytes = bytesOrData.byteLength;
    } else if (typeof bytesOrData === 'string') {
      rawBytes = bytesOrData.length;
    } else {
      rawBytes = JSON.stringify(bytesOrData).length;
    }
    const totalBytes = rawBytes + 64;
    this.appReceivedBytes += totalBytes;
    this.totalReceivedBytes += totalBytes;
    this.appPacketCount++;

    if (this.isCapturing) {
      const timeOffsetMs = Math.round(performance.now() - this.captureStartTime);
      this.capturePackets.push({
        id: this.nextPacketId++,
        timeOffsetMs,
        direction: 'DOWNLOAD',
        rawBytes,
        summary: this.summarize(decodedObj || bytesOrData),
        decodedData: decodedObj || (typeof bytesOrData === 'object' ? bytesOrData : undefined),
      });
    }
  }

  public async sample(): Promise<void> {
    const now = performance.now();
    const elapsedSeconds = Math.max(0.1, (now - this.lastSampleTime) / 1000);
    this.lastSampleTime = now;

    let measuredSentBytes = 0;
    let measuredReceivedBytes = 0;
    let foundRtcStats = false;
    let rttMs: number | null = null;

    // Query native WebRTC RTCPeerConnection statistics
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
      // Fallback
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
