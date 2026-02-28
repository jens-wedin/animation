import { describe, it, expect, vi } from 'vitest';
import {
  wrapValue,
  syncCount,
  densityToShapeCount,
  densityToSourceCount,
} from './particles.js';

// ─── wrapValue ────────────────────────────────────────────────────────────────

describe('wrapValue', () => {
  it('wraps negative values to max', () => {
    expect(wrapValue(-1, 100)).toBe(100);
    expect(wrapValue(-0.001, 200)).toBe(200);
  });

  it('wraps values over max to 0', () => {
    expect(wrapValue(101, 100)).toBe(0);
    expect(wrapValue(500, 200)).toBe(0);
  });

  it('leaves values inside the range unchanged', () => {
    expect(wrapValue(50, 100)).toBe(50);
    expect(wrapValue(1, 100)).toBe(1);
    expect(wrapValue(99, 100)).toBe(99);
  });

  it('does not wrap the exact lower boundary (0)', () => {
    expect(wrapValue(0, 100)).toBe(0);
  });

  it('does not wrap the exact upper boundary', () => {
    expect(wrapValue(100, 100)).toBe(100);
  });
});

// ─── syncCount ────────────────────────────────────────────────────────────────

describe('syncCount', () => {
  it('grows the array to targetCount by calling createFn', () => {
    const arr = [1, 2];
    syncCount(arr, 5, () => 99);
    expect(arr.length).toBe(5);
  });

  it('calls createFn exactly the number of times needed to grow', () => {
    const createFn = vi.fn(() => 0);
    syncCount([1, 2], 5, createFn);
    expect(createFn).toHaveBeenCalledTimes(3);
  });

  it('passes the current array length (insertion index) to createFn', () => {
    const indices = [];
    syncCount([], 3, (i) => { indices.push(i); return i; });
    expect(indices).toEqual([0, 1, 2]);
  });

  it('shrinks the array to targetCount without calling createFn', () => {
    const createFn = vi.fn();
    const arr = [1, 2, 3, 4, 5];
    syncCount(arr, 2, createFn);
    expect(arr.length).toBe(2);
    expect(createFn).not.toHaveBeenCalled();
  });

  it('truncates from the end when shrinking', () => {
    const arr = [10, 20, 30, 40];
    syncCount(arr, 2, () => 0);
    expect(arr).toEqual([10, 20]);
  });

  it('leaves the array unchanged when already at targetCount', () => {
    const arr = [1, 2, 3];
    const createFn = vi.fn();
    syncCount(arr, 3, createFn);
    expect(arr).toEqual([1, 2, 3]);
    expect(createFn).not.toHaveBeenCalled();
  });

  it('returns the mutated array', () => {
    const arr = [];
    const result = syncCount(arr, 2, () => 0);
    expect(result).toBe(arr); // same reference
  });
});

// ─── densityToShapeCount ─────────────────────────────────────────────────────

describe('densityToShapeCount', () => {
  it('returns minimum 3 when density is 0', () => {
    expect(densityToShapeCount(0)).toBe(3);
  });

  it('clamps low values to minimum 3', () => {
    // round(50/40) = 1 → clamped to 3
    expect(densityToShapeCount(50)).toBe(3);
  });

  it('scales proportionally in the normal range', () => {
    expect(densityToShapeCount(160)).toBe(4);  // 160/40 = 4
    expect(densityToShapeCount(400)).toBe(10); // 400/40 = 10
  });

  it('handles the slider maximum', () => {
    expect(densityToShapeCount(1200)).toBe(30); // 1200/40 = 30
  });
});

// ─── densityToSourceCount ─────────────────────────────────────────────────────

describe('densityToSourceCount', () => {
  it('returns minimum 2 when density is 0', () => {
    expect(densityToSourceCount(0)).toBe(2);
  });

  it('clamps low values to minimum 2', () => {
    // round(50/80) = 1 → clamped to 2
    expect(densityToSourceCount(50)).toBe(2);
  });

  it('scales proportionally in the normal range', () => {
    expect(densityToSourceCount(240)).toBe(3); // 240/80 = 3
    expect(densityToSourceCount(400)).toBe(5); // 400/80 = 5
  });

  it('caps at 8 for high density values', () => {
    expect(densityToSourceCount(640)).toBe(8);  // exactly at ceiling
    expect(densityToSourceCount(1200)).toBe(8); // well above ceiling
  });
});
