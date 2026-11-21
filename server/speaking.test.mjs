import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
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

test('one sustained syllable cannot pass three repeated characters', () => {
  const silence = new Float32Array(2400);
  const samples = concatWithPause([silence, synthContour(220, null, 220, 0.85), silence], 0);
  const input = { samples, text: '妈妈妈', pinyin: 'mā mā mā' };
  for (const transcript of ['妈', '妈妈妈', '']) {
    const result = pitchCore.segmentAndScore({ ...input, transcript });
    assert.deepEqual(result.syllables.map(s => s.pronunciationVerified), [transcript ? true : null, false, false]);
    assert.deepEqual(result.syllables.slice(1).map(s => s.score), [0, 0]);
    assert.ok(result.overallScore < 70);
  }
});

test('aligns skipped and reordered characters without reusing recognized speech', () => {
  const { perChar, heardIndices } = pitchCore.computeCharMatch('今天天气很好', '今天很好');
  assert.deepEqual(perChar, [true, true, false, false, true, true]);
  assert.deepEqual(heardIndices, [0, 1, -1, -1, 2, 3]);
  assert.equal(pitchCore.computeCharMatch('你好', '好你').perChar.filter(Boolean).length, 1);
  assert.equal(pitchCore.computeCharMatch('你好', '你好啊').matchRatio, 67);

  const samples = concatWithPause([synthContour(245, null, 145, 0.24), synthContour(175, 130, 170, 0.26)]);
  const result = pitchCore.segmentAndScore({ samples, text: '对不起', pinyin: 'duì bu qǐ', transcript: '对起' });
  assert.deepEqual(result.syllables.map(s => s.pronunciationVerified), [true, false, true]);
  assert.equal(result.syllables[1].score, 0);
  assert.match(result.summaryVi, /2\/3/);
});

test('matching tones alone cannot pass a different initial or final', () => {
  const samples = concatWithPause([
    synthContour(175, 115, 168, 0.42),
    synthContour(245, null, 145, 0.34),
    synthContour(175, 115, 168, 0.42)
  ]);
  const input = { samples, text: '我爱你', pinyin: 'wǒ ài nǐ' };
  const wrongWord = pitchCore.segmentAndScore({ ...input, transcript: '我恨你' });
  assert.equal(wrongWord.syllables[1].detectedTone, 4);
  assert.deepEqual(wrongWord.syllables.map(s => s.pronunciationVerified), [true, false, true]);
  assert.ok(wrongWord.overallScore < 70);
  const completelyDifferent = pitchCore.segmentAndScore({ ...input, transcript: '早上好' });
  assert.deepEqual(completelyDifferent.syllables.map(s => s.pronunciationVerified), [false, false, false]);
  assert.equal(completelyDifferent.overallScore, 0);
});

test('recorder scores only final speech recognition results', async () => {
  let recognition;
  const connectable = { connect() {}, disconnect() {} };
  const window = {
    navigator: { mediaDevices: { async getUserMedia() { return { getTracks: () => [] }; } } },
    AudioContext: class {
      createMediaStreamSource() { return connectable; }
      createScriptProcessor() { return { ...connectable }; }
      createGain() { return { ...connectable, gain: { value: 1 } }; }
      async close() {}
    },
    SpeechRecognition: class {
      start() { recognition = this; }
      stop() { this.onend(); }
    }
  };
  const source = readFileSync(new URL('../src/modules/speaking/speech-recorder.js', import.meta.url), 'utf8');
  runInNewContext(source, { window, Blob, setTimeout, clearTimeout });
  const previews = [];
  const session = await window.HSKRecorder.start({ onTranscript: (text, final) => previews.push([text, final]) });
  const result = (transcript, isFinal) => Object.assign([{ transcript }], { isFinal });
  recognition.onresult({ results: [result('没', true), result('关系', false)] });
  const recording = await session.stop();
  assert.equal(recording.transcript, '没');
  assert.equal(recording.provisionalTranscript, '关系');
  assert.deepEqual(previews, [['没关系', false], ['没', true]]);
});

