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

  // Pick the best supported codec
  const MIME_TYPES = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  function bestMime() {
    return MIME_TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  }

  function start(fps = 30) {
    const canvas = getCanvas();
    if (!canvas) {
      console.warn('Recorder: canvas not available yet');
      return;
    }

    chunks = [];
    const stream = canvas.captureStream(fps);
    recorder = new MediaRecorder(stream, { mimeType: bestMime() });

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
    a.download = `animation-${timestamp()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Delay revoke so the browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  function timestamp() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
      '-',
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
      String(d.getSeconds()).padStart(2, '0'),
    ].join('');
  }

  return { start, stop, isActive };
}
