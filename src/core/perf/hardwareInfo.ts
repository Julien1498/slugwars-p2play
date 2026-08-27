export function getGpuHardwareInfo(): { renderer: string; vendor: string } {
  if (typeof document === 'undefined') return { renderer: 'Inconnu (SSR)', vendor: 'Inconnu (SSR)' };
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
    if (!gl) return { renderer: 'Non disponible (Software)', vendor: 'Non disponible' };
    const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbgRenderInfo) {
      return {
        renderer: gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) || 'Inconnu',
        vendor: gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL) || 'Inconnu',
      };
    }
    return {
      renderer: gl.getParameter(gl.RENDERER) || 'Inconnu',
      vendor: gl.getParameter(gl.VENDOR) || 'Inconnu',
    };
  } catch {
    return { renderer: 'Accès restreint par le navigateur', vendor: 'Inconnu' };
  }
}
