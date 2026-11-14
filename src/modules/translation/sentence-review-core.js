/* Shared Worker/browser contract. Text responses become anchored edits only
 * when they contain an explicitly labelled corrected paragraph. */
(() => {
  'use strict';

  const han = /\p{Script=Han}/u;
  const MAX_TEXT_LENGTH = 5000;
  const MAX_REPLACEMENT_LENGTH = 5500;
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
    return han.test(corrected) && corrected.length <= MAX_TEXT_LENGTH && safeEditText(corrected, original) ? corrected : null;
  }

  function tryParseJson(str) {
    if (typeof str !== 'string') return null;
    let clean = str.trim();
    clean = clean.replace(/<(?:think|thought|reasoning)>[\s\S]*?<\/(?:think|thought|reasoning)>/gi, '').trim();
    clean = clean.replace(/<\/?(?:text|output|response|result|json)(?:\s+[^>]*)?>/gi, '').trim();
    clean = clean.replace(/(?:^|\s*\{)\s*JSON\.(?:stringify|parse)\s*\(\s*([\s\S]*?)\s*\)\s*(?:\}\s*|$)/g, '$1').trim();
    clean = clean.replace(/(?:^|\s*\{)\s*JSON\.(?:stringify|parse)\s*\(\s*([\s\S]*?)\s*\)\s*(?:\}\s*|$)/g, '$1').trim();
    const fenced = clean.match(/```(?:json|javascript|js)?\s*([\s\S]*?)```/i);
    if (fenced) clean = fenced[1].trim();
    try { return JSON.parse(clean); } catch {}
    const b0 = clean.indexOf('{');
    const b1 = clean.lastIndexOf('}');
    if (b0 >= 0 && b1 > b0) {
      const slice = clean.slice(b0, b1 + 1);
      try { return JSON.parse(slice); } catch {}
      const withoutTrailingCommas = slice.replace(/,\s*([\]}])/g, '$1');
      try { return JSON.parse(withoutTrailingCommas); } catch {}
      const quotedKeys = withoutTrailingCommas.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
      try { return JSON.parse(quotedKeys); } catch {}
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

  function runDpEdits(left, right, offsets, leftBase, editsOut) {
    const table = Array.from({length: left.length + 1}, () => new Uint16Array(right.length + 1));
    for (let i = left.length - 1; i >= 0; i--) {
      for (let j = right.length - 1; j >= 0; j--) {
        table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
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
      editsOut.push({start: offsets[leftBase + start], end: offsets[leftBase + i], replacement});
    }
  }

  function splitCodepointSentences(chars) {
    const chunks = [];
    let start = 0;
    for (let i = 0; i < chars.length; i++) {
      if (/[。！？!?\n；;]/u.test(chars[i]) || i - start >= 180) {
        chunks.push({start, end: i + 1, text: chars.slice(start, i + 1).join('')});
        start = i + 1;
      }
    }
    if (start < chars.length) chunks.push({start, end: chars.length, text: chars.slice(start).join('')});
    return chunks;
  }

  function computeRawEditsLarge(left, right, offsets) {
    let prefix = 0;
    while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix++;
    let suffix = 0;
    while (suffix < left.length - prefix && suffix < right.length - prefix && left[left.length - 1 - suffix] === right[right.length - 1 - suffix]) suffix++;
    const lEnd = left.length - suffix;
    const rEnd = right.length - suffix;
    if (prefix === lEnd && prefix === rEnd) return [];
    const lSub = left.slice(prefix, lEnd);
    const rSub = right.slice(prefix, rEnd);
    const edits = [];
    if (!lSub.length || !rSub.length) {
      edits.push({start: offsets[prefix], end: offsets[lEnd], replacement: rSub.join('')});
      return edits;
    }
    if (lSub.length * rSub.length <= 400000) {
      runDpEdits(lSub, rSub, offsets, prefix, edits);
      return edits;
    }
    const lChunks = splitCodepointSentences(lSub);
    const rChunks = splitCodepointSentences(rSub);
    const table = Array.from({length: lChunks.length + 1}, () => new Uint16Array(rChunks.length + 1));
    for (let i = lChunks.length - 1; i >= 0; i--) {
      for (let j = rChunks.length - 1; j >= 0; j--) {
        table[i][j] = lChunks[i].text === rChunks[j].text ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    let ci = 0;
    let cj = 0;
    while (ci < lChunks.length || cj < rChunks.length) {
      if (ci < lChunks.length && cj < rChunks.length && lChunks[ci].text === rChunks[cj].text) {
        ci++;
        cj++;
        continue;
      }
      const lGapStart = ci < lChunks.length ? lChunks[ci].start : lSub.length;
      const rGapStart = cj < rChunks.length ? rChunks[cj].start : rSub.length;
      while (ci < lChunks.length || cj < rChunks.length) {
        if (ci < lChunks.length && cj < rChunks.length && lChunks[ci].text === rChunks[cj].text) break;
        if (cj < rChunks.length && (ci === lChunks.length || table[ci][cj + 1] > table[ci + 1][cj])) cj++;
        else ci++;
      }
      const lGapEnd = ci < lChunks.length ? lChunks[ci].start : lSub.length;
      const rGapEnd = cj < rChunks.length ? rChunks[cj].start : rSub.length;
      const gapL = lSub.slice(lGapStart, lGapEnd);
      const gapR = rSub.slice(rGapStart, rGapEnd);
      if (!gapL.length || !gapR.length) {
        edits.push({start: offsets[prefix + lGapStart], end: offsets[prefix + lGapEnd], replacement: gapR.join('')});
      } else if (gapL.length * gapR.length <= 400000) {
        runDpEdits(gapL, gapR, offsets, prefix + lGapStart, edits);
      } else {
        edits.push({start: offsets[prefix + lGapStart], end: offsets[prefix + lGapEnd], replacement: gapR.join('')});
      }
    }
    return edits;
  }

  function diffEdits(original, corrected) {
    if (original.length > MAX_TEXT_LENGTH || corrected.length > MAX_REPLACEMENT_LENGTH) return [];
    const left = Array.from(original);
    const right = Array.from(corrected);
    const offsets = [0];
    for (const char of left) offsets.push(offsets.at(-1) + char.length);
    const edits = [];
    if (left.length * right.length <= 400000) {
      runDpEdits(left, right, offsets, 0, edits);
    } else {
      edits.push(...computeRawEditsLarge(left, right, offsets));
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
      if (corrected.length > MAX_TEXT_LENGTH || !safeEditText(corrected, text)) return null;
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
      if (replacement.length > MAX_REPLACEMENT_LENGTH || original === replacement || !safeEditText(replacement, text) || !reason.trim()) continue;
      let start = -1;
      if (Number.isInteger(edit.start) && Number.isInteger(edit.end) && edit.end === edit.start + original.length &&
          edit.start >= 0 && edit.end <= text.length && text.slice(edit.start, edit.end) === original) {
        start = edit.start;
      } else {
        if (!original) continue;
        const occurrences = [];
        let pos = text.indexOf(original);
        while (pos >= 0) {
          occurrences.push(pos);
          pos = text.indexOf(original, pos + 1);
        }
        if (occurrences.length === 1) {
          start = occurrences[0];
        } else if (occurrences.length > 1) {
          const nonOverlapping = occurrences.filter(p => {
            const e = p + original.length;
            return !accepted.some(other => p === other.start || (p < other.end && e > other.start));
          });
          if (nonOverlapping.length > 0) {
            start = nonOverlapping[0];
          }
        }
      }
      if (start < 0) continue;
      const end = start + original.length;
      if (accepted.some(other => start === other.start || start < other.end && end > other.start)) continue;
      if (text.length - original.length + replacement.length > MAX_TEXT_LENGTH) continue;
      accepted.push({kind, start, end, original, replacement, reason: reason.trim().slice(0, 350), ...(edit.fromRewrite === true ? {fromRewrite: true} : {})});
      if (accepted.length === 12) break;
    }
    if (suggestions.length && !accepted.length) {
      if (typeof correctedCandidate === 'string') {
        const corrected = cleanMarkdownWrap(correctedCandidate);
        if (corrected.length <= MAX_TEXT_LENGTH && safeEditText(corrected, text) && (!han.test(text) || han.test(corrected))) {
          const fallbackEdits = diffEdits(text, corrected);
          if (fallbackEdits.length) {
            return {
              summary: 'AI đã đề xuất ' + fallbackEdits.length + ' chỉnh sửa.',
              suggestions: fallbackEdits.sort((a,b) => a.start - b.start)
            };
          }
        }
      }
      return null;
    }
    return {
      summary: accepted.length ? 'AI đã đề xuất ' + accepted.length + ' chỉnh sửa.' : 'AI chưa thấy chỗ cần sửa.',
      suggestions: accepted.sort((a,b) => a.start - b.start)
    };
  }

  function clampInt(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
  }

  const AI_TEMPLATE_RULES = [
    {
      pattern: /(?:综上所述|总而言之|由此可见|总的来说)/gu,
      weight: 16,
      reason: 'Cụm chuyển đoạn tổng kết chuẩn mực kiểu bài luận AI.',
      tip: 'Thay bằng cách kết tự nhiên hơn như 「所以我觉得…」 hoặc nêu cảm nhận cá nhân.'
    },
    {
      pattern: /(?:首先|其次|此外|与此同时|不仅如此|另外)/gu,
      weight: 9,
      reason: 'Từ nối liệt kê đều đặn, thường xuất hiện thành chuỗi trong văn bản AI.',
      tip: 'Xen kẽ cách nối câu tự nhiên hơn hoặc bỏ bớt từ nối hình thức.'
    },
    {
      pattern: /(?:不可否认|显而易见|众所周知|值得一提的是|毫无疑问|一方面|另一方面)/gu,
      weight: 12,
      reason: 'Cụm mở ý khuôn mẫu hay dùng để cân bằng hai mặt vấn đề kiểu LLM.',
      tip: 'Đi thẳng vào quan điểm hoặc ví dụ cụ thể thay cho câu mở sáo.'
    },
    {
      pattern: /(?:在当今社会|在现代社会|随着科技的(?:不断)?发展|随着时代的进步)/gu,
      weight: 16,
      reason: 'Mở đầu khái quát vĩ mô quen thuộc trong câu trả lời tự động.',
      tip: 'Mở bài bằng bối cảnh đời thực gần gũi thay cho khung 「随着…」.'
    },
    {
      pattern: /(?:具有重要意义|发挥着重要作用|注入新的活力|提供有力支撑|提供重要保障|迈上新的台阶|不可或缺的一部分|带来深远的影响|双刃剑|利大于弊)/gu,
      weight: 17,
      reason: 'Cụm danh/động từ trừu tượng mật độ cao rất đặc trưng của văn AI tiếng Trung.',
      tip: 'Thay bằng hành động hoặc hệ quả cụ thể trong đời sống hàng ngày.'
    },
    {
      pattern: /(?:不仅[^。！？\n]{2,24}(?:而且|并且|还)|虽然[^。！？\n]{2,24}但是|尽管[^。！？\n]{2,24}(?:但是|然而)|一方面[^。！？\n]{2,30}另一方面)/gu,
      weight: 10,
      reason: 'Cấu trúc liên từ đối xứng chặt chẽ kiểu văn mẫu / AI hay dùng để cân bằng ý.',
      tip: 'Ngắt thành câu ngắn tự nhiên hoặc bỏ bớt vế đối xứng quá khuôn mẫu.'
    }
  ];

  const HUMAN_COLLOQUIAL_REGEX = /(?:其实我|我个人觉得|说实话|挺好的|有点儿|一下子|刚才|哎呀|哈哈|对吧|好吧|呢[，,。！？!?]?|啊[，,。！？!?]?|嘛[，,。！？!?]?)/gu;
  const LEARNER_AUTHENTIC_REGEX = /(?:帮忙我|不有|二个(?:书|人)|二本|很漂亮衣服)/gu;

  function findSpanPosition(text, snippet, occupied) {
    if (typeof snippet !== 'string' || !snippet.trim()) return -1;
    const clean = snippet.trim();
    let pos = text.indexOf(clean);
    while (pos >= 0) {
      const end = pos + clean.length;
      if (!occupied.some(item => pos < item.end && end > item.start)) return pos;
      pos = text.indexOf(clean, pos + 1);
    }
    return -1;
  }

  function detectVerdictLabel(verdict) {
    if (verdict === 'ai') return 'Khả năng cao do AI tạo';
    if (verdict === 'mixed') return 'Pha trộn Người & AI';
    return 'Do người viết';
  }

  function analyzeAiLikelihood(inputText) {
    const text = typeof inputText === 'string' ? inputText.slice(0, MAX_TEXT_LENGTH) : '';
    const hanChars = (text.match(/\p{Script=Han}/gu) || []).length;
    const sentences = text
      .split(/[。！？!?\n]+/u)
      .map(s => s.trim())
      .filter(s => /\p{Script=Han}/u.test(s));

    const flaggedSpans = [];
    let templateWeight = 0;
    let enumeratorHits = 0;

    for (const rule of AI_TEMPLATE_RULES) {
      for (const m of text.matchAll(rule.pattern)) {
        templateWeight += rule.weight;
        if (/^(?:首先|其次|此外|最后|与此同时|综上所述|总而言之)$/u.test(m[0])) enumeratorHits++;
        const start = m.index;
        const end = start + m[0].length;
        if (flaggedSpans.length < 8 && !flaggedSpans.some(span => start < span.end && end > span.start)) {
          flaggedSpans.push({
            start,
            end,
            text: m[0],
            reason: rule.reason,
            humanizeTip: rule.tip
          });
        }
      }
    }

    const templateDensity = hanChars > 0 ? clampInt((templateWeight * 115) / Math.max(hanChars, 45)) : 0;

    let burstiness = 56;
    let uniformityBonus = 0;
    if (sentences.length >= 3) {
      const lengths = sentences.map(s => (s.match(/\p{Script=Han}/gu) || []).length);
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + (len - mean) ** 2, 0) / lengths.length;
      const cv = Math.sqrt(variance) / Math.max(1, mean);
      burstiness = clampInt(cv * 120, 10, 95);
      if (cv < 0.25 && mean >= 12) uniformityBonus = 18;
      else if (cv < 0.36 && mean >= 10) uniformityBonus = 10;
    }

    const humanHits = (text.match(HUMAN_COLLOQUIAL_REGEX) || []).length;
    const learnerHits = (text.match(LEARNER_AUTHENTIC_REGEX) || []).length;
    const hasExclamationOrQuestion = /[！!？?]/u.test(text) ? 1 : 0;
    const humanOffset = Math.min(34, humanHits * 7 + learnerHits * 14 + hasExclamationOrQuestion * 4);

    let score = 24 + templateDensity * 0.56 + (enumeratorHits >= 2 ? 12 : 0) + uniformityBonus - humanOffset;
    if (hanChars < 20) score = 20 + templateDensity * 0.4 - humanOffset * 0.5;
    const aiProbability = clampInt(score, 4, 96);
    const humanProbability = 100 - aiProbability;
    const verdict = aiProbability >= 65 ? 'ai' : aiProbability >= 38 ? 'mixed' : 'human';
    const verdictLabel = detectVerdictLabel(verdict);
    const confidence = hanChars < 25 ? 'Thấp' : (hanChars >= 80 && (aiProbability >= 72 || aiProbability <= 25)) ? 'Cao' : 'Trung bình';
    const naturalness = clampInt(humanProbability * 0.72 + burstiness * 0.28, 5, 98);

    const signals = [];
    if (flaggedSpans.length) {
      signals.push(`Có ${flaggedSpans.length} cụm từ nối hoặc cấu trúc đặc trưng của AI (${flaggedSpans.slice(0, 3).map(s => `「${s.text}」`).join(', ')}).`);
    }
    if (sentences.length >= 3) {
      if (burstiness < 40) {
        signals.push(`Nhịp độ ${sentences.length} câu quá đồng đều (biến thiên ${burstiness}/100) — AI thường viết các câu dài xấp xỉ nhau, ít ngắt nghỉ bất ngờ như người thật.`);
      } else if (aiProbability >= 38) {
        signals.push(`Biến thiên độ dài câu ở mức vừa (${burstiness}/100), kết hợp câu chữ trau chuốt nên mang nét máy biên tập.`);
      } else {
        signals.push(`Độ dài giữa các câu thay đổi tự nhiên (${burstiness}/100), đúng nhịp viết của người thật.`);
      }
    }
    if (hanChars >= 35 && humanHits === 0 && learnerHits === 0) {
      signals.push('Câu văn trơn tru theo lối sách giáo khoa, thiếu khẩu ngữ, trợ từ ngữ khí (吧/呢/啊) hoặc cảm xúc cá nhân — đặc điểm phổ biến khi AI tạo/viết lại.');
    }
    if (!flaggedSpans.length && aiProbability < 38) {
      signals.push('Không phát hiện các cụm từ nối rập khuôn phổ biến của văn bản AI.');
    } else if (!flaggedSpans.length && aiProbability >= 38) {
      signals.push('Tuy không lặp từ nối sáo rỗng, nhưng văn phong chuẩn hóa và mạch câu cân đối khiến văn bản vẫn giống AI biên tập.');
    }
    if (learnerHits > 0) {
      signals.push('Có nét diễn đạt tự nhiên của người học tiếng Trung — dấu hiệu mạnh do người tự viết.');
    } else if (humanHits > 0) {
      signals.push('Có trợ từ/cụm khẩu ngữ mang sắc thái giao tiếp đời thường của người viết.');
    }
    if (hanChars < 25) {
      signals.push('Đoạn văn còn ngắn (< 25 chữ Hán); nên nhập đoạn dài hơn để tăng độ chính xác.');
    }

    if (aiProbability >= 38 && !flaggedSpans.length && sentences.length) {
      const repSentences = [...sentences]
        .filter(s => (s.match(/\p{Script=Han}/gu) || []).length >= 8)
        .sort((a, b) => b.length - a.length)
        .slice(0, 2);
      for (const snippet of repSentences) {
        const pos = findSpanPosition(text, snippet, flaggedSpans);
        if (pos >= 0) {
          flaggedSpans.push({
            start: pos,
            end: pos + snippet.length,
            text: snippet,
            reason: 'Câu diễn đạt chuẩn mực, nhịp vế cân đối đều đặn và thiếu sắc thái khẩu ngữ cá nhân — dễ khiến người đọc/AI Detector nhận diện là do AI viết hoặc chỉnh sửa.',
            humanizeTip: 'Thêm chi tiết cụ thể của bản thân hoặc rút gọn bớt thành cách nói tự nhiên hơn.'
          });
        }
      }
    }

    const summary = verdict === 'ai'
      ? `Văn bản có ${aiProbability}% dấu hiệu do AI viết: mật độ khuôn mẫu cao, cấu trúc cân đối và ít sắc thái cá nhân.`
      : verdict === 'mixed'
        ? `Văn bản mang ${aiProbability}% đặc trưng AI (nhịp câu đều hoặc dùng cấu trúc biên tập chuẩn hóa), pha với ${humanProbability}% nét tự nhiên của người viết.`
        : `Văn bản tự nhiên (${humanProbability}% dấu hiệu do người viết, mạch câu và từ ngữ gần với cách diễn đạt đời thực).`;

    flaggedSpans.sort((a, b) => a.start - b.start);
    return {
      aiProbability,
      humanProbability,
      verdict,
      verdictLabel,
      confidence,
      summary,
      metrics: {
        naturalness,
        templateDensity,
        burstiness
      },
      signals: signals.slice(0, 6),
      flaggedSpans
    };
  }

  function normalizeAiDetection(payload, text) {
    const baseline = analyzeAiLikelihood(text);
    let value = payload?.aiDetection ?? payload?.answer ?? payload;
    for (let depth = 0; depth < 4; depth++) {
      if (typeof value !== 'string') {
        if (value && (value.aiProbability !== undefined || value.ai_probability !== undefined || typeof value.verdict === 'string' || typeof value.summary === 'string')) break;
        value = value?.answer;
        continue;
      }
      const parsed = tryParseJson(value);
      if (parsed && typeof parsed === 'object') {
        value = parsed;
        if (value.aiProbability !== undefined || value.ai_probability !== undefined || typeof value.verdict === 'string' || typeof value.summary === 'string') break;
        continue;
      }
      return null;
    }
    if (!value || typeof value !== 'object') return null;

    const rawScore = value.aiProbability ?? value.ai_probability ?? value.score;
    const rawVerdict = typeof value.verdict === 'string' ? value.verdict.toLowerCase().trim() : '';
    const hasScore = Number.isFinite(Number(rawScore));
    const validVerdict = ['human', 'mixed', 'ai'].includes(rawVerdict) ? rawVerdict : '';
    if (!hasScore && !validVerdict && typeof value.summary !== 'string') return null;

    const aiProbability = hasScore
      ? clampInt(rawScore, 0, 100)
      : validVerdict === 'ai' ? 78 : validVerdict === 'mixed' ? 50 : validVerdict === 'human' ? 18 : baseline.aiProbability;
    const humanProbability = 100 - aiProbability;
    const verdict = validVerdict || (aiProbability >= 65 ? 'ai' : aiProbability >= 38 ? 'mixed' : 'human');
    const verdictLabel = detectVerdictLabel(verdict);

    const confRaw = String(value.confidence || '').toLowerCase();
    const confidence = confRaw.includes('cao') || confRaw === 'high'
      ? 'Cao'
      : confRaw.includes('thấp') || confRaw.includes('thap') || confRaw === 'low'
        ? 'Thấp'
        : confRaw.includes('trung') || confRaw === 'medium'
          ? 'Trung bình'
          : baseline.confidence;

    const m = value.metrics && typeof value.metrics === 'object' ? value.metrics : {};
    const metrics = {
      naturalness: Number.isFinite(Number(m.naturalness)) ? clampInt(m.naturalness, 0, 100) : clampInt(humanProbability * 0.72 + baseline.metrics.burstiness * 0.28, 5, 98),
      templateDensity: Number.isFinite(Number(m.templateDensity)) ? clampInt(m.templateDensity, 0, 100) : baseline.metrics.templateDensity,
      burstiness: Number.isFinite(Number(m.burstiness)) ? clampInt(m.burstiness, 0, 100) : baseline.metrics.burstiness
    };

    const rawSignals = Array.isArray(value.signals)
      ? value.signals.map(item => String(item || '').trim().slice(0, 280)).filter(Boolean).slice(0, 6)
      : [];
    const signals = rawSignals.length >= 2
      ? rawSignals
      : [...rawSignals, ...baseline.signals.filter(s => !rawSignals.includes(s))].slice(0, 6);

    const flaggedSpans = [];
    if (Array.isArray(value.flaggedSpans)) {
      for (const rawSpan of value.flaggedSpans.slice(0, 12)) {
        if (!rawSpan || typeof rawSpan !== 'object') continue;
        const spanText = String(rawSpan.text ?? rawSpan.snippet ?? rawSpan.original ?? rawSpan.quote ?? '').replace(/^[“”"「『]+|[”"」』]+$/gu, '').trim();
        const reason = String(rawSpan.reason ?? rawSpan.note ?? '').trim().slice(0, 260);
        const humanizeTip = String(rawSpan.humanizeTip ?? rawSpan.tip ?? rawSpan.suggestion ?? '').trim().slice(0, 260);
        if (!spanText || !reason) continue;
        let start = -1;
        if (Number.isInteger(rawSpan.start) && Number.isInteger(rawSpan.end) && rawSpan.end === rawSpan.start + spanText.length &&
            rawSpan.start >= 0 && rawSpan.end <= text.length && text.slice(rawSpan.start, rawSpan.end) === spanText &&
            !flaggedSpans.some(other => rawSpan.start < other.end && rawSpan.end > other.start)) {
          start = rawSpan.start;
        } else {
          start = findSpanPosition(text, spanText, flaggedSpans);
        }
        if (start < 0) continue;
        flaggedSpans.push({
          start,
          end: start + spanText.length,
          text: spanText,
          reason,
          humanizeTip: humanizeTip || 'Thay bằng cách diễn đạt cụ thể, gần với văn nói đời thường hơn.'
        });
        if (flaggedSpans.length >= 8) break;
      }
      flaggedSpans.sort((a, b) => a.start - b.start);
    } else {
      flaggedSpans.push(...baseline.flaggedSpans);
    }

    const summary = typeof value.summary === 'string' && value.summary.trim()
      ? value.summary.trim().slice(0, 420)
      : baseline.summary;

    return {
      aiProbability,
      humanProbability,
      verdict,
      verdictLabel,
      confidence,
      summary,
      metrics,
      signals,
      flaggedSpans
    };
  }

  globalThis.HSKSentenceReview = {MAX_TEXT_LENGTH, normalize, diffEdits, analyzeAiLikelihood, normalizeAiDetection};
  if (typeof module === 'object' && module.exports) module.exports = globalThis.HSKSentenceReview;
})();
