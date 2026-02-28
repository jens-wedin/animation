import p5 from 'p5';
import { Pane } from 'tweakpane';

import { flowFieldSketch } from './sketches/flowField.js';
import { geometricSketch  } from './sketches/geometric.js';
import { waveSketch        } from './sketches/waves.js';
import { audioSketch       } from './sketches/audio.js';
import { cloudSketch       } from './sketches/clouds.js';
import { laserDomeSketch   } from './sketches/laserDome.js';
import { createRecorder    } from './export.js';
import { startMic, stopMic } from './utils/audioInput.js';

// ─── Shared parameters ───────────────────────────────────────────────────────

const params = {
  sketch:  'flowField',
  speed:   1.2,
  density: 600,
  scale:   0.003,
  trail:   0.03,
  hue:        200,
  pixelation: 1,
  mic:        false,
  // Flow Field
  curl:       4.0,
  colorShift: 1.0,
  // Geometric
  spin:       1.0,
  layers:     2,
  // Waves
  ripple:     3.5,
  contrast:   1.0,
  // Audio Reactive
  mirror:     false,
  waveGain:   1.0,
  // Clouds
  cloudScale:      3.0,
  cloudCover:      0.55,
  cloudTurbulence: 1.2,
  // Laser Dome
  laserRings: 5,
  laserBeams: 8,
  laserGlow:  1.5,
  paused:     false,
};

const SKETCHES = {
  flowField: flowFieldSketch,
  geometric: geometricSketch,
  waves:     waveSketch,
  audio:     audioSketch,
  clouds:    cloudSketch,
  laserDome: laserDomeSketch,
};

const SKETCH_LABELS = {
  flowField: 'Flow Field',
  geometric: 'Geometric Forms',
  waves:     'Wave Pattern',
  audio:     'Audio Reactive',
  clouds:    'Clouds',
  laserDome: 'Laser Dome',
};

// ─── p5 instance management ──────────────────────────────────────────────────

const container = document.getElementById('canvas-container');
let instance = null;

