/* Shared Worker/browser contract. Text responses become anchored edits only
 * when they contain an explicitly labelled corrected paragraph. */
(() => {
  'use strict';

  const han = /\p{Script=Han}/u;
  const rewriteHeading = /^(?:#{1,6}\s+)?(?:\*{1,2}|__)?(?:Bản (?:sửa|chỉnh sửa)(?: đề xuất| tự nhiên(?: hơn)?| hoàn chỉnh| đã chỉnh sửa)?|Đoạn văn (?:đã sửa|sau khi sửa)|Văn bản đã sửa|Câu (?:đúng|sửa|đã sửa|viết lại|hoàn chỉnh|chuẩn)|(?:Gợi ý|Đề xuất) (?:sửa|chỉnh sửa)|Sửa (?:lại|thành)|修改后(?:的文本)?|修改稿|修改建议|正确(?:句子|表达)|建议修改)(?:\*{1,2}|__)?\s*(?:[:：]\s*(?:\*{1,2}|__)?\s*(.*))?$/iu;
  const explanationHeading = /^(?:#{1,6}\s+|(?:\d+[.)]|[-*])\s+|(?:\*{1,2}|__)?(?:Giải thích|Nhận xét|Phân tích|Lý do|Gợi ý|Lưu ý|说明|解析|修改说明|理由|提示)(?:\b|[:：]))/iu;

  function cleanMarkdownWrap(text) {
    if (typeof text !== 'string') return '';
    return text.trim().replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
  }

  function safeEditText(value, original) {
    const clean = cleanMarkdownWrap(value);
    if (/(?:\*\*|__|[\x60#]|<\/?[a-z][^>]*>|\[[^\]]+\]\()/iu.test(clean)) return false;
    // Chinese revisions may preserve source acronyms and names. New Latin
    // words are more likely to be a heading or commentary than a correction.
    if (!han.test(original)) return true;
    const words = text => (text.normalize('NFKC').toLowerCase().match(/[\p{Script=Latin}\p{Mark}]+/gu) || []);
    const allowed = new Set(words(original));
    return words(clean).every(word => allowed.has(word));
  }

  function extractRewrite(reply, original) {
    const lines = reply.split(/\r?\n/u);
    const heading = lines.findIndex(line => rewriteHeading.test(line.trim()));
    if (heading < 0) return null;
    const firstLine = lines[heading].trim().match(rewriteHeading)[1];
    const paragraphs = firstLine?.trim() ? [cleanMarkdownWrap(firstLine.trim())] : [];
    for (const raw of lines.slice(heading + 1)) {
      const line = raw.trim();
      if (explanationHeading.test(line) || rewriteHeading.test(line)) break;
      if (line) paragraphs.push(cleanMarkdownWrap(line));
    }
    const corrected = paragraphs.join('\n').trim();
    return han.test(corrected) && corrected.length <= 500 && safeEditText(corrected, original) ? corrected : null;
  }

  function tryParseJson(str) {
    if (typeof str !== 'string') return null;
    let clean = str.trim();
    clean = clean.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, '').trim();
    const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) clean = fenced[1].trim();
    try { return JSON.parse(clean); } catch {}
    const b0 = clean.indexOf('{');
    const b1 = clean.lastIndexOf('}');
    if (b0 >= 0 && b1 > b0) {
      const slice = clean.slice(b0, b1 + 1);
      try { return JSON.parse(slice); } catch {}
      const withoutTrailingCommas = slice.replace(/,\s*([\]}])/g, '$1');
      try { return JSON.parse(withoutTrailingCommas); } catch {}
    }
    // Attempt repair of unclosed JSON brackets from truncated stream
    if (b0 >= 0) {
      let openBraces = 0, openBrackets = 0, inString = false, escape = false;
      const target = clean.slice(b0);
      for (let i = 0; i < target.length; i++) {
        const c = target[i];
        if (escape) { escape = false; continue; }
        if (c === '\\') { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === '{') openBraces++;
        else if (c === '}') openBraces = Math.max(0, openBraces - 1);
        else if (c === '[') openBrackets++;
        else if (c === ']') openBrackets = Math.max(0, openBrackets - 1);
      }
      let repaired = target.trim().replace(/,\s*$/, '');
      while (openBrackets > 0) { repaired += ']'; openBrackets--; }
      while (openBraces > 0) { repaired += '}'; openBraces--; }
      try { return JSON.parse(repaired); } catch {}
    }
    return null;
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
        if (value && (Array.isArray(value.suggestions) || Array.isArray(value.corrections) || Array.isArray(value.edits) || typeof value.correctedText === 'string' || typeof value.corrected_text === 'string')) break;
        value = value?.answer;
        continue;
      }
      const parsed = tryParseJson(value);
      if (parsed && typeof parsed === 'object') {
        value = parsed;
        if (Array.isArray(value.suggestions) || Array.isArray(value.corrections) || Array.isArray(value.edits) || typeof value.correctedText === 'string' || typeof value.corrected_text === 'string') {
          break;
        }
        continue;
      }
      const clean = value.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, '').trim();
      const corrected = extractRewrite(clean, text);
      if (corrected === null) return null;
      value = {correctedText: corrected};
      break;
    }
    if (!value || typeof value !== 'object') return null;
    let suggestions = value.suggestions ?? value.corrections ?? value.edits ?? value.changes;
    const correctedCandidate = value.correctedText ?? value.corrected_text ?? value.revisedText ?? value.revised_text;
    const derived = !Array.isArray(suggestions) && typeof correctedCandidate === 'string';
    if (derived) {
      const corrected = cleanMarkdownWrap(correctedCandidate);
      if (corrected.length > 500 || !safeEditText(corrected, text)) return null;
      if (han.test(text) && !han.test(corrected)) return null;
      suggestions = diffEdits(text, corrected);
    }
    if (!Array.isArray(suggestions)) return null;
    const accepted = [];
    for (const edit of suggestions.slice(0, 20)) {
      if (!edit || typeof edit !== 'object') continue;
      let kind = String(edit.kind || 'fix').toLowerCase();
      if (['fix', 'style'].includes(kind)) {
        // standard
      } else if (['grammar', 'error', 'spelling', 'vocab', 'vocabulary', 'cần sửa', 'sai'].some(k => kind.includes(k))) {
        kind = 'fix';
      } else {
        kind = 'style';
      }
      let original = edit.original ?? edit.from ?? edit.target ?? edit.before;
      let replacement = edit.replacement ?? edit.to ?? edit.replace ?? edit.after ?? edit.corrected ?? '';
      let reason = edit.reason ?? edit.explanation ?? edit.note ?? edit.message ?? 'Gợi ý chỉnh sửa từ AI.';
      if (typeof original !== 'string' || typeof replacement !== 'string' || typeof reason !== 'string') continue;
      original = original.replace(/^[“”"「『]+|[”"」』]+$/gu, '').trim();
      replacement = cleanMarkdownWrap(replacement).replace(/^[“”"「『]+|[”"」』]+$/gu, '').trim();
      if (replacement.length > 700 || original === replacement || !safeEditText(replacement, text) || !reason.trim()) continue;
      let start;
      if (Number.isInteger(edit.start) && Number.isInteger(edit.end) && edit.end === edit.start + original.length &&
          edit.start >= 0 && edit.end <= text.length && text.slice(edit.start, edit.end) === original) start = edit.start;
      else {
        if (!original) continue;
        start = text.indexOf(original);
        if (start < 0 || text.indexOf(original, start + 1) >= 0) continue;
      }
      const end = start + original.length;
      if (accepted.some(other => start === other.start || start < other.end && end > other.start)) continue;
      if (text.length - original.length + replacement.length > 500) continue;
      accepted.push({kind, start, end, original, replacement, reason: reason.trim().slice(0, 350), ...(edit.fromRewrite === true ? {fromRewrite: true} : {})});
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