test('iPhone retries naturally finish recognition and clear the previous audio session', async () => {
  const events = [];
  let current;
  const node = { connect() {}, disconnect() {} };
  const window = {
    navigator: {
      userAgent: 'iPhone', audioSession: { type: 'auto' },
      mediaDevices: { async getUserMedia() {
        events.push('microphone');
        return { getTracks: () => [{ stop() { events.push('track closed'); } }] };
      } }
    },
    AudioContext: class {
      createMediaStreamSource() { return node; }
      createScriptProcessor() { return { ...node }; }
      createGain() { return { ...node, gain: { value: 1 } }; }
      async close() {
        await new Promise(resolve => setTimeout(resolve, 5));
        events.push('context closed');
      }
    },
    SpeechSynthesisUtterance: class {},
    speechSynthesis: { speak() { assert.fail('TTS cue before mic open expires iOS user gesture'); } },
    webkitSpeechRecognition: class {
      start() {
        assert.equal(this.continuous, true);
        current = this;
        events.push('recognition');
      }
      stop() {
        events.push('recognition stopped');
      }
      abort() { assert.fail('a completed recognition should never be aborted'); }
    }
  };
  const source = readFileSync(new URL('../src/modules/speaking/speech-recorder.js', import.meta.url), 'utf8');
  runInNewContext(source, { window, Blob, setTimeout, clearTimeout });
  for (const [segments, expectedFinal, expectedProvisional] of [
    [[['北', true], ['方', true]], '北方', ''],
    [[['北方', true]], '北方', ''],
    [[['北', true], ['北方', false]], '北', '方']
  ]) {
    const session = await window.HSKRecorder.start();
    const result = session.stop();
    setTimeout(() => {
      for (const [transcript, isFinal] of segments) {
        current.onresult({ results: [Object.assign([{ transcript }], { isFinal })] });
      }
      current.onend();
    }, 0);
    const recording = await result;
    assert.equal(recording.transcript, expectedFinal);
    assert.equal(recording.provisionalTranscript, expectedProvisional);
    assert.equal(window.navigator.audioSession.type, 'auto');
  }
  assert.deepEqual(events, [
    'microphone', 'recognition', 'recognition stopped', 'track closed', 'context closed',
    'microphone', 'recognition', 'recognition stopped', 'track closed', 'context closed',
    'microphone', 'recognition', 'recognition stopped', 'track closed', 'context closed'
  ]);
});

test('mobile 2-character phrases do not confuse tone matching with ASR recognition on retries', () => {
  const sr = 16000;
  const bei = synthContour(175, 128, 170, 0.28, sr); // 北 T3
  const fang = synthContour(225, null, 225, 0.28, sr); // 方 T1
  const beifang = concatWithPause([bei, fang], 0.07, sr);

  // 1) Mobile stops with 1st char final ('北') and 2nd char still interim ('方')
  const resInterim = pitchCore.segmentAndScore({
    samples: beifang,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '北',
    provisionalTranscript: '方'
  });
  assert.deepEqual(resInterim.syllables.map(s => s.pronunciationVerified), [true, true]);
  assert.ok(resInterim.overallScore >= 80, `Expected interim-assisted 北方 >= 80, got ${resInterim.overallScore}`);

  // 2) Mobile ASR clipped 2nd char ('北' only), but user clearly pronounced both syllables with right tones
  const resClipped = pitchCore.segmentAndScore({
    samples: beifang,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '北'
  });
  assert.deepEqual(resClipped.syllables.map(s => s.pronunciationVerified), [true, false]);
  assert.ok(resClipped.overallScore < 70, 'Partial ASR cannot confirm a missing second character from tones alone');

  // 3) Consecutive take on same word when mobile cloud ASR throttles (empty transcript) but both syllables are clearly spoken
  const resRetry = pitchCore.segmentAndScore({
    samples: beifang,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '',
    recognitionSupported: false
  });
  assert.equal(resRetry.charMatch, null, 'A retry with no ASR must not invent a recognized word');
  assert.deepEqual(resRetry.syllables.map(s => s.pronunciationVerified), [null, null]);
  assert.ok(resRetry.toneScore >= 80, `Expected retry tonal contour >= 80, got ${resRetry.toneScore}`);
});

