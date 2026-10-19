/** CPU-only 24 kHz mono PCM WAV segmentation. Does not certify words. */
export function detectVoiceSegments(base64, expected) {
  if (!Number.isInteger(expected) || expected < 1 || expected > 100) throw Error('invalid_expected');
  if (typeof base64 !== 'string' || base64.length > 12000000) throw Error('invalid_audio');
  let raw; try { raw = atob(base64); } catch { throw Error('invalid_audio'); }
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  const v = new DataView(bytes.buffer);
  const tag = n => String.fromCharCode(...bytes.subarray(n, n + 4));
  if (bytes.length < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || v.getUint32(4, true) !== bytes.length - 8) throw Error('invalid_wav');
  let data = null, rate = 0, validFormat = false;
  for (let off = 12; off + 8 <= bytes.length;) {
    const name = tag(off), len = v.getUint32(off + 4, true), start = off + 8;
    if (start + len > bytes.length) throw Error('invalid_wav');
    if (name === 'fmt ') {
      if (len < 16 || v.getUint16(start, true) !== 1 || v.getUint16(start + 2, true) !== 1 || v.getUint16(start + 14, true) !== 16) throw Error('unsupported_wav');
      rate = v.getUint32(start + 4, true); validFormat = true;
    }
    if (name === 'data') { if (data) throw Error('invalid_wav'); data = bytes.subarray(start, start + len); }
    off = start + len + len % 2;
  }
  if (!validFormat || rate !== 24000 || !data || !data.length || data.length % 2) throw Error('unsupported_wav');
  const pcm = new DataView(data.buffer, data.byteOffset, data.byteLength), samples = data.length / 2, levels = [];
  let peak = 0;
  for (let i = 0; i < samples; i += 480) {
    const end = Math.min(samples, i + 480); let sum = 0;
    for (let k = i; k < end; k++) { const value = pcm.getInt16(k * 2, true); sum += value * value; }
    const rms = Math.sqrt(sum / (end - i)) / 32768;
    levels.push(rms); peak = Math.max(peak, rms);
  }
  if (peak < .004) throw Error('silent_master');
  let best;
  for (const gap of [.3, .4, .5, .65, .8, 1]) for (const factor of [.012, .02, .03, .04, .05]) {
    const threshold = Math.max(.002, peak * factor), ranges = []; let start = -1, last = -1;
    levels.forEach((rms, n) => {
      if (rms > threshold) { if (start < 0) start = n; last = n; }
      else if (start >= 0 && (n - last) * .02 >= gap) {
        if (last - start >= 5) ranges.push([start * 480, (last + 1) * 480]);
        start = last = -1;
      }
    });
    if (start >= 0 && last - start >= 5) ranges.push([start * 480, Math.min(samples, (last + 1) * 480)]);
    const score = Math.abs(ranges.length - expected) * 100 + Math.abs(gap - .55) * 6 + factor * 4;
    if (!best || score < best.score) best = { ranges, score, gap, ratio: factor };
  }
  if (!best || best.ranges.length < Math.min(20, expected) || best.ranges.length > expected + 5) throw Error('unreliable_segmentation');
  return { ranges: best.ranges, duration: samples / 24000, gap: best.gap, ratio: best.ratio };
}

