/* Shared Worker/browser contract. Text responses become anchored edits only
 * when they contain an explicitly labelled corrected paragraph. */
(() => {
  'use strict';

  function diffEdits(original, corrected) {
    if (original.length > 500 || corrected.length > 700) return [];
    const left = Array.from(original);
    const right = Array.from(corrected);
    const offsets = [0];
    for (const char of left) offsets.push(offsets.at(-1) + char.length);
    const table = Array.from({length: left.length + 1}, () => new Uint16Array(right.length + 1));
    for (let i = left.length - 1; i >= 0; i--) {
      for (let j = right.length - 1; j >= 0; j--) {
        table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const edits = [];
    let i = 0;
    let j = 0;
    while (i < left.length || j < right.length) {
      if (i < left.length && j < right.length && left[i] === right[j]) { i++; j++; continue; }
      const start = i;
      let replacement = '';
      while (i < left.length || j < right.length) {
        if (i < left.length && j < right.length && left[i] === right[j]) break;
        if (j < right.length && (i === left.length || table[i][j + 1] > table[i + 1][j])) replacement += right[j++];
        else i++;
      }
      edits.push({start: offsets[start], end: offsets[i], replacement});
    }
    // Keep short grammatical changes together instead of one card per character.
    const merged = [];
    for (const edit of edits) {
      const previous = merged.at(-1);
      if (previous && edit.start - previous.end <= 3) {
        previous.replacement += original.slice(previous.end, edit.start) + edit.replacement;
        previous.end = edit.end;
      } else merged.push({...edit});
    }
    while (merged.length > 12) {
      let best = 0;
      for (let k = 1; k < merged.length - 1; k++) {
        if (merged[k + 1].start - merged[k].end < merged[best + 1].start - merged[best].end) best = k;
      }
      const a = merged[best], b = merged[best + 1];
      a.replacement += original.slice(a.end, b.start) + b.replacement;
      a.end = b.end;
      merged.splice(best + 1, 1);
    }
    return merged.map(edit => ({
      ...edit, original: original.slice(edit.start, edit.end), kind: 'style',
      reason: 'Gợi ý từ bản AI biên tập. Kiểm tra lại ý nghĩa trước khi áp dụng.'
    }));
  }

  function normalize(payload, text) {
    let value = payload?.sentenceReview ?? payload?.answer ?? payload;
    for (let depth = 0; depth < 4; depth++) {
      if (typeof value !== 'string') {
        if (value && (Array.isArray(value.suggestions) || typeof value.correctedText === 'string')) break;
        value = value?.answer;
        continue;
      }
      const clean = value.trim().replace(/^\x60{3}(?:json)?\s*([\s\S]*?)\s*\x60{3}$/i, '$1');
      try { value = JSON.parse(clean); }
      catch {
        const match = clean.match(/(?:^|\n)\s*(?:#{1,6}\s*)?(?:Bản sửa đề xuất|Bản sửa|Đoạn văn đã sửa|Văn bản đã sửa|修改后(?:的文本)?|修改稿)\s*[:：]?\s*\n?([^]*?)(?=\n\s*(?:#{1,6}\s|(?:Giải thích|Nhận xét|Phân tích)\b)|$)/iu);
        const corrected = match?.[1]?.trim();
        if (!corrected || !/\p{Script=Han}/u.test(corrected) || corrected.length > 700) return null;
        // Explanations or lists cannot be treated as the revised paragraph.
        if (/[#\x60]|(?:^|\n)\s*(?:\d+[.)]|[-*])\s/u.test(corrected)) return null;
        value = {correctedText: corrected};
        break;
      }
    }
    if (!value || typeof value !== 'object') return null;
    let suggestions = value.suggestions;
    const derived = !Array.isArray(suggestions) && typeof value.correctedText === 'string';
    if (derived) suggestions = diffEdits(text, value.correctedText.trim());
    if (!Array.isArray(suggestions)) return null;
    const accepted = [];
    for (const edit of suggestions.slice(0, 20)) {
      if (!edit || !['fix', 'style'].includes(edit.kind) || typeof edit.original !== 'string' ||
          typeof edit.replacement !== 'string' || edit.replacement.length > 700 ||
          edit.original === edit.replacement || typeof edit.reason !== 'string' || !edit.reason.trim()) continue;
      let start;
      if (Number.isInteger(edit.start) && Number.isInteger(edit.end) && edit.end === edit.start + edit.original.length &&
          edit.start >= 0 && edit.end <= text.length && text.slice(edit.start, edit.end) === edit.original) start = edit.start;
      else {
        if (!edit.original) continue;
        start = text.indexOf(edit.original);
        if (start < 0 || text.indexOf(edit.original, start + 1) >= 0) continue;
      }
      const end = start + edit.original.length;
      if (accepted.some(other => start === other.start || start < other.end && end > other.start)) continue;
      if (text.length - edit.original.length + edit.replacement.length > 500) continue;
      accepted.push({kind: edit.kind, start, end, original: edit.original, replacement: edit.replacement, reason: edit.reason.slice(0,350)});
      if (accepted.length === 12) break;
    }
    if (suggestions.length && !accepted.length) return null;
    return {
      summary: accepted.length ? 'AI đã đề xuất ' + accepted.length + ' chỉnh sửa.' : 'AI chưa thấy chỗ cần sửa.',
      suggestions: accepted.sort((a,b) => a.start - b.start)
    };
  }

  globalThis.HSKSentenceReview = {normalize, diffEdits};
  if (typeof module === 'object' && module.exports) module.exports = globalThis.HSKSentenceReview;
})();