test('installed Mandarin model handles consecutive phone recordings without browser recognition', async () => {
  const connectable = { connect() {}, disconnect() {} };
  const asset = { url: 'https://example.org/test-model' };
  let processor;
  let workerStarts = 0;
  const sent = [];
  const window = {
    HSKPitchCore: pitchCore,
    navigator: { userAgent: 'iPhone', mediaDevices: { async getUserMedia() { return { getTracks: () => [] }; } } },
    caches: {
      async has() { return true; },
      async open() { return {
        async match() { return { async json() { return { schema: 2, assets: { runtime: asset } }; } }; },
        async keys() { return [asset]; }
      }; }
    },
    AudioContext: class {
      createMediaStreamSource() { return connectable; }
      createScriptProcessor() { processor = { ...connectable }; return processor; }
      createGain() { return { ...connectable, gain: { value: 1 } }; }
      async close() {}
    },
    webkitSpeechRecognition: class { constructor() { assert.fail('local recognition should have priority on iPhone'); } },
    Worker: class {
      constructor() { workerStarts++; }
      postMessage({ samples }) {
        sent.push(samples);
        queueMicrotask(() => this.onmessage({ data: { transcript: sent.length === 1 ? '你好' : '北方' } }));
      }
      terminate() {}
    }
  };
  const source = readFileSync(new URL('../src/modules/speaking/speech-recorder.js', import.meta.url), 'utf8');
  runInNewContext(source, { window, Blob, setTimeout, clearTimeout });
  for (const [transcript, frequency] of [['你好', 210], ['北方', 240]]) {
    const samples = concatWithPause([new Float32Array(4000), synthContour(frequency, null, frequency, 0.3)]);
    const session = await window.HSKRecorder.start();
    processor.onaudioprocess({ inputBuffer: { getChannelData: () => samples } });
    const result = await session.stop();
    assert.equal(result.transcript, transcript);
    assert.equal(result.recognitionSource, 'local');
  }
  assert.equal(workerStarts, 1);
  assert.notEqual(sent[0][5000], sent[1][5000]);
  window.HSKRecorder.releaseLocalRecognition();
});

test('keeps a quieter final syllable confirmed even when its tone is wrong', () => {
  const samples = concatWithPause([
    synthContour(172, 126, 105, 0.3),
    synthContour(225, null, 130, 0.32).map(sample => sample * 0.11)
  ], 0.1);
  const result = pitchCore.segmentAndScore({ samples, text: '北方', pinyin: 'běi fāng', transcript: '北方' });
  assert.deepEqual(result.syllables.map(s => s.pronunciationVerified), [true, true]);
  assert.equal(result.syllables[1].detectedTone, 4);
  assert.ok(result.syllables[1].score < 65);
});

test('finds and keeps both quiet syllables in a 48kHz recording of 北方', () => {
  const sampleRate = 48000;
  const samples = concatWithPause([
    synthContour(172, 126, 105, 0.3, sampleRate),
    synthContour(220, null, 220, 0.32, sampleRate)
  ], 0.1, sampleRate).map(sample => sample * 0.003);
  const result = pitchCore.segmentAndScore({ samples, sampleRate, text: '北方', pinyin: 'běi fāng', transcript: '北方' });
  assert.equal(result.hasVoice, true);
  assert.deepEqual(result.syllables.map(syllable => syllable.pronunciationVerified), [true, true]);
  assert.ok(pitchCore.encodeWav16k(samples, sampleRate).length > 16000, 'quiet speech is kept in the playback WAV');
  const silence = pitchCore.segmentAndScore({ samples: new Float32Array(sampleRate), sampleRate, text: '北方', pinyin: 'běi fāng' });
  assert.equal(silence.hasVoice, false);
});

