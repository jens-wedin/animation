/**
 * Audio Reactive
 *
 * Captures microphone input via the Web Audio API and renders
 * a circular oscilloscope (time-domain) overlaid on a 360°
 * frequency-spectrum ring.
 *
 * params.speed   → waveform responsiveness (controls analyser smoothing)
 * params.density → bar height scale
 * params.trail   → how quickly trails fade
 * params.hue     → base colour offset
 */
export function audioSketch(p, params) {
  let analyser   = null;
  let timeDomain = null;
  let freqDomain = null;
  let stream     = null;
  let audioCtx   = null;
  let status     = 'requesting'; // 'requesting' | 'denied' | 'active'

  // loadSketch() calls this before instance.remove() so the mic is released
  p._cleanup = () => {
    stream?.getTracks().forEach(t => t.stop());
    audioCtx?.close().catch(() => {});
    analyser = null;
  };

  async function initAudio() {
    try {
      stream   = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(stream);
      analyser  = audioCtx.createAnalyser();
      analyser.fftSize              = 512;
      analyser.smoothingTimeConstant = 0.82;
      src.connect(analyser);
      timeDomain = new Uint8Array(analyser.fftSize);
      freqDomain = new Uint8Array(analyser.frequencyBinCount);
      status = 'active';
    } catch (_) {
      status = 'denied';
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    initAudio();
  };

  p.draw = () => {
    if (params.paused) return;

    const cx     = p.width  / 2;
    const cy     = p.height / 2;
    const minDim = Math.min(p.width, p.height);

    // Trail fade — same mechanic as the other sketches
    p.push();
    p.noStroke();
    p.fill(0, 0, 3, params.trail * 100);
    p.rect(0, 0, p.width, p.height);
    p.pop();

    if (status !== 'active') {
      const msg = status === 'denied' ? 'MIC ACCESS DENIED' : 'REQUESTING MIC...';
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
    analyser.smoothingTimeConstant = p.constrain(1 - params.speed * 0.13, 0.2, 0.95);
    analyser.getByteTimeDomainData(timeDomain);
    analyser.getByteFrequencyData(freqDomain);

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
