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

test('recognizes natural huyen-style Tone 4 drop with fade-out and half-third (21) without trailing hook', () => {
  const sr = 16000;
  // Natural Tone 4 spoken by a male voice dropping 125Hz -> 72Hz with realistic fade-out in the second half
  const rawLen = Math.round(0.32 * sr);
  const t4Fade = new Float32Array(rawLen);
  let phase = 0;
  for (let i = 0; i < rawLen; i++) {
    const t = i / (rawLen - 1);
    // Slight consonant onset rise in first 12%, then falling drop like dấu huyền into low tail
    const hz = t < 0.12 ? 120 + 6 * (t / 0.12) : 126 - 54 * Math.pow((t - 0.12) / 0.88, 0.9);
    phase += (2 * Math.PI * hz) / sr;
    const fadeEnv = t < 0.1 ? t / 0.1 : Math.max(0.14, 1 - 0.85 * Math.pow((t - 0.1) / 0.9, 1.3));
    t4Fade[i] = fadeEnv * (0.6 * Math.sin(phase) + 0.25 * Math.sin(2 * phase));
  }
  const sT4Gentle = concatWithPause([t4Fade], 0, sr);
  const resT4 = pitchCore.segmentAndScore({ samples: sT4Gentle, sampleRate: sr, text: '看', pinyin: 'kàn' });
  assert.equal(resT4.syllables[0].detectedTone, 4);
  assert.ok(resT4.overallScore >= 78, `expected gentle huyen-like T4 score >= 78, got ${resT4.overallScore}`);

  // Half-third (21) on an isolated syllable (drops from 145Hz -> 108Hz without trailing rise)
  const halfThird = concatWithPause([synthContour(145, null, 108, 0.36, sr)], 0, sr);
  const resT3Half = pitchCore.segmentAndScore({ samples: halfThird, sampleRate: sr, text: '马', pinyin: 'mǎ' });
  assert.equal(resT3Half.syllables[0].detectedTone, 3);
  assert.ok(resT3Half.overallScore >= 78, `expected half-third T3 score >= 78, got ${resT3Half.overallScore}`);
  assert.match(resT3Half.syllables[0].feedbackVi, /nửa dấu 21/);
});

test('dtwDistance and MPM clarity support time-warped Tone 4 hold-then-drop contours', () => {
  const straight = [4.7, 4.4, 4.1, 3.8, 3.5, 3.2, 2.9, 2.6, 2.2, 1.9, 1.6, 1.3];
  const delayedDrop = [4.7, 4.7, 4.7, 4.6, 4.5, 4.1, 3.3, 2.5, 1.8, 1.5, 1.3, 1.3];
  const dtw = pitchCore.dtwDistance(delayedDrop, straight, 4);
  assert.ok(dtw < 0.25, `expected time-warped DTW distance < 0.25, got ${dtw}`);

  const sr = 16000;
  const n = Math.round(0.36 * sr);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const hz = t < 0.4 ? 225 : 225 - 100 * Math.pow((t - 0.4) / 0.6, 0.9);
    phase += (2 * Math.PI * hz) / sr;
    samples[i] = 0.6 * Math.sin(phase) + 0.2 * Math.sin(2 * phase);
  }
  const padded = concatWithPause([samples], 0, sr);
  const track = pitchCore.extractPitchTrack(padded, sr);
  const voiced = track.filter(f => f.f0 > 0);
  assert.ok(voiced.some(f => f.clarity >= 0.85), 'MPM should report high harmonic clarity >= 0.85');
  const scored = pitchCore.segmentAndScore({ samples: padded, sampleRate: sr, text: '去', pinyin: 'qù' });
  assert.equal(scored.syllables[0].detectedTone, 4);
  assert.ok(scored.overallScore >= 80, `expected delayed-drop T4 score >= 80, got ${scored.overallScore}`);

  // 3-syllable expression with middle 不 (对不起): accepts light middle tone gracefully
  const duibuqi = concatWithPause([
    synthContour(235, null, 130, 0.28, sr),
    synthContour(165, null, 160, 0.16, sr),
    synthContour(145, null, 110, 0.34, sr)
  ], 0.06, sr);
  const resDbq = pitchCore.segmentAndScore({ samples: duibuqi, sampleRate: sr, text: '对不起', pinyin: 'duì bu qǐ' });
  assert.equal(resDbq.syllables[1].optionalNeutral, true);
  assert.ok(resDbq.syllables[1].score >= 80, `expected middle 不 in 对不起 >= 80, got ${resDbq.syllables[1].score}`);
  assert.ok(resDbq.overallScore >= 80, `expected 对不起 overall >= 80, got ${resDbq.overallScore}`);
});

