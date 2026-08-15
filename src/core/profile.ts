export interface PlayerProfile {
  username: string;
  avatar: string;
  updatedAt?: number;
}

const PROFILE_STORAGE_KEY = 'p2play:profile';

export function loadProfile(): PlayerProfile | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.username === 'string' && parsed.username.trim()) {
      return {
        username: parsed.username.trim(),
        avatar: typeof parsed.avatar === 'string' && parsed.avatar ? parsed.avatar : '🐌',
        updatedAt: parsed.updatedAt || Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProfile(data: { username: string; avatar?: string }): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const username = data.username.trim();
  if (!username) return;
  try {
    const profile: PlayerProfile = {
      username,
      avatar: data.avatar || '🐌',
      updatedAt: Date.now(),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded or private browsing
  }
}
