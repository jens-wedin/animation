/**
 * Formatting utilities for the export pipeline.
 * No DOM, no MediaRecorder — fully unit-testable.
 */

/**
 * Format a total-seconds count as "MM:SS".
 * Minutes are not capped at 59 (e.g. 3600s → "60:00").
 */
export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a Date object as "YYYYMMDD-HHMMSS" for use in filenames.
 */
export function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}` +
    `-` +
    `${pad(date.getHours())}` +
    `${pad(date.getMinutes())}` +
    `${pad(date.getSeconds())}`
  );
}

/**
 * Return the first MIME type from candidates that passes isSupported().
 * Falls back to `fallback` when none match.
 */
export function selectMimeType(candidates, isSupported, fallback = 'video/webm') {
  return candidates.find((t) => isSupported(t)) ?? fallback;
}
