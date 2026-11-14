(() => {
  'use strict';

  const panel = document.getElementById('sentenceEditor');
  if (!panel) return;
  const form = panel.querySelector('form');
  const draft = panel.querySelector('textarea');
  const submit = form.querySelector('[type="submit"]');
  const providerSelect = form.querySelector('#sentenceAiProvider');
  const thinkingSelect = form.querySelector('#sentenceAiThinking');
  const detectBtn = panel.querySelector('#sentenceAiDetectBtn');
  const detectorPanel = panel.querySelector('#sentenceAiDetector');
  const detectorRunBtn = panel.querySelector('#sentenceDetectorRunBtn');
  const detectorHint = panel.querySelector('#sentenceDetectorHint');
  const reviewAside = panel.querySelector('.sentence-review');
  const toolHeading = panel.querySelector('#sentenceToolHeading');
  const toolSubtitle = panel.querySelector('#sentenceToolSubtitle');
  const filtersBox = panel.querySelector('.sentence-filters');
  const railButtons = [...panel.querySelectorAll('[data-sentence-tool]')];
  const toolPanes = [...panel.querySelectorAll('[data-sentence-pane]')];
  const bulkBar = panel.querySelector('.sentence-bulk-bar');
  const applyAllBtn = panel.querySelector('.sentence-apply-all');
  const rewriteStyleBtns = [...panel.querySelectorAll('[data-rewrite-style]')];
  const rewriteRunBtn = panel.querySelector('#sentenceRewriteRunBtn');
  const rewriteOutput = panel.querySelector('#sentenceRewriteOutput');
  const qaChipBtns = [...panel.querySelectorAll('[data-qa-preset]')];
  const qaInput = panel.querySelector('#sentenceQaInput');
  const qaSendBtn = panel.querySelector('#sentenceQaSendBtn');
  const qaThread = panel.querySelector('#sentenceQaThread');
  const statsBody = panel.querySelector('#sentenceStatsBody');
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
  const TOOL_META = Object.freeze({
    grammar: { title: 'Gợi ý chỉnh sửa · HSK 1–6', subtitle: 'Sửa ngữ pháp & cách diễn đạt', defaultStatus: initialStatus },
    detector: { title: 'AI Detector', subtitle: 'Phát hiện văn bản AI & nguyên nhân', defaultStatus: 'Bấm Quét dấu hiệu AI để phân tích văn bản đang dán.' },
    rewrite: { title: 'Viết lại & Tự nhiên hóa', subtitle: 'Paraphrase · Giữ nguyên văn bản đang dán', defaultStatus: 'Chọn phong cách rồi bấm Viết lại đoạn văn.' },
    ask: { title: 'Hỏi nhanh AI về bài viết', subtitle: 'Dịch, giải thích ngữ pháp & chấm mức HSK', defaultStatus: 'Đặt câu hỏi hoặc chọn gợi ý nhanh cho văn bản đang dán.' },
    stats: { title: 'Thống kê văn bản', subtitle: 'Đếm chữ Hán, câu & nhịp độ tự nhiên', defaultStatus: 'Thống kê cập nhật tức thì theo văn bản đang dán.' }
  });
  const REWRITE_STYLE_LABELS = Object.freeze({
    natural: 'Tự nhiên như người bản xứ (thoát văn AI)',
    formal: 'Trang trọng, chuẩn văn viết HSK',
    concise: 'Ngắn gọn, súc tích, rõ ý'
  });
  const han = /\p{Script=Han}/u;

  let suggestions = [];
  let filter = 'all';
  let pending = null;
  let detection = null;
  let detectorCollapsed = false;
  let detectorWhyOpen = true;
  let detectorSpansOpen = true;
  let activeMode = 'grammar';
  let activeTool = 'grammar';
  let rewriteStyle = 'natural';
  let rewriteResult = null;
  let qaMessages = [];
  const toolStatuses = {
    grammar: TOOL_META.grammar.defaultStatus,
    detector: TOOL_META.detector.defaultStatus,
    rewrite: TOOL_META.rewrite.defaultStatus,
    ask: TOOL_META.ask.defaultStatus,
    stats: TOOL_META.stats.defaultStatus
  };
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

  function setStatus(message, tool = activeTool) {
    if (Object.hasOwn(toolStatuses, tool)) toolStatuses[tool] = message;
    if (tool === activeTool) status.textContent = message;
  }

  function setBusy(busy) {
    waitLabel.hidden = !busy;
    if (busy) {
      waitStarted = performance.now();
      waitPhase = activeMode === 'detect'
        ? 'Đang phân tích AI Detector'
        : activeMode === 'rewrite'
          ? 'Đang viết lại đoạn văn'
          : activeMode === 'ask'
            ? 'Đang hỏi AI về bài viết'
            : 'Đang kết nối';
      startThinkingIndicator(activeProviderLabel());
      renderWait(0, 0);
    } else {
      stopThinkingIndicator();
    }
    submit.disabled = busy;
    if (detectorRunBtn) detectorRunBtn.disabled = busy;
    if (rewriteRunBtn) rewriteRunBtn.disabled = busy;
    if (qaSendBtn) qaSendBtn.disabled = busy;
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
      detectorPanel.classList.remove('is-collapsed');
      return;
    }
    detectorPanel.hidden = false;
    detectorPanel.classList.toggle('is-collapsed', detectorCollapsed);
    const {result, sourceLabel: src} = detection;
    const humanPct = Math.max(0, Math.min(100, Number(result.humanProbability ?? (100 - (result.aiProbability || 0))) || 0));
    const aiPct = Math.max(0, Math.min(100, Number(result.aiProbability ?? (100 - humanPct)) || 0));

    const head = document.createElement('header');
    head.className = 'sentence-detector-head';
    const badge = document.createElement('span');
    badge.className = 'sentence-detector-verdict';
    badge.dataset.verdict = result.verdict;
    badge.textContent = result.verdictLabel;

    const toggleBtn = button(detectorCollapsed ? 'Mở rộng ▾' : 'Thu gọn ▴', 'sentence-detector-close', () => {
      detectorCollapsed = !detectorCollapsed;
      renderDetector();
      render();
    });
    toggleBtn.setAttribute('aria-expanded', String(!detectorCollapsed));
    toggleBtn.setAttribute('aria-label', detectorCollapsed ? 'Mở rộng bảng AI Detector' : 'Thu gọn bảng AI Detector');
    head.append(badge);
    if (detectorCollapsed) {
      const compactPct = document.createElement('span');
      compactPct.className = 'sentence-detector-compact-pct';
      compactPct.textContent = `${humanPct}% Người · ${aiPct}% AI`;
      head.append(compactPct);
    }
    head.append(toggleBtn);

    const meter = document.createElement('div');
    meter.className = 'sentence-detector-meter';
    meter.setAttribute('aria-hidden', 'true');
    const humanFill = document.createElement('span');
    humanFill.className = 'sentence-detector-meter-human';
    humanFill.style.width = `${humanPct}%`;
    const aiFill = document.createElement('span');
    aiFill.className = 'sentence-detector-meter-ai';
    aiFill.style.width = `${aiPct}%`;
    meter.append(humanFill, aiFill);

    if (detectorCollapsed) {
      detectorPanel.append(head, meter);
      return;
    }

    const legend = document.createElement('div');
    legend.className = 'sentence-detector-legend';
    const humanLeg = document.createElement('span');
    humanLeg.className = 'sentence-detector-legend-item is-human';
    humanLeg.textContent = `Người: ${humanPct}%`;
    const aiLeg = document.createElement('span');
    aiLeg.className = 'sentence-detector-legend-item is-ai';
    aiLeg.textContent = `AI: ${aiPct}%`;
    legend.append(humanLeg, aiLeg);

    const meta = document.createElement('p');
    meta.className = 'sentence-detector-meta';
    meta.textContent = `Độ tin cậy: ${result.confidence}` + (src ? ` · ${src}` : '');

    const whyBox = document.createElement('details');
    whyBox.className = 'sentence-detector-why';
    whyBox.open = detectorWhyOpen;
    whyBox.addEventListener('toggle', () => { detectorWhyOpen = whyBox.open; });
    const whySummary = document.createElement('summary');
    whySummary.className = 'sentence-detector-why-summary';
    const whyTitle = document.createElement('strong');
    whyTitle.className = 'sentence-detector-why-title';
    whyTitle.textContent = aiPct >= 38 ? 'Vì sao văn bản này giống AI?' : 'Vì sao văn bản này giống người viết?';
    const whyChevron = document.createElement('span');
    whyChevron.className = 'sentence-detector-accordion-chevron';
    whyChevron.setAttribute('aria-hidden', 'true');
    whyChevron.textContent = '▾';
    whySummary.append(whyTitle, whyChevron);

    const whyBody = document.createElement('div');
    whyBody.className = 'sentence-detector-why-body';
    const summary = document.createElement('p');
    summary.className = 'sentence-detector-summary';
    summary.textContent = result.summary;
    whyBody.append(summary);
    if (Array.isArray(result.signals) && result.signals.length) {
      const list = document.createElement('ul');
      list.className = 'sentence-detector-signals';
      for (const item of result.signals) {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
      }
      whyBody.append(list);
    }
    whyBox.append(whySummary, whyBody);

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

    detectorPanel.append(head, meter, legend, meta, whyBox, metrics);

    if (Array.isArray(result.flaggedSpans) && result.flaggedSpans.length) {
      const spansWrap = document.createElement('details');
      spansWrap.className = 'sentence-detector-spans';
      spansWrap.open = detectorSpansOpen;
      spansWrap.addEventListener('toggle', () => { detectorSpansOpen = spansWrap.open; });
      const spansSummary = document.createElement('summary');
      spansSummary.className = 'sentence-detector-spans-summary';
      const spansTitle = document.createElement('strong');
      spansTitle.className = 'sentence-detector-spans-title';
      spansTitle.textContent = `Đoạn có dấu hiệu khuôn mẫu / AI (${result.flaggedSpans.length}):`;
      const spansChevron = document.createElement('span');
      spansChevron.className = 'sentence-detector-accordion-chevron';
      spansChevron.setAttribute('aria-hidden', 'true');
      spansChevron.textContent = '▾';
      spansSummary.append(spansTitle, spansChevron);
      const spansBody = document.createElement('div');
      spansBody.className = 'sentence-detector-spans-body';

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
        spansBody.append(row);
      }
      spansWrap.append(spansSummary, spansBody);
      detectorPanel.append(spansWrap);
    }
  }

  function updateRailBadges() {
    for (const badge of panel.querySelectorAll('[data-tool-badge]')) {
      const tool = badge.dataset.toolBadge;
      let text = '';
      if (tool === 'grammar') {
        const n = visibleSuggestions().length;
        if (n > 0) text = String(n);
      } else if (tool === 'detector' && detection?.result) {
        const aiPct = Math.max(0, Math.min(100, Number(detection.result.aiProbability) || 0));
        text = aiPct + '%';
      } else if (tool === 'rewrite' && rewriteResult?.rewrittenText) {
        text = '✓';
      } else if (tool === 'ask') {
        const replies = qaMessages.filter(m => m.role === 'assistant').length;
        if (replies > 0) text = String(replies);
      }
      badge.textContent = text;
      badge.hidden = !text;
    }
  }

  function renderStats() {
    if (!statsBody) return;
    const text = draft.value;
    const hanMatches = text.match(/\p{Script=Han}/gu) || [];
    const hanCount = hanMatches.length;
    const uniqueHan = new Set(hanMatches).size;
    const sentences = text.split(/[。！？!?；;\n]+/u).map(s => s.trim()).filter(s => /\p{Script=Han}|[A-Za-z0-9]/u.test(s));
    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const avgChars = sentences.length ? Math.round(hanCount / sentences.length) : 0;
    const readSec = hanCount ? Math.max(2, Math.round((hanCount / 260) * 60)) : 0;
    const readLabel = readSec >= 60 ? `${Math.floor(readSec / 60)} phút ${readSec % 60} giây` : `${readSec} giây`;
    const pct = Math.min(100, Math.round((text.length / (draft.maxLength || 5000)) * 100));
    const localMetrics = hanCount && window.HSKSentenceReview?.analyzeAiLikelihood
      ? window.HSKSentenceReview.analyzeAiLikelihood(text).metrics
      : null;

    statsBody.replaceChildren();
    const progressWrap = document.createElement('div');
    progressWrap.className = 'sentence-stats-progress';
    const progressFill = document.createElement('div');
    progressFill.className = 'sentence-stats-progress-fill';
    progressFill.style.width = `${pct}%`;
    progressWrap.append(progressFill);

    const grid = document.createElement('div');
    grid.className = 'sentence-stats-grid';
    const items = [
      [text.length.toLocaleString('vi-VN'), `Tổng ký tự (/ ${(draft.maxLength || 5000).toLocaleString('vi-VN')})`],
      [hanCount.toLocaleString('vi-VN'), 'Tổng chữ Hán (Hanzi)'],
      [uniqueHan.toLocaleString('vi-VN'), 'Chữ Hán khác nhau'],
      [String(sentences.length), `Số câu · ${paragraphs.length} đoạn`],
      [avgChars ? `${avgChars} chữ` : '0', 'Trung bình mỗi câu'],
      [hanCount ? readLabel : '0 giây', 'Thời gian đọc ước tính']
    ];
    if (localMetrics) {
      items.push(
        [`${localMetrics.naturalness}/100`, 'Điểm tự nhiên sơ bộ'],
        [`${localMetrics.burstiness}/100`, 'Độ biến thiên nhịp câu']
      );
    }
    for (const [valText, lblText] of items) {
      const card = document.createElement('div');
      card.className = 'sentence-stat-card';
      const strong = document.createElement('strong');
      strong.textContent = valText;
      const span = document.createElement('span');
      span.textContent = lblText;
      card.append(strong, span);
      grid.append(card);
    }
    statsBody.append(progressWrap, grid);
  }

  function renderRewrite() {
    if (!rewriteOutput) return;
    for (const btn of rewriteStyleBtns) {
      btn.setAttribute('aria-pressed', String(btn.dataset.rewriteStyle === rewriteStyle));
    }
    rewriteOutput.replaceChildren();
    if (!rewriteResult?.rewrittenText) {
      rewriteOutput.hidden = true;
      return;
    }
    rewriteOutput.hidden = false;
    const card = document.createElement('article');
    card.className = 'sentence-rewrite-card';
    const meta = document.createElement('div');
    meta.className = 'sentence-rewrite-meta';
    meta.textContent = `${REWRITE_STYLE_LABELS[rewriteResult.style] || 'Viết lại'}` + (rewriteResult.sourceLabel ? ` · ${rewriteResult.sourceLabel}` : '');

    const textBox = document.createElement('p');
    textBox.className = 'sentence-rewrite-text';
    textBox.lang = 'zh';
    textBox.textContent = rewriteResult.rewrittenText;

    card.append(meta, textBox);
    if (rewriteResult.notes) {
      const notes = document.createElement('p');
      notes.className = 'sentence-rewrite-notes';
      notes.textContent = rewriteResult.notes;
      card.append(notes);
    }

    const actions = document.createElement('div');
    actions.className = 'sentence-rewrite-actions';
    actions.append(
      button('Áp dụng vào bài viết', 'sentence-apply', () => applyRewriteText(rewriteResult.rewrittenText)),
      button('Sao chép', 'sentence-locate', async () => {
        try {
          await navigator.clipboard?.writeText?.(rewriteResult.rewrittenText);
          setStatus('Đã sao chép bản viết lại.', 'rewrite');
        } catch {
          setStatus('Không tự sao chép được; hãy bôi đen đoạn viết lại để copy.', 'rewrite');
        }
      })
    );
    card.append(actions);
    rewriteOutput.append(card);
  }

  function renderQa() {
    if (!qaThread) return;
    qaThread.replaceChildren();
    for (const msg of qaMessages) {
      const box = document.createElement('div');
      box.className = 'sentence-qa-msg';
      box.dataset.role = msg.role;
      const meta = document.createElement('span');
      meta.className = 'sentence-qa-msg-meta';
      meta.textContent = msg.role === 'user' ? 'Bạn' : ('AI' + (msg.sourceLabel ? ' · ' + msg.sourceLabel : ''));
      const body = document.createElement('div');
      body.textContent = msg.text;
      box.append(meta, body);
      qaThread.append(box);
    }
  }

  function setActiveTool(nextTool) {
    if (!Object.hasOwn(TOOL_META, nextTool)) return;
    activeTool = nextTool;
    if (reviewAside) reviewAside.dataset.activeTool = nextTool;
    const meta = TOOL_META[nextTool];
    if (toolHeading) toolHeading.textContent = meta.title;
    if (toolSubtitle) toolSubtitle.textContent = meta.subtitle;
    if (filtersBox) filtersBox.hidden = nextTool !== 'grammar';
    for (const btn of railButtons) {
      const isActive = btn.dataset.sentenceTool === nextTool;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.setAttribute('aria-selected', String(isActive));
    }
    for (const pane of toolPanes) {
      pane.hidden = pane.dataset.sentencePane !== nextTool;
    }
    status.textContent = toolStatuses[nextTool] || meta.defaultStatus;
    if (nextTool === 'detector') renderDetector();
    else if (nextTool === 'rewrite') renderRewrite();
    else if (nextTool === 'ask') renderQa();
    else if (nextTool === 'stats') renderStats();
    render();
  }

  function render() {
    undo.disabled = !undoStack.length;
    example.hidden = Boolean(draft.value.trim());
    count.textContent = draft.value.length + ' / ' + draft.maxLength + ' ký tự';
    if (detectorHint) detectorHint.hidden = Boolean(detection?.result);
    if (detectorRunBtn) detectorRunBtn.textContent = detection?.result ? 'Quét lại bằng AI' : 'Quét dấu hiệu AI';
    mirror.replaceChildren();
    cards.replaceChildren();

    const text = draft.value;
    const rawEdits = visibleSuggestions();
    const edits = [];
    let lastEnd = 0;
    for (const edit of rawEdits) {
      if (edit.start < lastEnd) continue;
      edits.push(edit);
      lastEnd = edit.end;
    }
    const rawFlags = (activeTool === 'detector' && !detectorCollapsed && detection?.result?.flaggedSpans?.length)
      ? detection.result.flaggedSpans
      : [];
    const flagSpans = rawFlags.filter(span =>
      span.start >= 0 && span.end > span.start && span.end <= text.length && text.slice(span.start, span.end) === span.text
    );
    const grammarEditsForMirror = activeTool === 'detector' ? [] : edits;

    const bounds = new Set([0, text.length]);
    for (const edit of grammarEditsForMirror) {
      bounds.add(edit.start);
      bounds.add(edit.end);
    }
    for (const span of flagSpans) {
      bounds.add(span.start);
      bounds.add(span.end);
    }
    const points = [...bounds].sort((a, b) => a - b);
    let renderedAiFlags = 0;

    const appendInsertionsAt = pos => {
      for (const edit of grammarEditsForMirror) {
        if (edit.start !== edit.end || edit.start !== pos) continue;
        const insMark = document.createElement('mark');
        insMark.dataset.kind = edit.kind;
        insMark.dataset.source = 'ai';
        insMark.dataset.insertion = 'true';
        insMark.textContent = '\u200b';
        mirror.append(insMark);
      }
    };

    for (let i = 0; i < points.length - 1; i++) {
      const segStart = points[i];
      const segEnd = points[i + 1];
      appendInsertionsAt(segStart);
      if (segStart >= segEnd) continue;
      const edit = grammarEditsForMirror.find(item => item.start < item.end && item.start <= segStart && item.end >= segEnd);
      const flag = flagSpans.find(item => item.start <= segStart && item.end >= segEnd);
      const slice = text.slice(segStart, segEnd);
      if (!edit && !flag) {
        mirror.append(slice);
        continue;
      }
      const mark = document.createElement('mark');
      if (edit) {
        mark.dataset.kind = edit.kind;
        mark.dataset.source = 'ai';
        mark.dataset.insertion = 'false';
      } else {
        mark.dataset.kind = 'ai-flag';
        mark.dataset.source = 'detector';
      }
      if (flag) {
        mark.dataset.aiFlag = 'true';
        renderedAiFlags++;
      }
      mark.textContent = slice;
      mirror.append(mark);
    }
    appendInsertionsAt(text.length);
    mirror.append('\n');
    panel.classList.toggle('is-ai-highlight', renderedAiFlags > 0);
    syncScroll();

    if (bulkBar && applyAllBtn) {
      bulkBar.hidden = edits.length < 2;
      applyAllBtn.textContent = `Sửa toàn bộ (${edits.length} gợi ý)`;
    }

    for (const edit of edits) {
      if (filter === 'all' || edit.kind === filter) cards.append(makeCard(edit));
    }
    if (edits.length && !cards.children.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Không có gợi ý thuộc nhóm này.';
      cards.append(empty);
    }
    updateRailBadges();
    renderStats();
  }

  function showRemaining() {
    const remaining = visibleSuggestions().length;
    setStatus(remaining ? 'Còn ' + remaining + ' gợi ý từ lần kiểm tra này.' : 'Đã xem hết gợi ý. Bạn có thể kiểm tra lại văn bản bằng AI.', 'grammar');
  }

  function resetForInput() {
    cancelPending();
    suggestions = [];
    detection = null;
    rewriteResult = null;
    qaMessages = [];
    dismissed.clear();
    undoStack = [];
    toolStatuses.grammar = TOOL_META.grammar.defaultStatus;
    toolStatuses.detector = TOOL_META.detector.defaultStatus;
    toolStatuses.rewrite = TOOL_META.rewrite.defaultStatus;
    toolStatuses.ask = TOOL_META.ask.defaultStatus;
    toolStatuses.stats = TOOL_META.stats.defaultStatus;
    status.textContent = toolStatuses[activeTool] || initialStatus;
    renderDetector();
    renderRewrite();
    renderQa();
    render();
  }

  function applySuggestion(edit) {
    if (!isCurrent(edit)) {
      resetForInput();
      return;
    }
    const delta = edit.replacement.length - edit.original.length;
    if (draft.value.length + delta > draft.maxLength) {
      setStatus('Áp dụng gợi ý này sẽ vượt giới hạn ' + draft.maxLength + ' ký tự.', 'grammar');
      return;
    }
    cancelPending();
    detection = null;
    renderDetector();
    undoStack.push({text: draft.value, suggestions, dismissed: new Set(dismissed), status: toolStatuses.grammar});
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

  function applyAllSuggestions() {
    const rawEdits = visibleSuggestions();
    const nonOverlapping = [];
    let lastEnd = 0;
    for (const edit of rawEdits) {
      if (edit.start < lastEnd || !isCurrent(edit)) continue;
      nonOverlapping.push(edit);
      lastEnd = edit.end;
    }
    if (!nonOverlapping.length) return;
    const totalDelta = nonOverlapping.reduce((acc, edit) => acc + (edit.replacement.length - edit.original.length), 0);
    if (draft.value.length + totalDelta > draft.maxLength) {
      setStatus('Áp dụng tất cả gợi ý sẽ vượt giới hạn ' + draft.maxLength + ' ký tự.', 'grammar');
      return;
    }
    cancelPending();
    detection = null;
    renderDetector();
    undoStack.push({text: draft.value, suggestions, dismissed: new Set(dismissed), status: toolStatuses.grammar});
    if (undoStack.length > 20) undoStack.shift();
    for (let i = nonOverlapping.length - 1; i >= 0; i--) {
      const edit = nonOverlapping[i];
      draft.setRangeText(edit.replacement, edit.start, edit.end, 'end');
    }
    const appliedSet = new Set(nonOverlapping);
    suggestions = suggestions.filter(item => !appliedSet.has(item));
    dismissed.clear();
    render();
    setStatus(`Đã áp dụng ${nonOverlapping.length} gợi ý sửa câu.`, 'grammar');
  }

  function applyRewriteText(nextText) {
    if (!nextText || typeof nextText !== 'string') return;
    if (nextText.length > draft.maxLength) {
      setStatus('Bản viết lại vượt giới hạn ' + draft.maxLength + ' ký tự.', 'rewrite');
      return;
    }
    cancelPending();
    undoStack.push({text: draft.value, suggestions, dismissed: new Set(dismissed), status: toolStatuses.grammar});
    if (undoStack.length > 20) undoStack.shift();
    draft.value = nextText;
    suggestions = [];
    detection = null;
    dismissed.clear();
    toolStatuses.grammar = 'Đã áp dụng bản viết lại. Bạn có thể Hoàn tác hoặc kiểm tra ngữ pháp lại.';
    renderDetector();
    render();
    setStatus('Đã áp dụng bản viết lại vào bài viết bên trái. Có thể bấm Hoàn tác nếu muốn khôi phục.', 'rewrite');
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
    setStatus(previous.status, 'grammar');
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
    const pickerParams = window.HSKAiProviderPicker?.getActiveAiParams?.(thinkingSelect) || null;
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
    const chosen = (saved && saved !== 'auto' && providerChoices.has(saved))
      ? saved
      : (pickerId && providerChoices.has(pickerId) ? pickerId : 'auto');
    syncingProvider = true;
    providerSelect.value = chosen;
    if (chosen !== 'auto' && window.HSKAiProviderPicker?.setSelectionFromSelect && window.HSKAiProviderPicker.selectedId?.() !== chosen) {
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
      setStatus(TOOL_META[activeTool]?.defaultStatus || initialStatus, activeTool);
    } else if (!panel.hidden) {
      window.dispatchEvent(new CustomEvent('hsk-sentence-editor-open'));
    }
  }).observe(panel, {attributes: true, attributeFilter: ['hidden']});

  function parseRewriteOutput(raw) {
    const text = String(raw || '').trim();
    if (!text) return { rewrittenText: '', notes: '' };
    const tagMatch = text.match(/\[\[REWRITE\]\]([\s\S]*?)\[\[\/REWRITE\]\]/i);
    if (tagMatch) {
      const rewrittenText = tagMatch[1].trim();
      const notes = text.replace(tagMatch[0], '').trim();
      return { rewrittenText, notes };
    }
    const fenceMatch = text.match(/```(?:zh|chinese|text)?\s*([\s\S]*?)```/i);
    if (fenceMatch && han.test(fenceMatch[1])) {
      const rewrittenText = fenceMatch[1].trim();
      const notes = text.replace(fenceMatch[0], '').trim();
      return { rewrittenText, notes };
    }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const firstChineseLine = lines.find(line => han.test(line));
    return {
      rewrittenText: firstChineseLine || text,
      notes: firstChineseLine && lines.length > 1 ? lines.filter(l => l !== firstChineseLine).join('\n') : ''
    };
  }

  async function requestLessonAsk(bodyPayload, controller) {
    const configResponse = await fetch('./translation-config.json', {signal: controller.signal, cache: 'no-store'});
    if (!configResponse.ok) throw Error('Dịch vụ AI chưa sẵn sàng.');
    const config = await configResponse.json();
    if (!config.enabled) throw Error('Dịch vụ AI chưa sẵn sàng.');
    const endpoint = new URL('/lesson-ask', config.endpoint);
    if (endpoint.protocol !== 'https:') throw Error('Dịch vụ AI chưa sẵn sàng.');

    const user = window.HSKAccountDashboard?.user;
    if (!user?.uid) throw Error('Đăng nhập để sử dụng tính năng AI này.');
    const token = await user.getIdToken();
    if (pending !== controller) return null;
    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
      body: JSON.stringify(bodyPayload)
    });
    const data = await response.json().catch(() => null);
    return { response, data, uid: user.uid };
  }

  async function runAiDetector() {
    if (pending || composing) return;
    const text = draft.value;
    if (!han.test(text)) {
      setStatus('Nhập câu hoặc đoạn văn tiếng Trung để phân tích dấu hiệu AI.', 'detector');
      draft.focus();
      return;
    }
    const localResult = window.HSKSentenceReview.analyzeAiLikelihood(text);
    detectorCollapsed = false;
    detectorWhyOpen = true;
    detectorSpansOpen = true;
    const user = window.HSKAccountDashboard?.user;
    if (navigator.onLine === false || !user?.uid) {
      detection = {
        result: localResult,
        sourceLabel: navigator.onLine === false ? 'Phân tích văn phong offline' : 'Phân tích nhanh trên máy (đăng nhập để kiểm tra AI sâu)'
      };
      setStatus(localResult.summary, 'detector');
      renderDetector();
      render();
      return;
    }

    const aiParams = buildAiRequestParams();
    const controller = new AbortController();
    pending = controller;
    activeMode = 'detect';
    setBusy(true);
    setStatus('AI Detector đang phân tích dấu hiệu AI trong văn bản tiếng Trung…', 'detector');
    const timeout = setTimeout(() => controller.abort(), 185000);
    try {
      const level = Number(document.getElementById('studioTargetLevel')?.value);
      waitPhase = 'Đang chờ AI Detector trả lời';
      renderWait();
      const res = await requestLessonAsk({
        question: text,
        ...aiParams,
        hsk: level >= 1 && level <= 6 ? level : 3,
        history: [],
        lesson: {id: 'sentence-editor', title: 'Kiểm tra dấu hiệu AI tiếng Trung', words: [], content: {mode: 'sentence-ai-detect'}}
      }, controller);
      if (!res || pending !== controller || draft.value !== text || window.HSKAccountDashboard?.user?.uid !== res.uid) return;
      const { response, data } = res;
      if (!response.ok) throw Error(data?.error || 'Không phân tích sâu được, dùng kết quả phân tích nhanh trên máy.');
      const detected = window.HSKSentenceReview.normalizeAiDetection(data, text) || localResult;
      const {provider, model} = sourceLabel(data || {}, response);
      const fbFrom = typeof data?.fallbackFrom === 'string' && providerNames[data.fallbackFrom] ? providerNames[data.fallbackFrom] : '';
      const srcLabel = provider ? provider + (model ? ' · ' + model : '') + (fbFrom ? ` (dự phòng từ ${fbFrom})` : '') : 'HSK AI + Văn phong';
      detection = {result: detected, sourceLabel: srcLabel};
      setStatus(detected.summary + (provider ? ' Nguồn: ' + srcLabel + '.' : ''), 'detector');
      renderDetector();
      render();
    } catch (error) {
      if (pending !== controller) return;
      detection = {result: localResult, sourceLabel: 'Phân tích nhanh trên máy'};
      renderDetector();
      render();
      if (controller.signal.aborted || error.name === 'AbortError') {
        setStatus('AI Detector phản hồi quá lâu; đang hiển thị kết quả phân tích nhanh trên máy.', 'detector');
      } else {
        setStatus((error.message || 'Không kết nối được AI.') + ' Đang hiển thị kết quả phân tích nhanh trên máy.', 'detector');
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

  async function runRewrite() {
    if (pending || composing) return;
    const text = draft.value;
    if (!han.test(text)) {
      setStatus('Nhập đoạn văn tiếng Trung bên trái trước khi viết lại.', 'rewrite');
      draft.focus();
      return;
    }
    if (navigator.onLine === false) {
      setStatus('Viết lại bằng AI cần kết nối mạng. Văn bản vẫn được giữ nguyên.', 'rewrite');
      return;
    }
    const user = window.HSKAccountDashboard?.user;
    if (!user?.uid) {
      setStatus('Đăng nhập để dùng tính năng Viết lại bằng AI.', 'rewrite');
      return;
    }
    const aiParams = buildAiRequestParams();
    const styleDesc = REWRITE_STYLE_LABELS[rewriteStyle] || REWRITE_STYLE_LABELS.natural;
    const prompt = `Trong learning_snapshot.draft_chinese là bài viết tiếng Trung. Hãy viết lại hoàn chỉnh đoạn văn đó bằng tiếng Trung theo phong cách "${styleDesc}", giữ đúng ý chính. Đặt trọn đoạn tiếng Trung đã viết lại vào cặp thẻ [[REWRITE]]...[[/REWRITE]] rồi giải thích ngắn các cải thiện bằng tiếng Việt.`;
    const controller = new AbortController();
    pending = controller;
    activeMode = 'rewrite';
    setBusy(true);
    setStatus('AI đang viết lại đoạn văn theo phong cách đã chọn…', 'rewrite');
    const timeout = setTimeout(() => controller.abort(), 185000);
    try {
      const level = Number(document.getElementById('studioTargetLevel')?.value);
      waitPhase = 'Đang viết lại đoạn văn';
      renderWait();
      const res = await requestLessonAsk({
        question: prompt.slice(0, 490),
        ...aiParams,
        hsk: level >= 1 && level <= 6 ? level : 3,
        history: [],
        lesson: {
          id: 'sentence-editor',
          title: 'Viết lại câu tiếng Trung',
          words: [],
          content: {mode: 'ai-qa', learning_snapshot: {task: 'chinese_sentence_rewrite', style: rewriteStyle, draft_chinese: text}}
        }
      }, controller);
      if (!res || pending !== controller || draft.value !== text || window.HSKAccountDashboard?.user?.uid !== res.uid) return;
      const { response, data } = res;
      if (!response.ok) throw Error(data?.error || 'Chưa viết lại được văn bản. Hãy thử lại.');
      const parsed = parseRewriteOutput(data?.answer || '');
      if (!parsed.rewrittenText || !han.test(parsed.rewrittenText)) {
        throw Error('AI chưa trả được đoạn tiếng Trung viết lại. Hãy thử lại.');
      }
      const {provider, model} = sourceLabel(data || {}, response);
      const srcLabel = provider ? provider + (model ? ' · ' + model : '') : 'HSK AI';
      rewriteResult = { style: rewriteStyle, rewrittenText: parsed.rewrittenText, notes: parsed.notes, sourceLabel: srcLabel };
      setStatus('Đã tạo bản viết lại. Bạn có thể bấm Áp dụng vào bài viết hoặc chuyển tab khác.', 'rewrite');
      renderRewrite();
      updateRailBadges();
    } catch (error) {
      if (pending !== controller) return;
      setStatus(controller.signal.aborted || error.name === 'AbortError' ? 'AI xử lý quá lâu. Hãy thử lại.' : (error.message || 'Chưa viết lại được văn bản.'), 'rewrite');
    } finally {
      clearTimeout(timeout);
      if (pending === controller) {
        pending = null;
        activeMode = 'grammar';
        setBusy(false);
      }
    }
  }

  async function runDraftQa(rawQuestion) {
    if (pending || composing) return;
    const text = draft.value;
    const query = String(rawQuestion || '').trim();
    if (!han.test(text)) {
      setStatus('Dán đoạn văn tiếng Trung bên trái trước khi hỏi AI.', 'ask');
      draft.focus();
      return;
    }
    if (!query) {
      qaInput?.focus();
      return;
    }
    if (navigator.onLine === false) {
      setStatus('Hỏi đáp AI cần kết nối mạng. Văn bản vẫn được giữ nguyên.', 'ask');
      return;
    }
    const user = window.HSKAccountDashboard?.user;
    if (!user?.uid) {
      setStatus('Đăng nhập để hỏi AI về bài viết.', 'ask');
      return;
    }
    const aiParams = buildAiRequestParams();
    const controller = new AbortController();
    pending = controller;
    activeMode = 'ask';
    setBusy(true);
    setStatus('AI đang đọc văn bản và trả lời câu hỏi của bạn…', 'ask');
    const timeout = setTimeout(() => controller.abort(), 185000);
    try {
      const level = Number(document.getElementById('studioTargetLevel')?.value);
      waitPhase = 'Đang chờ AI trả lời';
      renderWait();
      const historyPayload = qaMessages.slice(-4).map(m => ({role: m.role, text: String(m.text || '').slice(0, 1000)}));
      const res = await requestLessonAsk({
        question: query.slice(0, 480),
        ...aiParams,
        hsk: level >= 1 && level <= 6 ? level : 3,
        history: historyPayload,
        lesson: {
          id: 'sentence-editor',
          title: 'Hỏi đáp bài viết tiếng Trung',
          words: [],
          content: {mode: 'ai-qa', learning_snapshot: {task: 'chinese_draft_qa', draft_chinese: text}}
        }
      }, controller);
      if (!res || pending !== controller || draft.value !== text || window.HSKAccountDashboard?.user?.uid !== res.uid) return;
      const { response, data } = res;
      if (!response.ok) throw Error(data?.error || 'Chưa nhận được phản hồi từ AI. Hãy thử lại.');
      const answer = String(data?.answer || '').trim();
      if (!answer) throw Error('AI chưa trả lời được câu hỏi này.');
      const {provider, model} = sourceLabel(data || {}, response);
      const srcLabel = provider ? provider + (model ? ' · ' + model : '') : 'HSK AI';
      qaMessages.push({ role: 'user', text: query }, { role: 'assistant', text: answer, sourceLabel: srcLabel });
      if (qaInput) qaInput.value = '';
      setStatus('Đã trả lời dựa trên văn bản đang dán.', 'ask');
      renderQa();
      updateRailBadges();
    } catch (error) {
      if (pending !== controller) return;
      setStatus(controller.signal.aborted || error.name === 'AbortError' ? 'AI xử lý quá lâu. Hãy thử lại.' : (error.message || 'Chưa hỏi được AI.'), 'ask');
    } finally {
      clearTimeout(timeout);
      if (pending === controller) {
        pending = null;
        activeMode = 'grammar';
        setBusy(false);
      }
    }
  }

  for (const btn of railButtons) {
    btn.addEventListener('click', () => {
      const nextTool = btn.dataset.sentenceTool;
      if (!nextTool) return;
      setActiveTool(nextTool);
      if (nextTool === 'detector' && !detection && han.test(draft.value) && !pending) {
        runAiDetector();
      }
    });
  }

  detectorRunBtn?.addEventListener('click', () => {
    setActiveTool('detector');
    runAiDetector();
  });
  applyAllBtn?.addEventListener('click', applyAllSuggestions);
  for (const btn of rewriteStyleBtns) {
    btn.addEventListener('click', () => {
      rewriteStyle = btn.dataset.rewriteStyle || 'natural';
      renderRewrite();
    });
  }
  rewriteRunBtn?.addEventListener('click', () => {
    setActiveTool('rewrite');
    runRewrite();
  });
  for (const chip of qaChipBtns) {
    chip.addEventListener('click', () => {
      const preset = chip.dataset.qaPreset || '';
      if (qaInput) qaInput.value = preset;
      setActiveTool('ask');
      runDraftQa(preset);
    });
  }
  qaSendBtn?.addEventListener('click', () => {
    setActiveTool('ask');
    runDraftQa(qaInput?.value || '');
  });
  qaInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !composing) {
      event.preventDefault();
      event.stopPropagation();
      setActiveTool('ask');
      runDraftQa(qaInput.value);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setActiveTool('grammar');
    if (pending || composing) return;
    const text = draft.value;
    if (!han.test(text)) {
      setStatus('Nhập câu hoặc đoạn văn tiếng Trung cần sửa.', 'grammar');
      draft.focus();
      return;
    }
    if (navigator.onLine === false) {
      setStatus('Kiểm tra bằng AI cần kết nối mạng. Văn bản vẫn ở đây.', 'grammar');
      return;
    }
    const user = window.HSKAccountDashboard?.user;
    if (!user?.uid) {
      setStatus('Đăng nhập để kiểm tra văn bản bằng AI.', 'grammar');
      return;
    }
    const aiParams = buildAiRequestParams();
    const controller = new AbortController();
    pending = controller;
    activeMode = 'grammar';
    setBusy(true);
    setStatus('AI đang kiểm tra ngữ pháp và cách diễn đạt…', 'grammar');
    const timeout = setTimeout(() => controller.abort(), 185000);
    try {
      const level = Number(document.getElementById('studioTargetLevel')?.value);
      waitPhase = 'Đang chờ AI trả lời';
      renderWait();
      const res = await requestLessonAsk({
        question: text,
        ...aiParams,
        hsk: level >= 1 && level <= 6 ? level : 3,
        history: [],
        lesson: {id: 'sentence-editor', title: 'Sửa câu tiếng Trung', words: [], content: {mode: 'sentence-editor'}}
      }, controller);
      if (!res || pending !== controller || draft.value !== text || window.HSKAccountDashboard?.user?.uid !== res.uid) return;
      const { response, data } = res;
      if (!response.ok) throw Error(data?.error || 'Chưa kiểm tra được văn bản. Hãy thử lại.');
      const review = window.HSKSentenceReview.normalize(data, text);
      if (!review) throw Error('AI chưa trả được gợi ý có vị trí sửa. Hãy bấm kiểm tra lại.');
      const {provider, model} = sourceLabel(data, response);
      const fbFrom = typeof data?.fallbackFrom === 'string' && providerNames[data.fallbackFrom] ? providerNames[data.fallbackFrom] : '';
      suggestions = review.suggestions.map(edit => ({...edit, provider}));
      dismissed.clear();
      setStatus(review.summary + (provider ? ' Nguồn: ' + provider + (model ? ' · ' + model : '') + (fbFrom ? ` (dự phòng vì ${fbFrom} lỗi/không kiểm tra được)` : '') + '.' : ''), 'grammar');
      render();
    } catch (error) {
      if (pending !== controller) return;
      if (controller.signal.aborted || error.name === 'AbortError') setStatus('AI xử lý quá lâu. Hãy thử lại.', 'grammar');
      else if (error instanceof TypeError) setStatus('Không kết nối được dịch vụ AI. Kiểm tra mạng rồi thử lại.', 'grammar');
      else setStatus(error.message || 'Chưa kiểm tra được văn bản. Hãy thử lại.', 'grammar');
    } finally {
      clearTimeout(timeout);
      if (pending === controller) {
        pending = null;
        activeMode = 'grammar';
        setBusy(false);
      }
    }
  });

  setActiveTool('grammar');
  renderDetector();
  render();
})();
