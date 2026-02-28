import { syncCount } from '../utils/particles.js';
import { getAmplitude } from '../utils/audioInput.js';

/**
 * Flow Field
 *
 * Perlin noise vectors guide particles across the canvas.
 * Particles leave trails that slowly fade — the accumulation
 * creates an aurora-like texture over time.
 *
 * params.density  → particle count
 * params.speed    → movement speed multiplier
 * params.scale    → noise zoom (low = large smooth curves, high = tight turbulence)
 * params.trail    → how quickly trails fade (low = long memory)
 * params.hue      → base color offset (0–360)
 * params.curl       → noise angle multiplier (low = laminar, high = turbulent swirls)
 * params.colorShift → how strongly the flow angle drives hue rotation
 */
export function flowFieldSketch(p, params) {
  let particles = [];

  p.setup = () => {
    const px = Math.max(1, params.pixelation);
    p.createCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    syncCount(particles, params.density, () => newParticle());
  };

  function newParticle() {
    const x = p.random(p.width);
    const y = p.random(p.height);
    return { x, y, px: x, py: y, life: p.random(0.4, 1) };
  }

  p.draw = () => {
    if (params.paused) return;

    const amp = params.mic ? getAmplitude() : 0;

    // Translucent fill erases the previous frame gradually → trails
    p.push();
    p.noStroke();
    p.fill(0, 0, 5, params.trail * 100 * (1 + amp * 3));
    p.rect(0, 0, p.width, p.height);
    p.pop();

    const speedMod = 1 + amp * 4;
    const t = p.frameCount * 0.003;

    // Keep particle count in sync with the density slider
    syncCount(particles, params.density, () => newParticle());

    for (const pt of particles) {
      pt.px = pt.x;
      pt.py = pt.y;

      const angle = p.noise(pt.x * params.scale, pt.y * params.scale, t) * p.TWO_PI * params.curl;

      pt.x += p.cos(angle) * pt.life * params.speed * speedMod * 2;
      pt.y += p.sin(angle) * pt.life * params.speed * speedMod * 2;

      // Wrap at edges — also reset the previous position so the
      // stroke doesn't draw a line across the full canvas width.
      if (pt.x < 0)        { pt.x = p.width;  pt.px = p.width;  }
      if (pt.x > p.width)  { pt.x = 0;        pt.px = 0;        }
      if (pt.y < 0)        { pt.y = p.height; pt.py = p.height; }
      if (pt.y > p.height) { pt.y = 0;        pt.py = 0;        }

      const hue = (p.degrees(angle) * params.colorShift + params.hue) % 360;
      p.stroke(hue, 68, 92, 55);
      p.strokeWeight(1.1);
      p.line(pt.px, pt.py, pt.x, pt.y);
    }
  };

  p.windowResized = () => {
    const px = Math.max(1, params.pixelation);
    p.resizeCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
  };
}
