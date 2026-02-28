import { waveAmplitude, combineWaves } from '../utils/math.js';
import { densityToSourceCount } from '../utils/particles.js';
import { getAmplitude } from '../utils/audioInput.js';

/**
 * Wave Interference
 *
 * Multiple circular wave sources orbit the canvas center.
 * Each pixel's brightness and hue is determined by the
 * combined amplitude at that point — constructive and
 * destructive interference creates moiré-like patterns.
 *
 * params.density  → number of wave sources (2–8)
 * params.speed    → animation speed
 * params.scale    → wavelength (low = tight waves, high = wide)
 * params.hue      → base color offset
 * (trail is unused — each frame is fully redrawn for clean interference)
 */
export function waveSketch(p, params) {
  const CELL = 10;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    p.noStroke();
  };

  p.draw = () => {
    if (params.paused) return;

    p.background(0, 0, 5);

    const srcCount = densityToSourceCount(params.density);
    const t = p.frameCount * params.speed * 0.025;
    const cx = p.width / 2;
    const cy = p.height / 2;
    const orbitR = Math.min(p.width, p.height) * 0.22;
    const freqScale = params.scale * 4;

    const sources = Array.from({ length: srcCount }, (_, i) => {
      const phase = (i / srcCount) * p.TWO_PI;
      return {
        x:    cx + Math.cos(phase + t * (0.7 + i * 0.13)) * orbitR,
        y:    cy + Math.sin(phase + t * (0.5 + i * 0.11)) * orbitR * 0.75,
        freq: 0.012 + i * 0.003,
      };
    });

    const micAmp  = params.mic ? getAmplitude() : 0;
    const contrastBoost = 1 + micAmp * 2;

    for (let x = 0; x < p.width; x += CELL) {
      for (let y = 0; y < p.height; y += CELL) {
        const amplitudes = sources.map((s) =>
          waveAmplitude(x, y, s.x, s.y, s.freq * freqScale, t * 3.5)
        );
        const val = combineWaves(amplitudes); // [-1, 1]

        const hue   = ((val * 55) + params.hue) % 360;
        const sat   = 55 + val * 25;
        const bri   = p.constrain((30 + val * 45) * contrastBoost, 0, 100);
        const alpha = 65 + val * 20;

        p.fill(hue, sat, bri, alpha);
        p.rect(x, y, CELL, CELL);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}
