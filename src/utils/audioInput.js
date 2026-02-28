/**
 * Shared microphone / Web Audio input.
 *
 * One AudioContext is shared across all sketch modes.
 * main.js owns the lifecycle (startMic / stopMic on checkbox change).
 * Sketches just read data via getAmplitude(), getTimeDomain(), etc.
 */

let _audioCtx = null;
let _analyser = null;
let _stream   = null;
let _status   = 'idle';  // 'idle' | 'requesting' | 'active' | 'denied'
let _timeBuf  = null;
let _freqBuf  = null;

export async function startMic() {
  if (_status === 'active' || _status === 'requesting') return;
  _status = 'requesting';
  try {
    _stream   = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = _audioCtx.createMediaStreamSource(_stream);
    _analyser = _audioCtx.createAnalyser();
    _analyser.fftSize              = 512;
    _analyser.smoothingTimeConstant = 0.82;
    src.connect(_analyser);
    _timeBuf = new Uint8Array(_analyser.fftSize);
    _freqBuf = new Uint8Array(_analyser.frequencyBinCount);
    _status  = 'active';
  } catch (_e) {
    _status = 'denied';
  }
}

export function stopMic() {
  _stream?.getTracks().forEach(t => t.stop());
  _audioCtx?.close().catch(() => {});
  _analyser = null;
  _stream   = null;
  _audioCtx = null;
  _timeBuf  = null;
  _freqBuf  = null;
  _status   = 'idle';
}

export function getMicStatus() { return _status; }

/** Raw AnalyserNode — needed by Audio Reactive mode for smoothingTimeConstant tuning. */
export function getAnalyser() { return _analyser; }

/** Normalised RMS amplitude — 0 when inactive, roughly 0..1 when active. */
export function getAmplitude() {
  if (!_analyser || !_timeBuf) return 0;
  _analyser.getByteTimeDomainData(_timeBuf);
  let sum = 0;
  for (let i = 0; i < _timeBuf.length; i++) {
    const v = (_timeBuf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / _timeBuf.length);
}

/** Pre-allocated time-domain Uint8Array, freshly filled. Null if inactive. */
export function getTimeDomain() {
  if (!_analyser || !_timeBuf) return null;
  _analyser.getByteTimeDomainData(_timeBuf);
  return _timeBuf;
}

/** Pre-allocated frequency Uint8Array, freshly filled. Null if inactive. */
export function getFrequencyData() {
  if (!_analyser || !_freqBuf) return null;
  _analyser.getByteFrequencyData(_freqBuf);
  return _freqBuf;
}
