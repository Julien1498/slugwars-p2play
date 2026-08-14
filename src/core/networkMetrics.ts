export interface NetworkStats {
  uploadKbps: number;
  downloadKbps: number;
  uploadKBs: number;
  downloadKBs: number;
  totalSentKB: number;
  totalReceivedKB: number;
}

class NetworkMetricsTracker {
  private sentBytesInWindow = 0;
  private receivedBytesInWindow = 0;
  private lastCalculationTime = performance.now();

  public uploadKbps = 0;
  public downloadKbps = 0;
  public uploadKBs = 0;
  public downloadKBs = 0;
  public totalSentBytes = 0;
  public totalReceivedBytes = 0;

  public recordUpload(bytesOrData: number | any): void {
    const bytes = typeof bytesOrData === 'number'
      ? bytesOrData
      : (typeof bytesOrData === 'string' ? bytesOrData.length : JSON.stringify(bytesOrData).length);
    this.sentBytesInWindow += bytes;
    this.totalSentBytes += bytes;
  }

  public recordDownload(bytesOrData: number | any): void {
    const bytes = typeof bytesOrData === 'number'
      ? bytesOrData
      : (typeof bytesOrData === 'string' ? bytesOrData.length : JSON.stringify(bytesOrData).length);
    this.receivedBytesInWindow += bytes;
    this.totalReceivedBytes += bytes;
  }

  public update(): NetworkStats {
    const now = performance.now();
    const elapsedSeconds = (now - this.lastCalculationTime) / 1000;

    if (elapsedSeconds >= 0.5) {
      // Calculate kbps (kilobits per second) and KB/s (kilobytes per second)
      this.uploadKBs = Math.round(((this.sentBytesInWindow / 1024) / elapsedSeconds) * 10) / 10;
      this.downloadKBs = Math.round(((this.receivedBytesInWindow / 1024) / elapsedSeconds) * 10) / 10;
      this.uploadKbps = Math.round(((this.sentBytesInWindow * 8) / 1000) / elapsedSeconds);
      this.downloadKbps = Math.round(((this.receivedBytesInWindow * 8) / 1000) / elapsedSeconds);

      this.sentBytesInWindow = 0;
      this.receivedBytesInWindow = 0;
      this.lastCalculationTime = now;
    }

    return {
      uploadKbps: this.uploadKbps,
      downloadKbps: this.downloadKbps,
      uploadKBs: this.uploadKBs,
      downloadKBs: this.downloadKBs,
      totalSentKB: Math.round((this.totalSentBytes / 1024) * 10) / 10,
      totalReceivedKB: Math.round((this.totalReceivedBytes / 1024) * 10) / 10,
    };
  }
}

export const netMetrics = new NetworkMetricsTracker();
