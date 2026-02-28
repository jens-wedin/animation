import { describe, it, expect } from 'vitest';
import { formatDuration, formatTimestamp, selectMimeType } from './format.js';

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats zero seconds as "00:00"', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('zero-pads single-digit seconds', () => {
    expect(formatDuration(5)).toBe('00:05');
    expect(formatDuration(9)).toBe('00:09');
  });

  it('formats under a minute', () => {
    expect(formatDuration(59)).toBe('00:59');
  });

  it('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('01:00');
  });

  it('formats minutes and seconds together', () => {
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3599)).toBe('59:59');
  });

  it('does not cap minutes at 59 (long recordings roll over to 60+)', () => {
    expect(formatDuration(3600)).toBe('60:00');
    expect(formatDuration(3661)).toBe('61:01');
  });
});

// ─── formatTimestamp ─────────────────────────────────────────────────────────

describe('formatTimestamp', () => {
  it('formats a known date into YYYYMMDD-HHMMSS', () => {
    // Feb 28 2026, 14:05:09
    const d = new Date(2026, 1, 28, 14, 5, 9);
    expect(formatTimestamp(d)).toBe('20260228-140509');
  });

  it('zero-pads single-digit month, day, hours, minutes, seconds', () => {
    // Jan 3 2026, 08:04:02
    const d = new Date(2026, 0, 3, 8, 4, 2);
    expect(formatTimestamp(d)).toBe('20260103-080402');
  });

  it('produces exactly 15 characters (8 date + 1 dash + 6 time)', () => {
    const d = new Date(2026, 5, 15, 10, 30, 45);
    expect(formatTimestamp(d)).toHaveLength(15);
  });
});

// ─── selectMimeType ───────────────────────────────────────────────────────────

describe('selectMimeType', () => {
  const CANDIDATES = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  it('returns the first supported candidate', () => {
    const isSupported = (t) => t === 'video/webm;codecs=vp9';
    expect(selectMimeType(CANDIDATES, isSupported)).toBe('video/webm;codecs=vp9');
  });

  it('skips unsupported leading candidates and picks next match', () => {
    const isSupported = (t) => t === 'video/webm;codecs=vp8';
    expect(selectMimeType(CANDIDATES, isSupported)).toBe('video/webm;codecs=vp8');
  });

  it('falls back to default "video/webm" when no candidate is supported', () => {
    expect(selectMimeType(CANDIDATES, () => false)).toBe('video/webm');
  });

  it('accepts a custom fallback string', () => {
    expect(selectMimeType(CANDIDATES, () => false, 'video/mp4')).toBe('video/mp4');
  });

  it('returns first match even when multiple are supported', () => {
    expect(selectMimeType(CANDIDATES, () => true)).toBe('video/webm;codecs=vp9');
  });

  it('returns fallback for an empty candidate list', () => {
    expect(selectMimeType([], () => true, 'video/webm')).toBe('video/webm');
  });
});
