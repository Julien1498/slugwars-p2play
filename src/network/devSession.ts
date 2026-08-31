const DEV_SESSION_KEY = 'slugwars_dev_enabled';

/**
 * Checks whether dev/debug mode is requested via URL query parameters or sessionStorage.
 */
export function detectDevModeFromEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const hasQuery =
    params.get('dev') === 'true' ||
    params.get('dev') === '1' ||
    params.get('debug') === 'true' ||
    params.get('debug') === '1';

  if (hasQuery) return true;

  try {
    return sessionStorage.getItem(DEV_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persists or clears the dev mode status in sessionStorage.
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
