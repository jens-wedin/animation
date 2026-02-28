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

    // Sky gradient — 14 horizontal bands from deep sky to hazy horizon
    const bands = 14;
    for (let i = 0; i < bands; i++) {
      const y0    = Math.floor(i       * p.height / bands);
      const y1    = Math.ceil((i + 1)  * p.height / bands);
      const ratio = i / (bands - 1);
      p.fill(params.hue, p.lerp(88, 40, ratio), p.lerp(14, 58, ratio));
      p.rect(0, y0, p.width, y1 - y0 + 1);
    }

    // Cloud layer — FBM noise with domain warp
    const step  = Math.max(1, Math.ceil(p.width / 240));
    const scale = params.cloudScale;
    const cover = params.cloudCover;
    const turb  = params.cloudTurbulence;

    for (let y = 0; y < p.height; y += step) {
      for (let x = 0; x < p.width; x += step) {
        const nx = (x / p.width)  * scale;
        const ny = (y / p.height) * scale * 0.55;

        // Domain warp — puffy vs wispy
        const wx = (p.noise(nx * 0.65,       ny * 0.65, t * 0.12) - 0.5) * turb;
        const wy = (p.noise(nx * 0.65 + 3.7, ny * 0.65, t * 0.12) - 0.5) * turb * 0.35;

        // 4-octave FBM
        let n  = p.noise(nx      + wx + t,       ny      + wy)       * 1.000;
        n     += p.noise(nx * 2  + wx + t * 1.1, ny * 2  + wy +  7) * 0.500;
        n     += p.noise(nx * 4  + wx + t * 1.2, ny * 4  + wy + 14) * 0.250;
        n     += p.noise(nx * 8  + wx + t * 1.4, ny * 8  + wy + 21) * 0.125;
        n     /= 1.875;

        // Clouds thin out toward the horizon
        n *= p.map(y / p.height, 0, 1, 1.0, 0.2);

        // p5 Perlin noise clusters in ~[0.2, 0.8] — normalise to [0, 1]
        // so cover maps intuitively across the full slider range
        const nNorm = p.constrain(p.map(n, 0.15, 0.75, 0, 1), 0, 1);

        // cover=0.1 → sparse, cover=0.9 → nearly overcast
        const thr = 1 - cover;
        if (nNorm > thr) {
          const cloudStr = p.map(nNorm, thr, 1.0, 0, 1);
          const alpha    = p.lerp(30, 96, cloudStr);
          const bright   = p.lerp(82, 100, cloudStr);
          p.fill(0, 0, bright, alpha); // pure white — visible on any sky hue
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
