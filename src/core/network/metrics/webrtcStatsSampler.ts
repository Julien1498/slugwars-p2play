export interface RawRtcStats {
  measuredSentBytes: number;
  measuredReceivedBytes: number;
  rttMs: number | null;
  foundRtcStats: boolean;
}

export async function queryNativeRtcStats(peerManager: any): Promise<RawRtcStats> {
  let measuredSentBytes = 0;
  let measuredReceivedBytes = 0;
  let foundRtcStats = false;
  let rttMs: number | null = null;

  try {
    const connections = peerManager?.connections ? Array.from(peerManager.connections.values()) : [];
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

  return { measuredSentBytes, measuredReceivedBytes, rttMs, foundRtcStats };
}

export function parsePayloadBytes(bytesOrData: number | any): number {
  if (typeof bytesOrData === 'number') return bytesOrData;
  if (bytesOrData instanceof ArrayBuffer) return bytesOrData.byteLength;
  if (ArrayBuffer.isView(bytesOrData)) return bytesOrData.byteLength;
  if (typeof bytesOrData === 'string') return bytesOrData.length;
  return JSON.stringify(bytesOrData).length;
}
