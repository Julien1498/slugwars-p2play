/**
 * Background Worker Timer
 * Runs precise intervals inside an isolated Web Worker thread.
 * Unlike DOM setInterval/requestAnimationFrame, Web Workers are NEVER throttled
 * by browsers when tabs are inactive, hidden, or minimized.
 */
export function createWorkerInterval(callback: () => void, intervalMs: number = 50): () => void {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    const id = setInterval(callback, intervalMs);
    return () => clearInterval(id);
  }

  try {
    const blobCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(function() {
            self.postMessage('tick');
          }, ${intervalMs});
        } else if (e.data === 'stop') {
          if (timer) clearInterval(timer);
          timer = null;
        }
      };
    `;
    const blob = new Blob([blobCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        callback();
      }
    };

    worker.postMessage('start');

    return () => {
      try {
        worker.postMessage('stop');
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      } catch {
        // Safe fallback cleanup
      }
    };
  } catch (err) {
    console.warn('Web Worker timer creation fallback to setInterval:', err);
    const id = setInterval(callback, intervalMs);
    return () => clearInterval(id);
  }
}
