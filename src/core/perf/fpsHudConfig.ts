export class FpsHudConfigManager {
  private isFpsHudEnabled: boolean =
    typeof window !== 'undefined' && localStorage.getItem('slugwars_fps_hud_enabled') === 'true';
  private fpsHudListeners: ((enabled: boolean) => void)[] = [];

  private isFpsHudAdvancedEnabled: boolean =
    typeof window !== 'undefined' && localStorage.getItem('slugwars_fps_hud_advanced') === 'true';
  private fpsHudAdvancedListeners: ((enabled: boolean) => void)[] = [];

  public getFpsHudEnabled(): boolean {
    return this.isFpsHudEnabled;
  }

  public setFpsHudEnabled(enabled: boolean): void {
    this.isFpsHudEnabled = enabled;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('slugwars_fps_hud_enabled', enabled ? 'true' : 'false');
      }
    } catch {}
    for (const listener of this.fpsHudListeners) {
      listener(enabled);
    }
  }

  public onFpsHudToggle(listener: (enabled: boolean) => void): () => void {
    this.fpsHudListeners.push(listener);
    listener(this.isFpsHudEnabled);
    return () => {
      this.fpsHudListeners = this.fpsHudListeners.filter((l) => l !== listener);
    };
  }

  public getFpsHudAdvancedEnabled(): boolean {
    return this.isFpsHudAdvancedEnabled;
  }

  public setFpsHudAdvancedEnabled(enabled: boolean): void {
    this.isFpsHudAdvancedEnabled = enabled;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('slugwars_fps_hud_advanced', enabled ? 'true' : 'false');
      }
    } catch {}
    for (const listener of this.fpsHudAdvancedListeners) {
      listener(enabled);
    }
  }

  public onFpsHudAdvancedToggle(listener: (enabled: boolean) => void): () => void {
    this.fpsHudAdvancedListeners.push(listener);
    listener(this.isFpsHudAdvancedEnabled);
    return () => {
      this.fpsHudAdvancedListeners = this.fpsHudAdvancedListeners.filter((l) => l !== listener);
    };
  }
}
