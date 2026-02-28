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
 */
export function flowFieldSketch(p, params) {
  let particles = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    spawnParticles(params.density);
  };

  function spawnParticles(n) {
    particles = Array.from({ length: n }, () => newParticle());
  }

  function newParticle() {
    const x = p.random(p.width);
    const y = p.random(p.height);
    return { x, y, px: x, py: y, life: p.random(0.4, 1) };
  }

  p.draw = () => {
    if (params.paused) return;

    // Translucent fill erases the previous frame gradually → trails
    p.push();
    p.noStroke();
    p.fill(0, 0, 5, params.trail * 100);
    p.rect(0, 0, p.width, p.height);
    p.pop();

    const t = p.frameCount * 0.003;

    // Sync particle count to params
    while (particles.length < params.density) particles.push(newParticle());
    if (particles.length > params.density) particles.length = params.density;

    for (const pt of particles) {
      pt.px = pt.x;
      pt.py = pt.y;

      const nx = pt.x * params.scale;
      const ny = pt.y * params.scale;
      const angle = p.noise(nx, ny, t) * p.TWO_PI * 4;

      pt.x += p.cos(angle) * pt.life * params.speed * 2;
      pt.y += p.sin(angle) * pt.life * params.speed * 2;

      // Wrap at edges
      if (pt.x < 0)        { pt.x = p.width;  pt.px = p.width;  }
      if (pt.x > p.width)  { pt.x = 0;        pt.px = 0;        }
      if (pt.y < 0)        { pt.y = p.height; pt.py = p.height; }
      if (pt.y > p.height) { pt.y = 0;        pt.py = 0;        }

      const hue = (p.degrees(angle) + params.hue) % 360;
      p.stroke(hue, 68, 92, 55);
      p.strokeWeight(1.1);
      p.line(pt.px, pt.py, pt.x, pt.y);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}
