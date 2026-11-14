(() => {
  'use strict';

  const panel = document.getElementById('sentenceEditor');
  if (!panel) return;
  const form = panel.querySelector('form');
  const draft = panel.querySelector('textarea');
  const submit = form.querySelector('[type="submit"]');
  const providerSelect = form.querySelector('#sentenceAiProvider');
  const thinkingSelect = form.querySelector('#sentenceAiThinking');
  const detectBtn = form.querySelector('#sentenceAiDetectBtn');
  const detectorPanel = panel.querySelector('#sentenceAiDetector');
  const providerChoices = new Set([...providerSelect.options].map(option => option.value));
  const providerStorageKey = () => 'hsk-sentence-ai-provider:' + (window.HSKAccountDashboard?.user?.uid || 'guest');
  const undo = panel.querySelector('.sentence-undo');
  const example = panel.querySelector('.sentence-example');
  const status = panel.querySelector('.sentence-status');
  const count = panel.querySelector('.sentence-count');
  const mirror = panel.querySelector('.sentence-mirror');
  const cards = panel.querySelector('.sentence-suggestions');
  const help = panel.querySelector('.sentence-help');
  const filters = [...panel.querySelectorAll('[data-sentence-filter]')];
  const providerNames = Object.freeze({gemini:'Gemini', xkiro:'xKiro', openai:'OpenAI', anthropic:'Claude', claude:'Claude', deepseek:'DeepSeek', fosta:'Fosta', 'chatgpt-cookie':'ChatGPT', 'muse-cookie':'Muse AI', custom:'Tùy chỉnh'});
  const initialStatus = status.textContent;
  const han = /\p{Script=Han}/u;

  let suggestions = [];
  let filter = 'all';
  let pending = null;
  let detection = null;
  let activeMode = 'grammar';
  let syncingProvider = false;
  let waitStarted = 0;
  let waitPhase = 'Đang kết nối';

  const THINKING_STEPS = [
    { at: 0, pct: 24, text: 'Phân tích câu hỏi & mục tiêu HSK của bạn' },
    { at: 1.5, pct: 52, text: 'Tra cứu từ vựng, chữ Hán, phiên âm & ngữ pháp' },
    { at: 3.5, pct: 78, text: 'Đối chiếu cách diễn đạt tự nhiên & chọn ví dụ sát ngữ cảnh' },
    { at: 6.0, pct: 94, text: 'Tổng hợp gợi ý sửa lỗi & giải thích chi tiết' }
  ];

  const waitLabel = document.createElement('span');
  waitLabel.className = 'sentence-wait';
  waitLabel.hidden = true;
  waitLabel.setAttribute('aria-hidden', 'true');
  status.after(waitLabel);

  function activeProviderLabel() {
    if (providerSelect.value === 'auto') {
      const info = window.HSKAiProviderPicker?.activeProviderInfo?.();
      if (info?.label && info.kind && info.kind !== 'system-gemini') return info.label;
      return 'HSK AI';
    }
    const selectedOption = providerSelect.selectedOptions?.[0];
    if (selectedOption) return selectedOption.textContent.trim();
    return window.HSKAiProviderPicker?.activeProviderInfo?.()?.label || 'HSK AI';
  }

  function renderWait(elapsed = (performance.now() - waitStarted) / 1000, activeIdx = -1) {
    const seconds = Math.floor(elapsed);
    if (activeIdx < 0) {
      activeIdx = 0;
      for (let i = 0; i < THINKING_STEPS.length; i++) {
        if (elapsed >= THINKING_STEPS[i].at) activeIdx = i;
      }
    }
    const stepText = THINKING_STEPS[activeIdx]?.text || '';
    waitLabel.textContent = waitPhase + ' · ' + seconds + ' giây' + (stepText ? ' · ' + stepText : '');
  }

  const thinkingIndicator = window.HSKAIQACore.createThinkingIndicator({
    container: panel,
    steps: THINKING_STEPS,
    extraRate: 0.25,
    insertCard: card => status.before(card),
    onStart: () => {
      if (status) status.hidden = true;
      if (help) help.hidden = true;
    },
    onStop: () => {
      if (status) status.hidden = false;
      if (help) help.hidden = false;
    },
    onTick: (elapsed, activeIdx) => renderWait(elapsed, activeIdx)
  });

  function stopThinkingIndicator() {
    thinkingIndicator.stop();
  }

  function startThinkingIndicator(modelLabel = '') {
    thinkingIndicator.start(modelLabel);
  }

  let composing = false;
  let dismissed = new Set();
  let undoStack = [];

  function setStatus(message) {
    status.textContent = message;
  }

  function setBusy(busy) {
    waitLabel.hidden = !busy;
    if (busy) {
      waitStarted = performance.now();
      waitPhase = activeMode === 'detect' ? 'Đang phân tích AI Detector' : 'Đang kết nối';
      startThinkingIndicator(activeProviderLabel());
      renderWait(0, 0);
    } else {
      stopThinkingIndicator();
    }
    submit.disabled = busy;
    if (detectBtn) detectBtn.disabled = busy;
    panel.setAttribute('aria-busy', String(busy));
  }

  function cancelPending() {
    pending?.abort();
    pending = null;
    setBusy(false);
  }

  function signature(edit) {
    return JSON.stringify([edit.start, edit.end, edit.original, edit.replacement]);
  }

  function isCurrent(edit) {
    return edit.start >= 0 && edit.end <= draft.value.length && draft.value.slice(edit.start, edit.end) === edit.original;
  }

  function visibleSuggestions() {
    return suggestions.filter(edit => isCurrent(edit) && !dismissed.has(signature(edit)));
  }

  function syncScroll() {
    mirror.scrollTop = draft.scrollTop;
    mirror.scrollLeft = draft.scrollLeft;
  }

  function button(label, className, handler) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = label;
    node.addEventListener('click', handler);
    return node;
  }

  function makeCard(edit) {
    const card = document.createElement('article');
    card.className = 'sentence-card';
    card.dataset.kind = edit.kind;
    card.dataset.source = 'ai';
    card.title = 'Nhấn vào gợi ý để áp dụng đề xuất sửa này';
    card.addEventListener('click', event => {
      if (event.target.closest('button, a')) return;
      const selection = window.getSelection?.();
      if (selection && selection.toString() && card.contains(selection.anchorNode)) return;
      applySuggestion(edit);
    });
    const head = document.createElement('div');
    head.className = 'sentence-card-head';
    const dot = document.createElement('span');
    dot.className = 'sentence-card-dot';
    const title = document.createElement('h4');
    title.textContent = (edit.kind === 'fix' ? 'Cần sửa' : 'Gợi ý diễn đạt') + ' · AI' + (edit.provider ? ' · ' + edit.provider : '');
    head.append(dot, title);

    const change = document.createElement('p');
    change.className = 'sentence-diff';
    change.lang = 'zh';
    const before = document.createElement('del');
    before.className = 'sentence-del';
    before.textContent = edit.original || '(thêm tại đây)';
    const arrow = document.createElement('span');
    arrow.className = 'sentence-arrow';
    arrow.textContent = ' → ';
    const after = document.createElement('ins');
    after.className = 'sentence-ins';
    after.textContent = edit.replacement || '∅';
    change.append(before, arrow, after);

    const reason = document.createElement('p');
    reason.className = 'sentence-card-detail';
    reason.textContent = edit.reason;
    const actions = document.createElement('footer');
    actions.append(
      button('Áp dụng', 'sentence-apply', () => applySuggestion(edit)),
      button('Bỏ qua', 'sentence-dismiss', () => {
        dismissed.add(signature(edit));
        render();
        showRemaining();
      }),
      button('Tìm trong bài', 'sentence-locate', () => {
        draft.focus();
        draft.setSelectionRange(edit.start, edit.end);
      })
    );
    card.append(head, change, reason, actions);
    return card;
  }

  function renderDetector() {
    if (!detectorPanel) return;
    detectorPanel.replaceChildren();
    if (!detection?.result) {
      detectorPanel.hidden = true;
      return;
    }
    detectorPanel.hidden = false;
    const {result, sourceLabel: src} = detection;

    const head = document.createElement('header');
    head.className = 'sentence-detector-head';
    const badge = document.createElement('span');
    badge.className = 'sentence-detector-verdict';
    badge.dataset.verdict = result.verdict;
    badge.textContent = result.verdictLabel;

    const score = document.createElement('strong');
    score.className = 'sentence-detector-score';
    score.textContent = `${result.aiProbability}% AI · ${result.humanProbability}% Người`;

    const closeBtn = button('Đóng', 'sentence-detector-close', () => {
      detection = null;
      renderDetector();
      render();
    });
    head.append(badge, score, closeBtn);

    const meter = document.createElement('div');
    meter.className = 'sentence-detector-meter';
    meter.setAttribute('aria-hidden', 'true');
    const meterFill = document.createElement('span');
    meterFill.className = 'sentence-detector-meter-fill';
    meterFill.dataset.verdict = result.verdict;
    meterFill.style.width = `${Math.max(4, Math.min(100, result.aiProbability))}%`;
    meter.append(meterFill);

    const meta = document.createElement('p');
    meta.className = 'sentence-detector-meta';
    meta.textContent = `Độ tin cậy: ${result.confidence}` + (src ? ` · ${src}` : '');

    const summary = document.createElement('p');
    summary.className = 'sentence-detector-summary';
    summary.textContent = result.summary;

    const metrics = document.createElement('div');
    metrics.className = 'sentence-detector-metrics';
    const metricItems = [
      ['Tự nhiên', `${result.metrics.naturalness}/100`],
      ['Khuôn mẫu AI', `${result.metrics.templateDensity}/100`],
      ['Nhịp câu', `${result.metrics.burstiness}/100`]
    ];
    for (const [labelText, valText] of metricItems) {
      const chip = document.createElement('span');
      chip.className = 'sentence-detector-metric';
      const lbl = document.createElement('span');
      lbl.textContent = labelText + ': ';
      const val = document.createElement('strong');
      val.textContent = valText;
      chip.append(lbl, val);
      metrics.append(chip);
    }

    detectorPanel.append(head, meter, meta, summary, metrics);

    if (Array.isArray(result.signals) && result.signals.length) {
      const list = document.createElement('ul');
      list.className = 'sentence-detector-signals';
      for (const item of result.signals) {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
      }
      detectorPanel.append(list);
    }

    if (Array.isArray(result.flaggedSpans) && result.flaggedSpans.length) {
      const spansWrap = document.createElement('div');
      spansWrap.className = 'sentence-detector-spans';
      const spansTitle = document.createElement('strong');
      spansTitle.className = 'sentence-detector-spans-title';
      spansTitle.textContent = 'Đoạn có dấu hiệu khuôn mẫu / AI:';
      spansWrap.append(spansTitle);

      for (const span of result.flaggedSpans) {
        const row = document.createElement('article');
        row.className = 'sentence-detector-span';
        const snippet = document.createElement('p');
        snippet.className = 'sentence-detector-quote';
        snippet.lang = 'zh';
        snippet.textContent = `「${span.text}」`;

        const reason = document.createElement('p');
        reason.className = 'sentence-detector-reason';
        reason.textContent = span.reason + (span.humanizeTip ? ' Gợi ý tự nhiên hơn: ' + span.humanizeTip : '');

        const locateBtn = button('Tìm trong bài', 'sentence-locate', () => {
          draft.focus();
          draft.setSelectionRange(span.start, span.end);
        });
        row.append(snippet, reason, locateBtn);
        spansWrap.append(row);
      }
      detectorPanel.append(spansWrap);
    }
  }

  function render() {
    undo.disabled = !undoStack.length;
    example.hidden = Boolean(draft.value.trim());
    count.textContent = draft.value.length + ' / ' + draft.maxLength + ' ký tự';
    mirror.replaceChildren();
    cards.replaceChildren();

    const edits = visibleSuggestions();
    const flagSpans = !edits.length && detection?.result?.flaggedSpans?.length ? detection.result.flaggedSpans : [];
    let cursor = 0;
    if (edits.length) {
      for (const edit of edits) {
        if (edit.start < cursor) continue;
        mirror.append(draft.value.slice(cursor, edit.start));
        const mark = document.createElement('mark');
        mark.dataset.kind = edit.kind;
        mark.dataset.source = 'ai';
        mark.dataset.insertion = String(edit.start === edit.end);
        mark.textContent = edit.original || '\u200b';
        mirror.append(mark);
        cursor = edit.end;
      }
    } else if (flagSpans.length) {
      for (const span of flagSpans) {
        if (span.start < cursor || span.end > draft.value.length || draft.value.slice(span.start, span.end) !== span.text) continue;
        mirror.append(draft.value.slice(cursor, span.start));
        const mark = document.createElement('mark');
        mark.dataset.kind = 'ai-flag';
        mark.dataset.source = 'detector';
        mark.textContent = span.text;
        mirror.append(mark);
        cursor = span.end;
      }
    }
    mirror.append(draft.value.slice(cursor) + '\n');
    syncScroll();

    for (const edit of edits) {
      if (filter === 'all' || edit.kind === filter) cards.append(makeCard(edit));
    }
    if (edits.length && !cards.children.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Không có gợi ý thuộc nhóm này.';
      cards.append(empty);
    }
  }

  function showRemaining() {
    const remaining = visibleSuggestions().length;
    setStatus(remaining ? 'Còn ' + remaining + ' gợi ý từ lần kiểm tra này.' : 'Đã xem hết gợi ý. Bạn có thể kiểm tra lại văn bản bằng AI.');
  }

  function resetForInput() {
    cancelPending();
    suggestions = [];
    detection = null;
    dismissed.clear();
    undoStack = [];
    setStatus(initialStatus);
    renderDetector();
    render();
  }

  function applySuggestion(edit) {
    if (!isCurrent(edit)) {
      resetForInput();
      return;
    }
    const delta = edit.replacement.length - edit.original.length;
    if (draft.value.length + delta > draft.maxLength) {
      setStatus('Áp dụng gợi ý này sẽ vượt giới hạn ' + draft.maxLength + ' ký tự.');
      return;
    }
    cancelPending();
    detection = null;
    renderDetector();
    undoStack.push({text: draft.value, suggestions, dismissed: new Set(dismissed), status: status.textContent});
    if (undoStack.length > 20) undoStack.shift();
    draft.setRangeText(edit.replacement, edit.start, edit.end, 'end');

    const nextDismissed = new Set();
    suggestions = suggestions
      .filter(other => other !== edit && (other.end <= edit.start || other.start >= edit.end))
      .map(other => {
        const shifted = other.start < edit.end ? other : {...other, start: other.start + delta, end: other.end + delta};
        if (dismissed.has(signature(other))) nextDismissed.add(signature(shifted));
        return shifted;
      });
    dismissed = nextDismissed;
    render();
    showRemaining();
  }

  function sourceLabel(data, response) {
    const key = response.headers.get('X-HSK-AI-Provider') || data.aiSource?.provider;
    const provider = Object.hasOwn(providerNames, key) ? providerNames[key] : '';
    const reported = data.aiSource?.model;
    const model = data.aiSource?.provider === key && typeof reported === 'string' && /^[a-z0-9][a-z0-9._/:+-]{0,119}$/i.test(reported) ? reported : '';
    return {provider, model};
  }

  draft.addEventListener('input', resetForInput);
  draft.addEventListener('scroll', syncScroll);
  draft.addEventListener('compositionstart', () => { composing = true; });
  draft.addEventListener('compositionend', () => { composing = false; });
  draft.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !composing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  example.addEventListener('click', () => {
    if (draft.value.trim()) return;
    draft.value = '我昨天去了商店，买了一件很漂亮衣服。';
    resetForInput();
    draft.focus();
  });
  undo.addEventListener('click', () => {
    const previous = undoStack.pop();
    if (!previous) return;
    cancelPending();
    draft.value = previous.text;
    suggestions = previous.suggestions;
    dismissed = previous.dismissed;
    detection = null;
    setStatus(previous.status);
    renderDetector();
    render();
    draft.focus();
  });
  for (const node of filters) {
    node.addEventListener('click', () => {
      filter = node.dataset.sentenceFilter;
      for (const item of filters) item.setAttribute('aria-pressed', String(item === node));
      render();
    });
  }
  function buildAiRequestParams() {
    const pickerParams = (!thinkingSelect?.disabled || providerSelect.value !== 'auto')
      ? (window.HSKAiProviderPicker?.getActiveAiParams?.() || null)
      : null;
    const aiProvider = providerSelect.value !== 'auto'
      ? providerSelect.value
      : (pickerParams?.aiProvider || 'auto');
    const params = {};
    if (aiProvider && aiProvider !== 'auto') params.aiProvider = aiProvider;
    if (pickerParams?.personalProvider && (aiProvider.startsWith('personal') || aiProvider === 'auto')) {
      params.personalProvider = pickerParams.personalProvider;
    }
    if (pickerParams?.aiModel) params.aiModel = pickerParams.aiModel;
    if (thinkingSelect && !thinkingSelect.disabled && pickerParams?.thinking) {
      params.thinking = pickerParams.thinking;
    }
    return params;
  }

  function syncProviderFromPicker() {
    if (syncingProvider) return;
    const nextId = window.HSKAiProviderPicker?.selectedId?.();
    if (!nextId || !providerChoices.has(nextId)) return;
    if (providerSelect.value !== nextId) {
      syncingProvider = true;
      providerSelect.value = nextId;
      try { localStorage.setItem(providerStorageKey(), nextId); } catch {}
      syncingProvider = false;
      if (pending) {
        cancelPending();
        setStatus(initialStatus);
      }
    }
  }

  function restoreProvider() {
    let saved = null;
    try { saved = localStorage.getItem(providerStorageKey()); } catch {}
    const pickerId = window.HSKAiProviderPicker?.selectedId?.();
    const chosen = (saved !== null && providerChoices.has(saved))
      ? saved
      : (pickerId && providerChoices.has(pickerId) ? pickerId : 'auto');
    syncingProvider = true;
    providerSelect.value = chosen;
    if (window.HSKAiProviderPicker?.setSelectionFromSelect && window.HSKAiProviderPicker.selectedId?.() !== chosen) {
      window.HSKAiProviderPicker.setSelectionFromSelect(chosen);
    }
    syncingProvider = false;
  }

  restoreProvider();
  providerSelect.addEventListener('change', () => {
    try { localStorage.setItem(providerStorageKey(), providerSelect.value); } catch {}
    if (!syncingProvider && window.HSKAiProviderPicker?.setSelectionFromSelect) {
      syncingProvider = true;
      window.HSKAiProviderPicker.setSelectionFromSelect(providerSelect.value);
      syncingProvider = false;
    }
    if (pending) {
      cancelPending();
      setStatus(initialStatus);
    }
  });
  window.addEventListener('hsk-ai-provider-state', syncProviderFromPicker);
  window.addEventListener('hsk-account-ready', () => {
    restoreProvider();
    resetForInput();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreProvider, {once: true});
  }
  new MutationObserver(() => {
    if (panel.hidden && pending) {
      cancelPending();
      setStatus(initialStatus);
    } else if (!panel.hidden) {
      window.dispatchEvent(new CustomEvent('hsk-sentence-editor-open'));
    }
  }).observe(panel, {attributes: true, attributeFilter: ['hidden']});

  async function runAiDetector() {
    if (pending || composing) return;
    const text = draft.value;
    if (!han.test(text)) {
      setStatus('Nhập câu hoặc đoạn văn tiếng Trung để phân tích dấu hiệu AI.');
      draft.focus();
      return;
    }
    const localResult = window.HSKSentenceReview.analyzeAiLikelihood(text);
    const user = window.HSKAccountDashboard?.user;
    if (navigator.onLine === false || !user?.uid) {
      detection = {
        result: localResult,
        sourceLabel: navigator.onLine === false ? 'Phân tích văn phong offline' : 'Phân tích nhanh trên máy (đăng nhập để kiểm tra AI sâu)'
      };
      setStatus(localResult.summary);
      renderDetector();
      render();
      return;
    }

    const aiParams = buildAiRequestParams();
    const controller = new AbortController();
    pending = controller;
    activeMode = 'detect';
    setBusy(true);
    setStatus('AI Detector đang phân tích dấu hiệu AI trong văn bản tiếng Trung…');
    const timeout = setTimeout(() => controller.abort(), 185000);
    try {
      const configResponse = await fetch('./translation-config.json', {signal: controller.signal, cache: 'no-store'});
      if (!configResponse.ok) throw Error('Dịch vụ AI chưa sẵn sàng.');
      const config = await configResponse.json();
      if (!config.enabled) throw Error('Dịch vụ AI chưa sẵn sàng.');
      const endpoint = new URL('/lesson-ask', config.endpoint);
      if (endpoint.protocol !== 'https:') throw Error('Dịch vụ AI chưa sẵn sàng.');

      const token = await user.getIdToken();
      if (pending !== controller) return;
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const level = Number(document.getElementById('studioTargetLevel')?.value);
      waitPhase = 'Đang chờ AI Detector trả lời';
      renderWait();
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          question: text,
          ...aiParams,
          hsk: level >= 1 && level <= 6 ? level : 3,
          history: [],
          lesson: {id: 'sentence-editor', title: 'Kiểm tra dấu hiệu AI tiếng Trung', words: [], content: {mode: 'sentence-ai-detect'}}
        })
      });
      const data = await response.json().catch(() => null);
      if (pending !== controller || draft.value !== text || window.HSKAccountDashboard?.user?.uid !== user.uid) return;
      if (!response.ok) throw Error(data?.error || 'Không phân tích sâu được, dùng kết quả phân tích nhanh trên máy.');
      const detected = window.HSKSentenceReview.normalizeAiDetection(data, text) || localResult;
      const {provider, model} = sourceLabel(data || {}, response);
      const srcLabel = provider ? provider + (model ? ' · ' + model : '') : 'HSK AI + Văn phong';
      detection = {result: detected, sourceLabel: srcLabel};
      setStatus(detected.summary + (provider ? ' Nguồn: ' + srcLabel + '.' : ''));
      renderDetector();
      render();
    } catch (error) {
      if (pending !== controller) return;
      detection = {result: localResult, sourceLabel: 'Phân tích nhanh trên máy'};
      renderDetector();
      render();
      if (controller.signal.aborted || error.name === 'AbortError') {
        setStatus('AI Detector phản hồi quá lâu; đang hiển thị kết quả phân tích nhanh trên máy.');
      } else {
        setStatus((error.message || 'Không kết nối được AI.') + ' Đang hiển thị kết quả phân tích nhanh trên máy.');
      }
    } finally {
      clearTimeout(timeout);
      if (pending === controller) {
        pending = null;
        activeMode = 'grammar';
        setBusy(false);
      }
    }
  }

  detectBtn?.addEventListener('click', runAiDetector);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || composing) return;
    const text = draft.value;
    if (!han.test(text)) {
      setStatus('Nhập câu hoặc đoạn văn tiếng Trung cần sửa.');
      draft.focus();
      return;
    }
    if (navigator.onLine === false) {
      setStatus('Kiểm tra bằng AI cần kết nối mạng. Văn bản vẫn ở đây.');
      return;
    }
    const user = window.HSKAccountDashboard?.user;
    if (!user?.uid) {
      setStatus('Đăng nhập để kiểm tra văn bản bằng AI.');
      return;
    }
    const aiParams = buildAiRequestParams();
    const controller = new AbortController();
    pending = controller;
    activeMode = 'grammar';
    setBusy(true);
    setStatus('AI đang kiểm tra ngữ pháp và cách diễn đạt…');
    const timeout = setTimeout(() => controller.abort(), 185000);
    try {
      const configResponse = await fetch('./translation-config.json', {signal: controller.signal, cache: 'no-store'});
      if (!configResponse.ok) throw Error('Dịch vụ AI chưa sẵn sàng.');
      const config = await configResponse.json();
      if (!config.enabled) throw Error('Dịch vụ AI chưa sẵn sàng.');
      const endpoint = new URL('/lesson-ask', config.endpoint);
      if (endpoint.protocol !== 'https:') throw Error('Dịch vụ AI chưa sẵn sàng.');

      const token = await user.getIdToken();
      if (pending !== controller) return;
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const level = Number(document.getElementById('studioTargetLevel')?.value);
      waitPhase = 'Đang chờ AI trả lời';
      renderWait();
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          question: text,
          ...aiParams,
          hsk: level >= 1 && level <= 6 ? level : 3,
          history: [],
          lesson: {id: 'sentence-editor', title: 'Sửa câu tiếng Trung', words: [], content: {mode: 'sentence-editor'}}
        })
      });
      const data = await response.json().catch(() => null);
      if (pending !== controller || draft.value !== text || window.HSKAccountDashboard?.user?.uid !== user.uid) return;
      if (!response.ok) throw Error(data?.error || 'Chưa kiểm tra được văn bản. Hãy thử lại.');
      const review = window.HSKSentenceReview.normalize(data, text);
      if (!review) throw Error('AI chưa trả được gợi ý có vị trí sửa. Hãy bấm kiểm tra lại.');
      const {provider, model} = sourceLabel(data, response);
      suggestions = review.suggestions.map(edit => ({...edit, provider}));
      dismissed.clear();
      setStatus(review.summary + (provider ? ' Nguồn: ' + provider + (model ? ' · ' + model : '') + '.' : ''));
      render();
    } catch (error) {
      if (pending !== controller) return;
      if (controller.signal.aborted || error.name === 'AbortError') setStatus('AI xử lý quá lâu. Hãy thử lại.');
      else if (error instanceof TypeError) setStatus('Không kết nối được dịch vụ AI. Kiểm tra mạng rồi thử lại.');
      else setStatus(error.message || 'Chưa kiểm tra được văn bản. Hãy thử lại.');
    } finally {
      clearTimeout(timeout);
      if (pending === controller) {
        pending = null;
        activeMode = 'grammar';
        setBusy(false);
      }
    }
  });

  renderDetector();
  render();
})();
