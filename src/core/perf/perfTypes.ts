export const RENDER_PASS_LABELS: Record<string, string> = {
  // Ciel & Atmosphère
  sky_gradient: '🌌 Dégradé Ciel Infini',
  sky_clouds_stars: '☁️ Nuages & Étoiles',
  sky_celestial: '☀️ Soleil / Lune / Phare',
  sky_mountains: '🏔️ Montagnes & Collines',
  sky_back_ocean: '🌊 Océan Arrière-Plan',
  // Terrain
  terrain_buffer: '🏜️ Terrain Destructible',
  // Décors & Poutres
  props_girders: '🏗️ Poutres Métalliques HD',
  props_solids: '🌴 Décors Solides (Palmiers, Hérissons, etc.)',
  decor_foliage: '🦋 Végétation & Papillons',
  decor_mines: '💣 Mines Terrestres',
  decor_helicopters: '🚁 Hélicoptères',
  decor_tombstones: '🪦 Tombes & Âmes',
  // Limaces & Cordes
  ninja_ropes: '🪢 Cordes Ninja',
  slugs_rendering: '🐌 Limaces & Armes',
  // Projectiles & Effets FX
  supply_crates: '📦 Caisses de Largage',
  projectiles: '🚀 Projectiles & Roquettes',
  particles_fx: '✨ Particules & Fumée',
  explosions_fx: '💥 Explosions HD',
  floating_damages: '🔢 Dégâts Flottants',
  // Visée & Placement
  aim_guides: '🎯 Guides de Visée & Trajectoires',
  placement_ghost: '👤 Fantôme de Placement',
  // Océan & Débogage
  ocean_waves: '🌊 Vagues Océaniques Avant-Plan',
  debug_hitboxes: '📐 Hitboxes Debug',
};

export interface RenderPassMetric {
  passId: string;
  label: string;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  percentOfRender: number;
  callCount: number;
}

export interface FrameLogEntry {
  frameId: number;
  timeOffsetMs: number;
  frameIntervalMs: number;
  renderDurationMs: number;
  physicsDurationMs: number;
  reactRenderDurationMs: number;
  cpuJsMs: number;
  gpuRasterMs: number;
  realIdleWaitMs: number;
  browserWaitMs: number;
  fpsInstant: number;
  isJank: boolean;
  isCriticalJank: boolean;
  memoryMB: number | null;
  entities: {
    slugs: number;
    livingSlugs: number;
    projectiles: number;
    explosions: number;
    particles: number;
    mines: number;
    crates: number;
  };
  renderPasses?: Record<string, number>;
}

export interface ReactComponentPerf {
  componentId: string;
  renderCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
}

export interface FpsDistribution {
  fps60PlusCount: number;
  fps60PlusPercent: number;
  fps50to59Count: number;
  fps50to59Percent: number;
  fps30to49Count: number;
  fps30to49Percent: number;
  fpsBelow30Count: number;
  fpsBelow30Percent: number;
}

export interface EnvironmentMetrics {
  dpr: number;
  dprBg?: number;
  dprAction?: number;
  screenWidth: number;
  screenHeight: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  isWindowFocused: boolean;
  isTabVisible: boolean;
  hardwareConcurrency: number;
  deviceMemoryGB: number | null;
  gpuRenderer: string;
  gpuVendor: string;
  framePacingJitterMs: number;
  smoothnessScore: number;
  avgEventLoopLagMs: number;
  maxEventLoopLagMs: number;
  longTasksCount: number;
  longTasksTotalMs: number;
  heapSizeLimitMB: number | null;
}

export interface CpuGpuBreakdown {
  avgCpuJsMs: number;
  cpuJsPercent: number;
  avgGpuRasterMs: number;
  gpuRasterPercent: number;
  avgRealIdleMs: number;
  realIdlePercent: number;
}

export interface PerfCaptureReport {
  durationMs: number;
  totalFrames: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  p1LowFps: number;
  avgFrameIntervalMs: number;
  avgRenderDurationMs: number;
  maxRenderDurationMs: number;
  avgPhysicsDurationMs: number;
  maxPhysicsDurationMs: number;
  totalPhysicsTicks: number;
  totalReactRenders: number;
  avgReactRenderMs: number;
  maxReactRenderMs: number;
  avgBrowserWaitMs: number;
  browserWaitPercent: number;
  cpuGpuBreakdown: CpuGpuBreakdown;
  fpsDistribution: FpsDistribution;
  environment: EnvironmentMetrics;
  diagnosticVerdict: string;
  reactComponents: ReactComponentPerf[];
  renderPasses: RenderPassMetric[];
  topBottleneckPass: RenderPassMetric | null;
  jankFrameCount: number;
  criticalJankCount: number;
  jankPercent: number;
  memoryStartMB: number | null;
  memoryEndMB: number | null;
  memoryDeltaMB: number | null;
  frames: FrameLogEntry[];
  topWorstFrames: FrameLogEntry[];
}