function loadSketch(name) {
  if (instance) {
    instance._cleanup?.(); // release mic / audio context if the sketch registered one
    instance.remove();
    instance = null;
  }
  const sketchFn = SKETCHES[name];
  instance = new p5((p) => sketchFn(p, params), container);

  // 1.1.1: give the canvas an accessible name once p5 has inserted it
  requestAnimationFrame(() => {
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Generative animation — ${SKETCH_LABELS[name] ?? name} mode`);
    }
    // Keep the container label in sync too
    container.setAttribute('aria-label', `${SKETCH_LABELS[name] ?? name} animation canvas`);
  });
}

loadSketch(params.sketch);

// ─── Tweakpane ───────────────────────────────────────────────────────────────

const pane = new Pane({ title: 'VISUAL SYNTH' });

pane.addBinding(params, 'sketch', {
  label: 'mode',
  options: {
    'Flow Field':     'flowField',
    'Geometric':      'geometric',
    'Wave Pattern':   'waves',
    'Audio Reactive': 'audio',
    'Clouds':         'clouds',
    'Laser Dome':     'laserDome',
  },
}).on('change', ({ value }) => { loadSketch(value); syncModeBindings(value); });

pane.addBinding(params, 'mic', { label: 'mic input' })
  .on('change', ({ value }) => { if (value) startMic(); else stopMic(); });

const f = pane.addFolder({ title: 'Parameters', expanded: true });

f.addBinding(params, 'speed',   { label: 'speed',   min: 0.1,    max: 5,     step: 0.05   });
f.addBinding(params, 'density', { label: 'density',  min: 50,     max: 1200,  step: 10     });
f.addBinding(params, 'scale',   { label: 'scale',    min: 0.0005, max: 0.02,  step: 0.0005 });
f.addBinding(params, 'trail',   { label: 'trail',    min: 0.005,  max: 0.6,   step: 0.005  });
f.addBinding(params, 'hue',        { label: 'hue',        min: 0, max: 360, step: 1  });
f.addBinding(params, 'pixelation', { label: 'pixelation', min: 1, max: 16,  step: 1  })
  .on('change', () => {
    if (instance) {
      const px = Math.max(1, params.pixelation);
      instance.resizeCanvas(
        Math.floor(window.innerWidth  / px),
        Math.floor(window.innerHeight / px),
      );
    }
  });

// ── Mode-specific parameters — shown/hidden on mode change ────────────────
const modeBindings = {
  flowField: [
    f.addBinding(params, 'curl',       { label: 'curl',        min: 0.5, max: 8,   step: 0.1  }),
    f.addBinding(params, 'colorShift', { label: 'color shift', min: 0,   max: 3,   step: 0.05 }),
  ],
  geometric: [
    f.addBinding(params, 'spin',   { label: 'spin',   min: 0, max: 3, step: 0.05 }),
    f.addBinding(params, 'layers', { label: 'layers', min: 1, max: 5, step: 1    }),
  ],
  waves: [
    f.addBinding(params, 'ripple',   { label: 'ripple',   min: 0.5, max: 8,   step: 0.1  }),
    f.addBinding(params, 'contrast', { label: 'contrast', min: 0.5, max: 3.0, step: 0.05 }),
  ],
  audio: [
    f.addBinding(params, 'mirror',   { label: 'mirror'                                  }),
    f.addBinding(params, 'waveGain', { label: 'wave gain', min: 0.5, max: 5, step: 0.1 }),
  ],
  clouds: [
    f.addBinding(params, 'cloudScale',      { label: 'cloud scale',  min: 1,   max: 8,    step: 0.1  }),
    f.addBinding(params, 'cloudCover',      { label: 'cover',        min: 0.1, max: 0.95, step: 0.01 }),
    f.addBinding(params, 'cloudTurbulence', { label: 'turbulence',   min: 0,   max: 3,    step: 0.05 }),
  ],
  laserDome: [
    f.addBinding(params, 'laserRings', { label: 'rings', min: 1, max: 12, step: 1   }),
    f.addBinding(params, 'laserBeams', { label: 'beams', min: 2, max: 24, step: 1   }),
    f.addBinding(params, 'laserGlow',  { label: 'glow',  min: 0.2, max: 4, step: 0.1 }),
  ],
};

function syncModeBindings(mode) {
  for (const [key, bindings] of Object.entries(modeBindings)) {
    for (const b of bindings) b.hidden = key !== mode;
  }
}

syncModeBindings(params.sketch); // hide non-active modes on load

pane.addButton({ title: 'Reset sketch' }).on('click', () => {
  loadSketch(params.sketch);
});

// ─── Transport: play / pause ─────────────────────────────────────────────────

const btnPlay   = document.getElementById('btn-play');
const srStatus  = document.getElementById('sr-status');

btnPlay.addEventListener('click', () => {
  params.paused = !params.paused;

  // 4.1.2: keep visible label, aria-label, and pressed state in sync
  btnPlay.textContent = params.paused ? '▶ Play' : '⏸ Pause';
  btnPlay.setAttribute('aria-label', params.paused ? 'Resume animation' : 'Pause animation');
  btnPlay.setAttribute('aria-pressed', String(params.paused));
  btnPlay.classList.toggle('active', params.paused);
});

// ─── Transport: record ───────────────────────────────────────────────────────

const recorder    = createRecorder(() => instance?.canvas ?? null);
const btnRecord   = document.getElementById('btn-record');
const recordTimer = document.getElementById('record-timer');

let timerInterval = null;
let recordSeconds = 0;

btnRecord.addEventListener('click', async () => {
  if (recorder.isActive()) {
    // Stop recording
    clearInterval(timerInterval);
    timerInterval  = null;
    recordSeconds  = 0;
    recordTimer.textContent = '';

    btnRecord.textContent = '⏺ Record';
    btnRecord.setAttribute('aria-label', 'Start recording');
    btnRecord.setAttribute('aria-pressed', 'false');
    btnRecord.classList.remove('recording');

    // 4.1.3: announce state change assertively
    srStatus.textContent = 'Recording stopped. Download starting.';

    await recorder.stop(); // triggers download

  } else {
    // Start recording
    recorder.start(30);

    btnRecord.textContent = '⏹ Stop';
    btnRecord.setAttribute('aria-label', 'Stop recording');
    btnRecord.setAttribute('aria-pressed', 'true');
    btnRecord.classList.add('recording');

    srStatus.textContent = 'Recording started.';

    timerInterval = setInterval(() => {
      recordSeconds += 1;
      const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
      const s = String(recordSeconds % 60).padStart(2, '0');
      recordTimer.textContent = `${m}:${s}`;
    }, 1000);
  }
});
