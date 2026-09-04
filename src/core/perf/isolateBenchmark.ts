export type IsolateBypassTarget =
  | 'NONE'
  | 'TERRAIN'
  | 'PROPS'
  | 'WATER'
  | 'SKY'
  | 'DECOR'
  | 'ENTITIES'
  | 'ALL_FOUR'
  | 'TOTAL_BLACK';

export interface IsolateStepDef {
  target: IsolateBypassTarget;
  label: string;
  description: string;
  durationMs: number;
}

export interface IsolateStepResult {
  target: IsolateBypassTarget;
  label: string;
  description: string;
  avgFps: number;
  avgFrameMs: number;
  deltaFps: number;
  savedMs: number;
  gpuBottleneckSharePercent: number;
}

export interface IsolateBenchmarkReport {
  timestamp: number;
  totalDurationMs: number;
  baseline: {
    avgFps: number;
    avgFrameMs: number;
  };
  steps: IsolateStepResult[];
  culpritRanking: { target: IsolateBypassTarget; label: string; savedMs: number }[];
}

export interface IsolateProgress {
  currentStepIndex: number;
  totalSteps: number;
  currentLabel: string;
  secondsRemaining: number;
}

export const ISOLATE_STEPS: IsolateStepDef[] = [
  { target: 'NONE', label: 'Référence (Tout actif)', description: 'Mesure de base en conditions réelles', durationMs: 2000 },
  { target: 'TERRAIN', label: 'Sans Terrain', description: 'Texture 2400x1200 et cratères désactivés', durationMs: 2000 },
  { target: 'PROPS', label: 'Sans Props Solides', description: 'Arbres, bunkers, champignons désactivés', durationMs: 2000 },
  { target: 'WATER', label: 'Sans Océan & Vagues', description: 'Houle, dégradés et écume désactivés', durationMs: 2000 },
  { target: 'SKY', label: 'Sans Ciel & Montagnes', description: 'Dégradé ciel et montagnes désactivés', durationMs: 2000 },
  { target: 'DECOR', label: 'Sans Décors & Poutres', description: 'Lianes, papillons, tombes, poutres coupés', durationMs: 2000 },
  { target: 'ENTITIES', label: 'Sans Limaces & Visée', description: 'Slugs, fantôme de pose, caisses, mines coupés', durationMs: 2000 },
  { target: 'ALL_FOUR', label: 'Sans les 4 Majeurs', description: 'Terrain + Props + Eau + Ciel coupés ensemble', durationMs: 2000 },
  { target: 'TOTAL_BLACK', label: 'Écran Noir Total', description: 'Zéro rendu canvas, écran noir pur à vide', durationMs: 2000 },
];

class IsolateBenchmarkManager {
  private activeBypass: IsolateBypassTarget = 'NONE';
  private isRunning = false;
  private currentStepIndex = 0;
  private stepStartTime = 0;
  private stepIntervals: number[] = [];
  private stepResults: IsolateStepResult[] = [];
  private progressListeners: ((progress: IsolateProgress) => void)[] = [];
  private finishListeners: ((report: IsolateBenchmarkReport) => void)[] = [];
  private timerId: any = null;

  public getActiveBypass(): IsolateBypassTarget {
    return this.activeBypass;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public start(
    onProgress?: (progress: IsolateProgress) => void,
    onFinish?: (report: IsolateBenchmarkReport) => void
  ): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentStepIndex = 0;
    this.stepResults = [];
    this.stepIntervals = [];
    this.progressListeners = onProgress ? [onProgress] : [];
    this.finishListeners = onFinish ? [onFinish] : [];

    this.runStep(0);
  }

  public recordFrame(frameIntervalMs: number): void {
    if (!this.isRunning) return;
    if (frameIntervalMs > 0 && frameIntervalMs < 500) {
      this.stepIntervals.push(frameIntervalMs);
    }
  }

  public cancel(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.activeBypass = 'NONE';
    this.currentStepIndex = 0;
    this.stepIntervals = [];
    this.progressListeners = [];
    this.finishListeners = [];
  }

