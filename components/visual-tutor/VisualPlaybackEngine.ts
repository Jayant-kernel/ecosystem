import type { VisualPlan } from './visualTypes';

const DEFAULT_DELAY = 850;

/** A cancellable, bounded scheduler: plans are data, never executable model code. */
export class VisualPlaybackEngine {
  private timer: number | null = null;
  private cancelled = false;
  constructor(private readonly onStep: (index: number) => void, private readonly onFinish: () => void) {}
  play(plan: VisualPlan) {
    this.cancel();
    this.cancelled = false;
    const next = (index: number) => {
      if (this.cancelled) return;
      if (index >= plan.steps.length) { this.onFinish(); return; }
      this.onStep(index);
      const wait = Math.max(0, Math.min(6000, plan.steps[index].durationMs ?? (plan.steps[index].type === 'wait' ? 1200 : DEFAULT_DELAY)));
      this.timer = window.setTimeout(() => next(index + 1), wait);
    };
    next(0);
  }
  cancel() { this.cancelled = true; if (this.timer !== null) window.clearTimeout(this.timer); this.timer = null; }
}
