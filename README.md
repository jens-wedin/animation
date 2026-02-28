# Animation Playground

A browser-based generative animation tool with four visual modes, real-time parameter tuning, optional microphone reactivity, and canvas recording. Built with p5.js and Tweakpane, deployed to GitHub Pages.

**Live:** https://jens-wedin.github.io/animation/

---

## Modes

### Flow Field
Particles follow a Perlin-noise vector field and leave slowly fading trails, building up an aurora-like texture over time. Each particle wraps toroidally at the canvas edges.

### Geometric Forms
Rotating polygons orbit a shared center. Each shape has its own spin speed, orbit radius, and phase, so independent rhythms interact to produce complex interference patterns. Concentric rings can be stacked on each shape.

### Wave Pattern
Multiple circular wave sources orbit the canvas. Each pixel's color is determined by the constructive and destructive interference of all sources combined, creating moiré-like patterns that shift continuously.

### Audio Reactive
A real-time microphone visualizer: a 360° frequency-spectrum ring overlaid with a circular oscilloscope tracing the raw waveform. Requires microphone permission (enable the **mic input** checkbox).

---

## Parameters

### Shared — all modes

| Parameter | Range | Effect |
|-----------|-------|--------|
| speed | 0.1 – 5 | Movement or animation rate |
| density | 50 – 1200 | Particle / shape / source count |
| scale | 0.0005 – 0.02 | Noise zoom, orbit radius, or wavelength |
| trail | 0.005 – 0.6 | How quickly old frames fade |
| hue | 0 – 360 | Base colour offset |
| mic input | on / off | Enable microphone reactivity |

### Mode-specific (shown only for the active mode)

| Mode | Parameter | Range | Effect |
|------|-----------|-------|--------|
| Flow Field | curl | 0.5 – 8 | Noise angle range — low is laminar, high is turbulent |
| Flow Field | color shift | 0 – 3 | How strongly the flow direction drives hue rotation |
| Geometric | spin | 0 – 3 | Self-rotation speed, independent of orbital speed |
| Geometric | layers | 1 – 5 | Concentric polygon rings per shape |
| Wave Pattern | ripple | 0.5 – 8 | Wave propagation speed — low is a near-standing pattern |
| Wave Pattern | contrast | 0.5 – 3 | Brightness curve boost, sharpens the interference bands |
| Audio Reactive | mirror | on / off | Folds the spectrum ring into bilateral symmetry |
| Audio Reactive | wave gain | 0.5 – 5 | Oscilloscope excursion radius multiplier |

### Microphone reactivity

When **mic input** is enabled the microphone amplitude modulates each mode:

- **Flow Field** — loud sounds surge particle speed and burn trails faster
- **Geometric** — amplitude pulses all polygon radii (shapes breathe)
- **Wave Pattern** — amplitude boosts brightness contrast
- **Audio Reactive** — drives the full spectrum and oscilloscope visualization

---

## Recording

Press **Record** in the transport bar at the bottom to start capturing the canvas via the MediaRecorder API. Press **Stop** to finish; a `.webm` file is downloaded automatically (filename includes a timestamp).

---

## Development

```
npm install       # install dependencies
npm run dev       # start Vite dev server with HMR  →  http://localhost:5173
npm run build     # production bundle  →  dist/
npm run preview   # preview the production build locally
npm test          # run unit tests once
npm run coverage  # run tests and generate coverage report
```

### Coverage thresholds

Tests are enforced on the pure utility layer (`src/utils/**`). The build will fail if coverage drops below:

| Metric | Threshold |
|--------|-----------|
| Lines | 90% |
| Functions | 90% |
| Branches | 80% |

---

## Project structure

```
src/
├── main.js               Application entry — p5 instance management, Tweakpane UI
├── export.js             Canvas recorder (MediaRecorder → .webm download)
├── style.css             Global styles + retro green-on-black Tweakpane theme
├── sketches/
│   ├── flowField.js      Perlin-noise particle system
│   ├── geometric.js      Orbiting rotating polygons
│   ├── waves.js          Circular wave interference
│   └── audio.js          Mic-driven oscilloscope + spectrum ring
└── utils/
    ├── audioInput.js     Shared Web Audio API singleton (mic lifecycle)
    ├── math.js           Pure math — waves, polygons, orbits, lerp
    ├── math.test.js
    ├── particles.js      Particle count sync, density mapping, boundary wrap
    ├── particles.test.js
    ├── format.js         Timestamp and MIME-type formatting
    └── format.test.js
```

### Architecture notes

**Shared params object.** A single `params` object in `main.js` is passed by reference into every sketch. Tweakpane binds directly to it, so any slider change is reflected in the running sketch immediately without reloading.

**Layered utilities.** All math and particle logic lives in pure functions with no p5 or DOM dependencies, making them straightforward to unit-test. The sketches are the only layer that touches the canvas.

**Singleton audio.** `audioInput.js` maintains one `AudioContext` for the lifetime of the session. `main.js` owns the lifecycle (start on checkbox, stop on uncheck). Sketches only read from it — they never create or destroy audio resources.

**Mode-specific Tweakpane bindings.** Each mode's extra parameters are created once at startup and hidden/shown via `binding.hidden` when the mode selector changes, so there are no re-renders of the panel.

---

## Deployment

GitHub Actions builds and deploys to GitHub Pages on every push to `main`. The workflow:

1. Checks out the repo and installs dependencies with `npm ci`
2. Runs `npm run build` (Vite, with `base: '/animation/'` set for correct asset paths)
3. Uploads `dist/` as a Pages artifact
4. Deploys via `actions/deploy-pages`

To enable: go to **Settings → Pages** in the repository and set the source to **GitHub Actions**.

---

## Stack

| Library | Version | Purpose |
|---------|---------|---------|
| [p5.js](https://p5js.org) | ^1.11 | Creative coding — canvas, noise, color |
| [Tweakpane](https://tweakpane.github.io) | ^4.0 | Parameter panel UI |
| [Vite](https://vitejs.dev) | ^6.0 | Build tool and dev server |
| [Vitest](https://vitest.dev) | ^2.0 | Unit testing |
