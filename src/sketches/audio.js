import { getMicStatus, getAnalyser, getTimeDomain, getFrequencyData } from '../utils/audioInput.js';

/**
 * Audio Reactive
 *
 * Renders a circular oscilloscope (time-domain) overlaid on a 360°
 * frequency-spectrum ring. Requires the shared mic to be active
 * (enable "mic input" in the parameters panel).
 *
 * params.speed   → waveform responsiveness (analyser smoothing)
 * params.density → bar height scale
 * params.trail   → fade speed
 * params.hue     → base colour offset
 */
export function audioSketch(p, params) {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
  };

  p.draw = () => {
    if (params.paused) return;

    const cx     = p.width  / 2;
    const cy     = p.height / 2;
    const minDim = Math.min(p.width, p.height);
    const status = getMicStatus();

    // Trail fade
    p.push();
    p.noStroke();
    p.fill(0, 0, 3, params.trail * 100);
    p.rect(0, 0, p.width, p.height);
    p.pop();

    if (status !== 'active') {
      const msg = status === 'denied'
        ? 'MIC ACCESS DENIED'
        : 'ENABLE MIC INPUT IN PARAMETERS ↗';
      p.push();
      p.fill(params.hue % 360, 65, 75, 70);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(msg, cx, cy);
      p.pop();
      return;
    }

    // Tune smoothing: high speed → snappier response
    const analyser = getAnalyser();
    analyser.smoothingTimeConstant = p.constrain(1 - params.speed * 0.13, 0.2, 0.95);

    const timeDomain = getTimeDomain();
    const freqDomain = getFrequencyData();
    if (!timeDomain || !freqDomain) return;

    const baseR  = minDim * 0.22;
    const barMax = minDim * 0.22 * (params.density / 600);

    p.push();
    p.translate(cx, cy);

    // ── Frequency bars — 360° ring ──────────────────────────────────────────
    const bins = freqDomain.length;
    for (let i = 0; i < bins; i++) {
      const angle = (i / bins) * p.TWO_PI - p.HALF_PI;
      const norm  = freqDomain[i] / 255;
      const r1    = baseR;
      const r2    = baseR + norm * barMax;
      const hue   = (params.hue + (i / bins) * 120) % 360;
      p.stroke(hue, 75, 90, norm * 85);
      p.strokeWeight(1.5);
      p.line(
        Math.cos(angle) * r1, Math.sin(angle) * r1,
        Math.cos(angle) * r2, Math.sin(angle) * r2,
      );
    }

    // ── Circular waveform — oscilloscope ring ───────────────────────────────
    const samples = timeDomain.length;
    for (let i = 0; i < samples; i++) {
      const next = (i + 1) % samples;
      const a1   = (i    / samples) * p.TWO_PI - p.HALF_PI;
      const a2   = (next / samples) * p.TWO_PI - p.HALF_PI;
      const v1   = (timeDomain[i]    - 128) / 128;
      const v2   = (timeDomain[next] - 128) / 128;
      const r1   = baseR + v1 * minDim * 0.06 * params.speed;
      const r2   = baseR + v2 * minDim * 0.06 * params.speed;
      const hue  = (params.hue + 30 + (i / samples) * 60) % 360;
      p.stroke(hue, 55, 98, 80);
      p.strokeWeight(1.8);
      p.line(
        Math.cos(a1) * r1, Math.sin(a1) * r1,
        Math.cos(a2) * r2, Math.sin(a2) * r2,
      );
    }

    p.pop();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}
