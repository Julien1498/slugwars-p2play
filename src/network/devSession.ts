const DEV_SESSION_KEY = 'slugwars_dev_enabled';

/**
 * Checks whether dev/debug mode is requested via URL query parameters or hash.
 * Dev mode is strictly opt-in per URL and never lingers in storage.
 */
export function detectDevModeFromEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const hasQuery =
      params.get('dev') === 'true' ||
      params.get('dev') === '1' ||
      params.get('debug') === 'true' ||
      params.get('debug') === '1';

    if (hasQuery) return true;

    const hash = (window.location.hash || '').toLowerCase();
    if (
      hash.includes('dev=1') ||
      hash.includes('dev=true') ||
      hash.includes('debug=1') ||
      hash.includes('debug=true')
    ) {
      return true;
    }
  } catch {}

  // Auto-purge any stale storage key so users never get stuck in debug mode
  try {
    sessionStorage.removeItem(DEV_SESSION_KEY);
  } catch {}

  return false;
}

/**
 * Clears or updates dev mode status in sessionStorage.
 */
export function persistDevModeSession(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      sessionStorage.setItem(DEV_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(DEV_SESSION_KEY);
    }
  } catch {}
}

/**
 * Determines if host dev capabilities are active for the current match.
 */
export function isHostDevModeActive(
  engineState: { isDevHost?: boolean },
  isHost: boolean
): boolean {
  if (!isHost) return false;
  if (engineState.isDevHost) return true;
  return detectDevModeFromEnvironment();
}
