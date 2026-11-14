(function (root) {
  'use strict';

  const STORAGE_KEY = 'hsk_admin_manifest_v1';
  const THEME_STORAGE_KEY = 'hsk_admin_theme';
  const FIREBASE_VERSION = '13.0.0';

  const core = root.HSKAdminPortalCore;
  if (!core) return;

  const state = {
    manifest: core.createDefaultManifest(),
    activeTab: 'overview',
    accountConfig: null,
    workerBase: '',
    user: null,
    isAdmin: false,
    firebaseMods: null,
    firebaseAuth: null,
    firebaseDb: null,
    accounts: [],
    students: [],
    examEditIndex: -1,
    musicEditIndex: -1,
    podcastEditIndex: -1,
    docEditIndex: -1
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (val == null || val === false) continue;
      if (key === 'className') node.className = val;
      else if (key === 'textContent') node.textContent = val;
      else if (key.startsWith('on') && typeof val === 'function') node.addEventListener(key.slice(2).toLowerCase(), val);
      else node.setAttribute(key, String(val));
    }
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  function showStatus(message, type = 'info') {
    const banner = byId('apStatusBanner');
    if (!banner) return;
    banner.textContent = message;
    banner.className = 'ap-status' + (type === 'error' ? ' is-error' : type === 'ok' ? ' is-ok' : '');
    banner.hidden = !message;
  }

  function readLocalManifest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return core.normalizeManifest(JSON.parse(raw));
    } catch (_) {
      return null;
    }
  }

  function writeLocalManifest(manifest) {
    state.manifest = core.normalizeManifest(manifest);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.manifest));
    } catch (_) {}
  }

  function formatTimestamp(ms) {
    if (!ms || !Number.isFinite(Number(ms))) return 'Chưa có mốc đồng bộ';
    try {
      return new Date(Number(ms)).toLocaleString('vi-VN');
    } catch (_) {
      return String(ms);
    }
  }

  function accessBadge(access) {
    const level = core.normalizeAccess(access);
    const cls = level === 'vip' ? 'ap-badge ap-badge-vip' : level === 'hidden' ? 'ap-badge ap-badge-hidden' : 'ap-badge ap-badge-public';
    return el('span', { className: cls, textContent: core.ACCESS_LABELS[level] || level });
  }

  function createAccessSelect(currentAccess, onChange) {
    const select = el('select', { className: 'ap-select ap-select-sm', 'aria-label': 'Quyền truy cập' });
    for (const level of core.ACCESS_LEVELS) {
      const opt = el('option', { value: level, textContent: core.ACCESS_LABELS[level] || level });
      if (level === core.normalizeAccess(currentAccess)) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  function updateThemeButton() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const btn = byId('apThemeBtn');
    if (btn) btn.textContent = theme === 'dark' ? 'Giao diện: Tối' : 'Giao diện: Sáng';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (_) {}
    updateThemeButton();
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('[data-ap-tab]').forEach((btn) => {
      const active = btn.getAttribute('data-ap-tab') === tabId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.ap-panel').forEach((panel) => {
      panel.hidden = panel.id !== `panel-${tabId}`;
    });
  }

  function renderAuthStatus() {
    const badge = byId('apAuthBadge');
    const line = byId('apAccountLine');
    const loginBtn = byId('apLoginBtn');
    const logoutBtn = byId('apLogoutBtn');
    const meta = byId('apSyncMeta');

    if (state.user) {
      const expectedUid = state.accountConfig?.adminUid || '';
      state.isAdmin = !expectedUid || state.user.uid === expectedUid;
      if (badge) {
        badge.textContent = state.isAdmin ? 'Admin đã xác thực' : 'Không phải Admin';
        badge.className = state.isAdmin ? 'ap-badge ap-badge-public' : 'ap-badge ap-badge-hidden';
      }
      if (line) line.textContent = `${state.user.email || state.user.uid} · UID: ${state.user.uid}`;
      if (loginBtn) loginBtn.hidden = true;
      if (logoutBtn) logoutBtn.hidden = false;
    } else {
      state.isAdmin = false;
      if (badge) {
        badge.textContent = 'Chưa đăng nhập';
        badge.className = 'ap-badge ap-badge-muted';
      }
      if (line) line.textContent = 'Chế độ xem / soạn thảo cục bộ (đăng nhập Admin để xuất bản lên Server)';
      if (loginBtn) loginBtn.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;
    }
    if (meta) {
      const updated = state.manifest.updatedAt ? `Cập nhật lúc ${formatTimestamp(state.manifest.updatedAt)}` : 'Chưa xuất bản lên Server';
      meta.textContent = state.workerBase ? `${updated} · Worker: ${state.workerBase}` : updated;
    }
  }

  function renderOverview() {
    const m = state.manifest;
    const setText = (id, val) => {
      const n = byId(id);
      if (n) n.textContent = String(val);
    };
    setText('apKpiExams', m.exams.length);
    setText('apKpiMusic', m.music.length);
    setText('apKpiPodcasts', m.podcasts.length);
    setText('apKpiDocs', m.documents.length);
    const restrictedCount = Object.values(m.features || {}).filter((v) => v === 'vip' || v === 'hidden').length;
    setText('apKpiRestricted', restrictedCount);

    const epExam = byId('apEpExamManifest');
    const epDrive = byId('apEpDriveExam');
    const epMusic = byId('apEpMusicCloud');
    if (epExam) epExam.value = m.endpoints.examManifestUrl || '';
    if (epDrive) epDrive.value = m.endpoints.driveExamDataUrl || '';
    if (epMusic) epMusic.value = m.endpoints.musicCloudEndpoint || '';
  }

  function renderExams() {
    const list = byId('apExamList');
    const countEl = byId('apExamCount');
    if (!list) return;
    const filterLevel = byId('apExamFilterLevel')?.value || 'all';
    const search = (byId('apExamSearch')?.value || '').trim().toLowerCase();

    const rows = state.manifest.exams
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => {
        if (filterLevel !== 'all' && String(item.level) !== filterLevel) return false;
        if (search && !`${item.id} ${item.title} ${item.provider}`.toLowerCase().includes(search)) return false;
        return true;
      });

    if (countEl) countEl.textContent = String(state.manifest.exams.length);
    list.textContent = '';
    if (!rows.length) {
      list.appendChild(el('p', { className: 'ap-empty', textContent: 'Không có bộ đề nào khớp bộ lọc.' }));
      return;
    }

    for (const { item, idx } of rows) {
      const accessSelect = createAccessSelect(item.access, (nextAccess) => {
        state.manifest.exams[idx].access = core.normalizeAccess(nextAccess);
        writeLocalManifest(state.manifest);
        renderAll();
        showStatus(`Đã cập nhật quyền bộ đề "${item.title}" → ${core.ACCESS_LABELS[nextAccess]}.`, 'ok');
      });

      const editBtn = el('button', {
        type: 'button',
        className: 'ap-btn ap-btn-ghost',
        textContent: 'Sửa',
        onClick: () => startEditExam(idx)
      });
      const delBtn = el('button', {
        type: 'button',
        className: 'ap-btn ap-btn-danger-ghost',
        textContent: 'Xoá',
        onClick: () => {
          state.manifest.exams.splice(idx, 1);
          writeLocalManifest(state.manifest);
          resetExamForm();
          renderAll();
          showStatus(`Đã xoá bộ đề "${item.title}".`, 'info');
        }
      });

      list.appendChild(
        el('div', { className: 'ap-item-row', 'data-exam-id': item.id }, [
          el('div', { className: 'ap-item-main' }, [
            el('div', { className: 'ap-item-title-line' }, [
              el('span', { className: 'ap-badge ap-badge-muted', textContent: `HSK ${item.level}` }),
              el('span', { className: 'ap-item-title', textContent: item.title }),
              accessBadge(item.access)
            ]),
            el('div', {
              className: 'ap-item-meta',
              textContent: `ID: ${item.id} · Nguồn: ${item.provider}${item.url ? ` · ${item.url}` : ''}${item.note ? ` · ${item.note}` : ''}`
            })
          ]),
          el('div', { className: 'ap-item-actions' }, [accessSelect, editBtn, delBtn])
        ])
      );
    }
  }

  function startEditExam(idx) {
    const item = state.manifest.exams[idx];
    if (!item) return;
    state.examEditIndex = idx;
    byId('apExamEditIndex').value = String(idx);
    byId('apExamId').value = item.id;
    byId('apExamLevel').value = String(item.level);
    byId('apExamTitle').value = item.title;
    byId('apExamProvider').value = item.provider;
    byId('apExamAccess').value = item.access;
    byId('apExamUrl').value = item.url || '';
    byId('apExamNote').value = item.note || '';
    byId('apExamSubmitBtn').textContent = 'Lưu thay đổi bộ đề';
    byId('apExamCancelBtn').hidden = false;
  }

  function resetExamForm() {
    state.examEditIndex = -1;
    byId('apExamForm')?.reset();
    byId('apExamEditIndex').value = '-1';
    byId('apExamSubmitBtn').textContent = 'Thêm bộ đề';
    byId('apExamCancelBtn').hidden = true;
  }

  function renderMusic() {
    const list = byId('apMusicList');
    const countEl = byId('apMusicCount');
    if (!list) return;
    if (countEl) countEl.textContent = String(state.manifest.music.length);
    list.textContent = '';
    if (!state.manifest.music.length) {
      list.appendChild(el('p', { className: 'ap-empty', textContent: 'Chưa có bài nhạc nào được cấu hình trong trang Admin.' }));
      return;
    }

    state.manifest.music.forEach((item, idx) => {
      const accessSelect = createAccessSelect(item.access, (nextAccess) => {
        state.manifest.music[idx].access = core.normalizeAccess(nextAccess);
        writeLocalManifest(state.manifest);
        renderAll();
      });
      list.appendChild(
        el('div', { className: 'ap-item-row', 'data-music-id': item.id }, [
          el('div', { className: 'ap-item-main' }, [
            el('div', { className: 'ap-item-title-line' }, [
              el('span', { className: 'ap-badge ap-badge-muted', textContent: `HSK ${item.level}` }),
              el('span', { className: 'ap-item-title', textContent: item.artist ? `${item.title} — ${item.artist}` : item.title }),
              accessBadge(item.access)
            ]),
            el('div', { className: 'ap-item-meta', textContent: `${item.url}${item.note ? ` · ${item.note}` : ''}` })
          ]),
          el('div', { className: 'ap-item-actions' }, [
            accessSelect,
            el('button', { type: 'button', className: 'ap-btn ap-btn-ghost', textContent: 'Sửa', onClick: () => startEditMusic(idx) }),
            el('button', {
              type: 'button',
              className: 'ap-btn ap-btn-danger-ghost',
              textContent: 'Xoá',
              onClick: () => {
                state.manifest.music.splice(idx, 1);
                writeLocalManifest(state.manifest);
                resetMusicForm();
                renderAll();
              }
            })
          ])
        ])
      );
    });
  }

  function startEditMusic(idx) {
    const item = state.manifest.music[idx];
    if (!item) return;
    state.musicEditIndex = idx;
    byId('apMusicEditIndex').value = String(idx);
    byId('apMusicTitle').value = item.title;
    byId('apMusicArtist').value = item.artist || '';
    byId('apMusicLevel').value = String(item.level);
    byId('apMusicAccess').value = item.access;
    byId('apMusicUrl').value = item.url;
    byId('apMusicNote').value = item.note || '';
    byId('apMusicSubmitBtn').textContent = 'Lưu thay đổi bài nhạc';
    byId('apMusicCancelBtn').hidden = false;
  }

  function resetMusicForm() {
    state.musicEditIndex = -1;
    byId('apMusicForm')?.reset();
    byId('apMusicEditIndex').value = '-1';
    byId('apMusicSubmitBtn').textContent = 'Thêm bài nhạc';
    byId('apMusicCancelBtn').hidden = true;
  }

  function renderPodcasts() {
    const list = byId('apPodcastList');
    const countEl = byId('apPodcastCount');
    if (!list) return;
    if (countEl) countEl.textContent = String(state.manifest.podcasts.length);
    list.textContent = '';
    if (!state.manifest.podcasts.length) {
      list.appendChild(el('p', { className: 'ap-empty', textContent: 'Chưa có tập Podcast đề xuất nào.' }));
      return;
    }

    state.manifest.podcasts.forEach((item, idx) => {
      const accessSelect = createAccessSelect(item.access, (nextAccess) => {
        state.manifest.podcasts[idx].access = core.normalizeAccess(nextAccess);
        writeLocalManifest(state.manifest);
        renderAll();
      });
      list.appendChild(
        el('div', { className: 'ap-item-row', 'data-podcast-id': item.id }, [
          el('div', { className: 'ap-item-main' }, [
            el('div', { className: 'ap-item-title-line' }, [
              el('span', { className: 'ap-badge ap-badge-muted', textContent: `HSK ${item.level}` }),
              el('span', { className: 'ap-item-title', textContent: item.title }),
              accessBadge(item.access)
            ]),
            el('div', {
              className: 'ap-item-meta',
              textContent: `${item.youtubeUrl}${item.subtitleText ? ' · Có phụ đề đính kèm' : ''}${item.note ? ` · ${item.note}` : ''}`
            })
          ]),
          el('div', { className: 'ap-item-actions' }, [
            accessSelect,
            el('button', { type: 'button', className: 'ap-btn ap-btn-ghost', textContent: 'Sửa', onClick: () => startEditPodcast(idx) }),
            el('button', {
              type: 'button',
              className: 'ap-btn ap-btn-danger-ghost',
              textContent: 'Xoá',
              onClick: () => {
                state.manifest.podcasts.splice(idx, 1);
                writeLocalManifest(state.manifest);
                resetPodcastForm();
                renderAll();
              }
            })
          ])
        ])
      );
    });
  }

  function startEditPodcast(idx) {
    const item = state.manifest.podcasts[idx];
    if (!item) return;
    state.podcastEditIndex = idx;
    byId('apPodcastEditIndex').value = String(idx);
    byId('apPodcastTitle').value = item.title;
    byId('apPodcastLevel').value = String(item.level);
    byId('apPodcastAccess').value = item.access;
    byId('apPodcastUrl').value = item.youtubeUrl;
    byId('apPodcastSubtitle').value = item.subtitleText || '';
    byId('apPodcastNote').value = item.note || '';
    byId('apPodcastSubmitBtn').textContent = 'Lưu thay đổi Podcast';
    byId('apPodcastCancelBtn').hidden = false;
  }

  function resetPodcastForm() {
    state.podcastEditIndex = -1;
    byId('apPodcastForm')?.reset();
    byId('apPodcastEditIndex').value = '-1';
    byId('apPodcastSubmitBtn').textContent = 'Thêm tập Podcast';
    byId('apPodcastCancelBtn').hidden = true;
  }

  function renderDocs() {
    const list = byId('apDocList');
    const countEl = byId('apDocCount');
    if (!list) return;
    const filterLevel = byId('apDocFilterLevel')?.value || 'all';
    const rows = state.manifest.documents
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => filterLevel === 'all' || String(item.level) === filterLevel);

    if (countEl) countEl.textContent = String(state.manifest.documents.length);
    list.textContent = '';
    if (!rows.length) {
      list.appendChild(el('p', { className: 'ap-empty', textContent: 'Chưa có tài liệu nào.' }));
      return;
    }

    for (const { item, idx } of rows) {
      const accessSelect = createAccessSelect(item.access, (nextAccess) => {
        state.manifest.documents[idx].access = core.normalizeAccess(nextAccess);
        writeLocalManifest(state.manifest);
        renderAll();
      });
      list.appendChild(
        el('div', { className: 'ap-item-row', 'data-doc-id': item.id }, [
          el('div', { className: 'ap-item-main' }, [
            el('div', { className: 'ap-item-title-line' }, [
              el('span', { className: 'ap-badge ap-badge-muted', textContent: `HSK ${item.level}` }),
              el('span', { className: 'ap-badge ap-badge-muted', textContent: item.kind.toUpperCase() }),
              el('span', { className: 'ap-item-title', textContent: item.title }),
              accessBadge(item.access)
            ]),
            el('div', { className: 'ap-item-meta', textContent: `${item.url}${item.description ? ` · ${item.description}` : ''}` })
          ]),
          el('div', { className: 'ap-item-actions' }, [
            accessSelect,
            el('button', { type: 'button', className: 'ap-btn ap-btn-ghost', textContent: 'Sửa', onClick: () => startEditDoc(idx) }),
            el('button', {
              type: 'button',
              className: 'ap-btn ap-btn-danger-ghost',
              textContent: 'Xoá',
              onClick: () => {
                state.manifest.documents.splice(idx, 1);
                writeLocalManifest(state.manifest);
                resetDocForm();
                renderAll();
              }
            })
          ])
        ])
      );
    }
  }

  function startEditDoc(idx) {
    const item = state.manifest.documents[idx];
    if (!item) return;
    state.docEditIndex = idx;
    byId('apDocEditIndex').value = String(idx);
    byId('apDocTitle').value = item.title;
    byId('apDocLevel').value = String(item.level);
    byId('apDocKind').value = item.kind;
    byId('apDocAccess').value = item.access;
    byId('apDocDesc').value = item.description || '';
    byId('apDocUrl').value = item.url;
    byId('apDocSubmitBtn').textContent = 'Lưu thay đổi tài liệu';
    byId('apDocCancelBtn').hidden = false;
  }

  function resetDocForm() {
    state.docEditIndex = -1;
    byId('apDocForm')?.reset();
    byId('apDocEditIndex').value = '-1';
    byId('apDocSubmitBtn').textContent = 'Thêm tài liệu';
    byId('apDocCancelBtn').hidden = true;
  }

  function renderFeatures() {
    const grid = byId('apFeatureMatrix');
    if (!grid) return;
    grid.textContent = '';
    for (const feat of core.CONTROLLABLE_FEATURES) {
      const current = core.getFeatureAccess(state.manifest, feat.id);
      const select = createAccessSelect(current, (nextAccess) => {
        state.manifest.features[feat.id] = core.normalizeAccess(nextAccess);
        writeLocalManifest(state.manifest);
        renderOverview();
        showStatus(`Đã đổi quyền "${feat.label}" → ${core.ACCESS_LABELS[nextAccess]}.`, 'ok');
      });
      select.setAttribute('data-feature-select', feat.id);
      grid.appendChild(
        el('div', { className: 'ap-feature-row', 'data-feature-id': feat.id }, [
          el('div', { className: 'ap-feature-info' }, [
            el('div', { className: 'ap-feature-name', textContent: feat.label }),
            el('div', { className: 'ap-feature-group', textContent: `${feat.group} · route: ${feat.route}` })
          ]),
          select
        ])
      );
    }
  }

  function renderAccounts() {
    const list = byId('apAccountsList');
    if (!list) return;
    list.textContent = '';
    if (!state.accounts.length) {
      list.appendChild(el('p', { className: 'ap-empty', textContent: 'Bấm "Tải danh sách" sau khi đăng nhập Admin để xem các tài khoản từ Worker.' }));
      return;
    }
    for (const acc of state.accounts) {
      const isOwner = acc.role === 'admin' || acc.uid === state.accountConfig?.adminUid;
      const isVip = acc.role === 'vip';
      const actionBtn = isOwner
        ? el('span', { className: 'ap-badge ap-badge-public', textContent: 'Admin cố định' })
        : el('button', {
            type: 'button',
            className: 'ap-btn ap-btn-secondary',
            textContent: isVip ? 'Thu hồi VIP' : 'Cấp VIP',
            onClick: () => setAccountRole(acc.uid, acc.email || '', isVip ? 'regular' : 'vip')
          });

      list.appendChild(
        el('div', { className: 'ap-item-row' }, [
          el('div', { className: 'ap-item-main' }, [
            el('div', { className: 'ap-item-title-line' }, [
              el('span', { className: 'ap-item-title', textContent: acc.email || acc.uid }),
              el('span', { className: isVip ? 'ap-badge ap-badge-vip' : 'ap-badge ap-badge-muted', textContent: String(acc.role || 'regular').toUpperCase() })
            ]),
            el('div', { className: 'ap-item-meta', textContent: `UID: ${acc.uid}` })
          ]),
          el('div', { className: 'ap-item-actions' }, [actionBtn])
        ])
      );
    }
  }

  function renderStudents() {
    const list = byId('apStudentList');
    if (!list) return;
    const search = (byId('apStudentSearch')?.value || '').trim().toLowerCase();
    const rows = state.students.filter((st) => {
      if (!search) return true;
      return `${st.email || ''} ${st.uid || ''}`.toLowerCase().includes(search);
    });
    list.textContent = '';
    if (!rows.length) {
      list.appendChild(el('p', { className: 'ap-empty', textContent: 'Bấm "Tải tiến độ" sau khi đăng nhập Admin để xem thống kê học viên từ Firestore.' }));
      return;
    }
    for (const st of rows) {
      const levels = Array.isArray(st.levels) ? st.levels : [];
      const knownTotal = levels.reduce((sum, l) => sum + (Number(l.known) || 0), 0);
      const trackedTotal = levels.reduce((sum, l) => sum + (Number(l.tracked) || 0), 0);
      const accPct = st.attempts > 0 ? Math.round(((st.attempts - (st.errors || 0)) / st.attempts) * 100) : null;
      const summaryText = `Đã biết: ${knownTotal}/${trackedTotal} từ${accPct !== null ? ` · Độ chính xác: ${accPct}%` : ''}${st.lastActivity ? ` · Hoạt động: ${formatTimestamp(st.lastActivity)}` : ''}`;
      list.appendChild(
        el('div', { className: 'ap-item-row' }, [
          el('div', { className: 'ap-item-main' }, [
            el('div', { className: 'ap-item-title-line' }, [
              el('span', { className: 'ap-item-title', textContent: st.email || st.uid })
            ]),
            el('div', { className: 'ap-item-meta', textContent: summaryText })
          ])
        ])
      );
    }
  }

  function renderAll() {
    renderAuthStatus();
    renderOverview();
    renderExams();
    renderMusic();
    renderPodcasts();
    renderDocs();
    renderFeatures();
    renderAccounts();
    renderStudents();
  }

  async function fetchServerManifest() {
    if (!state.workerBase) return null;
    try {
      const res = await fetch(`${state.workerBase}/resources-manifest`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.manifest ? core.normalizeManifest(data.manifest) : null;
    } catch (_) {
      return null;
    }
  }

  async function ensureFirebase() {
    if (state.firebaseAuth) return true;
    const cfg = state.accountConfig?.firebase;
    if (!state.accountConfig?.enabled || !cfg?.apiKey) return false;
    try {
      const [appMod, authMod, fsMod] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
      ]);
      const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
      state.firebaseMods = { appMod, authMod, fsMod };
      state.firebaseAuth = authMod.getAuth(app);
      state.firebaseDb = fsMod.getFirestore(app);
      authMod.onAuthStateChanged(state.firebaseAuth, (user) => {
        state.user = user || null;
        renderAuthStatus();
      });
      return true;
    } catch (err) {
      showStatus('Không thể kết nối Firebase Auth từ trình duyệt này (chế độ ngoại tuyến).', 'error');
      return false;
    }
  }

  async function getIdToken() {
    if (!state.firebaseAuth?.currentUser) return '';
    return state.firebaseAuth.currentUser.getIdToken();
  }

  async function publishToServer() {
    writeLocalManifest(state.manifest);
    if (!state.workerBase) {
      showStatus('Thiếu endpoint Worker trong translation-config.json.', 'error');
      return;
    }
    const token = await getIdToken();
    if (!token) {
      showStatus('Hãy đăng nhập bằng tài khoản Admin trước khi xuất bản lên Server (bản nháp đã lưu cục bộ).', 'error');
      return;
    }
    try {
      showStatus('Đang xuất bản cấu hình lên Worker Server...', 'info');
      const res = await fetch(`${state.workerBase}/admin/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ manifest: state.manifest })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(data.error || `Xuất bản thất bại (${res.status}).`, 'error');
        return;
      }
      if (data.manifest) {
        writeLocalManifest(data.manifest);
      }
      renderAll();
      showStatus('Đã xuất bản cấu hình tài nguyên lên Server thành công.', 'ok');
    } catch (_) {
      showStatus('Lỗi mạng khi xuất bản lên Server.', 'error');
    }
  }

  async function loadAccounts() {
    const token = await getIdToken();
    if (!token || !state.workerBase) {
      showStatus('Hãy đăng nhập tài khoản Admin để tải danh sách tài khoản.', 'error');
      return;
    }
    try {
      const res = await fetch(`${state.workerBase}/admin/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(data.error || `Không tải được danh sách tài khoản (${res.status}).`, 'error');
        return;
      }
      state.accounts = Array.isArray(data.accounts) ? data.accounts : [];
      renderAccounts();
      showStatus(`Đã tải ${state.accounts.length} tài khoản.`, 'ok');
    } catch (_) {
      showStatus('Lỗi mạng khi tải danh sách tài khoản.', 'error');
    }
  }

  async function setAccountRole(uid, email, role) {
    const token = await getIdToken();
    if (!token || !state.workerBase) {
      showStatus('Hãy đăng nhập tài khoản Admin để thay đổi quyền VIP.', 'error');
      return;
    }
    try {
      const res = await fetch(`${state.workerBase}/admin/account-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, email, role })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(data.error || `Cập nhật quyền thất bại (${res.status}).`, 'error');
        return;
      }
      await loadAccounts();
      showStatus(`Đã cập nhật quyền tài khoản ${email || uid} → ${role.toUpperCase()}.`, 'ok');
    } catch (_) {
      showStatus('Lỗi mạng khi cập nhật quyền VIP.', 'error');
    }
  }

  async function loadStudents() {
    const ok = await ensureFirebase();
    if (!ok || !state.firebaseDb || !state.user) {
      showStatus('Hãy đăng nhập tài khoản Admin để tải tiến độ học viên từ Firestore.', 'error');
      return;
    }
    try {
      const { fsMod } = state.firebaseMods;
      const q = fsMod.query(fsMod.collection(state.firebaseDb, 'learningSummaries'), fsMod.orderBy('updatedAt', 'desc'), fsMod.limit(60));
      const snap = await fsMod.getDocs(q);
      state.students = snap.docs.map((d) => ({ uid: d.id, ...(d.data() || {}) }));
      renderStudents();
      showStatus(`Đã tải tiến độ của ${state.students.length} học viên.`, 'ok');
    } catch (_) {
      showStatus('Không đọc được learningSummaries (kiểm tra quyền Admin trên Firestore).', 'error');
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state.manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'hsk-resources-manifest.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showStatus('Đã xuất file JSON cấu hình tài nguyên.', 'ok');
  }

  function bindEvents() {
    document.querySelectorAll('[data-ap-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-ap-tab')));
    });

    byId('apThemeBtn')?.addEventListener('click', toggleTheme);

    byId('apSaveLocalBtn')?.addEventListener('click', () => {
      writeLocalManifest(state.manifest);
      renderAll();
      showStatus('Đã lưu bản nháp cấu hình vào trình duyệt (localStorage).', 'ok');
    });

    byId('apPublishBtn')?.addEventListener('click', publishToServer);

    byId('apLoginBtn')?.addEventListener('click', async () => {
      const ok = await ensureFirebase();
      if (!ok || !state.firebaseMods || !state.firebaseAuth) {
        showStatus('Firebase Auth chưa sẵn sàng.', 'error');
        return;
      }
      try {
        const provider = new state.firebaseMods.authMod.GoogleAuthProvider();
        await state.firebaseMods.authMod.signInWithPopup(state.firebaseAuth, provider);
        showStatus('Đã đăng nhập thành công.', 'ok');
      } catch (err) {
        showStatus(err?.message || 'Đăng nhập thất bại.', 'error');
      }
    });

    byId('apLogoutBtn')?.addEventListener('click', async () => {
      if (state.firebaseMods && state.firebaseAuth) {
        await state.firebaseMods.authMod.signOut(state.firebaseAuth);
        showStatus('Đã đăng xuất.', 'info');
      }
    });

    byId('apRefreshBtn')?.addEventListener('click', async () => {
      const serverManifest = await fetchServerManifest();
      if (!serverManifest) {
        showStatus('Không tìm thấy cấu hình đã lưu trên Server hoặc chưa kết nối.', 'error');
        return;
      }
      writeLocalManifest(serverManifest);
      renderAll();
      showStatus('Đã tải lại cấu hình mới nhất từ Server.', 'ok');
    });

    byId('apExportBtn')?.addEventListener('click', exportJson);

    byId('apImportInput')?.addEventListener('change', async (ev) => {
      const file = ev.target?.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        writeLocalManifest(parsed);
        renderAll();
        showStatus(`Đã nhập cấu hình từ ${file.name}. Nhấn "Xuất bản lên Server" để đồng bộ cho toàn bộ học viên.`, 'ok');
      } catch (_) {
        showStatus('File JSON không hợp lệ.', 'error');
      } finally {
        ev.target.value = '';
      }
    });

    byId('apResetBtn')?.addEventListener('click', () => {
      writeLocalManifest(core.createDefaultManifest());
      renderAll();
      showStatus('Đã khôi phục cấu hình mặc định trong bản nháp.', 'info');
    });

    byId('apEndpointsForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const examCheck = core.validateHttpsUrl(byId('apEpExamManifest').value, { allowEmpty: true, allowRelative: true });
      const driveCheck = core.validateHttpsUrl(byId('apEpDriveExam').value, { allowEmpty: false, allowRelative: true });
      const musicCheck = core.validateHttpsUrl(byId('apEpMusicCloud').value, { allowEmpty: false, allowRelative: false });
      if (!examCheck.valid || !driveCheck.valid || !musicCheck.valid) {
        showStatus(examCheck.error || driveCheck.error || musicCheck.error, 'error');
        return;
      }
      state.manifest.endpoints = {
        examManifestUrl: examCheck.url,
        driveExamDataUrl: driveCheck.url,
        musicCloudEndpoint: musicCheck.url
      };
      writeLocalManifest(state.manifest);
      renderAll();
      showStatus('Đã cập nhật đường dẫn hệ thống.', 'ok');
    });

    byId('apExamForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const urlRaw = byId('apExamUrl').value.trim();
      const provider = byId('apExamProvider').value;
      const urlCheck = core.validateHttpsUrl(urlRaw, { allowEmpty: provider === 'study4', allowRelative: true });
      if (!urlCheck.valid) {
        showStatus(urlCheck.error, 'error');
        return;
      }
      const nextItem = {
        id: byId('apExamId').value.trim(),
        level: core.normalizeLevel(byId('apExamLevel').value),
        title: byId('apExamTitle').value.trim(),
        provider,
        url: urlCheck.url,
        access: core.normalizeAccess(byId('apExamAccess').value),
        note: byId('apExamNote').value.trim()
      };
      if (state.examEditIndex >= 0 && state.manifest.exams[state.examEditIndex]) {
        state.manifest.exams[state.examEditIndex] = nextItem;
      } else {
        state.manifest.exams.unshift(nextItem);
      }
      writeLocalManifest(state.manifest);
      resetExamForm();
      renderAll();
      showStatus(`Đã lưu bộ đề "${nextItem.title}".`, 'ok');
    });

    byId('apExamCancelBtn')?.addEventListener('click', resetExamForm);
    byId('apExamFilterLevel')?.addEventListener('change', renderExams);
    byId('apExamSearch')?.addEventListener('input', renderExams);

    byId('apMusicForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const urlCheck = core.validateHttpsUrl(byId('apMusicUrl').value, { allowEmpty: false });
      if (!urlCheck.valid) {
        showStatus(urlCheck.error, 'error');
        return;
      }
      const title = byId('apMusicTitle').value.trim();
      const existingId = state.musicEditIndex >= 0 ? state.manifest.music[state.musicEditIndex]?.id : '';
      const nextItem = {
        id: existingId || `music-${Date.now().toString(36)}`,
        title,
        artist: byId('apMusicArtist').value.trim(),
        level: core.normalizeLevel(byId('apMusicLevel').value),
        url: urlCheck.url,
        access: core.normalizeAccess(byId('apMusicAccess').value),
        note: byId('apMusicNote').value.trim()
      };
      if (state.musicEditIndex >= 0 && state.manifest.music[state.musicEditIndex]) {
        state.manifest.music[state.musicEditIndex] = nextItem;
      } else {
        state.manifest.music.unshift(nextItem);
      }
      writeLocalManifest(state.manifest);
      resetMusicForm();
      renderAll();
      showStatus(`Đã lưu bài nhạc "${nextItem.title}".`, 'ok');
    });

    byId('apMusicCancelBtn')?.addEventListener('click', resetMusicForm);

    byId('apPodcastForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const urlCheck = core.validateHttpsUrl(byId('apPodcastUrl').value, { allowEmpty: false });
      if (!urlCheck.valid) {
        showStatus(urlCheck.error, 'error');
        return;
      }
      const title = byId('apPodcastTitle').value.trim();
      const existingId = state.podcastEditIndex >= 0 ? state.manifest.podcasts[state.podcastEditIndex]?.id : '';
      const nextItem = {
        id: existingId || `podcast-${Date.now().toString(36)}`,
        title,
        level: core.normalizeLevel(byId('apPodcastLevel').value),
        youtubeUrl: urlCheck.url,
        subtitleText: byId('apPodcastSubtitle').value,
        access: core.normalizeAccess(byId('apPodcastAccess').value),
        note: byId('apPodcastNote').value.trim()
      };
      if (state.podcastEditIndex >= 0 && state.manifest.podcasts[state.podcastEditIndex]) {
        state.manifest.podcasts[state.podcastEditIndex] = nextItem;
      } else {
        state.manifest.podcasts.unshift(nextItem);
      }
      writeLocalManifest(state.manifest);
      resetPodcastForm();
      renderAll();
      showStatus(`Đã lưu tập Podcast "${nextItem.title}".`, 'ok');
    });

    byId('apPodcastCancelBtn')?.addEventListener('click', resetPodcastForm);

    byId('apSyncYoutubeChannelsBtn')?.addEventListener('click', async () => {
      if (!state.workerBase) {
        showStatus('Thiếu endpoint Worker trong translation-config.json để lấy feed YouTube.', 'error');
        return;
      }
      const btn = byId('apSyncYoutubeChannelsBtn');
      if (btn) btn.disabled = true;
      showStatus('Đang lấy danh sách tập mới từ @LearnChineseThroughPodcast và @BaoBaoMandarin...', 'info');
      try {
        const res = await fetch(`${state.workerBase}/podcast-feed?channel=all`, { method: 'GET', cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data?.episodes)) {
          throw Error(data?.error || `Không lấy được danh sách tập (${res.status}).`);
        }
        const existingYt = new Set(
          state.manifest.podcasts.map((p) => {
            const m = String(p?.youtubeUrl || '').match(/(?:v=|youtu\.be\/|\/(?:embed|shorts|live|v)\/)([a-zA-Z0-9_-]{11})/);
            return m ? m[1] : '';
          }).filter(Boolean)
        );
        let addedCount = 0;
        for (const ep of data.episodes) {
          if (!ep?.youtubeId || existingYt.has(ep.youtubeId)) continue;
          existingYt.add(ep.youtubeId);
          const lvlMatch = String(ep.levelGroup || '').match(/\d/);
          state.manifest.podcasts.push({
            id: `yt-${ep.youtubeId}`,
            title: ep.title,
            level: lvlMatch ? Number(lvlMatch[0]) : 3,
            youtubeUrl: `https://www.youtube.com/watch?v=${ep.youtubeId}`,
            subtitleText: '',
            access: 'public',
            note: `Kênh ${ep.channelHandle || ep.channelName || 'YouTube Podcast'}`
          });
          addedCount += 1;
        }
        if (addedCount > 0) {
          writeLocalManifest(state.manifest);
          renderAll();
          showStatus(`Đã đồng bộ thêm ${addedCount} tập mới từ 2 kênh YouTube (nhớ bấm Xuất bản để lưu lên Server).`, 'ok');
        } else {
          showStatus(`Tất cả ${data.episodes.length} tập gần nhất từ 2 kênh đã có trong danh sách.`, 'info');
        }
      } catch (err) {
        showStatus(err?.message || 'Lỗi mạng khi đồng bộ kênh YouTube.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    byId('apDocForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const urlCheck = core.validateHttpsUrl(byId('apDocUrl').value, { allowEmpty: false });
      if (!urlCheck.valid) {
        showStatus(urlCheck.error, 'error');
        return;
      }
      const title = byId('apDocTitle').value.trim();
      const existingId = state.docEditIndex >= 0 ? state.manifest.documents[state.docEditIndex]?.id : '';
      const nextItem = {
        id: existingId || `doc-${Date.now().toString(36)}`,
        title,
        level: core.normalizeLevel(byId('apDocLevel').value),
        kind: byId('apDocKind').value,
        url: urlCheck.url,
        access: core.normalizeAccess(byId('apDocAccess').value),
        description: byId('apDocDesc').value.trim()
      };
      if (state.docEditIndex >= 0 && state.manifest.documents[state.docEditIndex]) {
        state.manifest.documents[state.docEditIndex] = nextItem;
      } else {
        state.manifest.documents.unshift(nextItem);
      }
      writeLocalManifest(state.manifest);
      resetDocForm();
      renderAll();
      showStatus(`Đã lưu tài liệu "${nextItem.title}".`, 'ok');
    });

    byId('apDocCancelBtn')?.addEventListener('click', resetDocForm);
    byId('apDocFilterLevel')?.addEventListener('change', renderDocs);

    byId('apUnlockAllFeaturesBtn')?.addEventListener('click', () => {
      for (const feat of core.CONTROLLABLE_FEATURES) {
        state.manifest.features[feat.id] = 'public';
      }
      writeLocalManifest(state.manifest);
      renderAll();
      showStatus('Đã mở công khai tất cả tính năng trong bản nháp.', 'ok');
    });

    byId('apLoadAccountsBtn')?.addEventListener('click', loadAccounts);
    byId('apVipGrantForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      setAccountRole(byId('apVipUid').value.trim(), byId('apVipEmail').value.trim(), byId('apVipRoleSelect').value);
    });
    byId('apLoadStudentsBtn')?.addEventListener('click', loadStudents);
    byId('apStudentSearch')?.addEventListener('input', renderStudents);
  }

  async function init() {
    updateThemeButton();
    bindEvents();

    const local = readLocalManifest();
    if (local) state.manifest = local;

    try {
      const [accRes, trRes] = await Promise.all([
        fetch('./account-config.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('./translation-config.json').then((r) => (r.ok ? r.json() : null)).catch(() => null)
      ]);
      state.accountConfig = accRes;
      state.workerBase = trRes?.endpoint ? String(trRes.endpoint).replace(/\/translate\/?$/, '') : '';
    } catch (_) {}

    renderAll();

    const serverManifest = await fetchServerManifest();
    if (serverManifest && (!local || !local.updatedAt || serverManifest.updatedAt >= local.updatedAt)) {
      writeLocalManifest(serverManifest);
      renderAll();
    }

    ensureFirebase();
  }

  root.HSKAdminPortal = { init, renderAll };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
