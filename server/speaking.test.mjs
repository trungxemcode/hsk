import test from 'node:test';
import assert from 'node:assert/strict';
import pitchCore from '../src/modules/speaking/pitch-core.js';

function synthContour(f0Start, f0Mid, f0End, durationSec, sampleRate = 16000) {
  const n = Math.round(durationSec * sampleRate);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let hz;
    if (f0Mid !== null) {
      // Quadratic curve passing near f0Start -> f0Mid -> f0End
      const midT = 0.48;
      if (t <= midT) {
        const u = t / midT;
        hz = f0Start + (f0Mid - f0Start) * Math.sin((u * Math.PI) / 2);
      } else {
        const u = (t - midT) / (1 - midT);
        hz = f0Mid + (f0End - f0Mid) * Math.pow(u, 1.15);
      }
    } else {
      hz = f0Start + (f0End - f0Start) * t;
    }
    phase += (2 * Math.PI * hz) / sampleRate;
    const env = Math.sin((Math.PI / 2) * Math.min(1, i / (0.02 * sampleRate))) *
      Math.sin((Math.PI / 2) * Math.min(1, (n - 1 - i) / (0.02 * sampleRate)));
    // Slight 2nd harmonic makes YIN match realistic speech waveforms too.
    out[i] = env * (0.65 * Math.sin(phase) + 0.25 * Math.sin(2 * phase));
  }
  return out;
}

function concatWithPause(segments, pauseSec = 0.08, sampleRate = 16000) {
  const gap = Math.round(pauseSec * sampleRate);
  const lead = Math.round(0.06 * sampleRate);
  const total = lead * 2 + segments.reduce((n, s) => n + s.length, 0) + Math.max(0, segments.length - 1) * gap;
  const out = new Float32Array(total);
  let offset = lead;
  segments.forEach((seg, idx) => {
    out.set(seg, offset);
    offset += seg.length + (idx < segments.length - 1 ? gap : 0);
  });
  return out;
}

test('parseSyllables segments pinyin cleanly and applies Mandarin tone sandhi', () => {
  const nihao = pitchCore.parseSyllables('你好', 'nǐhǎo');
  assert.equal(nihao.length, 2);
  assert.equal(nihao[0].baseTone, 3);
  assert.equal(nihao[0].spokenTone, 2);
  assert.match(nihao[0].sandhiNote, /Thanh 2/);
  assert.equal(nihao[1].spokenTone, 3);

  const budui = pitchCore.parseSyllables('不对', 'bù duì');
  assert.equal(budui[0].baseTone, 4);
  assert.equal(budui[0].spokenTone, 2);
  assert.equal(budui[1].spokenTone, 4);

  const yige = pitchCore.parseSyllables('一个', 'yī gè');
  assert.equal(yige[0].spokenTone, 2);
  const yitian = pitchCore.parseSyllables('一天', 'yī tiān');
  assert.equal(yitian[0].spokenTone, 4);
});

test('extractPitchTrack + segmentAndScore accurately identifies all 4 Mandarin tones', () => {
  const sr = 16000;
  // T1: flat high (~220Hz)
  const s1 = concatWithPause([synthContour(220, null, 220, 0.38, sr)], 0, sr);
  const r1 = pitchCore.segmentAndScore({ samples: s1, sampleRate: sr, text: '妈', pinyin: 'mā' });
  assert.equal(r1.hasVoice, true);
  assert.equal(r1.syllables[0].detectedTone, 1);
  assert.ok(r1.overallScore >= 76, `expected T1 score >= 76, got ${r1.overallScore}`);

  // T2: rising (150Hz -> 240Hz)
  const s2 = concatWithPause([synthContour(150, null, 240, 0.38, sr)], 0, sr);
  const r2 = pitchCore.segmentAndScore({ samples: s2, sampleRate: sr, text: '麻', pinyin: 'má' });
  assert.equal(r2.syllables[0].detectedTone, 2);
  assert.ok(r2.overallScore >= 76, `expected T2 score >= 76, got ${r2.overallScore}`);

  // T3: dipping (175Hz -> 115Hz -> 168Hz)
  const s3 = concatWithPause([synthContour(175, 115, 168, 0.44, sr)], 0, sr);
  const r3 = pitchCore.segmentAndScore({ samples: s3, sampleRate: sr, text: '马', pinyin: 'mǎ' });
  assert.equal(r3.syllables[0].detectedTone, 3);
  assert.ok(r3.overallScore >= 76, `expected T3 score >= 76, got ${r3.overallScore}`);

  // T4: falling (250Hz -> 125Hz)
  const s4 = concatWithPause([synthContour(250, null, 125, 0.36, sr)], 0, sr);
  const r4 = pitchCore.segmentAndScore({ samples: s4, sampleRate: sr, text: '骂', pinyin: 'mà' });
  assert.equal(r4.syllables[0].detectedTone, 4);
  assert.ok(r4.overallScore >= 76, `expected T4 score >= 76, got ${r4.overallScore}`);

  // Mismatch check: Tone 4 expected, but speaker uses flat Tone 1 contour -> caught cleanly
  const mismatch = pitchCore.segmentAndScore({ samples: s1, sampleRate: sr, text: '骂', pinyin: 'mà' });
  assert.equal(mismatch.syllables[0].detectedTone, 1);
  assert.ok(mismatch.syllables[0].score <= 62, `expected mismatch capped <= 62, got ${mismatch.syllables[0].score}`);
  assert.match(mismatch.syllables[0].feedbackVi, /Thanh 1/);
});

test('segmentAndScore evaluates multi-syllable phrase with sandhi and ASR transcript', () => {
  const sr = 16000;
  // 你好 -> T2 + T3
  const ni = synthContour(155, null, 235, 0.32, sr);
  const hao = synthContour(170, 115, 165, 0.4, sr);
  const samples = concatWithPause([ni, hao], 0.08, sr);
  const res = pitchCore.segmentAndScore({
    samples,
    sampleRate: sr,
    text: '你好',
    pinyin: 'nǐ hǎo',
    transcript: '你好'
  });
  assert.equal(res.syllables.length, 2);
  assert.equal(res.syllables[0].spokenTone, 2);
  assert.equal(res.syllables[0].detectedTone, 2);
  assert.equal(res.syllables[1].detectedTone, 3);
  assert.equal(res.charMatch.matchRatio, 100);
  assert.ok(res.overallScore >= 78, `expected 你好 score >= 78, got ${res.overallScore}`);
});

test('encodeWav16k writes valid RIFF/WAVE 16kHz mono 16-bit header and trims silence', () => {
  const sr48 = 48000;
  const buf = new Float32Array(sr48 * 2); // 2s buffer, tone only in middle 0.3s
  const tone = synthContour(200, null, 200, 0.3, sr48);
  buf.set(tone, Math.round(sr48 * 0.8));

  const wav = pitchCore.encodeWav16k(buf, sr48);
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...wav.slice(8, 12)), 'WAVE');
  assert.equal(String.fromCharCode(...wav.slice(12, 16)), 'fmt ');
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint16(34, true), 16);
  // Trimmed duration should be ~0.3s + 0.24s padding (< 1s = 32044 bytes total)
  assert.ok(wav.length > 44 && wav.length < 32044, `unexpected trimmed WAV size: ${wav.length}`);
});
