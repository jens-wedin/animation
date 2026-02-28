/**
 * Particle and density utilities.
 * No canvas, no p5 — fully unit-testable.
 */

/**
 * Wrap a coordinate at canvas boundaries.
 * Values below 0 wrap to max; values above max wrap to 0.
 * Values exactly at the boundary are unchanged.
 */
export function wrapValue(value, max) {
  if (value < 0) return max;
  if (value > max) return 0;
  return value;
}

/**
 * Grow or shrink an array to targetCount in-place.
 * When growing, calls createFn(currentIndex) for each new element.
 * Returns the mutated array.
 */
export function syncCount(array, targetCount, createFn) {
  while (array.length < targetCount) {
    array.push(createFn(array.length));
  }
  if (array.length > targetCount) {
    array.length = targetCount;
  }
  return array;
}

/**
 * Convert a density slider value (50–1200) to a shape count
 * for the geometric sketch (minimum 3).
 */
export function densityToShapeCount(density) {
  return Math.max(3, Math.round(density / 40));
}

/**
 * Convert density to wave source count, clamped to [2, 8].
 */
export function densityToSourceCount(density) {
  return Math.max(2, Math.min(8, Math.round(density / 80)));
}
