export interface LocationLike {
  search?: string;
  hash?: string;
  pathname?: string;
}

export function getRoomCodeFromLocation(locationObj?: LocationLike): string {
  const loc = locationObj || (typeof window !== 'undefined' ? window.location : undefined);
  if (!loc) return '';

  // 1. Explicit search query parameters (?room=XYZ, ?code=XYZ, ?r=XYZ, ?join=XYZ)
  try {
    const params = new URLSearchParams(loc.search || '');
    for (const key of ['room', 'code', 'r', 'join']) {
      const val = params.get(key);
      if (val && val.trim()) {
        const clean = decodeURIComponent(val).trim().toUpperCase();
        if (/^[A-Z0-9_-]{3,16}$/i.test(clean)) {
          return clean;
        }
      }
    }
  } catch {}

  // 2. Hash routing (#/XYZ, #XYZ, #room=XYZ, #/room/XYZ)
  try {
    const rawHash = (loc.hash || '').replace(/^[#/]+/, '').trim();
    if (rawHash) {
      if (rawHash.includes('=')) {
        const hashParams = new URLSearchParams(rawHash);
        for (const key of ['room', 'code', 'r', 'join']) {
          const val = hashParams.get(key);
          if (val && val.trim()) {
            const clean = decodeURIComponent(val).trim().toUpperCase();
            if (/^[A-Z0-9_-]{3,16}$/i.test(clean)) return clean;
          }
        }
      } else {
        const clean = decodeURIComponent(rawHash.replace(/^room\//i, '')).trim().toUpperCase();
        if (
          /^[A-Z0-9_-]{3,16}$/i.test(clean) &&
          !['LOBBY', 'GAME', 'PLAY', 'INDEX.HTML'].includes(clean)
        ) {
          return clean;
        }
      }
    }
  } catch {}

  return '';
}
