/* Tone pitch contour (YIN + Chao 5-level normalization), tone sandhi, and 16kHz WAV encoding.
   Pure module (works in browser via window.HSKPitchCore and in Node via module.exports). */
(function (root) {
  'use strict';

  const TONE_MARKS = {
    'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
    'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
    'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
    'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
    'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
    'ǖ': ['ü', 1], 'ǘ': ['ü', 2], 'ǚ': ['ü', 3], 'ǜ': ['ü', 4]
  };

  const TONE_NAMES = {
    1: 'Thanh 1 (55 · ngang cao)',
    2: 'Thanh 2 (35 · đi lên)',
    3: 'Thanh 3 (214 · trầm xuống rồi lên)',
    4: 'Thanh 4 (51 · hạ mạnh xuống)',
    5: 'Thanh nhẹ'
  };

  const TONE_SHORT = {
    1: 'Thanh 1',
    2: 'Thanh 2',
    3: 'Thanh 3',
    4: 'Thanh 4',
    5: 'Thanh nhẹ'
  };

  function stripSpeakerPrefix(text) {
    return String(text || '').replace(/^\s*[A-Za-z0-9\u4e00-\u9fff]{1,6}\s*[:：]\s*/, '').trim();
  }

  function extractToneFromSyllable(raw) {
    const s = String(raw || '').normalize('NFC').trim();
    if (!s) return 5;
    for (const ch of s) {
      const lower = ch.toLowerCase();
      if (TONE_MARKS[lower]) return TONE_MARKS[lower][1];
    }
    const digit = s.match(/([1-5])[^1-5]*$/);
    if (digit) return Number(digit[1]);
    return 5;
  }

  function splitConcatPinyin(value, expectedCount = 0) {
    if (root.HSKGuidedCore?.formatPinyin) {
      const formatted = root.HSKGuidedCore.formatPinyin(value, '');
      const tokens = formatted.split(/[\s\-·,，。!?！？;；:：'’]+/).filter(t => /[a-zü]/i.test(t));
      if (!expectedCount || tokens.length === expectedCount) return tokens;
    }
    const source = String(value || '').normalize('NFC').trim();
    const rough = source.split(/[\s\-·,，。!?！？;；:：'’/]+/).filter(Boolean);
    const out = [];
    const valid = piece => {
      const tones = piece.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/gi) || [];
      if (tones.length > 1) return false;
      const base = piece.toLowerCase().replace(/[1-5]/g, '').replace(/[āáǎà]/g, 'a').replace(/[ēéěè]/g, 'e')
        .replace(/[īíǐì]/g, 'i').replace(/[ōóǒò]/g, 'o').replace(/[ūúǔù]/g, 'u').replace(/[ǖǘǚǜü]/g, 'v');
      return /^(?:(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcswy])?(?:a|o|e|ai|ei|ao|ou|an|en|ang|eng|ong|i|ia|ie|iao|iu|ian|in|iang|ing|iong|u|ua|ue|uo|uai|ui|uan|un|uang|ueng|v|ve|van|vn)|er|ng)$/.test(base);
    };
    for (const token of rough) {
      if (!/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(token)) continue;
      const clean = token.replace(/[^a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÜ1-5]/g, '');
      if (!clean) continue;
      if (valid(clean)) {
        out.push(clean);
        continue;
      }
      const chars = Array.from(clean);
      const memo = new Map();
      const solve = idx => {
        if (idx === chars.length) return [];
        if (memo.has(idx)) return memo.get(idx);
        let best = null;
        for (let end = Math.min(chars.length, idx + 7); end > idx; end--) {
          const part = chars.slice(idx, end).join('');
          if (!valid(part)) continue;
          const tail = solve(end);
          if (tail && (!best || tail.length + 1 < best.length)) best = [part, ...tail];
        }
        memo.set(idx, best);
        return best;
      };
      const split = solve(0);
      if (split?.length) out.push(...split);
      else out.push(clean);
    }
    return out;
  }

  /**
   * Parses Chinese characters, pinyin syllables and applies Mandarin tone sandhi rules.
   */
  function parseSyllables(text, pinyin = '') {
    const cleanText = stripSpeakerPrefix(text);
    const hanChars = Array.from(cleanText).filter(c => /\p{Script=Han}/u.test(c));
    const pinTokens = splitConcatPinyin(pinyin, hanChars.length);
    const syllables = hanChars.map((han, idx) => {
      const pin = pinTokens[idx] || '';
      const baseTone = pin ? extractToneFromSyllable(pin) : 5;
      return {
        index: idx,
        han,
        pinyin: pin,
        baseTone,
        spokenTone: baseTone,
        sandhiNote: '',
        isFinal: idx === hanChars.length - 1
      };
    });

    for (let i = 0; i < syllables.length - 1; i++) {
      const cur = syllables[i];
      const next = syllables[i + 1];
      if (cur.han === '一' && cur.baseTone !== 5) {
        if (next.baseTone === 4) {
          cur.spokenTone = 2;
          cur.sandhiNote = 'Biến điệu 一 trước Thanh 4 → đọc thành Thanh 2 (yí)';
        } else if (next.baseTone >= 1 && next.baseTone <= 3) {
          cur.spokenTone = 4;
          cur.sandhiNote = 'Biến điệu 一 trước Thanh 1/2/3 → đọc thành Thanh 4 (yì)';
        }
      } else if (cur.han === '不' && next.baseTone === 4) {
        cur.spokenTone = 2;
        cur.sandhiNote = 'Biến điệu 不 trước Thanh 4 → đọc thành Thanh 2 (bú)';
      } else if (cur.baseTone === 3 && next.baseTone === 3) {
        cur.spokenTone = 2;
        cur.sandhiNote = 'Biến điệu hai Thanh 3 liền nhau → âm trước đọc như Thanh 2';
      }
    }
    return syllables;
  }

  function percentile(sorted, p) {
    if (!sorted.length) return 0;
    const pos = Math.max(0, Math.min(sorted.length - 1, p * (sorted.length - 1)));
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  function medianFilter(values, width = 3) {
    const half = Math.floor(width / 2);
    return values.map((_, i) => {
      if (values[i] <= 0) return 0;
      const win = [];
      for (let k = Math.max(0, i - half); k <= Math.min(values.length - 1, i + half); k++) {
        if (values[k] > 0) win.push(values[k]);
      }
      if (!win.length) return values[i];
      win.sort((a, b) => a - b);
      return win[Math.floor(win.length / 2)];
    });
  }

  /**
   * Extracts F0 pitch track (Hz + Chao 1..5 normalized scale) using the YIN algorithm.
   */
  function extractPitchTrack(samples, sampleRate = 16000, opts = {}) {
    if (!samples || !samples.length || !sampleRate) return [];
    const minHz = opts.minHz || 66;
    const maxHz = opts.maxHz || 450;
    const threshold = opts.yinThreshold || 0.2;
    const hopSize = Math.max(32, Math.round(sampleRate * (opts.hopSec || 0.01)));
    const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
    const tauMax = Math.ceil(sampleRate / minHz);
    const winSize = Math.max(Math.round(sampleRate * (opts.winSec || 0.04)), tauMax * 2 + 4);
    const halfWin = Math.floor(winSize / 2);

    if (samples.length < winSize) return [];

    const rawFrames = [];
    let maxRms = 0;

    for (let start = 0; start + winSize <= samples.length; start += hopSize) {
      let sq = 0;
      for (let i = 0; i < winSize; i++) {
        const s = samples[start + i];
        sq += s * s;
      }
      const rms = Math.sqrt(sq / winSize);
      if (rms > maxRms) maxRms = rms;
      rawFrames.push({ start, timeMs: Math.round(((start + halfWin) / sampleRate) * 1000), rms, f0: 0 });
    }

    const rmsFloor = Math.max(opts.minRms || 0.0035, maxRms * (opts.rmsRatio || 0.055));
    const diff = new Float64Array(tauMax + 2);
    const cmndf = new Float64Array(tauMax + 2);

    for (const frame of rawFrames) {
      if (frame.rms < rmsFloor) continue;
      const s0 = frame.start;
      diff[0] = 0;
      cmndf[0] = 1;
      let runningSum = 0;

      for (let tau = 1; tau <= tauMax; tau++) {
        let sum = 0;
        for (let j = 0; j < halfWin; j++) {
          const d = samples[s0 + j] - samples[s0 + j + tau];
          sum += d * d;
        }
        diff[tau] = sum;
        runningSum += sum;
        cmndf[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1;
      }

      let pickedTau = -1;
      for (let tau = tauMin; tau < tauMax; tau++) {
        if (cmndf[tau] < threshold) {
          while (tau + 1 <= tauMax && cmndf[tau + 1] < cmndf[tau]) tau++;
          pickedTau = tau;
          break;
        }
      }
      if (pickedTau < 0) {
        let bestVal = 0.42;
        for (let tau = tauMin; tau <= tauMax; tau++) {
          if (cmndf[tau] < bestVal) {
            bestVal = cmndf[tau];
            pickedTau = tau;
          }
        }
      }
      if (pickedTau >= tauMin && pickedTau <= tauMax) {
        let betterTau = pickedTau;
        if (pickedTau > 1 && pickedTau < tauMax) {
          const a = cmndf[pickedTau - 1];
          const b = cmndf[pickedTau];
          const c = cmndf[pickedTau + 1];
          const denom = 2 * (a - 2 * b + c);
          if (Math.abs(denom) > 1e-9) {
            const delta = (a - c) / denom;
            if (Math.abs(delta) < 1) betterTau += delta;
          }
        }
        const f0 = sampleRate / betterTau;
        if (f0 >= minHz && f0 <= maxHz) frame.f0 = f0;
      }
    }

    const filteredF0 = medianFilter(rawFrames.map(f => f.f0), 3);
    const voicedSt = [];
    for (let i = 0; i < rawFrames.length; i++) {
      rawFrames[i].f0 = filteredF0[i];
      if (filteredF0[i] > 0) {
        const st = 12 * Math.log2(filteredF0[i] / 100);
        rawFrames[i].semitone = st;
        voicedSt.push(st);
      } else {
        rawFrames[i].semitone = 0;
      }
    }

    const sortedSt = voicedSt.slice().sort((a, b) => a - b);
    const p05 = percentile(sortedSt, 0.05);
    const p50 = percentile(sortedSt, 0.5);
    const p95 = percentile(sortedSt, 0.95);
    const rawSpan = p95 - p05;
    const effectiveSpan = Math.max(2.4, rawSpan);

    for (const frame of rawFrames) {
      if (frame.f0 > 0) {
        let chao;
        if (rawSpan < 1.2) {
          // Steady pitch remains cleanly legible instead of amplifying micro-jitter across 1..5.
          chao = 3.8 + ((frame.semitone - p50) / 3.2) * 2.4;
        } else {
          chao = 1.2 + ((frame.semitone - p05) / effectiveSpan) * 3.6;
        }
        frame.chao = Math.max(1, Math.min(5, chao));
      } else {
        frame.chao = 0;
      }
    }
    return rawFrames;
  }

  /**
   * Canonical Chao 5-level pitch contour templates [1..5].
   */
  function targetContour(tone, points = 12, isFinal = true, halfThird = false) {
    const out = [];
    for (let i = 0; i < points; i++) {
      const t = points === 1 ? 0 : i / (points - 1);
      let y = 3.0;
      if (tone === 1) {
        y = 4.4;
      } else if (tone === 2) {
        y = 2.4 + 2.2 * Math.pow(t, 1.15);
      } else if (tone === 3) {
        if (isFinal && !halfThird) {
          // 214 contour: dip to 1.2 around t=0.45 then rise toward 3.5
          y = t <= 0.45
            ? 2.4 - 1.2 * (t / 0.45)
            : 1.2 + 2.3 * Math.pow((t - 0.45) / 0.55, 1.15);
        } else {
          // Half-third (21): fall gently like a Vietnamese dấu huyền without trailing rebound
          y = 2.6 - 1.4 * Math.sin((t * Math.PI) / 2);
        }
      } else if (tone === 4) {
        y = 4.7 - 3.4 * Math.pow(t, 0.95);
      } else {
        y = 2.8 - 0.8 * t;
      }
      out.push(Number(y.toFixed(2)));
    }
    return out;
  }

  function resampleArray(values, count) {
    if (!values.length) return Array(count).fill(3);
    if (values.length === 1) return Array(count).fill(values[0]);
    const out = [];
    for (let i = 0; i < count; i++) {
      const pos = (i / (count - 1)) * (values.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(values.length - 1, lo + 1);
      const frac = pos - lo;
      out.push(values[lo] * (1 - frac) + values[hi] * frac);
    }
    return out;
  }

  function trimUnvoicedEdges(frames) {
    const list = frames.slice();
    let start = 0;
    let end = list.length - 1;
    while (start <= end && list[start].f0 <= 0) start++;
    while (end >= start && list[end].f0 <= 0) end--;
    return start <= end ? list.slice(start, end + 1) : [];
  }

  function findSyllableRanges(track, expectedCount) {
    if (!expectedCount || !track.length) return [];
    const firstVoiced = track.findIndex(f => f.f0 > 0);
    let lastVoiced = -1;
    for (let i = track.length - 1; i >= 0; i--) {
      if (track[i].f0 > 0) {
        lastVoiced = i;
        break;
      }
    }
    if (firstVoiced < 0 || lastVoiced <= firstVoiced) return [];
    if (expectedCount === 1) return [[firstVoiced, lastVoiced + 1]];

    const activeSpan = lastVoiced - firstVoiced + 1;
    // Smooth RMS + voiced activity to detect natural syllable boundaries (min separation >= 6 frames).
    const gaps = [];
    let i = firstVoiced;
    while (i <= lastVoiced) {
      if (track[i].f0 > 0) {
        i++;
        continue;
      }
      const gapStart = i;
      while (i <= lastVoiced && track[i].f0 <= 0) i++;
      const gapLen = i - gapStart;
      if (gapLen >= 2) {
        gaps.push({ mid: Math.floor((gapStart + i) / 2), score: gapLen * 10 });
      }
    }

    let boundaries = [];
    if (gaps.length >= expectedCount - 1) {
      // Pick strongest gaps respecting minimum spacing.
      const sorted = gaps.slice().sort((a, b) => b.score - a.score);
      const minSep = Math.max(4, Math.floor(activeSpan / (expectedCount * 2.2)));
      for (const g of sorted) {
        if (boundaries.length >= expectedCount - 1) break;
        if (g.mid - firstVoiced < minSep || lastVoiced - g.mid < minSep) continue;
        if (boundaries.every(b => Math.abs(b - g.mid) >= minSep)) boundaries.push(g.mid);
      }
    }

    if (boundaries.length < expectedCount - 1) {
      // Fall back to RMS valleys near ideal equal-time split points.
      boundaries = [];
      const minSeg = Math.max(3, Math.floor(activeSpan / (expectedCount * 2.5)));
      let prev = firstVoiced;
      for (let k = 1; k < expectedCount; k++) {
        const ideal = Math.round(firstVoiced + (k * activeSpan) / expectedCount);
        const searchHalf = Math.max(2, Math.floor(activeSpan / (expectedCount * 3)));
        const lo = Math.max(prev + minSeg, ideal - searchHalf);
        const hi = Math.min(lastVoiced - (expectedCount - k) * minSeg + 1, ideal + searchHalf);
        let bestIdx = Math.max(prev + 1, Math.min(lastVoiced, ideal));
        if (lo <= hi) {
          let bestMetric = Infinity;
          for (let j = lo; j <= hi; j++) {
            const rmsDip = track[j].rms + (track[j].f0 <= 0 ? -0.05 : 0);
            const distPenalty = Math.abs(j - ideal) * 0.0005;
            if (rmsDip + distPenalty < bestMetric) {
              bestMetric = rmsDip + distPenalty;
              bestIdx = j;
            }
          }
        }
        boundaries.push(bestIdx);
        prev = bestIdx;
      }
    } else {
      boundaries.sort((a, b) => a - b);
    }

    const ranges = [];
    let cur = firstVoiced;
    for (const b of boundaries) {
      ranges.push([cur, Math.max(cur + 1, b)]);
      cur = b;
    }
    ranges.push([cur, lastVoiced + 1]);
    return ranges;
  }

  function linearSlope(vals) {
    const n = vals.length;
    if (n < 2) return 0;
    let sx = 0; let sy = 0; let sxy = 0; let sx2 = 0;
    for (let i = 0; i < n; i++) {
      sx += i; sy += vals[i]; sxy += i * vals[i]; sx2 += i * i;
    }
    const denom = n * sx2 - sx * sx;
    return denom ? (n * sxy - sx * sy) / denom : 0;
  }

  function analyzeToneSegment(voicedFrames, spokenTone, isFinal) {
    if (voicedFrames.length < 2) {
      return {
        detectedTone: 0,
        score: 0,
        userContour: [],
        target: targetContour(spokenTone, 12, isFinal),
        feedbackVi: 'Âm tiết quá ngắn hoặc chưa thu rõ giọng.'
      };
    }

    const stResampled = resampleArray(voicedFrames.map(f => f.semitone), 12);
    const chaoResampled = resampleArray(voicedFrames.map(f => f.chao), 12).map(v => Number(v.toFixed(2)));

    const startAvg = (stResampled[0] + stResampled[1] + stResampled[2]) / 3;
    const endAvg = (stResampled[9] + stResampled[10] + stResampled[11]) / 3;
    const totalDeltaSt = linearSlope(stResampled) * 11;
    let minSt = Infinity; let maxSt = -Infinity; let minIdx = 0;
    for (let i = 0; i < stResampled.length; i++) {
      if (stResampled[i] < minSt) { minSt = stResampled[i]; minIdx = i; }
      if (stResampled[i] > maxSt) maxSt = stResampled[i];
    }
    const rangeSt = maxSt - minSt;
    const earlyPeakSt = Math.max(...stResampled.slice(0, 6));
    const dropFromPeakSt = earlyPeakSt - endAvg;
    const tailReboundSt = endAvg - minSt;
    const dipFromEnds = Math.min(startAvg, endAvg) - minSt;

    let detectedTone;
    let usedHalfThird = !isFinal;

    if (dipFromEnds >= 1.5 && minIdx >= 2 && minIdx <= 9 && tailReboundSt >= 1.3 && dropFromPeakSt < 2.0) {
      detectedTone = 3;
    } else if (totalDeltaSt >= 1.6 && endAvg - startAvg >= 1.25) {
      detectedTone = 2;
    } else if ((dropFromPeakSt >= 0.95 || totalDeltaSt <= -0.9) && tailReboundSt < 1.15) {
      // Falling contour (includes natural Tone 4 / huyền drop without trailing rebound).
      if (spokenTone === 3 && dropFromPeakSt >= 0.85) {
        detectedTone = 3;
        usedHalfThird = true;
      } else {
        detectedTone = 4;
      }
    } else if (rangeSt <= 1.35 && Math.abs(totalDeltaSt) <= 0.85 && dropFromPeakSt < 0.95) {
      detectedTone = 1;
    } else if (totalDeltaSt < -0.75 || dropFromPeakSt >= 0.85) {
      detectedTone = spokenTone === 3 && tailReboundSt < 1.2 ? 3 : 4;
      if (detectedTone === 3) usedHalfThird = true;
    } else if (totalDeltaSt > 0.9) {
      detectedTone = 2;
    } else {
      detectedTone = 1;
    }

    const target = targetContour(spokenTone, 12, isFinal, usedHalfThird);

    // Score shape match combining normalized template similarity and detected tone match.
    const userMean = chaoResampled.reduce((s, v) => s + v, 0) / 12;
    const tgtMean = target.reduce((s, v) => s + v, 0) / 12;
    let sqErr = 0;
    for (let i = 0; i < 12; i++) {
      const diff = (chaoResampled[i] - userMean) - (target[i] - tgtMean);
      sqErr += diff * diff;
    }
    const rmse = Math.sqrt(sqErr / 12);
    let shapeScore = Math.round(Math.max(25, Math.min(100, 100 - rmse * 28)));

    if (spokenTone === 5) {
      detectedTone = 5;
      shapeScore = Math.max(75, Math.min(96, Math.round(92 - Math.max(0, rangeSt - 4) * 5)));
    } else if (detectedTone === spokenTone) {
      shapeScore = Math.max(78, Math.min(99, shapeScore));
    } else {
      shapeScore = Math.min(62, shapeScore);
    }

    let feedbackVi;
    if (spokenTone === 5) {
      feedbackVi = 'Thanh nhẹ · đọc ngắn và nhẹ';
    } else if (detectedTone === spokenTone) {
      if (spokenTone === 3 && usedHalfThird) {
        feedbackVi = 'Chuẩn Thanh 3 (đọc nửa dấu 21 tự nhiên)';
      } else {
        feedbackVi = `Chuẩn ${TONE_SHORT[spokenTone]}`;
      }
    } else if (spokenTone === 1) {
      feedbackVi = `Đang bị nghiêng thành ${TONE_SHORT[detectedTone]} · cần giữ cao và phẳng ngang`;
    } else if (spokenTone === 2) {
      feedbackVi = `Đang giống ${TONE_SHORT[detectedTone]} · cần vuốt cao độ đi lên ở cuối`;
    } else if (spokenTone === 3) {
      feedbackVi = isFinal
        ? `Đang giống ${TONE_SHORT[detectedTone]} · cần hạ trầm xuống đáy (hoặc nửa dấu như dấu huyền)`
        : `Đang giống ${TONE_SHORT[detectedTone]} · cần hạ giọng xuống vùng trầm`;
    } else {
      feedbackVi = `Đang giống ${TONE_SHORT[detectedTone]} · cần hạ dứt khoát từ trên xuống (như dấu huyền)`;
    }

    return {
      detectedTone,
      score: shapeScore,
      userContour: chaoResampled,
      target,
      feedbackVi
    };
  }

  function computeCharMatch(targetText, transcript) {
    const expected = Array.from(stripSpeakerPrefix(targetText)).filter(c => /\p{Script=Han}/u.test(c));
    const heard = Array.from(String(transcript || '')).filter(c => /\p{Script=Han}/u.test(c));
    if (!expected.length || !heard.length) return null;
    let hits = 0;
    let cursor = 0;
    const perChar = expected.map(ch => {
      const foundAt = heard.indexOf(ch, cursor);
      if (foundAt >= 0) {
        cursor = foundAt + 1;
        hits++;
        return true;
      }
      if (heard.includes(ch)) {
        hits += 0.5;
        return true;
      }
      return false;
    });
    return {
      expectedCount: expected.length,
      heardText: heard.join(''),
      matchRatio: Math.round((hits / expected.length) * 100),
      perChar
    };
  }

  /**
   * Segments audio into expected syllables and scores Mandarin tones + optional ASR transcript.
   */
  function segmentAndScore({ samples, sampleRate = 16000, text = '', pinyin = '', transcript = '' } = {}) {
    const parsed = parseSyllables(text, pinyin);
    const track = extractPitchTrack(samples, sampleRate);
    const voicedFrames = track.filter(f => f.f0 > 0);
    const charMatch = computeCharMatch(text, transcript);

    if (!parsed.length) {
      return {
        hasVoice: voicedFrames.length >= 4,
        overallScore: 0,
        toneScore: 0,
        syllables: [],
        pitchTrack: track,
        charMatch,
        summaryVi: 'Chưa có văn bản chữ Hán để đối chiếu.'
      };
    }

    if (voicedFrames.length < 4) {
      return {
        hasVoice: false,
        overallScore: 0,
        toneScore: 0,
        syllables: parsed.map((s, idx) => ({
          ...s,
          detectedTone: 0,
          score: 0,
          userContour: [],
          target: targetContour(s.spokenTone, 12, s.isFinal),
          charMatched: charMatch ? Boolean(charMatch.perChar[idx]) : null,
          feedbackVi: 'Chưa thu được giọng rõ ràng.'
        })),
        pitchTrack: track,
        charMatch,
        summaryVi: 'Chưa nghe rõ giọng nói. Hãy ghé sát micro hơn và nói lại từ đầu.'
      };
    }

    const ranges = findSyllableRanges(track, parsed.length);
    const syllables = parsed.map((meta, idx) => {
      const [lo, hi] = ranges[idx] || [0, 0];
      const segFrames = track.slice(lo, hi);
      const voiced = trimUnvoicedEdges(segFrames).filter(f => f.f0 > 0);
      const analysis = analyzeToneSegment(voiced, meta.spokenTone, meta.isFinal);
      return {
        ...meta,
        startMs: segFrames[0]?.timeMs || 0,
        endMs: segFrames[segFrames.length - 1]?.timeMs || 0,
        ...analysis,
        charMatched: charMatch ? Boolean(charMatch.perChar[idx]) : null
      };
    });

    const scored = syllables.filter(s => s.detectedTone > 0);
    const toneScore = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length)
      : 0;
    const overallScore = charMatch
      ? Math.round(toneScore * 0.7 + charMatch.matchRatio * 0.3)
      : toneScore;

    const wrongCount = syllables.filter(s => s.spokenTone !== 5 && s.detectedTone !== s.spokenTone).length;
    let summaryVi;
    if (parsed.length > 5) {
      summaryVi = `Đã vẽ đường cao độ toàn câu (${toneScore}% khớp hình dáng thanh điệu · câu dài nên kết quả chia từng chữ mang tính tham khảo).`;
    } else if (wrongCount === 0 && overallScore >= 80) {
      summaryVi = `Tuyệt vời! Bạn đọc chuẩn cả ${syllables.length} âm tiết (${overallScore}%).`;
    } else if (wrongCount === 0) {
      summaryVi = `Thanh điệu đi đúng hướng (${overallScore}%), có thể mở rộng độ cao/thấp thêm một chút để rõ nét hơn.`;
    } else {
      summaryVi = `Đúng ${syllables.length - wrongCount}/${syllables.length} thanh điệu (${overallScore}%). Xem lại các chữ đánh dấu cam bên dưới.`;
    }

    return {
      hasVoice: true,
      overallScore,
      toneScore,
      syllables,
      pitchTrack: track,
      charMatch,
      summaryVi
    };
  }

  /**
   * Trims edge silence, downsamples to 16kHz mono PCM16, and writes a 44-byte RIFF/WAVE header.
   */
  function encodeWav16k(samples, inputSampleRate = 16000) {
    const targetRate = 16000;
    const input = samples instanceof Float32Array ? samples : new Float32Array(samples || 0);
    if (!input.length) {
      const empty = new Uint8Array(44);
      writeWavHeader(empty, 0, targetRate);
      return empty;
    }

    // Trim silence with 120ms safety padding.
    let first = 0;
    let last = input.length - 1;
    const gate = 0.008;
    while (first < last && Math.abs(input[first]) < gate) first++;
    while (last > first && Math.abs(input[last]) < gate) last--;
    const pad = Math.round(inputSampleRate * 0.12);
    first = Math.max(0, first - pad);
    last = Math.min(input.length - 1, last + pad);
    const trimmed = input.subarray(first, last + 1);

    let pcm16k;
    if (inputSampleRate === targetRate) {
      pcm16k = trimmed;
    } else {
      const ratio = inputSampleRate / targetRate;
      const outLen = Math.max(1, Math.round(trimmed.length / ratio));
      pcm16k = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const pos = i * ratio;
        const idx = Math.floor(pos);
        const next = Math.min(trimmed.length - 1, idx + 1);
        const frac = pos - idx;
        pcm16k[i] = trimmed[idx] * (1 - frac) + trimmed[next] * frac;
      }
    }

    const dataBytes = pcm16k.length * 2;
    const out = new Uint8Array(44 + dataBytes);
    writeWavHeader(out, dataBytes, targetRate);
    const view = new DataView(out.buffer);
    for (let i = 0; i < pcm16k.length; i++) {
      const clamped = Math.max(-1, Math.min(1, pcm16k[i]));
      view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }
    return out;
  }

  function writeWavHeader(bytes, dataLength, sampleRate) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const str = (offset, text) => {
      for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
    };
    str(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, dataLength, true);
  }

  const api = {
    TONE_NAMES,
    TONE_SHORT,
    parseSyllables,
    extractPitchTrack,
    targetContour,
    segmentAndScore,
    encodeWav16k
  };

  root.HSKPitchCore = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
