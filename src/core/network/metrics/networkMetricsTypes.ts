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