  private runStep(index: number): void {
    if (index >= ISOLATE_STEPS.length) {
      this.finish();
      return;
    }

    this.currentStepIndex = index;
    const step = ISOLATE_STEPS[index];
    this.activeBypass = step.target;
    this.stepStartTime = performance.now();
    this.stepIntervals = [];

    this.notifyProgress();

    this.timerId = setTimeout(() => {
      this.collectStepResult(step);
      this.runStep(index + 1);
    }, step.durationMs);
  }

  private collectStepResult(step: IsolateStepDef): void {
    const validIntervals = this.stepIntervals.slice(5);
    const intervals = validIntervals.length > 0 ? validIntervals : this.stepIntervals;

    let avgInterval = 16.67;
    let avgFps = 60.0;

    if (intervals.length > 0) {
      const sum = intervals.reduce((a, b) => a + b, 0);
      avgInterval = sum / intervals.length;
      avgFps = 1000 / avgInterval;
    }

    this.stepResults.push({
      target: step.target,
      label: step.label,
      description: step.description,
      avgFps: Math.round(avgFps * 10) / 10,
      avgFrameMs: Math.round(avgInterval * 10) / 10,
      deltaFps: 0,
      savedMs: 0,
      gpuBottleneckSharePercent: 0,
    });
  }

  private finish(): void {
    const listeners = [...this.finishListeners];
    this.isRunning = false;
    this.activeBypass = 'NONE';
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    const baseline = this.stepResults[0] || { avgFps: 60, avgFrameMs: 16.6 };
    let individualSavedMs = 0;
    for (let i = 1; i < this.stepResults.length; i++) {
      const res = this.stepResults[i];
      res.deltaFps = Math.round((res.avgFps - baseline.avgFps) * 10) / 10;
      res.savedMs = Math.max(0, Math.round((baseline.avgFrameMs - res.avgFrameMs) * 10) / 10);
      if (res.target !== 'ALL_FOUR' && res.target !== 'TOTAL_BLACK') {
        individualSavedMs += res.savedMs;
      }
    }

    for (let i = 1; i < this.stepResults.length; i++) {
      const res = this.stepResults[i];
      if (res.target === 'ALL_FOUR' || res.target === 'TOTAL_BLACK') {
        res.gpuBottleneckSharePercent = baseline.avgFrameMs > 0
          ? Math.round((res.savedMs / baseline.avgFrameMs) * 1000) / 10
          : 0;
      } else {
        res.gpuBottleneckSharePercent =
          individualSavedMs > 0 ? Math.round((res.savedMs / individualSavedMs) * 1000) / 10 : 0;
      }
    }

    const individualSteps = this.stepResults.slice(1).filter(
      (s) => s.target !== 'ALL_FOUR' && s.target !== 'TOTAL_BLACK'
    );
    individualSteps.sort((a, b) => b.savedMs - a.savedMs);
    const culpritRanking = individualSteps.map((s) => ({
      target: s.target,
      label: s.label,
      savedMs: s.savedMs,
    }));

    const report: IsolateBenchmarkReport = {
      timestamp: Date.now(),
      totalDurationMs: ISOLATE_STEPS.reduce((sum, s) => sum + s.durationMs, 0),
      baseline: {
        avgFps: baseline.avgFps,
        avgFrameMs: baseline.avgFrameMs,
      },
      steps: this.stepResults,
      culpritRanking,
    };

    for (const listener of listeners) {
      listener(report);
    }
    this.progressListeners = [];
    this.finishListeners = [];
  }

  private notifyProgress(): void {
    const currentStep = ISOLATE_STEPS[this.currentStepIndex];
    const elapsed = performance.now() - this.stepStartTime;
    const remainingMs = Math.max(0, currentStep.durationMs - elapsed);
    const secondsRemaining = Math.ceil(remainingMs / 1000);

    const progress: IsolateProgress = {
      currentStepIndex: this.currentStepIndex + 1,
      totalSteps: ISOLATE_STEPS.length,
      currentLabel: currentStep.label,
      secondsRemaining,
    };

    for (const listener of this.progressListeners) {
      listener(progress);
    }
  }
}

export const isolateBenchmark = new IsolateBenchmarkManager();
