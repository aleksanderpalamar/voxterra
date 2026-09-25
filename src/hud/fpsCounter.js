const DEFAULT_SAMPLE_WINDOW = 0.5;

export class FpsCounter {
  constructor(sampleWindow = DEFAULT_SAMPLE_WINDOW) {
    this.sampleWindow = sampleWindow;
    this.frames = 0;
    this.elapsed = 0;
  }

  tick(dt) {
    this.frames += 1;
    this.elapsed += dt;
    if (this.elapsed < this.sampleWindow) return null;
    const fps = Math.round(this.frames / this.elapsed);
    this.frames = 0;
    this.elapsed = 0;
    return fps;
  }
}
