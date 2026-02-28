import p5 from 'p5';
import { Pane } from 'tweakpane';

import { flowFieldSketch } from './sketches/flowField.js';
import { geometricSketch  } from './sketches/geometric.js';
import { waveSketch        } from './sketches/waves.js';
import { createRecorder    } from './export.js';

// ─── Shared parameters ───────────────────────────────────────────────────────
// Every sketch reads from this object each frame. Tweakpane writes to it.

const params = {
  sketch:  'flowField',
  speed:   1.2,
  density: 600,
  scale:   0.003,
  trail:   0.03,
  hue:     200,
  paused:  false,
};

const SKETCHES = {
  flowField: flowFieldSketch,
  geometric: geometricSketch,
  waves:     waveSketch,
};

// ─── p5 instance management ──────────────────────────────────────────────────

const container = document.getElementById('canvas-container');
let instance = null;

function loadSketch(name) {
  if (instance) {
    instance.remove();
    instance = null;
  }
  const sketchFn = SKETCHES[name];
  instance = new p5((p) => sketchFn(p, params), container);
}

loadSketch(params.sketch);

// ─── Tweakpane ───────────────────────────────────────────────────────────────

const pane = new Pane({ title: '✦ Playground' });

pane.addBinding(params, 'sketch', {
  label: 'mode',
  options: {
    'Flow Field':   'flowField',
    'Geometric':    'geometric',
    'Wave Pattern': 'waves',
  },
}).on('change', ({ value }) => loadSketch(value));

const f = pane.addFolder({ title: 'Parameters', expanded: true });

f.addBinding(params, 'speed',   { label: 'speed',   min: 0.1,    max: 5,     step: 0.05 });
f.addBinding(params, 'density', { label: 'density',  min: 50,     max: 1200,  step: 10   });
f.addBinding(params, 'scale',   { label: 'scale',    min: 0.0005, max: 0.02,  step: 0.0005 });
f.addBinding(params, 'trail',   { label: 'trail',    min: 0.005,  max: 0.6,   step: 0.005 });
f.addBinding(params, 'hue',     { label: 'hue',      min: 0,      max: 360,   step: 1    });

pane.addButton({ title: 'Reset sketch' }).on('click', () => {
  loadSketch(params.sketch);
});

// ─── Transport: play / pause ─────────────────────────────────────────────────

const btnPlay = document.getElementById('btn-play');

btnPlay.addEventListener('click', () => {
  params.paused = !params.paused;
  btnPlay.textContent = params.paused ? '▶ Play' : '⏸ Pause';
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
    btnRecord.classList.remove('recording');

    await recorder.stop(); // triggers download

  } else {
    // Start recording
    recorder.start(30);

    btnRecord.textContent = '⏹ Stop';
    btnRecord.classList.add('recording');

    timerInterval = setInterval(() => {
      recordSeconds += 1;
      const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
      const s = String(recordSeconds % 60).padStart(2, '0');
      recordTimer.textContent = `${m}:${s}`;
    }, 1000);
  }
});
