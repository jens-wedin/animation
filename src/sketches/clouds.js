export function cloudSketch(p, params) {
  let t = 0;

  p.setup = () => {
    const px = Math.max(1, params.pixelation);
    p.createCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    p.noStroke();
  };

  p.draw = () => {
    if (params.paused) return;
    t += params.speed * 0.002;

    // Sky gradient — solid bands, no alpha
    const bands = 12;
    for (let i = 0; i < bands; i++) {
      const y0    = Math.floor(i       * p.height / bands);
      const y1    = Math.ceil((i + 1)  * p.height / bands);
      const ratio = i / (bands - 1);
      p.fill(params.hue, p.lerp(90, 38, ratio), p.lerp(10, 52, ratio));
      p.rect(0, y0, p.width, y1 - y0 + 1);
    }

    // Cloud layer — fully opaque rects so alpha never washes them out
    const step  = Math.max(1, Math.ceil(p.width / 240));
    const scale = params.cloudScale;
    const cover = params.cloudCover;
    const turb  = params.cloudTurbulence;

    for (let y = 0; y < p.height; y += step) {
      for (let x = 0; x < p.width; x += step) {
        const nx = (x / p.width)  * scale;
        const ny = (y / p.height) * scale * 0.5;

        // Domain warp — wispy vs puffy
        const wx = (p.noise(nx * 0.7,       ny * 0.7, t * 0.1) - 0.5) * turb;
        const wy = (p.noise(nx * 0.7 + 3.7, ny * 0.7, t * 0.1) - 0.5) * turb * 0.4;

        // 3-octave FBM
        let n  = p.noise(nx      + wx + t,       ny      + wy);
        n     += p.noise(nx * 2  + wx + t * 1.1, ny * 2  + wy) * 0.5;
        n     += p.noise(nx * 4  + wx + t * 1.2, ny * 4  + wy) * 0.25;
        n     /= 1.75;

        // Fade clouds toward the bottom 20% of canvas (horizon)
        n *= p.map(y / p.height, 0, 0.85, 1.0, 0.0, true);

        // Normalise Perlin FBM range [0.1, 0.7] → [0, 1]
        const nNorm = p.constrain(p.map(n, 0.1, 0.68, 0, 1), 0, 1);

        const thr = 1 - cover;
        if (nNorm > thr) {
          const density = p.map(nNorm, thr, 1.0, 0, 1);
          // Fully opaque: lerp from light-sky to bright white
          // This guarantees visibility on any sky hue
          const s = p.lerp(35, 4,   density); // desaturate toward white
          const b = p.lerp(60, 100, density); // brighten toward white
          p.fill(params.hue, s, b);
          p.rect(x, y, step, step);
        }
      }
    }
  };

  p.windowResized = () => {
    const px = Math.max(1, params.pixelation);
    p.resizeCanvas(Math.floor(p.windowWidth / px), Math.floor(p.windowHeight / px));
  };
}
