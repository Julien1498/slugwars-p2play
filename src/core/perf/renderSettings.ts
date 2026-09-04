class RenderSettingsManager {
  private terrainMipmapEnabled = true;
  private terrainMipmapThreshold = 0.65;
  private propsMipmapEnabled = true;
  private listeners: (() => void)[] = [];

  public getTerrainMipmapEnabled(): boolean {
    return this.terrainMipmapEnabled;
  }

  public setTerrainMipmapEnabled(enabled: boolean): void {
    this.terrainMipmapEnabled = enabled;
    this.notify();
  }

  public toggleTerrainMipmap(): boolean {
    this.setTerrainMipmapEnabled(!this.terrainMipmapEnabled);
    return this.terrainMipmapEnabled;
  }

  public getTerrainMipmapThreshold(): number {
    return this.terrainMipmapThreshold;
  }

  public setTerrainMipmapThreshold(threshold: number): void {
    this.terrainMipmapThreshold = Math.max(0.3, Math.min(1.5, Math.round(threshold * 100) / 100));
    this.notify();
  }

  public getPropsMipmapEnabled(): boolean {
    return this.propsMipmapEnabled;
  }

  public setPropsMipmapEnabled(enabled: boolean): void {
    this.propsMipmapEnabled = enabled;
    this.notify();
  }

  public togglePropsMipmap(): boolean {
    this.setPropsMipmapEnabled(!this.propsMipmapEnabled);
    return this.propsMipmapEnabled;
  }

  public onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Backward compatibility with previous onTerrainMipmapChange
  public onTerrainMipmapChange(listener: (enabled: boolean) => void): () => void {
    return this.onChange(() => listener(this.terrainMipmapEnabled));
  }

  private notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }
}

export const renderSettings = new RenderSettingsManager();
