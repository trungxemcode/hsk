(function (root) {
  'use strict';

  const STORAGE_KEY = 'hsk_admin_manifest_v1';
  const ROLE_STORAGE_KEY = 'hsk_learner_role_v1';
  const core = root.HSKAdminPortalCore;
  if (!core) return;

  const state = {
    manifest: readStoredManifest(),
    role: readStoredRole(),
    workerBase: '',
    noticeTimer: null
  };

  function readStoredManifest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return core.createDefaultManifest();
      return core.normalizeManifest(JSON.parse(raw));
    } catch (_) {
      return core.createDefaultManifest();
    }
  }

  function readStoredRole() {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === 'admin' || saved === 'vip' || saved === 'regular') return saved;
    } catch (_) {}
    return 'regular';
  }

  function getManifest() {
    return state.manifest;
  }

  function setManifest(next, options = {}) {
    state.manifest = core.normalizeManifest(next);
    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.manifest));
      } catch (_) {}
    }
    applyToDOM();
    try {
      window.dispatchEvent(new CustomEvent('hsk-resources-updated', { detail: state.manifest }));
    } catch (_) {}
    return state.manifest;
  }

  function getRole() {
    const dash = root.HSKAccountDashboard;
    if (dash?.user && dash.adminUid && dash.user.uid === dash.adminUid) return 'admin';
    return state.role || 'regular';
  }

  function setRole(role, options = {}) {
    const valid = role === 'admin' || role === 'vip' ? role : 'regular';
    state.role = valid;
    if (options.persist !== false) {
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, valid);
      } catch (_) {}
    }
    applyToDOM();
    return state.role;
  }

  function checkFeature(routeOrId) {
    const access = core.getFeatureAccess(state.manifest, routeOrId);
    return core.canLearnerAccess(access, getRole());
  }

  function checkItemAccess(itemOrAccess) {
    const access = typeof itemOrAccess === 'string' ? itemOrAccess : itemOrAccess?.access;
    return core.canLearnerAccess(access || 'public', getRole());
  }

  function filterAccessibleItems(items) {
    return (Array.isArray(items) ? items : []).filter((item) => core.normalizeAccess(item?.access) !== 'hidden');
  }

  function notifyBlocked(checkResult, label = 'Nội dung này') {
    const msg = checkResult?.reason === 'vip-required'
      ? `${label} chỉ dành cho tài khoản VIP.`
      : `${label} hiện đang tạm ẩn bởi quản trị viên.`;
    let toast = document.getElementById('adminResourceNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminResourceNotice';
      toast.className = 'admin-resource-notice';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(state.noticeTimer);
    state.noticeTimer = setTimeout(() => {
      if (toast) toast.hidden = true;
    }, 3800);
  }

  function applyFeatureGatesToNav() {
    if (typeof document === 'undefined') return;
    const role = getRole();

    document.querySelectorAll('[data-studio-go]').forEach((node) => {
      const route = node.dataset.navAction === 'writing' ? 'writing' : node.dataset.studioGo;
      if (!route) return;
      const access = core.getFeatureAccess(state.manifest, route);
      const result = core.canLearnerAccess(access, role);

      if (access === 'hidden') {
        if (!node.hidden) node.dataset.adminHidden = 'true';
        node.hidden = true;
        delete node.dataset.adminVipLocked;
      } else {
        if (node.dataset.adminHidden === 'true') {
          node.hidden = false;
          delete node.dataset.adminHidden;
        }
        if (!result.allowed && result.reason === 'vip-required') {
          node.dataset.adminVipLocked = 'true';
        } else {
          delete node.dataset.adminVipLocked;
        }
      }
    });
  }

  function renderDocumentsBox() {
    const lessonsPanel = document.getElementById('lessonsPanel');
    if (!lessonsPanel) return;

    let box = document.getElementById('adminDocumentsBox');
    if (!box) {
      box = document.createElement('section');
      box.id = 'adminDocumentsBox';
      box.className = 'admin-resource-box';
      box.setAttribute('aria-label', 'Tài liệu bổ trợ từ Admin');
      box.hidden = true;
      const lessonsContent = document.getElementById('lessonsContent');
      if (lessonsContent) lessonsPanel.insertBefore(box, lessonsContent);
      else lessonsPanel.appendChild(box);
    }

    const docs = filterAccessibleItems(state.manifest.documents);
    if (!docs.length) {
      box.textContent = '';
      box.hidden = true;
      return;
    }

    box.hidden = false;
    box.textContent = '';
    const heading = document.createElement('h3');
    heading.className = 'admin-resource-heading';
    heading.textContent = 'Tài liệu bổ trợ từ Quản trị viên';
    const list = document.createElement('div');
    list.className = 'admin-resource-list';

    for (const doc of docs) {
      const gate = checkItemAccess(doc);
      const row = document.createElement('a');
      row.className = 'admin-resource-item' + (!gate.allowed ? ' is-vip-locked' : '');
      row.href = gate.allowed ? doc.url : '#vip-locked';
      if (gate.allowed) {
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
      } else {
        row.addEventListener('click', (ev) => {
          ev.preventDefault();
          notifyBlocked(gate, doc.title);
        });
      }

      const copy = document.createElement('div');
      copy.className = 'admin-resource-copy';
      const title = document.createElement('strong');
      title.textContent = `[HSK ${doc.level} · ${(doc.kind || 'link').toUpperCase()}] ${doc.title}`;
      copy.appendChild(title);
      if (doc.description) {
        const desc = document.createElement('small');
        desc.textContent = doc.description;
        copy.appendChild(desc);
      }

      const badge = document.createElement('span');
      badge.className = 'admin-resource-badge' + (!gate.allowed ? ' is-vip' : '');
      badge.textContent = gate.allowed ? 'Mở tài liệu →' : 'Chỉ VIP';

      row.append(copy, badge);
      list.appendChild(row);
    }

    box.append(heading, list);
  }

  function renderMusicBox() {
    const musicPanel = document.getElementById('musicPanel');
    if (!musicPanel) return;

    let box = document.getElementById('adminMusicCatalog');
    if (!box) {
      box = document.createElement('section');
      box.id = 'adminMusicCatalog';
      box.className = 'admin-resource-box admin-music-box';
      box.setAttribute('aria-label', 'Danh sách nhạc từ Admin');
      box.hidden = true;
      const browseCol = musicPanel.querySelector('.music-browse-col') || document.getElementById('musicBrowseView') || musicPanel;
      browseCol.appendChild(box);
    }

    const songs = filterAccessibleItems(state.manifest.music);
    if (!songs.length) {
      box.textContent = '';
      box.hidden = true;
      return;
    }

    box.hidden = false;
    box.textContent = '';
    const heading = document.createElement('h3');
    heading.className = 'admin-resource-heading';
    heading.textContent = 'Nhạc được Admin đề xuất';
    const list = document.createElement('div');
    list.className = 'admin-resource-list';

    for (const song of songs) {
      const gate = checkItemAccess(song);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-resource-item' + (!gate.allowed ? ' is-vip-locked' : '');

      const copy = document.createElement('span');
      copy.className = 'admin-resource-copy';
      const title = document.createElement('strong');
      title.textContent = song.artist ? `${song.title} — ${song.artist}` : song.title;
      const meta = document.createElement('small');
      meta.textContent = `HSK ${song.level}${song.note ? ` · ${song.note}` : ''}`;
      copy.append(title, meta);

      const badge = document.createElement('span');
      badge.className = 'admin-resource-badge' + (!gate.allowed ? ' is-vip' : '');
      badge.textContent = gate.allowed ? 'Nghe ngay' : 'Chỉ VIP';

      btn.append(copy, badge);
      btn.addEventListener('click', () => {
        if (!gate.allowed) {
          notifyBlocked(gate, song.title);
          return;
        }
        const urlInput = document.getElementById('musicLinkUrl');
        const nameInput = document.getElementById('musicLinkName');
        const form = document.getElementById('musicLinkForm');
        if (urlInput && form) {
          urlInput.value = song.url;
          if (nameInput) nameInput.value = song.title;
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else {
          window.open(song.url, '_blank', 'noopener,noreferrer');
        }
      });
      list.appendChild(btn);
    }

    box.append(heading, list);
  }

  function applyToDOM() {
    applyFeatureGatesToNav();
    renderDocumentsBox();
    renderMusicBox();
  }

  async function resolveRoleFromAccount() {
    const dash = root.HSKAccountDashboard;
    const user = dash?.user;
    if (!user) {
      if (state.role !== readStoredRole()) {
        state.role = readStoredRole();
      }
      applyToDOM();
      return state.role;
    }
    if (dash.adminUid && user.uid === dash.adminUid) {
      return setRole('admin', { persist: false });
    }
    if (!state.workerBase) return state.role;
    try {
      const token = await user.getIdToken();
      if (!token) return state.role;
      const res = await fetch(`${state.workerBase}/account-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: '{}'
      });
      if (!res.ok) return state.role;
      const data = await res.json();
      if (data?.account?.role) return setRole(data.account.role);
    } catch (_) {}
    return state.role;
  }

  async function refreshFromServer() {
    if (!state.workerBase) {
      try {
        const tr = await fetch('./translation-config.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
        state.workerBase = tr?.endpoint ? String(tr.endpoint).replace(/\/translate\/?$/, '') : '';
      } catch (_) {}
    }
    if (!state.workerBase) return state.manifest;
    try {
      const res = await fetch(`${state.workerBase}/resources-manifest`, { method: 'GET', cache: 'no-store' });
      if (!res.ok) return state.manifest;
      const data = await res.json();
      if (data?.manifest && typeof data.manifest === 'object') {
        const local = state.manifest;
        const incoming = core.normalizeManifest(data.manifest);
        if (!local.updatedAt || incoming.updatedAt >= local.updatedAt) {
          setManifest(incoming);
        }
      }
    } catch (_) {}
    return state.manifest;
  }

  function init() {
    state.manifest = readStoredManifest();
    applyToDOM();
    refreshFromServer();
  }

  window.addEventListener('hsk-account-ready', resolveRoleFromAccount);
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY) {
      state.manifest = readStoredManifest();
      applyToDOM();
      window.dispatchEvent(new CustomEvent('hsk-resources-updated', { detail: state.manifest }));
    } else if (ev.key === ROLE_STORAGE_KEY) {
      state.role = readStoredRole();
      applyToDOM();
    }
  });

  root.HSKResourceSync = {
    getManifest,
    setManifest,
    getRole,
    setRole,
    checkFeature,
    checkItemAccess,
    filterAccessibleItems,
    applyToDOM,
    refreshFromServer,
    notifyBlocked
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