test('noise-robust band-pass filtering, adaptive SNR gate and homophone ASR matching work in noisy rooms', () => {
  const sr = 16000;
  // Build clean 2-syllable speech (再见 -> T4 + T4) and add 50Hz fan hum + deterministic white noise (~8dB SNR)
  const zai = synthContour(240, null, 135, 0.34, sr);
  const jian = synthContour(235, null, 128, 0.36, sr);
  const clean = concatWithPause([zai, jian], 0.09, sr);
  const noisy = new Float32Array(clean.length);
  let seed = 1337;
  for (let i = 0; i < clean.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff - 0.5) * 0.28;
    const hum50 = 0.14 * Math.sin((2 * Math.PI * 50 * i) / sr);
    noisy[i] = clean[i] + white + hum50;
  }

  // Noise-only slice vs voiced slice clarity check for VAD
  const pureNoise = noisy.subarray(0, 800);
  const voicedSlice = noisy.subarray(Math.round(0.14 * sr), Math.round(0.14 * sr) + 1024);
  assert.ok(pitchCore.quickVoicedClarity(pureNoise, sr) < 0.56, 'Pure noise + 50Hz hum should fail voiced clarity gate');
  assert.ok(pitchCore.quickVoicedClarity(voicedSlice, sr) >= 0.70, 'Noisy speech should still pass voiced clarity gate');

  // Homophone ASR match (在见 vs 再见) + noisy pitch extraction
  const res = pitchCore.segmentAndScore({
    samples: noisy,
    sampleRate: sr,
    text: '再见',
    pinyin: 'zài jiàn',
    transcript: '在见'
  });
  assert.equal(res.hasVoice, true);
  assert.equal(res.syllables[0].detectedTone, 4);
  assert.equal(res.syllables[1].detectedTone, 4);
  assert.ok(res.charMatch.matchRatio >= 90, `Expected homophone ASR match >= 90%, got ${res.charMatch.matchRatio}`);
  assert.ok(res.overallScore >= 78, `Expected noisy room overall score >= 78, got ${res.overallScore}`);
});

