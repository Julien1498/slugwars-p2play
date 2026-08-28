import { PacketLogEntry, TrafficCaptureReport } from './networkMetricsTypes';

export function summarizePacket(decodedData?: any): string {
  if (!decodedData || typeof decodedData !== 'object') return 'Paquet Binaire';
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

export class TrafficCaptureInspector {
  private isCapturing = false;
  private captureStartTime = 0;
  private capturePackets: PacketLogEntry[] = [];
  private nextPacketId = 1;
  private captureListeners: ((report: TrafficCaptureReport | null, progressSecondsRemaining: number) => void)[] = [];
  private lastReport: TrafficCaptureReport | null = null;

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

  public recordPacket(
    direction: 'UPLOAD' | 'DOWNLOAD',
    rawBytes: number,
    decodedObj?: any,
    bytesOrData?: any
  ): void {
    if (!this.isCapturing) return;
    const timeOffsetMs = Math.round(performance.now() - this.captureStartTime);
    this.capturePackets.push({
      id: this.nextPacketId++,
      timeOffsetMs,
      direction,
      rawBytes,
      summary: summarizePacket(decodedObj || bytesOrData),
      decodedData: decodedObj || (typeof bytesOrData === 'object' ? bytesOrData : undefined),
    });
  }

  public getLastCaptureReport(): TrafficCaptureReport | null {
    return this.lastReport;
  }

  public isCaptureRecording(): boolean {
    return this.isCapturing;
  }
}
