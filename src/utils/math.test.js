import { describe, it, expect } from 'vitest';
import {
  waveAmplitude,
  combineWaves,
  polygonVertex,
  orbitPosition,
  lerp,
  mapRange,
} from './math.js';

// ─── waveAmplitude ────────────────────────────────────────────────────────────

describe('waveAmplitude', () => {
  it('returns 0 when source coincides with point at time 0', () => {
    // d=0 → sin(0 * freq − 0) = sin(0) = 0
    expect(waveAmplitude(0, 0, 0, 0, 0.1, 0)).toBeCloseTo(0);
  });

  it('returns 1 at a constructive peak', () => {
    // sin(d * freq − t) = 1  when  d * freq − t = PI/2
    // choose t=0, freq=0.1 → d = PI/2 / 0.1
    const d = Math.PI / 2 / 0.1;
    expect(waveAmplitude(d, 0, 0, 0, 0.1, 0)).toBeCloseTo(1);
  });

  it('returns -1 at a destructive trough', () => {
    // sin = -1 when argument = -PI/2 → d * freq = -PI/2 + t
    // choose t = 0, freq = 0.1, d = 3*PI/2 / 0.1
    const d = (3 * Math.PI) / 2 / 0.1;
    expect(waveAmplitude(d, 0, 0, 0, 0.1, 0)).toBeCloseTo(-1);
  });

  it('is radially symmetric — same distance gives same amplitude', () => {
    const [freq, t, r] = [0.05, 1.5, 20];
    const a1 = waveAmplitude( r,  0, 0, 0, freq, t);
    const a2 = waveAmplitude(-r,  0, 0, 0, freq, t);
    const a3 = waveAmplitude( 0,  r, 0, 0, freq, t);
    const a4 = waveAmplitude( 0, -r, 0, 0, freq, t);
    expect(a1).toBeCloseTo(a2);
    expect(a1).toBeCloseTo(a3);
    expect(a1).toBeCloseTo(a4);
  });

  it('a time shift of PI negates the amplitude (phase reversal)', () => {
    const a1 = waveAmplitude(10, 0, 0, 0, 0.1, 0);
    const a2 = waveAmplitude(10, 0, 0, 0, 0.1, Math.PI);
    expect(a1).toBeCloseTo(-a2);
  });

  it('source offset moves the wave origin', () => {
    // Amplitude at (10,0) from source (10,0) should be 0 at t=0 (d=0)
    expect(waveAmplitude(10, 0, 10, 0, 0.1, 0)).toBeCloseTo(0);
  });
});

// ─── combineWaves ─────────────────────────────────────────────────────────────

describe('combineWaves', () => {
  it('returns 0 for empty input', () => {
    expect(combineWaves([])).toBe(0);
  });

  it('returns the value unchanged for a single wave', () => {
    expect(combineWaves([0.7])).toBeCloseTo(0.7);
    expect(combineWaves([-0.4])).toBeCloseTo(-0.4);
  });

  it('fully constructive interference: [1, 1] → 1', () => {
    expect(combineWaves([1, 1])).toBeCloseTo(1);
  });

  it('fully destructive interference: [1, -1] → 0', () => {
    expect(combineWaves([1, -1])).toBeCloseTo(0);
  });

  it('normalises so 100 maxed-out sources still return 1', () => {
    expect(combineWaves(Array(100).fill(1))).toBeCloseTo(1);
  });

  it('handles partial cancellation', () => {
    expect(combineWaves([1, 0.5, -0.5])).toBeCloseTo(1 / 3);
  });
});

// ─── polygonVertex ────────────────────────────────────────────────────────────

describe('polygonVertex', () => {
  it('first vertex at index 0 with no offset points right (positive x-axis)', () => {
    const v = polygonVertex(0, 4, 10);
    expect(v.x).toBeCloseTo(10);
    expect(v.y).toBeCloseTo(0);
  });

  it('all vertices lie on the circumradius circle', () => {
    const r = 50;
    for (let i = 0; i < 6; i++) {
      const v = polygonVertex(i, 6, r);
      const dist = Math.sqrt(v.x ** 2 + v.y ** 2);
      expect(dist).toBeCloseTo(r);
    }
  });

  it('angleOffset = PI/2 rotates first vertex to point up', () => {
    const v = polygonVertex(0, 4, 10, Math.PI / 2);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(10);
  });

  it('triangle vertex at index 1 is at 120°', () => {
    const v = polygonVertex(1, 3, 10);
    const expected = (2 * Math.PI) / 3;
    expect(v.x).toBeCloseTo(Math.cos(expected) * 10);
    expect(v.y).toBeCloseTo(Math.sin(expected) * 10);
  });

  it('adjacent vertices of a square are 90° apart', () => {
    const v0 = polygonVertex(0, 4, 1);
    const v1 = polygonVertex(1, 4, 1);
    const dot = v0.x * v1.x + v0.y * v1.y; // cos(90°) = 0
    expect(dot).toBeCloseTo(0);
  });
});

// ─── orbitPosition ────────────────────────────────────────────────────────────

describe('orbitPosition', () => {
  it('at t=0 phase=0 returns centre + (radius, 0)', () => {
    const pos = orbitPosition(100, 200, 50, 0, 0, 1);
    expect(pos.x).toBeCloseTo(150);
    expect(pos.y).toBeCloseTo(200);
  });

  it('orbit radius is constant at any time value', () => {
    const [cx, cy, r] = [0, 0, 30];
    for (const t of [0, 0.5, 1, 2.7, 10]) {
      const pos = orbitPosition(cx, cy, r, 0, t, 0.5);
      const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2);
      expect(dist).toBeCloseTo(r);
    }
  });

  it('phase offset shifts the starting angle', () => {
    // phase = PI/2, t=0, speed=0 → point should be (cx, cy + r)
    const pos = orbitPosition(0, 0, 10, Math.PI / 2, 0, 1);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(10);
  });
});

// ─── lerp ────────────────────────────────────────────────────────────────────

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(0, 10, 0)).toBe(0));
  it('returns b at t=1', () => expect(lerp(0, 10, 1)).toBe(10));
  it('returns midpoint at t=0.5', () => expect(lerp(0, 10, 0.5)).toBe(5));
  it('works with negative range', () => expect(lerp(-10, 10, 0.5)).toBe(0));
  it('extrapolates beyond [0,1]', () => expect(lerp(0, 10, 2)).toBe(20));
});

// ─── mapRange ─────────────────────────────────────────────────────────────────

describe('mapRange', () => {
  it('maps midpoint of input range to midpoint of output range', () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBeCloseTo(50);
  });

  it('maps lower bound exactly', () => {
    expect(mapRange(0, 0, 1, 10, 20)).toBeCloseTo(10);
  });

  it('maps upper bound exactly', () => {
    expect(mapRange(1, 0, 1, 10, 20)).toBeCloseTo(20);
  });

  it('inverted output range produces descending mapping', () => {
    expect(mapRange(0, 0, 1, 100, 0)).toBeCloseTo(100);
    expect(mapRange(1, 0, 1, 100, 0)).toBeCloseTo(0);
  });

  it('maps an arbitrary mid-range value correctly', () => {
    // 25 in [0,100] → 0.25 in [0,1]
    expect(mapRange(25, 0, 100, 0, 1)).toBeCloseTo(0.25);
  });
});