test('rejects partial utterance followed by laughter/wheezing instead of scoring fake passes', () => {
  const sr = 16000;
  // Learner says ONLY the 1st syllable (没 -> T2) clearly, then laughs/wheezes (noisy unpitched bursts)
  const mei = synthContour(145, null, 225, 0.24, sr);
  const laugh = new Float32Array(Math.round(0.55 * sr));
  let seed = 42;
  for (let i = 0; i < laugh.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const gate = (Math.floor(i / (0.12 * sr)) % 2 === 0) ? 0.12 : 0.01;
    laugh[i] = ((seed / 0xffffffff) - 0.5) * gate;
  }
  const combined = concatWithPause([mei, laugh], 0.08, sr);

  // Case 1: Only syllable 1 spoken, laugh after -> syllables 2 & 3 MUST score < 40%
  const resNoAsr = pitchCore.segmentAndScore({
    samples: combined,
    sampleRate: sr,
    text: '没关系',
    pinyin: 'méi guān xi'
  });
  assert.ok(resNoAsr.syllables[0].score >= 70, 'First clearly spoken syllable passes');
  assert.ok(resNoAsr.syllables[1].score < 40, `Expected missing/laugh 关 < 40%, got ${resNoAsr.syllables[1].score}`);
  assert.ok(resNoAsr.syllables[2].score < 40, `Expected missing/laugh 系 < 40%, got ${resNoAsr.syllables[2].score}`);

  // Case 2: Browser ASR only recognized "没" out of "没关系" while trailing syllables are weak/hummed -> locks 关 & 系
  const weakGuan = synthContour(215, null, 215, 0.25, sr);
  const weakXi = synthContour(175, null, 155, 0.2, sr);
  for (let i = 0; i < weakGuan.length; i++) weakGuan[i] *= 0.22;
  for (let i = 0; i < weakXi.length; i++) weakXi[i] *= 0.18;
  const partialAudio = concatWithPause([
    synthContour(145, null, 225, 0.25, sr),
    weakGuan,
    weakXi
  ], 0.06, sr);
  const resPartialAsr = pitchCore.segmentAndScore({
    samples: partialAudio,
    sampleRate: sr,
    text: '没关系',
    pinyin: 'méi guān xi',
    transcript: '没',
    recognitionSupported: true
  });
  assert.equal(resPartialAsr.syllables[0].pronunciationVerified, true);
  assert.equal(resPartialAsr.syllables[1].pronunciationVerified, false);
  assert.equal(resPartialAsr.syllables[2].pronunciationVerified, false);
  assert.ok(resPartialAsr.syllables[1].score <= 38);
  assert.ok(resPartialAsr.syllables[2].score <= 38);
});

test('passes 对不起 with soft brief middle 不 and full 6-char sentence even without ASR transcript', () => {
  const sr = 16000;
  // Soft brief unstressed middle 不 (~40ms, 30% amplitude) between clear 对 (T4) and 起 (T3)
  const dui = synthContour(245, null, 145, 0.24, sr);
  const buSoft = synthContour(195, null, 165, 0.04, sr);
  for (let i = 0; i < buSoft.length; i++) buSoft[i] *= 0.30;
  const qi = synthContour(175, 130, 170, 0.26, sr);
  const duibuqi = concatWithPause([dui, buSoft, qi], 0.04, sr);

  const resDui = pitchCore.segmentAndScore({
    samples: duibuqi,
    sampleRate: sr,
    text: '对不起',
    pinyin: 'duì bu qǐ',
    transcript: '',
    recognitionSupported: true
  });
  assert.ok(resDui.syllables[0].score >= 75, `Expected 对 >= 75, got ${resDui.syllables[0].score}`);
  assert.ok(resDui.syllables[1].score >= 82, `Expected sandwiched soft 不 >= 82, got ${resDui.syllables[1].score}`);
  assert.ok(resDui.syllables[2].score >= 75, `Expected 起 >= 75, got ${resDui.syllables[2].score}`);
  assert.ok(resDui.overallScore >= 80, `Expected 对不起 overall >= 80, got ${resDui.overallScore}`);

  // Full 6-character sentence without ASR transcript should never be capped at 45%
  const sentence = concatWithPause([
    synthContour(220, null, 220, 0.20, sr), // 今 T1
    synthContour(220, null, 220, 0.20, sr), // 天 T1
    synthContour(220, null, 220, 0.20, sr), // 天 T1
    synthContour(245, null, 145, 0.20, sr), // 气 T4
    synthContour(145, null, 225, 0.20, sr), // 很 T2 (sandhi)
    synthContour(175, 130, 170, 0.24, sr)  // 好 T3
  ], 0.045, sr);

  const resSentence = pitchCore.segmentAndScore({
    samples: sentence,
    sampleRate: sr,
    text: '今天天气很好',
    pinyin: 'jīn tiān tiān qì hěn hǎo',
    transcript: '',
    recognitionSupported: true
  });
  assert.equal(resSentence.syllables.length, 6);
  for (const s of resSentence.syllables) {
    assert.ok(s.score >= 70, `Expected ${s.han} >= 70 without ASR cap, got ${s.score} (${s.feedbackVi})`);
    assert.notEqual(s.pronunciationVerified, false);
  }
  assert.ok(resSentence.overallScore >= 75, `Expected sentence overall >= 75, got ${resSentence.overallScore}`);
});
