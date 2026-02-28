/**
 * Pure math utilities used by animation sketches.
 * No canvas, no DOM, no p5 — fully unit-testable.
 */

/**
 * Circular wave amplitude at point (x, y) from a source at (srcX, srcY).
 * Returns a value in [-1, 1].
 */
export function waveAmplitude(x, y, srcX, srcY, freq, time) {
  const dx = x - srcX;
  const dy = y - srcY;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.sin(d * freq - time);
}

/**
 * Average an array of wave amplitudes.
 * Returns 0 for empty input; normalises so combined output stays in [-1, 1].
 */
export function combineWaves(amplitudes) {
  if (amplitudes.length === 0) return 0;
  return amplitudes.reduce((sum, v) => sum + v, 0) / amplitudes.length;
}

/**
 * Returns the {x, y} vertex of a regular polygon at the given vertex index.
 *   index       — vertex index (0-based, wraps via modulo internally)
 *   sides       — number of polygon sides
 *   radius      — circumradius
 *   angleOffset — rotation in radians (default 0, first vertex points right)
 */
export function polygonVertex(index, sides, radius, angleOffset = 0) {
  const angle = angleOffset + (index / sides) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/**
 * Returns the {x, y} of a point orbiting a centre at a given moment.
 */
export function orbitPosition(cx, cy, radius, phase, time, speed) {
  return {
    x: cx + Math.cos(phase + time * speed) * radius,
    y: cy + Math.sin(phase + time * speed) * radius,
  };
}

/**
 * Linear interpolation between a and b by factor t (0 = a, 1 = b).
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Map a value from one numeric range to another.
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
