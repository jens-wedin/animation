import { formatTimestamp, selectMimeType } from './utils/format.js';

/**
 * Canvas recorder using the MediaRecorder API.
 *
 * Usage:
 *   const rec = createRecorder(() => p5Instance.canvas);
 *   rec.start(30);       // begin recording at 30 fps
 *   await rec.stop();    // stop and trigger .webm download
 *   rec.isActive();      // true while recording
 */
export function createRecorder(getCanvas) {
  let recorder = null;
  let chunks   = [];

  const MIME_CANDIDATES = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  function start(fps = 30) {
    const canvas = getCanvas();
    if (!canvas) {
      console.warn('Recorder: canvas not available yet');
      return;
    }

    chunks = [];
    const stream  = canvas.captureStream(fps);
    const mimeType = selectMimeType(
      MIME_CANDIDATES,
      (t) => MediaRecorder.isTypeSupported(t)
    );

    recorder = new MediaRecorder(stream, { mimeType });

    // Collect data in 100 ms slices so we don't lose the last chunk on stop
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.start(100);
  }

  function stop() {
    return new Promise((resolve) => {
      if (!recorder || recorder.state !== 'recording') {
        resolve();
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        download(blob);
        recorder = null;
        chunks   = [];
        resolve();
      };

      recorder.stop();
    });
  }

  function isActive() {
    return recorder !== null && recorder.state === 'recording';
  }

  function download(blob) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `animation-${formatTimestamp(new Date())}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  return { start, stop, isActive };
}
