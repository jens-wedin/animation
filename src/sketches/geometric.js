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
 * params.density → number of shapes
 * params.speed   → rotation and orbit speed multiplier
 * params.scale   → orbit radius scale
 * params.trail   → trail persistence
 * params.hue     → base color offset
 * params.spin    → self-rotation speed multiplier (independent of orbit)
 * params.layers  → concentric polygon rings drawn per shape
 */
export function geometricSketch(p, params) {
  let shapes = [];
  let prevDensity = 0;

  p.setup = () => {
    const px = Math.max(1, params.pixelation);
    p.createCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
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
      const rot = t * s.rotSpeed * 60 * params.spin + s.phase;
      const hue = (s.hueBase + params.hue + t * 15) % 360;

      p.push();
      p.translate(ox, oy);
      p.rotate(rot);

      // Concentric rings — count driven by params.layers
      p.noFill();
      const n = Math.round(params.layers);
      for (let l = 0; l < n; l++) {
        const lr    = s.radius * sizeMod * (1 - (l / n) * 0.65);
        const lhue  = (hue + l * 25) % 360;
        const lsat  = Math.max(28, 65 - l * 10);
        const lalph = Math.max(14, 65 - l * 12);
        p.stroke(lhue, lsat, 90, lalph);
        p.strokeWeight(Math.max(0.4, 1.4 - l * 0.2));
        drawPolygon(p, lr, s.sides + l, l * Math.PI / s.sides);
      }

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
    const px = Math.max(1, params.pixelation);
    p.resizeCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
    buildShapes(params.density);
  };
}
