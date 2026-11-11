/* Shared Worker/browser contract. Text responses become anchored edits only
 * when they contain an explicitly labelled corrected paragraph. */
(() => {
  'use strict';

  const han = /\p{Script=Han}/u;
  const rewriteHeading = /^(?:#{1,6}\s+)?(?:\*{1,2}|__)?(?:Bản (?:sửa|chỉnh sửa)(?: đề xuất| tự nhiên(?: hơn)?| hoàn chỉnh| đã chỉnh sửa)?|Đoạn văn (?:đã sửa|sau khi sửa)|Văn bản đã sửa|修改后(?:的文本)?|修改稿)(?:\*{1,2}|__)?\s*(?:[:：]\s*(?:\*{1,2}|__)?\s*(.*))?$/iu;
  const explanationHeading = /^(?:#{1,6}\s+|(?:\d+[.)]|[-*])\s+|(?:\*{1,2}|__)?(?:Giải thích|Nhận xét|Phân tích|Lý do|Gợi ý|Lưu ý|说明|解析|修改说明|理由|提示)(?:\b|[:：]))/iu;

  function safeEditText(value, original) {
    if (/(?:\*\*|__|[\x60#]|<\/?[a-z][^>]*>|\[[^\]]+\]\()/iu.test(value)) return false;
    // Chinese revisions may preserve source acronyms and names. New Latin
    // words are more likely to be a heading or commentary than a correction.
    if (!han.test(original)) return true;
    const words = text => (text.normalize('NFKC').toLowerCase().match(/[\p{Script=Latin}\p{Mark}]+/gu) || []);
    const allowed = new Set(words(original));
    return words(value).every(word => allowed.has(word));
  }

  function extractRewrite(reply, original) {
    const lines = reply.split(/\r?\n/u);
    const heading = lines.findIndex(line => rewriteHeading.test(line.trim()));
    if (heading < 0) return null;
    const firstLine = lines[heading].trim().match(rewriteHeading)[1];
    const paragraphs = firstLine?.trim() ? [firstLine.trim()] : [];
    for (const raw of lines.slice(heading + 1)) {
      const line = raw.trim();
      if (explanationHeading.test(line) || rewriteHeading.test(line)) break;
      if (line) paragraphs.push(line);
    }
    const corrected = paragraphs.join('\n').trim();
    return han.test(corrected) && corrected.length <= 500 && safeEditText(corrected, original) ? corrected : null;
  }

  function groupMovedText(edits, original) {
    for (let first = 0; first < edits.length; first++) {
      const a = edits[first];
      const deleted = original.slice(a.start, a.end);
      const token = a.replacement || deleted;
      if (!token || !han.test(token) || (a.replacement && deleted)) continue;
      for (let second = first + 1; second < edits.length; second++) {
        const b = edits[second];
        if (b.start - a.end > 100 || /[，,。！？；;\n]/u.test(original.slice(a.end, b.start))) break;
        const complements = deleted
          ? b.start === b.end && b.replacement === token
          : !b.replacement && original.slice(b.start, b.end) === token;
        if (!complements) continue;
        let revised = original.slice(a.start, b.end);
        for (let index = second; index >= first; index--) {
          const edit = edits[index];
          revised = revised.slice(0, edit.start - a.start) + edit.replacement + revised.slice(edit.end - a.start);
        }
        edits.splice(first, second - first + 1, {
          start: a.start, end: b.end, replacement: revised,
          reason: 'Đổi vị trí 「' + token + '」 trong cùng một vế. Áp dụng cả cụm để giữ nguyên ý.'
        });
        break;
      }
    }
    return edits;
  }

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
    // A moved word is one operation; splitting it lets either half change meaning.
    const merged = [];
    for (const edit of groupMovedText(edits, original)) {
      const previous = merged.at(-1);
      if (previous && edit.start - previous.end <= 3 && !/[，,。！？；;\n]/u.test(original.slice(previous.end, edit.start))) {
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
      reason: edit.reason || 'Gợi ý từ bản AI biên tập. Kiểm tra lại ý nghĩa trước khi áp dụng.',
      fromRewrite: true
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
        const corrected = extractRewrite(clean, text);
        if (corrected === null) return null;
        value = {correctedText: corrected};
        break;
      }
    }
    if (!value || typeof value !== 'object') return null;
    let suggestions = value.suggestions;
    const derived = !Array.isArray(suggestions) && typeof value.correctedText === 'string';
    if (derived) {
      const corrected = value.correctedText.trim();
      if (corrected.length > 500 || !safeEditText(corrected, text)) return null;
      if (han.test(text) && !han.test(corrected)) return null;
      suggestions = diffEdits(text, corrected);
    }
    if (!Array.isArray(suggestions)) return null;
    const accepted = [];
    for (const edit of suggestions.slice(0, 20)) {
      if (!edit || !['fix', 'style'].includes(edit.kind) || typeof edit.original !== 'string' ||
          typeof edit.replacement !== 'string' || edit.replacement.length > 700 ||
          edit.original === edit.replacement || !safeEditText(edit.replacement, text) || typeof edit.reason !== 'string' || !edit.reason.trim()) continue;
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
      accepted.push({kind: edit.kind, start, end, original: edit.original, replacement: edit.replacement, reason: edit.reason.trim().slice(0,350), ...(edit.fromRewrite === true ? {fromRewrite: true} : {})});
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
