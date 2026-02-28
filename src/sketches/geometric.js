import { polygonVertex } from '../utils/math.js';
import { densityToShapeCount } from '../utils/particles.js';
import { getAmplitude } from '../utils/audioInput.js';

/**
 * Geometric Forms
 *
 * Rotating polygons orbit a shared center. Each shape has its own
 * rotation speed, orbit radius, and phase. The combination of
 * independent rhythms creates complex interference patterns.
 *
 * params.density  → number of shapes
 * params.speed    → rotation and orbit speed multiplier
 * params.scale    → orbit radius scale
 * params.trail    → trail persistence
 * params.hue      → base color offset
 */
export function geometricSketch(p, params) {
  let shapes = [];
  let prevDensity = 0;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    buildShapes(params.density);
    prevDensity = params.density;
  };

  function buildShapes(density) {
    const count = densityToShapeCount(density);
    shapes = Array.from({ length: count }, (_, i) => ({
      sides:      Math.floor(p.random(3, 9)),
      radius:     p.random(30, 130),
      rotSpeed:   p.random(0.005, 0.022) * (p.random() > 0.5 ? 1 : -1),
      orbitR:     p.random(20, Math.min(p.width, p.height) * 0.32 * params.scale),
      orbitSpeed: p.random(0.003, 0.014) * (p.random() > 0.5 ? 1 : -1),
      phase:      (i / count) * p.TWO_PI,
      hueBase:    (i / count) * 280,
    }));
  }

  p.draw = () => {
    if (params.paused) return;

    if (Math.abs(params.density - prevDensity) > 30) {
      buildShapes(params.density);
      prevDensity = params.density;
    }

    const amp = params.mic ? getAmplitude() : 0;

    p.push();
    p.noStroke();
    p.fill(0, 0, 5, params.trail * 100);
    p.rect(0, 0, p.width, p.height);
    p.pop();

    const cx      = p.width / 2;
    const cy      = p.height / 2;
    const t       = p.frameCount * params.speed * 0.012;
    const sizeMod = 1 + amp * 3;

    for (const s of shapes) {
      const ox  = cx + Math.cos(s.phase + t * s.orbitSpeed * 80) * s.orbitR * params.scale;
      const oy  = cy + Math.sin(s.phase + t * s.orbitSpeed * 80) * s.orbitR * params.scale;
      const rot = t * s.rotSpeed * 60 + s.phase;
      const hue = (s.hueBase + params.hue + t * 15) % 360;

      p.push();
      p.translate(ox, oy);
      p.rotate(rot);

      // Outer polygon — radius pulses with mic amplitude
      p.noFill();
      p.stroke(hue, 65, 90, 65);
      p.strokeWeight(1.4);
      drawPolygon(p, s.radius * sizeMod, s.sides);

      // Inner polygon at half radius, rotated one extra step
      p.stroke((hue + 30) % 360, 40, 100, 35);
      p.strokeWeight(0.8);
      drawPolygon(p, s.radius * 0.5 * sizeMod, s.sides + 1, Math.PI / s.sides);

      p.pop();
    }
  };

  function drawPolygon(p, r, sides, angleOffset = 0) {
    p.beginShape();
    for (let i = 0; i <= sides; i++) {
      const v = polygonVertex(i % sides, sides, r, angleOffset);
      p.vertex(v.x, v.y);
    }
    p.endShape(p.CLOSE);
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    buildShapes(params.density);
  };
}
