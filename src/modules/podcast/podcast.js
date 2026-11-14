(() => {
  'use strict';

  const core = window.HSKPodcastCore;
  if (!core) return;

  const PREFS_KEY = 'hsk-podcast-prefs-v1';
  const CUSTOM_EP_KEY = 'hsk-podcast-custom-v1';

  const DEFAULT_PREFS = {
    maskEnabled: true,
    maskStyle: 'solid',
    maskBottom: 4,
    maskHeight: 22,
    showZh: true,
    showPinyin: true,
    showVi: true,
    showEn: false,
    autoScroll: true,
    speed: 1
  };

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'className') node.className = v;
        else if (k === 'dataset' && typeof v === 'object') Object.assign(node.dataset, v);
        else if (k === 'hidden') node.hidden = Boolean(v);
        else if (k === 'disabled') node.disabled = Boolean(v);
        else if (k === 'checked') node.checked = Boolean(v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, String(v));
      }
    }
    for (const child of children) {
      if (child === undefined || child === null || child === false) continue;
      node.append(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
    }
    return node;
  }

  function loadJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function ensureShellMounts() {
    // 1. Add Podcast route inside Giải trí group in sidebar before studio.js clones nav
    const groups = document.querySelectorAll('.side-nav .nav-group');
    let entertainmentGroup = null;
    for (const g of groups) {
      const summary = g.querySelector('summary');
      if (summary && (summary.getAttribute('aria-label') === 'Giải trí' || summary.textContent.includes('Giải trí'))) {
        entertainmentGroup = g.querySelector('.nav-group-items') || g;
        break;
      }
    }
    if (entertainmentGroup && !entertainmentGroup.querySelector('[data-studio-go="podcast"]')) {
      const navBtn = el(
        'button',
        { type: 'button', dataset: { studioGo: 'podcast' }, 'aria-label': 'Luyện nghe Podcast' },
        el('i', { 'data-icon': 'volume-2' }),
        el('span', null, 'Luyện nghe Podcast')
      );
      entertainmentGroup.append(navBtn);
    }

    // 2. Add Home quick-access card inside #studioHome .home-music-grid
    const homeGrid = document.querySelector('#studioHome .home-music-grid');
    if (homeGrid && !homeGrid.querySelector('[data-studio-go="podcast"]')) {
      const homeCard = el(
        'button',
        { type: 'button', className: 'home-podcast-chill', dataset: { studioGo: 'podcast' } },
        el('span', { 'data-icon': 'volume-2', 'aria-hidden': 'true' }),
        el(
          'span',
          null,
          el('strong', null, 'Luyện nghe Podcast'),
          el('small', null, 'Che sub tiếng Anh · Hiện Hán – Pinyin – Việt')
        ),
        el('i', { 'data-icon': 'arrow-right', 'aria-hidden': 'true' })
      );
      const hiddenEntry = homeGrid.querySelector('.home-music-entry');
      if (hiddenEntry) hiddenEntry.before(homeCard);
      else homeGrid.append(homeCard);
    }

    // 3. Ensure #podcastPanel exists in main.workspace
    let panel = document.getElementById('podcastPanel');
    if (!panel) {
      panel = el('section', {
        id: 'podcastPanel',
        className: 'panel hub-panel podcast-panel',
        hidden: true,
        dataset: { studioHubPanel: 'podcast' }
      });
      const workspace = document.querySelector('main.workspace');
      const musicPanel = document.getElementById('musicPanel');
      if (musicPanel && musicPanel.parentNode) {
        musicPanel.after(panel);
      } else if (workspace) {
        workspace.append(panel);
      }
    }
    return panel;
  }

  const panel = ensureShellMounts();
  if (!panel) return;

  const savedPrefs = loadJsonStorage(PREFS_KEY, {});
  const state = {
    prefs: { ...DEFAULT_PREFS, ...(savedPrefs && !Array.isArray(savedPrefs) ? savedPrefs : {}) },
    customEpisodes: Array.isArray(loadJsonStorage(CUSTOM_EP_KEY, [])) ? loadJsonStorage(CUSTOM_EP_KEY, []) : [],
    levelFilter: 'all',
    currentEpisodeId: core.STARTER_EPISODES[0].id,
    cues: [],
    activeCueIdx: -1,
    playing: false,
    loopCue: false,
    currentTime: 0,
    durationSec: core.STARTER_EPISODES[0].durationSec || 40,
    ytPlayer: null,
    ytReady: false,
    ytFailed: false,
    tickerId: 0,
    lastTickMs: 0,
    pinyinLoading: false,
    importOpen: false,
    selectedWord: null,
    pendingRequest: null
  };

  function adminPodcasts() {
    const items = window.HSKResourceSync?.getManifest?.()?.podcasts || [];
    return items
      .filter((item) => item && item.access !== 'hidden')
      .map((item) => {
        const n = Number(item.level) || 3;
        const levelGroup = n <= 2 ? 'hsk1-2' : n === 3 ? 'hsk3' : n === 4 ? 'hsk4' : 'hsk5-6';
        const parsedCues = item.subtitleText ? core.parseSubtitleText(item.subtitleText) : [];
        return {
          id: `admin-${item.id}`,
          adminItem: item,
          title: item.title,
          titleVi: item.title,
          level: `HSK ${n}`,
          levelGroup,
          channel: 'Admin đề xuất',
          topic: item.access === 'vip' ? 'Chỉ VIP' : 'Podcast HSK',
          youtubeId: core.extractYoutubeId(item.youtubeUrl || ''),
          cues: parsedCues,
          note: item.note || ''
        };
      });
  }

  function allEpisodes() {
    return [...adminPodcasts(), ...state.customEpisodes, ...core.STARTER_EPISODES];
  }

  function currentEpisode() {
    return allEpisodes().find((ep) => ep.id === state.currentEpisodeId) || allEpisodes()[0];
  }

  function persistPrefs() {
    saveJsonStorage(PREFS_KEY, state.prefs);
  }

  function persistCustomEpisodes() {
    saveJsonStorage(CUSTOM_EP_KEY, state.customEpisodes.slice(0, 15));
  }

  function ensurePinyinPro() {
    if (window.pinyinPro?.pinyin) return Promise.resolve(window.pinyinPro);
    if (state.pinyinLoading) return Promise.resolve(null);
    state.pinyinLoading = true;
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src*="pinyin-pro"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.pinyinPro || null), { once: true });
        existing.addEventListener('error', () => resolve(null), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = './vendor/pinyin-pro/pinyin-pro.js';
      script.async = true;
      script.onload = () => {
        state.pinyinLoading = false;
        resolve(window.pinyinPro || null);
      };
      script.onerror = () => {
        state.pinyinLoading = false;
        resolve(null);
      };
      document.head.append(script);
    });
  }

  // ---- Build Panel DOM ----
  panel.textContent = '';

  const aiBadgeEl = el('span', { id: 'podcastAiBadge', className: 'podcast-ai-badge' }, 'AI: Tự động');
  const toggleImportBtn = el(
    'button',
    { type: 'button', id: 'podcastToggleImportBtn', className: 'podcast-cta-btn' },
    '+ Nhập YouTube / Sub tiếng Anh'
  );

  const headEl = el(
    'header',
    { className: 'podcast-head' },
    el(
      'div',
      { className: 'podcast-head-copy' },
      el('span', { className: 'podcast-eyebrow' }, 'GIẢI TRÍ · PODCAST SONG NGỮ'),
      el('h2', null, 'Luyện nghe Podcast'),
      el('p', { className: 'podcast-subtitle' }, 'Che phụ đề tiếng Anh đốt cứng ở đáy video YouTube và thay bằng phụ đề Tiếng Việt · Chữ Hán · Pinyin đồng bộ theo từng câu.')
    ),
    el('div', { className: 'podcast-head-actions' }, aiBadgeEl, toggleImportBtn)
  );

  // Import drawer
  const urlInput = el('input', {
    id: 'podcastUrlInput',
    type: 'text',
    className: 'podcast-input',
    placeholder: 'Dán link YouTube hoặc Video ID (vd: https://youtu.be/...)'
  });
  const titleInput = el('input', {
    id: 'podcastTitleInput',
    type: 'text',
    className: 'podcast-input',
    placeholder: 'Tên tập podcast (tùy chọn)'
  });
  const hskSelect = el(
    'select',
    { id: 'podcastHskSelect', className: 'podcast-select', 'aria-label': 'Trình độ HSK mục tiêu' },
    el('option', { value: '1' }, 'HSK 1'),
    el('option', { value: '2' }, 'HSK 2'),
    el('option', { value: '3', selected: 'selected' }, 'HSK 3'),
    el('option', { value: '4' }, 'HSK 4'),
    el('option', { value: '5' }, 'HSK 5'),
    el('option', { value: '6' }, 'HSK 6')
  );
  const autoFetchBtn = el(
    'button',
    { type: 'button', id: 'podcastAutoFetchBtn', className: 'podcast-sec-btn' },
    'Lấy CC YouTube & Dịch AI'
  );
  const fileInput = el('input', {
    id: 'podcastFileInput',
    type: 'file',
    accept: '.srt,.vtt,.lrc,.txt,.json',
    hidden: true
  });
  const uploadBtn = el(
    'button',
    { type: 'button', id: 'podcastUploadBtn', className: 'podcast-sec-btn' },
    'Tải tệp .srt / .vtt / .lrc'
  );
  const subInput = el('textarea', {
    id: 'podcastSubInput',
    className: 'podcast-textarea',
    rows: '5',
    placeholder: 'Dán phụ đề tiếng Anh (.srt, .vtt, .lrc, transcript YouTube có mốc thời gian hoặc văn bản từng dòng)...'
  });
  const translateBtn = el(
    'button',
    { type: 'button', id: 'podcastTranslateBtn', className: 'podcast-cta-btn' },
    'Dịch AI sang Việt + Hán · Pinyin'
  );
  const quickLoadBtn = el(
    'button',
    { type: 'button', id: 'podcastQuickLoadBtn', className: 'podcast-sec-btn' },
    'Nạp nhanh (không cần AI)'
  );
  const closeImportBtn = el(
    'button',
    { type: 'button', id: 'podcastCloseImportBtn', className: 'podcast-sec-btn' },
    'Thu gọn'
  );
  const importStatusEl = el('p', { id: 'podcastImportStatus', className: 'podcast-status', role: 'status' }, '');

  const importBox = el(
    'section',
    { id: 'podcastImportBox', className: 'podcast-import-box', hidden: true, 'aria-label': 'Nhập video YouTube và phụ đề' },
    el('div', { className: 'podcast-import-row' }, urlInput, titleInput, hskSelect),
    el('div', { className: 'podcast-import-tools' }, autoFetchBtn, uploadBtn, fileInput),
    subInput,
    el('div', { className: 'podcast-import-submit' }, translateBtn, quickLoadBtn, closeImportBtn),
    importStatusEl
  );

  // Filter & Episode Strip
  const filterStripEl = el('div', { id: 'podcastFilterStrip', className: 'podcast-filter-strip', role: 'tablist', 'aria-label': 'Lọc theo trình độ HSK' });
  const episodeStripEl = el('div', { id: 'podcastEpisodeList', className: 'podcast-ep-list' });
  const catalogSection = el('section', { className: 'podcast-catalog', 'aria-label': 'Danh sách tập Podcast' }, filterStripEl, episodeStripEl);

  // Video Stage + Subtitle Mask
  const epMetaEl = el('div', { id: 'podcastEpMeta', className: 'podcast-ep-meta' });
  const ytHostEl = el('div', { id: 'podcastYtHost', className: 'podcast-yt-host' });
  const posterFallbackEl = el('div', { id: 'podcastPosterFallback', className: 'podcast-poster-fallback', hidden: true });
  const maskLinesEl = el('div', { className: 'podcast-mask-lines' });
  const maskHintEl = el('span', { className: 'podcast-mask-pill' }, 'Lớp che sub EN · Đang hiện Tiếng Việt');
  const subMaskEl = el(
    'div',
    { id: 'podcastSubMask', className: 'podcast-sub-mask is-solid', 'aria-live': 'polite' },
    el('div', { className: 'podcast-mask-top' }, maskHintEl),
    maskLinesEl
  );
  const videoShellEl = el(
    'div',
    { id: 'podcastVideoShell', className: 'podcast-video-shell' },
    ytHostEl,
    posterFallbackEl,
    subMaskEl
  );

  // Controls
  const prevCueBtn = el('button', { type: 'button', id: 'podcastPrevCueBtn', className: 'podcast-ctrl-btn', title: 'Câu trước' }, '◀ Trước');
  const playBtn = el('button', { type: 'button', id: 'podcastPlayBtn', className: 'podcast-play-btn' }, '▶ Phát');
  const nextCueBtn = el('button', { type: 'button', id: 'podcastNextCueBtn', className: 'podcast-ctrl-btn', title: 'Câu sau' }, 'Sau ▶');
  const replayCueBtn = el('button', { type: 'button', id: 'podcastReplayCueBtn', className: 'podcast-ctrl-btn', title: 'Nghe lại câu đang chọn' }, '↻ Nghe lại câu');
  const loopCueBtn = el('button', { type: 'button', id: 'podcastLoopCueBtn', className: 'podcast-ctrl-btn' }, 'Lặp câu');

  const speedButtons = [0.75, 1, 1.25].map((rate) =>
    el('button', { type: 'button', className: 'podcast-speed-btn', dataset: { rate: String(rate) } }, `${rate}x`)
  );

  const timeSlider = el('input', {
    id: 'podcastTimeSlider',
    type: 'range',
    className: 'podcast-time-slider',
    min: '0',
    max: '40',
    step: '0.5',
    value: '0',
    'aria-label': 'Thanh tua thời gian podcast'
  });
  const timeLabelEl = el('span', { id: 'podcastTimeLabel', className: 'podcast-time-label' }, '0:00 / 0:40');

  const toggleMaskBtn = el('button', { type: 'button', id: 'podcastToggleMaskBtn', className: 'podcast-layer-btn' }, 'Che sub EN: Bật');
  const maskStyleBtn = el('button', { type: 'button', id: 'podcastMaskStyleBtn', className: 'podcast-layer-btn' }, 'Nền: Đặc tối');
  const toggleZhBtn = el('button', { type: 'button', id: 'podcastToggleZhBtn', className: 'podcast-layer-btn' }, 'Chữ Hán');
  const togglePinBtn = el('button', { type: 'button', id: 'podcastTogglePinBtn', className: 'podcast-layer-btn' }, 'Pinyin');
  const toggleViBtn = el('button', { type: 'button', id: 'podcastToggleViBtn', className: 'podcast-layer-btn' }, 'Tiếng Việt');
  const toggleEnBtn = el('button', { type: 'button', id: 'podcastToggleEnBtn', className: 'podcast-layer-btn' }, 'Gốc (EN)');

  const maskBottomRange = el('input', {
    id: 'podcastMaskBottomRange',
    type: 'range',
    min: '0',
    max: '28',
    step: '1',
    value: String(state.prefs.maskBottom),
    'aria-label': 'Vị trí vùng che từ đáy khung hình'
  });
  const maskBottomValEl = el('span', { id: 'podcastMaskBottomVal', className: 'podcast-range-val' }, `${state.prefs.maskBottom}%`);

  const maskHeightRange = el('input', {
    id: 'podcastMaskHeightRange',
    type: 'range',
    min: '12',
    max: '46',
    step: '1',
    value: String(state.prefs.maskHeight),
    'aria-label': 'Chiều cao vùng che phụ đề tiếng Anh'
  });
  const maskHeightValEl = el('span', { id: 'podcastMaskHeightVal', className: 'podcast-range-val' }, `${state.prefs.maskHeight}%`);
  const maskResetBtn = el('button', { type: 'button', id: 'podcastMaskResetBtn', className: 'podcast-sec-btn' }, 'Đặt lại khung che');

  const controlsCard = el(
    'section',
    { className: 'podcast-controls-card', 'aria-label': 'Điều khiển phát và lớp che phụ đề' },
    el('div', { className: 'podcast-scrub-row' }, timeSlider, timeLabelEl),
    el(
      'div',
      { className: 'podcast-transport-row' },
      el('div', { className: 'podcast-transport-group' }, prevCueBtn, playBtn, nextCueBtn, replayCueBtn, loopCueBtn),
      el('div', { className: 'podcast-speed-group' }, ...speedButtons)
    ),
    el(
      'div',
      { className: 'podcast-layer-row' },
      toggleMaskBtn,
      maskStyleBtn,
      toggleZhBtn,
      togglePinBtn,
      toggleViBtn,
      toggleEnBtn
    ),
    el(
      'div',
      { className: 'podcast-mask-sliders' },
      el(
        'label',
        { className: 'podcast-slider-field', htmlFor: 'podcastMaskBottomRange' },
        el('span', null, 'Vị trí từ đáy'),
        maskBottomRange,
        maskBottomValEl
      ),
      el(
        'label',
        { className: 'podcast-slider-field', htmlFor: 'podcastMaskHeightRange' },
        el('span', null, 'Độ cao lớp che'),
        maskHeightRange,
        maskHeightValEl
      ),
      maskResetBtn
    ),
    el('p', { className: 'podcast-mask-tip' }, 'Mẹo: Điều chỉnh Vị trí từ đáy và Độ cao lớp che sao cho phủ kín dòng phụ đề tiếng Anh đốt cứng trên video YouTube.')
  );

  const playerCol = el('div', { className: 'podcast-player-col' }, epMetaEl, videoShellEl, controlsCard);

  // Transcript + Word Popover Column
  const cueCountEl = el('span', { id: 'podcastCueCount', className: 'podcast-cue-count' }, '0 câu');
  const autoScrollBtn = el('button', { type: 'button', id: 'podcastAutoScrollBtn', className: 'podcast-sec-btn' }, 'Tự cuộn: Bật');
  const transcriptListEl = el('div', { id: 'podcastTranscriptList', className: 'podcast-transcript-list' });
  const wordPopoverEl = el('aside', { id: 'podcastWordPopover', className: 'podcast-word-popover', hidden: true, 'aria-live': 'polite' });

  const transcriptCol = el(
    'section',
    { className: 'podcast-transcript-col', 'aria-label': 'Phụ đề song ngữ đồng bộ' },
    el(
      'div',
      { className: 'podcast-transcript-head' },
      el('div', null, el('h3', null, 'Phụ đề song ngữ'), cueCountEl),
      autoScrollBtn
    ),
    wordPopoverEl,
    transcriptListEl
  );

  const stageEl = el('div', { className: 'podcast-stage' }, playerCol, transcriptCol);

  panel.append(headEl, importBox, catalogSection, stageEl);

  // ---- Helpers & Rendering ----
  function setImportStatus(msg, isError) {
    importStatusEl.textContent = msg || '';
    importStatusEl.classList.toggle('is-error', Boolean(isError));
  }

  function updateAiBadge() {
    const label = window.HSKAiProviderPicker?.activeProviderInfo?.()?.label;
    aiBadgeEl.textContent = label ? `AI: ${label}` : 'AI: Tự động';
  }

  function syncMaskAppearance() {
    const p = state.prefs;
    subMaskEl.hidden = !p.maskEnabled;
    subMaskEl.classList.toggle('is-solid', p.maskStyle === 'solid');
    subMaskEl.classList.toggle('is-blur', p.maskStyle !== 'solid');
    subMaskEl.style.setProperty('--podcast-mask-bottom', `${p.maskBottom}%`);
    subMaskEl.style.setProperty('--podcast-mask-height', `${p.maskHeight}%`);

    toggleMaskBtn.textContent = `Che sub EN: ${p.maskEnabled ? 'Bật' : 'Tắt'}`;
    toggleMaskBtn.classList.toggle('is-active', p.maskEnabled);

    maskStyleBtn.textContent = `Nền: ${p.maskStyle === 'solid' ? 'Đặc tối' : 'Mờ kính'}`;
    maskStyleBtn.classList.toggle('is-active', p.maskStyle === 'solid');

    toggleZhBtn.classList.toggle('is-active', p.showZh);
    togglePinBtn.classList.toggle('is-active', p.showPinyin);
    toggleViBtn.classList.toggle('is-active', p.showVi);
    toggleEnBtn.classList.toggle('is-active', p.showEn);

    maskBottomRange.value = String(p.maskBottom);
    maskBottomValEl.textContent = `${p.maskBottom}%`;
    maskHeightRange.value = String(p.maskHeight);
    maskHeightValEl.textContent = `${p.maskHeight}%`;

    autoScrollBtn.textContent = `Tự cuộn: ${p.autoScroll ? 'Bật' : 'Tắt'}`;
    autoScrollBtn.classList.toggle('is-active', p.autoScroll);

    for (const btn of speedButtons) {
      btn.classList.toggle('is-active', Number(btn.dataset.rate) === Number(p.speed));
    }
    loopCueBtn.classList.toggle('is-active', state.loopCue);
    playBtn.textContent = state.playing ? '⏸ Tạm dừng' : '▶ Phát';

    if (p.showVi && !p.showEn) maskHintEl.textContent = 'Đang che sub EN · Hiện Tiếng Việt';
    else if (p.showVi && p.showEn) maskHintEl.textContent = 'Đang hiện Việt + đối chiếu EN';
    else maskHintEl.textContent = 'Chế độ nghe thuần Hán · Pinyin';
  }

  function renderTokenizedChinese(container, text, exampleSentence) {
    const tokens = core.segmentChineseLine(text, window.words);
    if (!tokens.length) {
      container.textContent = text || '';
      return;
    }
    for (const tok of tokens) {
      if (!tok.isHan) {
        container.append(document.createTextNode(tok.text));
      } else {
        const btn = el(
          'button',
          {
            type: 'button',
            className: `podcast-word-token${tok.entry ? ' is-dict' : ''}`,
            onClick: (ev) => {
              ev.stopPropagation();
              openWordPopover(tok, exampleSentence);
            }
          },
          tok.text
        );
        container.append(btn);
      }
    }
  }

  function openWordPopover(tok, exampleSentence) {
    const han = tok.text;
    const entry = tok.entry || (Array.isArray(window.words) ? window.words.find((w) => w.han === han) : null);
    let pin = entry?.pin || entry?.pinyin || '';
    if (!pin && window.pinyinPro?.pinyin) {
      try {
        pin = window.pinyinPro.pinyin(han, { toneType: 'symbol' });
      } catch (_) {}
    }
    const mean = entry?.mean || 'Chưa có trong từ điển HSK cơ bản — bạn có thể lưu vào Sổ để ghi chú thêm.';
    const hskText = entry?.hsk ? `HSK ${entry.hsk}` : 'Mở rộng';

    state.selectedWord = { han, pin, mean, example: exampleSentence || han };
    wordPopoverEl.textContent = '';

    const speakWrap = el('span', { className: 'podcast-popover-speak' });
    if (window.HSKSpeech?.button) {
      speakWrap.append(window.HSKSpeech.button(han, `Nghe phát âm ${han}`, false));
    } else {
      speakWrap.append(
        el(
          'button',
          {
            type: 'button',
            className: 'podcast-sec-btn',
            onClick: () => window.HSKSpeech?.speak?.(han)
          },
          '🔊 Đọc từ'
        )
      );
    }

    const saveBtn = el(
      'button',
      {
        type: 'button',
        id: 'podcastSaveWordBtn',
        className: 'podcast-cta-btn',
        onClick: () => {
          if (window.HSKNotebook?.openEditor) {
            window.HSKNotebook.openEditor({
              han,
              pin,
              mean,
              example: exampleSentence || '',
              note: `Podcast: ${currentEpisode()?.titleVi || currentEpisode()?.title || ''}`,
              deck: 'Podcast'
            });
          } else {
            setImportStatus(`Đã chọn từ "${han}" — mở Sổ từ vựng để lưu.`, false);
          }
        }
      },
      '+ Lưu vào Sổ'
    );

    const closeBtn = el(
      'button',
      {
        type: 'button',
        id: 'podcastClosePopoverBtn',
        className: 'podcast-sec-btn',
        onClick: () => {
          wordPopoverEl.hidden = true;
          state.selectedWord = null;
        }
      },
      'Đóng'
    );

    wordPopoverEl.append(
      el(
        'div',
        { className: 'podcast-popover-top' },
        el(
          'div',
          { className: 'podcast-popover-headword' },
          el('strong', { className: 'podcast-popover-han' }, han),
          pin ? el('span', { className: 'podcast-popover-pin' }, pin) : null,
          el('span', { className: 'podcast-popover-level' }, hskText)
        ),
        el('div', { className: 'podcast-popover-actions' }, speakWrap, saveBtn, closeBtn)
      ),
      el('p', { className: 'podcast-popover-mean' }, mean)
    );
    wordPopoverEl.hidden = false;
  }

  function renderMaskCue() {
    maskLinesEl.textContent = '';
    const idx = state.activeCueIdx;
    const cue = idx >= 0 ? state.cues[idx] : state.cues[0];
    if (!cue) {
      maskLinesEl.append(el('p', { className: 'podcast-mask-empty' }, 'Chọn một câu hoặc nhấn Phát để xem phụ đề Việt · Hán · Pinyin.'));
      return;
    }
    const p = state.prefs;
    if (p.showZh && cue.zh) {
      const zhLine = el('div', { className: 'podcast-mask-zh' });
      renderTokenizedChinese(zhLine, cue.zh, cue.zh);
      maskLinesEl.append(zhLine);
    }
    if (p.showPinyin && cue.pinyin) {
      maskLinesEl.append(el('div', { className: 'podcast-mask-pinyin' }, cue.pinyin));
    }
    if (p.showVi && cue.vi) {
      maskLinesEl.append(el('div', { className: 'podcast-mask-vi' }, cue.vi));
    }
    if (p.showEn && cue.en) {
      maskLinesEl.append(el('div', { className: 'podcast-mask-en' }, `EN: ${cue.en}`));
    }
    if (!maskLinesEl.childNodes.length && cue.vi) {
      maskLinesEl.append(el('div', { className: 'podcast-mask-vi' }, cue.vi));
    }
  }

  function renderTranscript() {
    transcriptListEl.textContent = '';
    const cues = state.cues;
    cueCountEl.textContent = `${cues.length} câu`;
    if (!cues.length) {
      transcriptListEl.append(el('p', { className: 'podcast-empty' }, 'Chưa có phụ đề. Hãy chọn tập mẫu hoặc nhập URL YouTube + phụ đề tiếng Anh.'));
      return;
    }
    const p = state.prefs;
    cues.forEach((cue, i) => {
      const isActive = i === state.activeCueIdx;
      const tsBtn = el(
        'button',
        {
          type: 'button',
          className: 'podcast-cue-ts',
          title: 'Tua đến câu này',
          onClick: (ev) => {
            ev.stopPropagation();
            seekTo(cue.start, true);
          }
        },
        core.formatTimestamp(cue.start)
      );

      let speakControl = null;
      if (cue.zh) {
        if (window.HSKSpeech?.button) {
          speakControl = window.HSKSpeech.button(cue.zh, 'Nghe câu tiếng Trung', false);
        } else {
          speakControl = el(
            'button',
            {
              type: 'button',
              className: 'podcast-cue-speak',
              title: 'Đọc câu tiếng Trung',
              onClick: (ev) => {
                ev.stopPropagation();
                window.HSKSpeech?.speak?.(cue.zh);
              }
            },
            '🔊'
          );
        }
      }

      const body = el('div', { className: 'podcast-cue-body' });
      if (p.showZh && cue.zh) {
        const zhDiv = el('div', { className: 'podcast-cue-zh' });
        renderTokenizedChinese(zhDiv, cue.zh, cue.zh);
        body.append(zhDiv);
      }
      if (p.showPinyin && cue.pinyin) {
        body.append(el('div', { className: 'podcast-cue-pin' }, cue.pinyin));
      }
      if (p.showVi && cue.vi) {
        body.append(el('div', { className: 'podcast-cue-vi' }, cue.vi));
      }
      if (p.showEn && cue.en) {
        body.append(el('div', { className: 'podcast-cue-en' }, cue.en));
      }

      const item = el(
        'article',
        {
          className: `podcast-cue-item${isActive ? ' is-active' : ''}`,
          dataset: { cueIdx: String(i) },
          onClick: () => seekTo(cue.start, true)
        },
        el('div', { className: 'podcast-cue-side' }, tsBtn, speakControl),
        body
      );
      transcriptListEl.append(item);
    });
  }

  function highlightActiveCue(scrollIntoView) {
    const items = transcriptListEl.querySelectorAll('.podcast-cue-item');
    let activeEl = null;
    items.forEach((node) => {
      const idx = Number(node.dataset.cueIdx);
      const active = idx === state.activeCueIdx;
      node.classList.toggle('is-active', active);
      if (active) activeEl = node;
    });
    if (scrollIntoView && state.prefs.autoScroll && activeEl && !panel.hidden) {
      const listRect = transcriptListEl.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  function updateTimeDisplay(scrollCue) {
    const total = Math.max(1, state.durationSec || 40);
    const cur = Math.min(total, Math.max(0, state.currentTime));
    timeSlider.max = String(total);
    timeSlider.value = String(cur);
    timeLabelEl.textContent = `${core.formatTimestamp(cur)} / ${core.formatTimestamp(total)}`;

    const nextIdx = core.findActiveCueIndex(state.cues, cur);
    if (nextIdx !== state.activeCueIdx) {
      if (state.loopCue && state.playing && state.activeCueIdx >= 0) {
        const loopingCue = state.cues[state.activeCueIdx];
        if (loopingCue && cur >= loopingCue.end - 0.15) {
          seekTo(loopingCue.start, true);
          return;
        }
      }
      state.activeCueIdx = nextIdx;
      renderMaskCue();
      highlightActiveCue(scrollCue);
    }
  }

  function renderFilterStrip() {
    filterStripEl.textContent = '';
    const filters = [
      { id: 'all', label: 'Tất cả' },
      { id: 'hsk1-2', label: 'HSK 1–2' },
      { id: 'hsk3', label: 'HSK 3' },
      { id: 'hsk4', label: 'HSK 4' },
      { id: 'hsk5-6', label: 'HSK 5–6' }
    ];
    if (state.customEpisodes.length) {
      filters.push({ id: 'custom', label: `Đã nhập (${state.customEpisodes.length})` });
    }
    for (const f of filters) {
      const btn = el(
        'button',
        {
          type: 'button',
          role: 'tab',
          'aria-selected': String(state.levelFilter === f.id),
          className: `podcast-filter-btn${state.levelFilter === f.id ? ' is-active' : ''}`,
          onClick: () => {
            state.levelFilter = f.id;
            renderFilterStrip();
            renderEpisodeStrip();
          }
        },
        f.label
      );
      filterStripEl.append(btn);
    }
  }

  function renderEpisodeStrip() {
    episodeStripEl.textContent = '';
    const eps = allEpisodes().filter((ep) => {
      if (state.levelFilter === 'all') return true;
      if (state.levelFilter === 'custom') return Boolean(ep.isCustom);
      return ep.levelGroup === state.levelFilter;
    });
    if (!eps.length) {
      episodeStripEl.append(el('p', { className: 'podcast-empty' }, 'Không có tập nào trong nhóm này.'));
      return;
    }
    for (const ep of eps) {
      const active = ep.id === state.currentEpisodeId;
      const delBtn = ep.isCustom
        ? el(
            'button',
            {
              type: 'button',
              className: 'podcast-ep-del',
              title: 'Xóa tập đã nhập',
              'aria-label': 'Xóa tập đã nhập',
              onClick: (ev) => {
                ev.stopPropagation();
                state.customEpisodes = state.customEpisodes.filter((x) => x.id !== ep.id);
                persistCustomEpisodes();
                if (state.currentEpisodeId === ep.id) {
                  selectEpisode(core.STARTER_EPISODES[0].id);
                } else {
                  renderFilterStrip();
                  renderEpisodeStrip();
                }
              }
            },
            '×'
          )
        : null;

      const card = el(
        'div',
        {
          role: 'button',
          tabindex: '0',
          className: `podcast-ep-card${active ? ' is-active' : ''}`,
          dataset: { epId: ep.id },
          onClick: () => selectEpisode(ep.id),
          onKeydown: (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              selectEpisode(ep.id);
            }
          }
        },
        el(
          'div',
          { className: 'podcast-ep-card-top' },
          el('span', { className: 'podcast-ep-level' }, ep.isCustom ? `${ep.level || 'Tùy chỉnh'} · Tự nhập` : ep.level),
          el('span', { className: 'podcast-ep-dur' }, ep.durationLabel || core.formatTimestamp(ep.durationSec || 40)),
          delBtn
        ),
        el('strong', { className: 'podcast-ep-title' }, ep.titleVi || ep.title),
        el('small', { className: 'podcast-ep-channel' }, `${ep.channel || 'Podcast'} · ${ep.topic || 'Luyện nghe'}`)
      );
      episodeStripEl.append(card);
    }
  }

  function renderEpisodeMeta(ep) {
    epMetaEl.textContent = '';
    epMetaEl.append(
      el(
        'div',
        { className: 'podcast-meta-top' },
        el('span', { className: 'podcast-ep-level' }, ep.level || 'HSK'),
        el('span', { className: 'podcast-meta-channel' }, ep.channel || 'YouTube Podcast'),
        ep.youtubeId ? el('span', { className: 'podcast-meta-yt' }, `YouTube · ${ep.youtubeId}`) : null
      ),
      el('h3', { className: 'podcast-meta-title' }, ep.titleVi || ep.title),
      ep.title && ep.titleVi && ep.title !== ep.titleVi
        ? el('p', { className: 'podcast-meta-sub' }, `Tiêu đề gốc: ${ep.title}`)
        : null,
      ep.note ? el('p', { className: 'podcast-meta-note' }, ep.note) : null
    );
  }

  // ---- YouTube Player & Offline Timer Sync ----
  function renderFallbackPoster(ep) {
    posterFallbackEl.textContent = '';
    const hasYt = Boolean(ep?.youtubeId);
    posterFallbackEl.append(
      el('div', { className: 'podcast-poster-badge' }, hasYt ? 'YouTube Player · Chế độ đồng bộ phụ đề' : 'Podcast Audio'),
      el('strong', { className: 'podcast-poster-title' }, ep?.titleVi || ep?.title || 'Podcast tiếng Trung'),
      el('p', { className: 'podcast-poster-sub' }, hasYt ? `ID video: ${ep.youtubeId} — Nhấn ▶ Phát hoặc chọn câu bất kỳ bên phải để luyện nghe.` : 'Nhấn ▶ Phát để chạy phụ đề đồng bộ.')
    );
  }

  let ytApiPromise = null;
  function loadYoutubeIframeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
      const prevReady = window.onYouTubeIframeAPIReady;
      let settled = false;
      const finish = (yt) => {
        if (settled) return;
        settled = true;
        resolve(yt);
      };
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === 'function') prevReady();
        finish(window.YT || null);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => finish(null);
      document.head.append(tag);
      setTimeout(() => finish(window.YT?.Player ? window.YT : null), 4500);
    });
    return ytApiPromise;
  }

  async function mountYoutubeVideo(youtubeId) {
    state.ytReady = false;
    state.ytFailed = false;
    if (state.ytPlayer && typeof state.ytPlayer.loadVideoById === 'function') {
      try {
        state.ytPlayer.loadVideoById(youtubeId);
        state.ytPlayer.pauseVideo?.();
        state.ytReady = true;
        posterFallbackEl.hidden = true;
        return;
      } catch (_) {}
    }

    const YT = await loadYoutubeIframeApi();
    if (!YT?.Player || panel.hidden) {
      state.ytFailed = true;
      posterFallbackEl.hidden = false;
      return;
    }

    ytHostEl.textContent = '';
    const playerTarget = el('div', { id: 'podcastYtMount' });
    ytHostEl.append(playerTarget);
    posterFallbackEl.hidden = true;

    try {
      state.ytPlayer = new YT.Player(playerTarget, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          cc_load_policy: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1
        },
        events: {
          onReady: (ev) => {
            state.ytReady = true;
            posterFallbackEl.hidden = true;
            const dur = Number(ev?.target?.getDuration?.() || 0);
            if (dur > 1) {
              state.durationSec = Math.round(dur);
              updateTimeDisplay(false);
            }
            ev?.target?.setPlaybackRate?.(state.prefs.speed);
          },
          onStateChange: (ev) => {
            if (!window.YT?.PlayerState) return;
            if (ev.data === window.YT.PlayerState.PLAYING) {
              state.playing = true;
              startTicker();
              syncMaskAppearance();
            } else if (ev.data === window.YT.PlayerState.PAUSED || ev.data === window.YT.PlayerState.ENDED) {
              state.playing = false;
              stopTicker();
              if (ev.data === window.YT.PlayerState.ENDED) {
                state.currentTime = 0;
              }
              syncMaskAppearance();
            }
          },
          onError: () => {
            state.ytReady = false;
            state.ytFailed = true;
            posterFallbackEl.hidden = false;
          }
        }
      });
    } catch (_) {
      state.ytReady = false;
      state.ytFailed = true;
      posterFallbackEl.hidden = false;
    }
  }

  function startTicker() {
    stopTicker();
    state.lastTickMs = performance.now();
    state.tickerId = window.setInterval(() => {
      if (!state.playing) return;
      const now = performance.now();
      const dt = Math.min(0.5, Math.max(0, (now - state.lastTickMs) / 1000));
      state.lastTickMs = now;
      if (state.ytReady && state.ytPlayer?.getCurrentTime) {
        try {
          const ytTime = Number(state.ytPlayer.getCurrentTime());
          if (Number.isFinite(ytTime) && ytTime >= 0) {
            state.currentTime = ytTime;
          } else {
            state.currentTime += dt * state.prefs.speed;
          }
        } catch (_) {
          state.currentTime += dt * state.prefs.speed;
        }
      } else {
        state.currentTime += dt * state.prefs.speed;
        if (state.currentTime >= state.durationSec) {
          state.currentTime = 0;
          if (!state.loopCue) pausePlayback();
        }
      }
      updateTimeDisplay(true);
    }, 180);
  }

  function stopTicker() {
    if (state.tickerId) {
      window.clearInterval(state.tickerId);
      state.tickerId = 0;
    }
  }

  function startPlayback() {
    state.playing = true;
    if (state.ytReady && state.ytPlayer?.playVideo) {
      try {
        state.ytPlayer.setPlaybackRate?.(state.prefs.speed);
        state.ytPlayer.playVideo();
      } catch (_) {}
    }
    startTicker();
    syncMaskAppearance();
  }

  function pausePlayback() {
    state.playing = false;
    if (state.ytReady && state.ytPlayer?.pauseVideo) {
      try {
        state.ytPlayer.pauseVideo();
      } catch (_) {}
    }
    stopTicker();
    syncMaskAppearance();
  }

  function togglePlayback() {
    if (state.playing) pausePlayback();
    else startPlayback();
  }

  function seekTo(seconds, autoPlay) {
    const clamped = Math.min(Math.max(0, Number(seconds) || 0), state.durationSec || 99999);
    state.currentTime = clamped;
    if (state.ytReady && state.ytPlayer?.seekTo) {
      try {
        state.ytPlayer.seekTo(clamped, true);
      } catch (_) {}
    }
    updateTimeDisplay(true);
    if (autoPlay && !state.playing) startPlayback();
  }

  function selectEpisode(id) {
    const ep = allEpisodes().find((x) => x.id === id) || core.STARTER_EPISODES[0];
    if (!ep) return;
    if (ep.adminItem) {
      const check = window.HSKResourceSync?.checkItemAccess?.(ep.adminItem);
      if (check && !check.allowed) {
        importStatusEl.textContent = 'Tập Podcast này chỉ dành cho tài khoản VIP.';
        window.HSKResourceSync?.notifyBlocked?.(check, ep.title);
        return;
      }
    }
    pausePlayback();
    state.currentEpisodeId = ep.id;
    state.cues = core.enrichCuesLocal(ep.cues || []);
    const lastCueEnd = state.cues.length ? state.cues[state.cues.length - 1].end : 36;
    state.durationSec = Math.max(ep.durationSec || 0, lastCueEnd || 36);
    state.currentTime = 0;
    state.activeCueIdx = state.cues.length ? 0 : -1;
    wordPopoverEl.hidden = true;

    renderEpisodeMeta(ep);
    renderFallbackPoster(ep);
    renderEpisodeStrip();
    renderMaskCue();
    renderTranscript();
    syncMaskAppearance();
    updateTimeDisplay(false);

    if (ep.youtubeId && !panel.hidden) {
      posterFallbackEl.hidden = false;
      mountYoutubeVideo(ep.youtubeId);
    } else {
      posterFallbackEl.hidden = false;
    }
  }

  // ---- Import & AI Subtitle Translation ----
  async function requestPodcastSubtitles({ youtubeId, rawInput, sourceType, hskLevel }) {
    if (state.pendingRequest) state.pendingRequest.abort();
    const controller = new AbortController();
    state.pendingRequest = controller;

    const configResponse = await fetch('./translation-config.json', { signal: controller.signal, cache: 'no-store' });
    if (!configResponse.ok) throw Error('Dịch vụ AI chưa sẵn sàng.');
    const config = await configResponse.json();
    if (!config.enabled) throw Error('Dịch vụ AI chưa sẵn sàng.');
    const endpoint = new URL('/lesson-ask', config.endpoint);
    if (endpoint.protocol !== 'https:') throw Error('Dịch vụ AI chưa sẵn sàng.');

    const user = window.HSKAccountDashboard?.user;
    if (!user?.uid) {
      const err = Error('Chưa đăng nhập tài khoản — sẽ nạp phụ đề chế độ ngoại tuyến.');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }
    const token = await user.getIdToken();
    const aiParams = window.HSKAiProviderPicker?.getActiveAiParams?.() || {};

    const bodyPayload = {
      hsk: hskLevel,
      question: rawInput,
      history: [],
      ...(aiParams.aiProvider ? { aiProvider: aiParams.aiProvider } : {}),
      ...(aiParams.aiModel ? { aiModel: aiParams.aiModel } : {}),
      ...(aiParams.thinking ? { thinking: aiParams.thinking } : {}),
      lesson: {
        id: `podcast-${youtubeId || 'custom'}`,
        title: titleInput.value.trim() || `Podcast ${youtubeId || 'YouTube'}`,
        words: [],
        content: {
          mode: 'podcast-subtitles',
          youtubeId: youtubeId || '',
          sourceType
        }
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });
    const data = await response.json().catch(() => null);
    if (state.pendingRequest === controller) state.pendingRequest = null;
    if (!response.ok) {
      const err = Error(data?.error || 'Không thể dịch phụ đề bằng AI.');
      err.code = data?.code || '';
      throw err;
    }
    return data;
  }

  function installCustomEpisode({ youtubeId, titleVi, title, hskLevel, cues, note }) {
    const id = `custom-${youtubeId || Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const enriched = core.enrichCuesLocal(cues);
    const maxEnd = enriched.length ? enriched[enriched.length - 1].end : 40;
    const hskNum = Number(hskLevel) || 3;
    const levelGroup = hskNum <= 2 ? 'hsk1-2' : hskNum === 3 ? 'hsk3' : hskNum === 4 ? 'hsk4' : 'hsk5-6';
    const ep = {
      id,
      isCustom: true,
      youtubeId: youtubeId || '',
      level: `HSK ${hskNum}`,
      levelGroup,
      title: title || titleVi || 'Tập Podcast tự nhập',
      titleVi: titleVi || title || `Podcast YouTube ${youtubeId || ''}`.trim(),
      channel: 'Tập tự nhập',
      durationSec: Math.max(20, Math.round(maxEnd)),
      durationLabel: core.formatTimestamp(maxEnd),
      topic: 'Phụ đề Việt · Hán · Pinyin',
      note: note || 'Đã bật lớp che phụ đề tiếng Anh đáy khung hình.',
      cues: enriched
    };
    state.customEpisodes = [ep, ...state.customEpisodes].slice(0, 15);
    persistCustomEpisodes();
    state.levelFilter = 'all';
    state.prefs.maskEnabled = true;
    persistPrefs();
    renderFilterStrip();
    selectEpisode(ep.id);
    state.importOpen = false;
    importBox.hidden = true;
  }

  async function handleImport(mode) {
    const ytId = core.extractYoutubeId(urlInput.value);
    const rawText = subInput.value.trim();
    const hskLevel = Number(hskSelect.value) || 3;

    if (mode === 'auto-youtube') {
      if (!ytId) {
        setImportStatus('Hãy dán link YouTube hoặc Video ID hợp lệ trước khi lấy CC tự động.', true);
        urlInput.focus();
        return;
      }
      setImportStatus('Đang kiểm tra phụ đề CC trên YouTube và dịch sang Tiếng Việt + Hán · Pinyin…', false);
      autoFetchBtn.disabled = true;
      translateBtn.disabled = true;
      try {
        const res = await requestPodcastSubtitles({
          youtubeId: ytId,
          rawInput: `YOUTUBE_AUTO_CC:${ytId}`,
          sourceType: 'youtube-url',
          hskLevel
        });
        const subResult = res?.podcastSubtitles;
        if (!subResult?.cues?.length) throw Error('AI chưa trả về dữ liệu phụ đề.');
        installCustomEpisode({
          youtubeId: ytId,
          titleVi: titleInput.value.trim() || subResult.titleVi,
          title: titleInput.value.trim() || subResult.titleVi,
          hskLevel,
          cues: subResult.cues,
          note: subResult.summaryVi || 'Đã lấy phụ đề YouTube CC và dịch song ngữ tự động.'
        });
        setImportStatus('Đã nạp xong phụ đề từ YouTube!', false);
      } catch (err) {
        setImportStatus(err?.message || 'Không lấy được phụ đề CC tự động từ YouTube.', true);
        if (err?.code === 'YOUTUBE_CC_UNAVAILABLE') {
          subInput.focus();
        }
      } finally {
        autoFetchBtn.disabled = false;
        translateBtn.disabled = false;
      }
      return;
    }

    if (!rawText) {
      setImportStatus('Hãy dán phụ đề/transcript tiếng Anh hoặc tải tệp .srt/.vtt lên trước.', true);
      subInput.focus();
      return;
    }

    const parsedLocal = core.parseSubtitleText(rawText);
    if (!parsedLocal.length) {
      setImportStatus('Chưa nhận diện được dòng phụ đề hợp lệ.', true);
      return;
    }

    if (mode === 'quick-local') {
      if (parsedLocal.some((c) => c.zh && !c.pinyin)) {
        await ensurePinyinPro();
      }
      installCustomEpisode({
        youtubeId: ytId,
        titleVi: titleInput.value.trim() || (ytId ? `Podcast YouTube (${ytId})` : 'Podcast đã nạp nhanh'),
        title: titleInput.value.trim() || '',
        hskLevel,
        cues: parsedLocal,
        note: 'Nạp trực tiếp từ phụ đề bạn dán (chế độ ngoại tuyến — bật lớp che sub ở đáy video).'
      });
      setImportStatus(`Đã nạp nhanh ${parsedLocal.length} câu phụ đề.`, false);
      return;
    }

    // AI translate pasted subtitles
    setImportStatus(`Đang dùng AI chuyển ${parsedLocal.length} câu sang Tiếng Việt + Hán · Pinyin…`, false);
    translateBtn.disabled = true;
    autoFetchBtn.disabled = true;
    try {
      const compactInput = parsedLocal
        .slice(0, 75)
        .map((c) => `${c.start}-${c.end} | ${c.en || c.zh || c.vi}`)
        .join('\n')
        .slice(0, 11500);

      const res = await requestPodcastSubtitles({
        youtubeId: ytId,
        rawInput: compactInput,
        sourceType: 'pasted-transcript',
        hskLevel
      });
      const subResult = res?.podcastSubtitles;
      if (!subResult?.cues?.length) throw Error('AI chưa trả về danh sách câu.');
      installCustomEpisode({
        youtubeId: ytId,
        titleVi: titleInput.value.trim() || subResult.titleVi,
        title: titleInput.value.trim() || subResult.titleVi,
        hskLevel,
        cues: subResult.cues,
        note: subResult.summaryVi || 'Đã dịch bởi AI và bật lớp che phụ đề tiếng Anh gốc.'
      });
      setImportStatus(`Đã dịch AI thành công ${subResult.cues.length} câu phụ đề!`, false);
    } catch (err) {
      await ensurePinyinPro();
      installCustomEpisode({
        youtubeId: ytId,
        titleVi: titleInput.value.trim() || (ytId ? `Podcast (${ytId})` : 'Podcast bản ngoại tuyến'),
        title: '',
        hskLevel,
        cues: parsedLocal,
        note: err?.code === 'UNAUTHENTICATED'
          ? 'Chưa đăng nhập để dịch AI — đang hiển thị bản phụ đề nạp trực tiếp và lớp che đáy video.'
          : 'Không gọi được dịch AI — tạm hiển thị phụ đề nạp trực tiếp cùng lớp che đáy video.'
      });
      setImportStatus(`${err?.message || 'Chưa kết nối được AI.'} Đã tạm nạp phụ đề trực tiếp để bạn luyện nghe ngay.`, true);
    } finally {
      translateBtn.disabled = false;
      autoFetchBtn.disabled = false;
    }
  }

  // ---- Wire Events ----
  toggleImportBtn.addEventListener('click', () => {
    state.importOpen = !state.importOpen;
    importBox.hidden = !state.importOpen;
    if (state.importOpen) urlInput.focus();
  });

  closeImportBtn.addEventListener('click', () => {
    state.importOpen = false;
    importBox.hidden = true;
  });

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      subInput.value = String(reader.result || '');
      if (!titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^.]+$/, '');
      }
      setImportStatus(`Đã đọc tệp "${file.name}". Bấm "Dịch AI" hoặc "Nạp nhanh" để phát.`, false);
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  autoFetchBtn.addEventListener('click', () => handleImport('auto-youtube'));
  translateBtn.addEventListener('click', () => handleImport('ai-translate'));
  quickLoadBtn.addEventListener('click', () => handleImport('quick-local'));

  playBtn.addEventListener('click', togglePlayback);

  prevCueBtn.addEventListener('click', () => {
    if (!state.cues.length) return;
    const idx = Math.max(0, state.activeCueIdx > 0 ? state.activeCueIdx - 1 : 0);
    seekTo(state.cues[idx].start, true);
  });

  nextCueBtn.addEventListener('click', () => {
    if (!state.cues.length) return;
    const idx = Math.min(state.cues.length - 1, Math.max(0, state.activeCueIdx + 1));
    seekTo(state.cues[idx].start, true);
  });

  replayCueBtn.addEventListener('click', () => {
    if (!state.cues.length) return;
    const idx = Math.max(0, state.activeCueIdx);
    seekTo(state.cues[idx].start, true);
  });

  loopCueBtn.addEventListener('click', () => {
    state.loopCue = !state.loopCue;
    syncMaskAppearance();
  });

  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const rate = Number(btn.dataset.rate) || 1;
      state.prefs.speed = rate;
      persistPrefs();
      if (state.ytReady && state.ytPlayer?.setPlaybackRate) {
        try {
          state.ytPlayer.setPlaybackRate(rate);
        } catch (_) {}
      }
      syncMaskAppearance();
    });
  });

  timeSlider.addEventListener('input', () => {
    const val = Number(timeSlider.value) || 0;
    state.currentTime = val;
    if (state.ytReady && state.ytPlayer?.seekTo) {
      try {
        state.ytPlayer.seekTo(val, true);
      } catch (_) {}
    }
    updateTimeDisplay(false);
  });

  toggleMaskBtn.addEventListener('click', () => {
    state.prefs.maskEnabled = !state.prefs.maskEnabled;
    persistPrefs();
    syncMaskAppearance();
  });

  maskStyleBtn.addEventListener('click', () => {
    state.prefs.maskStyle = state.prefs.maskStyle === 'solid' ? 'blur' : 'solid';
    persistPrefs();
    syncMaskAppearance();
  });

  toggleZhBtn.addEventListener('click', () => {
    state.prefs.showZh = !state.prefs.showZh;
    persistPrefs();
    syncMaskAppearance();
    renderMaskCue();
    renderTranscript();
  });

  togglePinBtn.addEventListener('click', () => {
    state.prefs.showPinyin = !state.prefs.showPinyin;
    persistPrefs();
    syncMaskAppearance();
    renderMaskCue();
    renderTranscript();
  });

  toggleViBtn.addEventListener('click', () => {
    state.prefs.showVi = !state.prefs.showVi;
    persistPrefs();
    syncMaskAppearance();
    renderMaskCue();
    renderTranscript();
  });

  toggleEnBtn.addEventListener('click', () => {
    state.prefs.showEn = !state.prefs.showEn;
    persistPrefs();
    syncMaskAppearance();
    renderMaskCue();
    renderTranscript();
  });

  maskBottomRange.addEventListener('input', () => {
    state.prefs.maskBottom = Number(maskBottomRange.value) || 0;
    persistPrefs();
    syncMaskAppearance();
  });

  maskHeightRange.addEventListener('input', () => {
    state.prefs.maskHeight = Number(maskHeightRange.value) || 12;
    persistPrefs();
    syncMaskAppearance();
  });

  maskResetBtn.addEventListener('click', () => {
    const ep = currentEpisode();
    state.prefs.maskEnabled = true;
    state.prefs.maskStyle = 'solid';
    state.prefs.maskBottom = ep?.defaultMaskBottom ?? DEFAULT_PREFS.maskBottom;
    state.prefs.maskHeight = ep?.defaultMaskHeight ?? DEFAULT_PREFS.maskHeight;
    persistPrefs();
    syncMaskAppearance();
  });

  autoScrollBtn.addEventListener('click', () => {
    state.prefs.autoScroll = !state.prefs.autoScroll;
    persistPrefs();
    syncMaskAppearance();
  });

  window.HSKPodcast = {
    enter() {
      updateAiBadge();
      const ep = currentEpisode();
      if (ep?.youtubeId && !state.ytReady && !state.ytFailed) {
        mountYoutubeVideo(ep.youtubeId);
      }
      renderMaskCue();
      highlightActiveCue(false);
    },
    selectEpisode,
    seek: (sec, autoPlay) => seekTo(sec, autoPlay),
    play: startPlayback,
    pause: pausePlayback,
    togglePlay: togglePlayback,
    getState: () => ({
      currentEpisodeId: state.currentEpisodeId,
      activeCueIdx: state.activeCueIdx,
      currentTime: state.currentTime,
      playing: state.playing,
      cuesCount: state.cues.length,
      prefs: { ...state.prefs }
    })
  };

  // Initialize first starter episode
  window.addEventListener('hsk-resources-updated', () => {
    renderFilterStrip();
    renderEpisodeStrip();
  });
  renderFilterStrip();
  selectEpisode(state.currentEpisodeId);
  updateAiBadge();
})();