test('recovers missing Web Audio frames and keeps the microphone open until recognition finalizes', async () => {
  let stopped = false;
  let recognition;
  const pcm = synthContour(220, null, 220, 0.24);
  const track = { stop() { stopped = true; } };
  const mediaStream = { getTracks: () => [track] };
  const connectable = { connect() {}, disconnect() {} };
  const audioSession = { type: 'auto' };
  const window = {
    HSKPitchCore: pitchCore,
    navigator: {
      audioSession,
      mediaDevices: { async getUserMedia(settings) {
        assert.equal(settings.audio.autoGainControl, true);
        assert.equal(audioSession.type, 'play-and-record');
        return mediaStream;
      } }
    },
    AudioContext: class {
      createMediaStreamSource() { return connectable; }
      createScriptProcessor() { return { ...connectable }; }
      createGain() { return { ...connectable, gain: { value: 1 } }; }
      async close() {}
      async decodeAudioData(data) {
        assert.equal(data.byteLength, 14);
        return { getChannelData: () => pcm, sampleRate: 16000 };
      }
    },
    MediaRecorder: class {
      constructor(stream) { assert.equal(stream, mediaStream); }
      start() { this.state = 'recording'; }
      stop() {
        assert.equal(stopped, false);
        this.state = 'inactive';
        this.ondataavailable({ data: new Blob(['encoded speech'], { type: 'audio/mp4' }) });
        this.onstop();
      }
    },
    SpeechRecognition: class {
      start() { recognition = this; }
      stop() {
        setTimeout(() => {
          assert.equal(stopped, false);
          const result = Object.assign([{ transcript: '北方' }], { isFinal: true });
          recognition.onresult({ results: [result] });
          recognition.onend();
        }, 15);
      }
    }
  };
  const source = readFileSync(new URL('../src/modules/speaking/speech-recorder.js', import.meta.url), 'utf8');
  runInNewContext(source, { window, Blob, setTimeout, clearTimeout });
  const session = await window.HSKRecorder.start();
  const result = await session.stop();
  assert.equal(result.pcm, pcm);
  assert.equal(result.transcript, '北方');
  assert.equal(result.wavBlob.type, 'audio/wav');
  assert.equal(stopped, true);
  assert.equal(audioSession.type, 'auto');
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

test('iPhone records consecutive 北方 takes without simultaneous mic conflict or invented text recognition', async () => {
  const order = [];
  let processor;
  const sr = 16000;
  const connectable = { connect() {}, disconnect() {} };
  const beifang = concatWithPause([
    synthContour(175, 128, 170, 0.28, sr),
    synthContour(225, null, 225, 0.28, sr)
  ], 0.08, sr);

  const window = {
    HSKPitchCore: pitchCore,
    navigator: {
      userAgent: 'iPhone',
      audioSession: { type: 'auto' },
      mediaDevices: {
        async getUserMedia() {
          order.push('getUserMedia');
          return { getTracks: () => [{ stop() { order.push('track-stop'); } }] };
        }
      }
    },
    AudioContext: class {
      constructor() {
        this.state = 'suspended';
        order.push('AudioContext');
      }
      async resume() {
        this.state = 'running';
        order.push('resume');
      }
      createMediaStreamSource() { return connectable; }
      createScriptProcessor() { processor = { ...connectable }; return processor; }
      createGain() { return { ...connectable, gain: { value: 1 } }; }
      async close() { order.push('close'); }
      async decodeAudioData() {
        // Simulate empty/corrupt backup MediaRecorder blob that must NOT overwrite real captured PCM
        return { getChannelData: () => new Float32Array(sr), sampleRate: sr };
      }
    },
    MediaRecorder: class {
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        this.ondataavailable({ data: new Blob(['empty'], { type: 'audio/mp4' }) });
        this.onstop();
      }
    },
    webkitSpeechRecognition: class {
      constructor() {
        assert.fail('iPhone with HSKPitchCore must not run webkitSpeechRecognition concurrently with getUserMedia');
      }
    }
  };

  const source = readFileSync(new URL('../src/modules/speaking/speech-recorder.js', import.meta.url), 'utf8');
  runInNewContext(source, { window, Blob, setTimeout, clearTimeout });

  for (let take = 1; take <= 2; take++) {
    order.length = 0;
    const session = await window.HSKRecorder.start();
    assert.equal(order[0], 'getUserMedia');
    assert.equal(order[1], 'AudioContext');
    assert.equal(order[2], 'resume');
    processor.onaudioprocess({ inputBuffer: { getChannelData: () => beifang } });
    const rec = await session.stop();
    assert.equal(rec.recognitionSupported, false);
    assert.ok(rec.wavBytes.length > 44);
    const scored = pitchCore.segmentAndScore({
      samples: rec.pcm,
      sampleRate: rec.sampleRate,
      text: '北方',
      pinyin: 'běi fāng',
      transcript: rec.transcript,
      recognitionSupported: Boolean(rec.recognitionSupported)
    });
    assert.equal(scored.hasVoice, true);
    assert.equal(scored.charMatch, null, 'No recognizer means no verified Chinese characters');
    assert.deepEqual(scored.syllables.map(s => s.pronunciationVerified), [null, null]);
    assert.ok(scored.toneScore >= 80, `Take ${take} expected tone score >= 80, got ${scored.toneScore}`);
  }
});

test('drops leading 2-frame breath blip, splits continuous 北方 transition cleanly, and matches near-phonetic Whisper output 拜拜', () => {
  const sr = 16000;
  // Brief 2-frame breath blip (~45ms, weak) before a single merged 北(T3)->方(T1) utterance
  const blip = synthContour(190, null, 190, 0.045, sr).map(s => s * 0.35);
  const bei = synthContour(172, 126, 168, 0.24, sr);
  const fang = synthContour(242, null, 240, 0.24, sr);
  const merged = new Float32Array(bei.length + fang.length);
  merged.set(bei, 0);
  merged.set(fang, bei.length);
  const audio = concatWithPause([blip, merged], 0.08, sr);

  const res = pitchCore.segmentAndScore({
    samples: audio,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '拜拜'
  });
  assert.deepEqual(res.syllables.map(s => s.pronunciationVerified), [true, true]);
  assert.equal(res.syllables[0].detectedTone, 3);
  assert.equal(res.syllables[1].detectedTone, 1);
  assert.ok(res.syllables[0].userContour.length >= 4, 'First column 北 must draw learner contour');
  assert.ok(res.syllables[1].userContour.length >= 4, 'Second column 方 must draw learner contour');
  assert.ok(res.overallScore >= 80, `Expected near-phonetic 北方 score >= 80, got ${res.overallScore}`);

  // Speaking actual 拜拜 (T4 + T4) when expecting 北方 (T3 + T1) must still fail tone accuracy
  const baibai = concatWithPause([
    synthContour(245, null, 140, 0.24, sr),
    synthContour(245, null, 140, 0.24, sr)
  ], 0.06, sr);
  const resWrongTone = pitchCore.segmentAndScore({
    samples: baibai,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '拜拜'
  });
  assert.ok(resWrongTone.syllables[1].detectedTone === 4 && resWrongTone.syllables[1].score < 65);
  assert.ok(resWrongTone.overallScore < 75, `Expected 拜拜 T4+T4 on 北方 < 75, got ${resWrongTone.overallScore}`);
});

test('quiet 48kHz mobile speech with loud 0.25 tap transient keeps both syllables and boosts ASR audio cleanly', () => {
  const sampleRate = 48000;
  const tap = new Float32Array(Math.round(0.004 * sampleRate));
  for (let i = 0; i < tap.length; i++) tap[i] = 0.25 * (1 - i / tap.length);
  const leadSilence = new Float32Array(Math.round(0.18 * sampleRate));
  const bei = synthContour(172, 126, 168, 0.28, sampleRate).map(s => s * 0.003);
  const gap = new Float32Array(Math.round(0.08 * sampleRate));
  const fang = synthContour(225, null, 225, 0.30, sampleRate).map(s => s * 0.003);
  const tailSilence = new Float32Array(Math.round(0.25 * sampleRate));
  const samples = new Float32Array(tap.length + leadSilence.length + bei.length + gap.length + fang.length + tailSilence.length);
  let offset = 0;
  for (const part of [tap, leadSilence, bei, gap, fang, tailSilence]) {
    samples.set(part, offset);
    offset += part.length;
  }

  const wav = pitchCore.encodeWav16k(samples, sampleRate);
  assert.ok(wav.length > 16000, `Expected full quiet 北方 WAV > 16000 bytes despite 0.25 tap spike, got ${wav.length}`);

  const prepared = pitchCore.prepareAsrAudio(samples, sampleRate);
  assert.ok(prepared.length >= 10000, `Expected prepared 16kHz audio >= 10000 samples, got ${prepared.length}`);
  const speechSlice = prepared.subarray(Math.round(prepared.length * 0.2), Math.round(prepared.length * 0.8));
  let rmsSq = 0;
  for (const v of speechSlice) rmsSq += v * v;
  const speechRms = Math.sqrt(rmsSq / speechSlice.length);
  assert.ok(speechRms >= 0.04 && speechRms <= 0.45, `Expected boosted speech RMS in [0.04, 0.45], got ${speechRms}`);
  const preparedTrack = pitchCore.extractPitchTrack(prepared, 16000).filter(f => f.f0 > 0);
  assert.ok(preparedTrack.length >= 30, `Expected strong voiced pitch track in prepared audio, got ${preparedTrack.length}`);

  const res = pitchCore.segmentAndScore({ samples, sampleRate, text: '北方', pinyin: 'běi fāng', transcript: '北方' });
  assert.equal(res.hasVoice, true);
  assert.deepEqual(res.syllables.map(s => s.pronunciationVerified), [true, true]);
  assert.ok(res.syllables[0].score >= 70 && res.syllables[1].score >= 70);
  assert.ok(res.overallScore >= 78, `Expected quiet 48kHz 北方 score >= 78, got ${res.overallScore}`);
});

test('partial ASR transcript aligns recognized 1st or 2nd character to its real acoustic syllable', () => {
  const sr = 16000;
  const beifang = concatWithPause([
    synthContour(172, 126, 168, 0.28, sr), // 北 T3
    synthContour(228, null, 226, 0.28, sr) // 方 T1
  ], 0.08, sr);

  const onlySecond = pitchCore.segmentAndScore({
    samples: beifang,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '方'
  });
  assert.deepEqual(onlySecond.syllables.map(s => s.pronunciationVerified), [false, true]);
  assert.equal(onlySecond.syllables[1].detectedTone, 1, 'Recognized 方 must align to 2nd syllable (T1), not 1st syllable (T3)');
  assert.ok(onlySecond.syllables[1].score >= 80, `Expected 方 T1 score >= 80, got ${onlySecond.syllables[1].score}`);

  const onlyFirst = pitchCore.segmentAndScore({
    samples: beifang,
    sampleRate: sr,
    text: '北方',
    pinyin: 'běi fāng',
    transcript: '北'
  });
  assert.deepEqual(onlyFirst.syllables.map(s => s.pronunciationVerified), [true, false]);
  assert.equal(onlyFirst.syllables[0].detectedTone, 3);
});

test('buildPinyinLookup reads lexical const words and dictionarySupplement and keeps near-phonetic bounds', () => {
  const source = readFileSync(new URL('../src/modules/speaking/pitch-core.js', import.meta.url), 'utf8');
  const ctx = { window: undefined };
  runInNewContext(
    `const words = [{ han: '鲲鹏', pin: 'kūnpéng' }];
     const dictionarySupplement = { entries: { '6|滂沱|pāngtuó': {} } };
     ${source}
     globalThis.__core = HSKPitchCore;`,
    ctx
  );
  const core = ctx.__core;

  // Multi-syllable concatenated pinyin from lexical const words & dictionarySupplement
  const wordMatch = core.computeCharMatch('鲲鹏', '昆朋');
  assert.deepEqual(Array.from(wordMatch.perChar), [true, true], 'Concatenated pinyin in lexical const words indexes both characters');
  const suppMatch = core.computeCharMatch('滂沱', '旁托');
  assert.deepEqual(Array.from(suppMatch.perChar), [true, true], 'Concatenated pinyin in lexical dictionarySupplement indexes both characters');

  // Same-final & sibilant near-phonetic matching while rejecting distinct words
  const rhymeMatch = core.computeCharMatch('方', '刚');
  assert.deepEqual(Array.from(rhymeMatch.perChar), [true]);
  assert.deepEqual(Array.from(rhymeMatch.nearChar), [true]);
  const sibilantMatch = core.computeCharMatch('习', '诗');
  assert.deepEqual(Array.from(sibilantMatch.perChar), [true]);
  assert.deepEqual(Array.from(core.computeCharMatch('我爱你', '我恨你').perChar), [true, false, true]);
  assert.deepEqual(Array.from(core.computeCharMatch('我爱你', '早上好').perChar), [false, false, false]);
});
