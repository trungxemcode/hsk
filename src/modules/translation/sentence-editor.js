(() => {
  'use strict';

  const panel = document.getElementById('sentenceEditor');
  if (!panel) return;
  const form = panel.querySelector('form');
  const draft = panel.querySelector('textarea');
  const submit = form.querySelector('[type="submit"]');
  const providerSelect = form.querySelector('#sentenceAiProvider');
  const providerChoices = new Set([...providerSelect.options].map(option => option.value));
  const providerStorageKey = () => 'hsk-sentence-ai-provider:' + (window.HSKAccountDashboard?.user?.uid || 'guest');
  const undo = panel.querySelector('.sentence-undo');
  const example = panel.querySelector('.sentence-example');
  const status = panel.querySelector('.sentence-status');
  const count = panel.querySelector('.sentence-count');
  const mirror = panel.querySelector('.sentence-mirror');
  const cards = panel.querySelector('.sentence-suggestions');
  const filters = [...panel.querySelectorAll('[data-sentence-filter]')];
  const providerNames = Object.freeze({gemini:'Gemini', xkiro:'xKiro', openai:'OpenAI', anthropic:'Claude', claude:'Claude', deepseek:'DeepSeek', fosta:'Fosta', 'chatgpt-cookie':'ChatGPT'});
  const initialStatus = status.textContent;
  const han = /\p{Script=Han}/u;

  let suggestions = [];
  let filter = 'all';
  let pending = null;
  let composing = false;
  let dismissed = new Set();
  let undoStack = [];

  function setStatus(message) {
    status.textContent = message;
  }

  function setBusy(busy) {
    submit.disabled = busy;
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

  function render() {
    undo.disabled = !undoStack.length;
    example.hidden = Boolean(draft.value.trim());
    count.textContent = draft.value.length + ' / ' + draft.maxLength + ' ký tự';
    mirror.replaceChildren();
    cards.replaceChildren();

    const edits = visibleSuggestions();
    let cursor = 0;
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
    dismissed.clear();
    undoStack = [];
    setStatus(initialStatus);
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
    setStatus(previous.status);
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
  function restoreProvider() {
    let saved;
    try { saved = localStorage.getItem(providerStorageKey()); } catch {}
    providerSelect.value = providerChoices.has(saved) ? saved : 'auto';
  }

  restoreProvider();
  providerSelect.addEventListener('change', () => {
    try { localStorage.setItem(providerStorageKey(), providerSelect.value); } catch {}
    if (pending) {
      cancelPending();
      setStatus(initialStatus);
    }
  });
  window.addEventListener('hsk-account-ready', () => {
    restoreProvider();
    resetForInput();
  });
  new MutationObserver(() => {
    if (panel.hidden && pending) {
      cancelPending();
      setStatus(initialStatus);
    }
  }).observe(panel, {attributes: true, attributeFilter: ['hidden']});

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
    const aiProvider = providerSelect.value;
    const controller = new AbortController();
    pending = controller;
    setBusy(true);
    setStatus('AI đang kiểm tra ngữ pháp và cách diễn đạt…');
    const timeout = setTimeout(() => controller.abort(), 105000);
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
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          question: text,
          ...(aiProvider !== 'auto' ? {aiProvider} : {}),
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
        setBusy(false);
      }
    }
  });

  render();
})();
