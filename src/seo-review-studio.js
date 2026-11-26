(function () {
  'use strict';

  const DEFAULT_REPO_OWNER = 'trungxemcode';
  const DEFAULT_REPO_NAME = 'hsk';
  const DEFAULT_DRAFT_BRANCH = 'seo-drafts-state';
  const CLOUDFLARE_EDITORIAL_URL = 'https://hsk-seo-editorial.trung-hsk668.workers.dev';
  const WORKFLOW_FILE = 'seo-trends-drafts.yml';
  const FIRESTORE_DOC_ID = 'seo-editorial-gh-bridge';
  const SESSION_STORAGE_KEY = 'hsk-seo-review-session-v1';
  const LOCAL_GH_KEY = 'hsk-seo-review-gh-local-v1';

  const CATEGORY_LABELS = {
    'ky-thi': 'Kỳ thi & Đăng ký',
    'diem-so': 'Điểm số & Tra điểm',
    'meo-hoc': 'Mẹo học HSK',
    'ngu-phap': 'Phân biệt & Ngữ pháp',
  };

  const STATUS_LABELS = {
    pending_review: 'Chờ duyệt',
    approved: 'Đã xuất bản',
    rejected: 'Đã từ chối',
  };

  const $ = (id) => document.getElementById(id);

  let accountConfig = null;
  let authSession = null; // { email, uid, idToken, refreshToken, expiresAt }
  let ghConfig = {
    owner: DEFAULT_REPO_OWNER,
    repo: DEFAULT_REPO_NAME,
    draftBranch: DEFAULT_DRAFT_BRANCH,
    token: '',
    syncCloud: true,
  };
  let draftsData = { schema: 1, updatedAt: '', drafts: [] };
  let trendsSnapshot = { schema: 1, fetchedAt: '', sources: [], topics: [] };
  let cfLastRun = null;
  let selectedDraftId = '';
  let lastRenderedDraftId = '';
  let statusFilter = 'pending_review';
  let searchQuery = '';
  let activeViewTab = 'preview';
  let currentRating = 0;
  let csvFileContent = '';
  let pollTimer = null;

  function escHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function decodeBase64Utf8(b64) {
    const clean = String(b64 || '').replace(/\s+/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  function encodeUtf8Base64(text) {
    const bytes = new TextEncoder().encode(String(text || ''));
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function setStatusMsg(el, text, tone = '') {
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-ok', 'is-err', 'is-warn');
    if (tone) el.classList.add(tone);
  }

  function readJsonLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJsonLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }

  function formatTimeVi(iso) {
    if (!iso) return '—';
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return String(iso);
    return new Date(ts).toLocaleString('vi-VN', {
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function loadAccountConfig() {
    if (accountConfig) return accountConfig;
    const res = await fetch('./account-config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Không đọc được account-config.json');
    accountConfig = await res.json();
    return accountConfig;
  }

  function isExpectedAdminUid(uid) {
    return Boolean(accountConfig?.adminUid && uid === accountConfig.adminUid);
  }

  async function signInAdminWithPassword(email, password) {
    const cfg = await loadAccountConfig();
    const apiKey = cfg?.firebase?.apiKey;
    if (!apiKey) throw new Error('Thiếu cấu hình Firebase API key.');

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const code = data?.error?.message || '';
      if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(code)) {
        throw new Error('Email hoặc mật khẩu chưa đúng.');
      }
      if (/TOO_MANY_ATTEMPTS/.test(code)) {
        throw new Error('Thử sai quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.');
      }
      throw new Error(code || 'Đăng nhập thất bại.');
    }

    if (!isExpectedAdminUid(data.localId)) {
      throw new Error('Tài khoản này không có quyền Admin của phòng duyệt bài.');
    }

    const expiresInMs = Math.max(60, Number(data.expiresIn) || 3600) * 1000;
    authSession = {
      email: data.email || email,
      uid: data.localId,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + expiresInMs - 30000,
    };
    writeJsonLocal(SESSION_STORAGE_KEY, authSession);
    return authSession;
  }

  async function ensureValidIdToken() {
    if (!authSession) throw new Error('Chưa đăng nhập.');
    if (Date.now() < authSession.expiresAt && authSession.idToken) {
      return authSession.idToken;
    }
    const cfg = await loadAccountConfig();
    const apiKey = cfg?.firebase?.apiKey;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: authSession.refreshToken,
    });
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok || !data?.id_token) {
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    if (!isExpectedAdminUid(data.user_id)) {
      throw new Error('Sai UID Admin.');
    }
    authSession.idToken = data.id_token;
    authSession.refreshToken = data.refresh_token || authSession.refreshToken;
    authSession.expiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000 - 30000;
    writeJsonLocal(SESSION_STORAGE_KEY, authSession);
    return authSession.idToken;
  }

  async function loadGithubBridgeFromCloud() {
    try {
      const cfg = await loadAccountConfig();
      const idToken = await ensureValidIdToken();
      const projectId = cfg.firebase.projectId;
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(authSession.uid)}/items/${FIRESTORE_DOC_ID}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) return null;
      const doc = await res.json();
      const deleted = doc?.fields?.deleted?.booleanValue;
      const rawPayload = doc?.fields?.payload?.stringValue;
      if (deleted || !rawPayload) return null;
      return JSON.parse(rawPayload);
    } catch (_) {
      return null;
    }
  }

  async function saveGithubBridgeToCloud(payloadObj) {
    const cfg = await loadAccountConfig();
    const idToken = await ensureValidIdToken();
    const projectId = cfg.firebase.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:commit`;
    const body = {
      writes: [
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/users/${authSession.uid}/items/${FIRESTORE_DOC_ID}`,
            fields: {
              id: { stringValue: FIRESTORE_DOC_ID },
              time: { integerValue: String(Date.now()) },
              writer: { stringValue: 'seo-review-studio' },
              deleted: { booleanValue: false },
              payload: { stringValue: JSON.stringify(payloadObj) },
            },
          },
          updateTransforms: [
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
      ],
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Không lưu được cấu hình lên tài khoản Admin (${res.status}): ${errText}`);
    }
  }

  function githubHeaders() {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (ghConfig.token) {
      headers.Authorization = `Bearer ${ghConfig.token}`;
    }
    return headers;
  }

  async function cfHeaders(withJson = false) {
    const idToken = await ensureValidIdToken();
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    if (withJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async function fetchCloudflareEditorialState() {
    const res = await fetch(`${CLOUDFLARE_EDITORIAL_URL}/api/drafts?t=${Date.now()}`, {
      headers: await cfHeaders(false),
      cache: 'no-store',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `Cloudflare Worker HTTP ${res.status}`);
    }
    return await res.json();
  }

  async function callCloudflareEditorialPost(endpoint, payload) {
    const res = await fetch(`${CLOUDFLARE_EDITORIAL_URL}${endpoint}`, {
      method: 'POST',
      headers: await cfHeaders(true),
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Cloudflare Worker HTTP ${res.status}`);
    }
    return data;
  }

  async function fetchRepoJsonFile(filePath, fallbackRef = 'main') {
    const refsToTry = [ghConfig.draftBranch || DEFAULT_DRAFT_BRANCH];
    if (fallbackRef && !refsToTry.includes(fallbackRef)) refsToTry.push(fallbackRef);

    for (const ref of refsToTry) {
      const url = `https://api.github.com/repos/${encodeURIComponent(ghConfig.owner)}/${encodeURIComponent(ghConfig.repo)}/contents/${filePath}?ref=${encodeURIComponent(ref)}&t=${Date.now()}`;
      const res = await fetch(url, { headers: githubHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          return JSON.parse(decodeBase64Utf8(data.content));
        }
      }
    }
    throw new Error(`Không tải được ${filePath} từ GitHub (kiểm tra Token hoặc tên nhánh).`);
  }

  async function fetchLatestWorkflowRuns() {
    if (!ghConfig.token) return [];
    const url = `https://api.github.com/repos/${encodeURIComponent(ghConfig.owner)}/${encodeURIComponent(ghConfig.repo)}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=4&t=${Date.now()}`;
    const res = await fetch(url, { headers: githubHeaders(), cache: 'no-store' });
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
  }

  async function dispatchEditorialWorkflow(inputs) {
    if (!ghConfig.token) {
      throw new Error('Cần kết nối GitHub Fine-Grained Token trước khi duyệt hoặc sinh bài.');
    }
    const url = `https://api.github.com/repos/${encodeURIComponent(ghConfig.owner)}/${encodeURIComponent(ghConfig.repo)}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...githubHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub Actions từ chối lệnh (${res.status}): ${text.slice(0, 180)}`);
    }
  }

  function renderWorkflowStatus(runs = [], lastRun = cfLastRun) {
    const badge = $('workflowRunBadge');
    const link = $('workflowRunLink');
    if (!badge || !link) return;
    if (!runs.length) {
      link.hidden = true;
      if (lastRun?.at) {
        badge.hidden = false;
        badge.classList.remove('is-running', 'is-ok', 'is-fail');
        if (lastRun.status === 'generating') {
          badge.classList.add('is-running');
          badge.textContent = 'Cloudflare AI đang sinh bài nháp…';
        } else if (lastRun.error) {
          badge.classList.add('is-fail');
          badge.textContent = `Cloudflare chạy lỗi: ${lastRun.error}`;
        } else {
          badge.classList.add('is-ok');
          badge.textContent = `Cloudflare (${lastRun.trigger || 'cron'}): ${formatTimeVi(lastRun.at)}`;
        }
      } else {
        badge.hidden = true;
      }
      return;
    }
    const latest = runs[0];
    badge.hidden = false;
    badge.classList.remove('is-running', 'is-ok', 'is-fail');
    if (latest.status !== 'completed') {
      badge.classList.add('is-running');
      badge.textContent = `Đang xuất bản tĩnh (${latest.status})…`;
      scheduleWorkflowPolling();
    } else if (latest.conclusion === 'success') {
      badge.classList.add('is-ok');
      badge.textContent = `Xuất bản xong (${formatTimeVi(latest.updated_at)})`;
    } else {
      badge.classList.add('is-fail');
      badge.textContent = `Tác vụ gần nhất lỗi (${latest.conclusion || 'failed'})`;
    }
    if (latest.html_url) {
      link.href = latest.html_url;
      link.hidden = false;
    }
  }

  function scheduleWorkflowPolling() {
    if (pollTimer) return;
    pollTimer = setTimeout(async () => {
      pollTimer = null;
      if (!authSession || !ghConfig.token) return;
      const runs = await fetchLatestWorkflowRuns();
      renderWorkflowStatus(runs);
      if (runs[0]?.status === 'completed') {
        await reloadEditorialData();
      }
    }, 8000);
  }

  function updateCounters() {
    const drafts = draftsData?.drafts || [];
    const pending = drafts.filter((d) => d.status === 'pending_review').length;
    const approved = drafts.filter((d) => d.status === 'approved').length;
    const rejected = drafts.filter((d) => d.status === 'rejected').length;

    $('countPending').textContent = String(pending);
    $('countApproved').textContent = String(approved);
    $('countRejected').textContent = String(rejected);

    const lastScan = $('lastScanLabel');
    if (trendsSnapshot?.fetchedAt) {
      const srcStr = (trendsSnapshot.sources || []).join(', ') || 'Google Trends / Suggest VN';
      lastScan.textContent = `Quét Trends: ${formatTimeVi(trendsSnapshot.fetchedAt)} (${srcStr})`;
    } else {
      lastScan.textContent = 'Chưa có lượt quét Trends nào trên nhánh nháp';
    }
  }

  function getFilteredDrafts() {
    const all = Array.isArray(draftsData?.drafts) ? draftsData.drafts : [];
    const q = searchQuery.trim().toLowerCase();
    return all.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${d.article?.title || ''} ${d.trendQuery || ''} ${d.hskTag || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  function renderDraftList() {
    const listEl = $('draftList');
    if (!listEl) return;
    const items = getFilteredDrafts();

    if (!items.length) {
      listEl.innerHTML = '<div style="padding:1rem;font-size:0.84rem;color:var(--rev-muted)">Không có bản nháp nào khớp bộ lọc.</div>';
      return;
    }

    if (!items.some((d) => d.id === selectedDraftId)) {
      selectedDraftId = items[0].id;
    }

    listEl.innerHTML = items.map((d) => {
      const selected = d.id === selectedDraftId ? ' is-selected' : '';
      const score = d.quality?.score ?? '—';
      const spike = d.trendSpike ? ` · ${escHtml(d.trendSpike)}` : '';
      const stars = d.rating ? ` · ${d.rating}★` : '';
      const xkiroAvg = typeof d.aiReviews?.averageScore === 'number' ? ` · xKiro ${d.aiReviews.averageScore}` : '';
      return `<button type="button" class="rev-draft-card${selected}" data-draft-id="${escHtml(d.id)}">
        <div class="rev-card-top">
          <span class="rev-card-source">${escHtml(d.trendSource || 'google-trends')}${spike} · v${escHtml(d.version || 1)}</span>
          <span class="rev-card-score">SEO ${escHtml(score)}${escHtml(xkiroAvg)}${stars}</span>
        </div>
        <h3 class="rev-card-title">${escHtml(d.article?.title || d.trendQuery)}</h3>
        <span class="rev-card-query">Từ khóa: ${escHtml(d.trendQuery || '—')}</span>
      </button>`;
    }).join('');

    listEl.querySelectorAll('.rev-draft-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDraftId = btn.getAttribute('data-draft-id') || '';
        renderDraftList();
        renderSelectedDraft();
        $('revWorkspace')?.setAttribute('data-mobile-pane', 'review');
        document.querySelectorAll('.rev-mob-tab').forEach((t) => {
          const on = t.getAttribute('data-mob-pane') === 'review';
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      });
    });
  }

  function renderArticlePreviewHtml(draft) {
    const a = draft.article || {};
    const catLabel = a.categoryLabel || CATEGORY_LABELS[a.category] || 'Mẹo học HSK';
    const sectionsHtml = (a.sections || []).map((sec, idx) => {
      const paragraphs = (sec.paragraphs || []).map((p) => `<p>${escHtml(p)}</p>`).join('');
      const bullets = Array.isArray(sec.bullets) && sec.bullets.length
        ? `<ul>${sec.bullets.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul>`
        : '';
      const table = sec.table && Array.isArray(sec.table.headers) && Array.isArray(sec.table.rows)
        ? `<div class="rev-table-scroll"><table class="rev-table"><thead><tr>${sec.table.headers.map((h) => `<th>${escHtml(h)}</th>`).join('')}</tr></thead><tbody>${sec.table.rows.map((r) => `<tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : '';
      const example = sec.example?.han
        ? `<div class="rev-example"><span class="cn" lang="zh-Hans">${escHtml(sec.example.han)}</span>${sec.example.py ? `<span class="py">${escHtml(sec.example.py)}</span>` : ''}${sec.example.vi ? `<span class="vi">${escHtml(sec.example.vi)}</span>` : ''}</div>`
        : '';
      const tip = sec.tip ? `<div class="rev-tip"><strong>Mẹo ghi nhớ:</strong> ${escHtml(sec.tip)}</div>` : '';

      return `<section class="rev-sec"><h2>${idx + 1}. ${escHtml(sec.heading)}</h2>${paragraphs}${bullets}${table}${example}${tip}</section>`;
    }).join('');

    const faqsHtml = Array.isArray(a.faqs) && a.faqs.length
      ? `<section class="rev-sec"><h2>Câu hỏi thường gặp (FAQ Schema)</h2><div class="rev-faq-list">${a.faqs.map((f) => `<div class="rev-faq-item"><strong>${escHtml(f.q)}</strong><p>${escHtml(f.a)}</p></div>`).join('')}</div></section>`
      : '';

    const ctaHtml = a.cta?.heading
      ? `<section class="rev-sec"><div class="rev-meta-box"><strong>CTA cuối bài: ${escHtml(a.cta.heading)}</strong><span>${escHtml(a.cta.body || '')}</span><span>Nút: <strong>${escHtml(a.cta.buttonLabel || 'Vào học ngay')}</strong></span></div></section>`
      : '';

    return `<article class="rev-article">
      <div class="rev-meta-box">
        <span><strong>URL dự kiến:</strong> /bai-viet/${escHtml(a.slug || draft.publishedSlug || '')} · <strong>Chuyên mục:</strong> ${escHtml(catLabel)}</span>
        <span><strong>Meta Title:</strong> ${escHtml(a.metaTitle || '')} (${String(a.metaTitle || '').length} ký tự)</span>
        <span><strong>Meta Description:</strong> ${escHtml(a.metaDescription || '')} (${String(a.metaDescription || '').length} ký tự)</span>
      </div>
      <h1>${escHtml(a.title || '')}</h1>
      <p class="rev-summary">${escHtml(a.summary || '')}</p>
      ${sectionsHtml}
      ${faqsHtml}
      ${ctaHtml}
    </article>`;
  }

  function renderPipelineStripHtml(draft) {
    const rev1 = (draft.aiReviews?.reviewers || []).find((r) => r.id === 'command-a-plus') || draft.aiReviews?.reviewers?.[0];
    const rev2 = (draft.aiReviews?.reviewers || []).find((r) => r.id === 'mistral-large-3') || draft.aiReviews?.reviewers?.[1];
    const stepClass = (r) => {
      if (!r || r.status === 'skipped' || r.status === 'error') return '';
      return r.verdict === 'pass' ? ' is-done' : ' is-revise';
    };
    const verdictBadge = (r) => {
      if (!r) return '';
      if (r.status === 'skipped') return ' (bỏ qua)';
      const v = r.auditVerdict ? ` · ${r.auditVerdict}` : '';
      return typeof r.score === 'number' ? ` (${r.score}/100${v})` : v;
    };
    const label1 = rev1?.label || 'Vòng 1';
    const label2 = rev2?.label || 'Vòng 2';
    const adminClass = draft.status === 'approved' ? ' is-done' : draft.status === 'pending_review' ? ' is-active' : '';
    const writerLabel = draft.aiReviews?.writerStandard
      ? `1. Viết bài (${draft.aiReviews.writerStandard})`
      : '1. Gemma 4 viết';

    return [
      `<span class="rev-pipe-step is-done">${escHtml(writerLabel)}</span>`,
      `<span class="rev-pipe-step${stepClass(rev1)}">2. ${escHtml(label1)}${escHtml(verdictBadge(rev1))}</span>`,
      `<span class="rev-pipe-step${stepClass(rev2)}">3. ${escHtml(label2)}${escHtml(verdictBadge(rev2))}</span>`,
      `<span class="rev-pipe-step${adminClass}">4. ${draft.status === 'approved' ? 'Admin đã duyệt ✓' : 'Admin duyệt cuối'}</span>`,
    ].join('');
  }

  function renderCategoryRubricTable(catMap) {
    if (!catMap || typeof catMap !== 'object') return '';
    const rows = Object.values(catMap).map((c) => `<tr>
      <td><strong>${escHtml(c.code)}</strong></td>
      <td>${escHtml(c.name)}</td>
      <td><strong>${escHtml(c.score)} / ${escHtml(c.max)}</strong></td>
      <td>${escHtml(c.evidence || '—')}</td>
    </tr>`).join('');
    if (!rows) return '';
    return `<div class="rev-table-scroll" style="margin:0.65rem 0">
      <table class="rev-table">
        <thead><tr><th>Mã</th><th>Hạng mục</th><th>Điểm</th><th>Bằng chứng</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  function renderAuditHtml(draft) {
    const q = draft.quality || { score: 0, checks: [], warnings: [] };
    const aiRev = draft.aiReviews;
    const wb = draft.writerBrief;
    const writerBriefHtml = wb && typeof wb === 'object'
      ? `<div class="rev-meta-box">
          <strong>Hồ sơ bàn giao người viết (${escHtml(aiRev?.writerStandard || 'SEO-WRITER-01')})</strong>
          <span><strong>Văn phong:</strong> ${escHtml(wb.styleId || draft.editorialVoice || '—')}${wb.styleReason ? ` — ${escHtml(wb.styleReason)}` : ''}</span>
          ${wb.searchIntent ? `<span><strong>Search Intent:</strong> ${escHtml(wb.searchIntent)}${wb.targetAudience ? ` · <strong>Độc giả:</strong> ${escHtml(wb.targetAudience)}` : ''}</span>` : ''}
          ${Array.isArray(wb.unverifiedNotes) && wb.unverifiedNotes.length ? `<span><strong>Lưu ý chưa xác minh:</strong> ${escHtml(wb.unverifiedNotes.join('; '))}</span>` : ''}
        </div>`
      : '';

    const councilTitle = aiRev?.protocol
      ? `Hội đồng kiểm duyệt độc lập 2 vòng (${aiRev.protocol})`
      : (aiRev?.provider === 'cloudflare-ai' ? 'Hội đồng kiểm duyệt Cloudflare Workers AI' : 'Hội đồng kiểm duyệt AI (xKiro / Cloudflare)');

    const councilHtml = aiRev && Array.isArray(aiRev.reviewers) && aiRev.reviewers.length
      ? `<div>
          <h3>${escHtml(councilTitle)}</h3>
          ${aiRev.autoPolished ? `<div class="rev-tip" style="margin-bottom:0.75rem"><strong>Người viết đã chỉnh sửa giữa Vòng 1 &amp; Vòng 2 (qua tường lửa phản hồi):</strong> ${escHtml(aiRev.polishSummary || '')}</div>` : ''}
          <div class="rev-council-grid">
            ${aiRev.reviewers.map((r) => {
              const badgeClass = r.auditVerdict === 'APPROVED' || r.verdict === 'pass'
                ? 'is-ok'
                : r.auditVerdict === 'REJECTED' || r.status === 'error'
                  ? 'is-fail'
                  : r.verdict === 'revise'
                    ? 'is-warn'
                    : '';
              const badgeLabel = typeof r.score === 'number'
                ? `${r.score}/100${r.band ? ` (${r.band})` : ''} · ${r.auditVerdict || (r.verdict === 'pass' ? 'Đạt' : 'Cần sửa')}`
                : r.status === 'skipped' ? 'Chưa bật / Bỏ qua' : 'Lỗi gọi API';

              const structuredErrors = Array.isArray(r.errors) ? r.errors : [];
              const hardFailsHtml = Array.isArray(r.hardFails) && r.hardFails.length
                ? `<ul class="rev-council-list is-warn">${r.hardFails.map((hf) => `<li><strong>[${escHtml(hf.code)}]</strong> ${escHtml(hf.location ? `${hf.location}: ` : '')}${escHtml(hf.reason || hf.label)}</li>`).join('')}</ul>`
                : '';
              const errorsHtml = structuredErrors.length
                ? `<ul class="rev-council-list is-warn">${structuredErrors.map((e) => `<li><strong>[${escHtml(e.code)} · ${escHtml(e.severity)} · ${escHtml(e.location)}]</strong> ${escHtml(e.reason)}${e.fix ? ` <em>(Sửa: ${escHtml(e.fix)})</em>` : ''}</li>`).join('')}</ul>`
                : '';
              const allIssues = [...(r.mustFix || []).map((x) => `[Bắt buộc] ${x}`), ...(r.issues || [])];
              const legacyIssuesHtml = !structuredErrors.length && allIssues.length
                ? `<ul class="rev-council-list is-warn">${allIssues.map((iss) => `<li>! ${escHtml(iss)}</li>`).join('')}</ul>`
                : '';
              const challengesHtml = Array.isArray(r.challengeResults) && r.challengeResults.length
                ? `<div class="rev-table-scroll" style="margin-top:0.5rem"><table class="rev-table"><thead><tr><th>Phép thử</th><th>Nhóm</th><th>Kết quả</th><th>Phát hiện</th></tr></thead><tbody>${r.challengeResults.map((ch) => `<tr><td>${escHtml(ch.id)}</td><td>${escHtml(ch.group)}</td><td>${escHtml(ch.result)}</td><td>${escHtml(ch.finding)}</td></tr>`).join('')}</tbody></table></div>`
                : '';
              const feedbackText = allIssues.length ? `${r.label}: ${allIssues.join('; ')}` : '';
              return `<div class="rev-council-card">
                <div class="rev-council-head">
                  <div>
                    <strong>${escHtml(r.label)}</strong>
                    <small>${escHtml(r.role || '')} · <code>${escHtml(r.model || '')}</code></small>
                  </div>
                  <span class="rev-tag ${badgeClass}">${escHtml(badgeLabel)}</span>
                </div>
                <p class="rev-council-summary">${escHtml(r.summary || '')}</p>
                ${Array.isArray(r.below60Categories) && r.below60Categories.length ? `<p style="font-size:0.8rem;color:var(--rev-amber);margin:0.25rem 0">Hạng mục dưới 60%: <strong>${escHtml(r.below60Categories.join(', '))}</strong></p>` : ''}
                ${renderCategoryRubricTable(r.categoryBreakdown)}
                ${(r.strengths || []).length ? `<ul class="rev-council-list is-ok">${r.strengths.map((s) => `<li>✓ ${escHtml(s)}</li>`).join('')}</ul>` : ''}
                ${hardFailsHtml}
                ${errorsHtml}
                ${legacyIssuesHtml}
                ${challengesHtml}
                ${feedbackText ? `<button type="button" class="rev-quick-chip" data-use-ai-feedback="${escHtml(feedbackText)}">+ Đưa góp ý ${escHtml(r.label)} vào ô viết lại</button>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`
      : '<div><h3>Hội đồng kiểm duyệt AI</h3><p style="color:var(--rev-muted)">Bản nháp này chưa có kết quả kiểm duyệt AI.</p></div>';

    const checksHtml = (q.checks || []).length
      ? `<ul class="rev-audit-list is-ok">${q.checks.map((c) => `<li>✓ ${escHtml(c)}</li>`).join('')}</ul>`
      : '<p>Chưa có checklist đạt chuẩn.</p>';
    const warningsHtml = (q.warnings || []).length
      ? `<ul class="rev-audit-list is-warn">${q.warnings.map((w) => `<li>! ${escHtml(w)}</li>`).join('')}</ul>`
      : '<p style="color:var(--rev-emerald)">Không có cảnh báo chất lượng SEO nào.</p>';
    const historyHtml = (draft.reviewHistory || []).length
      ? draft.reviewHistory.slice().reverse().map((h) => `<div class="rev-history-item">
          <strong>${escHtml(h.action)} · ${escHtml(formatTimeVi(h.at))}${h.rating ? ` · ${h.rating}/5★` : ''}</strong>
          <span>${escHtml(h.comment || '')}</span>
          ${h.revisionSummary ? `<span style="color:var(--rev-emerald)">AI đã sửa: ${escHtml(h.revisionSummary)}</span>` : ''}
        </div>`).join('')
      : '<p>Chưa có lịch sử chỉnh sửa.</p>';

    return `<div class="rev-audit-grid">
      ${writerBriefHtml}
      ${councilHtml}
      <div><h3>Điểm kiểm định tự động: ${escHtml(q.score)} / 100</h3>${checksHtml}</div>
      <div><h3>Điểm cần lưu ý trước khi duyệt</h3>${warningsHtml}</div>
      <div><h3>Từ khóa SEO</h3><p>${escHtml((draft.article?.keywords || []).join(' · '))}</p></div>
      <div><h3>Lịch sử duyệt &amp; viết lại</h3><div style="display:grid;gap:0.5rem">${historyHtml}</div></div>
    </div>`;
  }

  function renderTrendsHtml() {
    const topics = trendsSnapshot?.topics || [];
    if (!topics.length) {
      return '<p>Chưa có snapshot xu hướng từ Google Trends / Suggest VN. Bấm “Quét Trends & Sinh bài” để chạy thu thập ngay.</p>';
    }
    return `<div>
      <p><strong>Lần quét gần nhất:</strong> ${escHtml(formatTimeVi(trendsSnapshot.fetchedAt))} · <strong>Nguồn:</strong> ${escHtml((trendsSnapshot.sources || []).join(', ') || '—')}</p>
      <div class="rev-table-scroll"><table class="rev-table">
        <thead><tr><th>Cụm từ tìm kiếm</th><th>Nguồn &amp; Tăng trưởng</th><th>Chuyên mục gợi ý</th><th>Điểm xếp hạng</th></tr></thead>
        <tbody>${topics.map((t) => `<tr><td><strong>${escHtml(t.query)}</strong></td><td>${escHtml(t.source)}${t.spike ? ` (${escHtml(t.spike)})` : ''}</td><td>${escHtml(CATEGORY_LABELS[t.category] || t.category)}</td><td>${escHtml(t.score)}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  }

  function updateStarsUi(rating) {
    currentRating = rating || 0;
    document.querySelectorAll('#starButtons .rev-star').forEach((btn) => {
      const val = Number(btn.getAttribute('data-star'));
      btn.classList.toggle('is-on', val <= currentRating);
    });
    $('ratingValueText').textContent = currentRating ? `${currentRating}/5 sao` : 'Chưa chấm sao';
  }

  function renderSelectedDraft() {
    const items = getFilteredDrafts();
    const draft = items.find((d) => d.id === selectedDraftId) || null;
    const emptyEl = $('emptyState');
    const viewerEl = $('draftViewer');

    if (!draft) {
      emptyEl.hidden = false;
      viewerEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    viewerEl.hidden = false;

    const statusTone = draft.status === 'approved' ? 'is-ok' : draft.status === 'rejected' ? 'is-fail' : 'is-accent';
    const score = draft.quality?.score ?? 0;
    const scoreTone = score >= 85 ? 'is-ok' : score >= 65 ? 'is-warn' : 'is-fail';
    const xkiroBadges = (draft.aiReviews?.reviewers || []).map((r) => {
      if (typeof r.score !== 'number') return '';
      const tone = r.verdict === 'pass' ? 'is-ok' : 'is-warn';
      return `<span class="rev-tag ${tone}">${escHtml(r.label)}: ${escHtml(r.score)}/100</span>`;
    });

    if ($('pipelineStrip')) {
      $('pipelineStrip').innerHTML = renderPipelineStripHtml(draft);
    }

    $('draftBadges').innerHTML = [
      `<span class="rev-tag ${statusTone}">${escHtml(STATUS_LABELS[draft.status] || draft.status)}</span>`,
      `<span class="rev-tag ${scoreTone}">SEO ${escHtml(score)}/100</span>`,
      ...xkiroBadges,
      draft.aiReviews?.autoPolished ? '<span class="rev-tag is-accent">Đã tự chỉnh sửa vòng 2</span>' : '',
      `<span class="rev-tag">v${escHtml(draft.version || 1)}</span>`,
      `<span class="rev-tag">${escHtml(draft.trendSource || 'google-trends')}${draft.trendSpike ? ` · ${escHtml(draft.trendSpike)}` : ''}</span>`,
      draft.publishedSlug ? `<span class="rev-tag is-ok">/bai-viet/${escHtml(draft.publishedSlug)}</span>` : '',
    ].filter(Boolean).join('');

    $('tabPreview').innerHTML = renderArticlePreviewHtml(draft);
    $('tabAudit').innerHTML = renderAuditHtml(draft);
    $('tabTrends').innerHTML = renderTrendsHtml();

    $('tabAudit').querySelectorAll('[data-use-ai-feedback]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const snippet = btn.getAttribute('data-use-ai-feedback') || '';
        const area = $('reviewCommentInput');
        if (!area || !snippet) return;
        area.value = area.value.trim() ? `${area.value.trim()}\n- ${snippet}` : `- ${snippet}`;
        area.focus();
      });
    });

    $('tabPreview').hidden = activeViewTab !== 'preview';
    $('tabAudit').hidden = activeViewTab !== 'audit';
    $('tabTrends').hidden = activeViewTab !== 'trends';

    const switchedDraft = lastRenderedDraftId !== draft.id;
    lastRenderedDraftId = draft.id;
    if (switchedDraft || draft.rating) {
      updateStarsUi(draft.rating || 0);
    }
    if (switchedDraft) {
      setStatusMsg($('actionStatus'), '');
    }

    const isApproved = draft.status === 'approved';
    $('approveBtn').disabled = isApproved;
    $('rewriteBtn').disabled = isApproved;
    $('rejectBtn').disabled = isApproved;
  }

  async function reloadEditorialData() {
    const refreshBtn = $('refreshDataBtn');
    if (refreshBtn) refreshBtn.disabled = true;
    try {
      let loadedDrafts = null;
      let loadedSnapshot = null;
      cfLastRun = null;

      try {
        const cfState = await fetchCloudflareEditorialState();
        loadedDrafts = cfState?.draftsData || { schema: 1, updatedAt: '', drafts: [] };
        loadedSnapshot = cfState?.trendsSnapshot || { schema: 1, fetchedAt: '', sources: [], topics: [] };
        cfLastRun = cfState?.lastRun || null;
      } catch (_) {
        loadedDrafts = await fetchRepoJsonFile('content/seo-articles/drafts.json', 'main').catch(() => ({ schema: 1, updatedAt: '', drafts: [] }));
        loadedSnapshot = await fetchRepoJsonFile('content/seo-articles/trends-snapshot.json', 'main').catch(() => ({ schema: 1, fetchedAt: '', sources: [], topics: [] }));
      }

      const runs = await fetchLatestWorkflowRuns().catch(() => []);
      draftsData = loadedDrafts;
      trendsSnapshot = loadedSnapshot;
      updateCounters();
      renderDraftList();
      renderSelectedDraft();
      renderWorkflowStatus(runs, cfLastRun);
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  async function enterAuthenticatedStudio() {
    $('authGate').hidden = true;
    $('studioApp').hidden = false;
    $('adminEmailBadge').textContent = `Admin · ${authSession.email}`;

    const localCfg = readJsonLocal(LOCAL_GH_KEY, null);
    if (localCfg) ghConfig = { ...ghConfig, ...localCfg };

    const cloudCfg = await loadGithubBridgeFromCloud();
    if (cloudCfg?.token) {
      ghConfig = { ...ghConfig, ...cloudCfg, syncCloud: true };
      writeJsonLocal(LOCAL_GH_KEY, ghConfig);
    }

    $('ghOwnerInput').value = ghConfig.owner || DEFAULT_REPO_OWNER;
    $('ghRepoInput').value = ghConfig.repo || DEFAULT_REPO_NAME;
    $('ghBranchInput').value = ghConfig.draftBranch || DEFAULT_DRAFT_BRANCH;
    $('ghTokenInput').value = ghConfig.token || '';
    $('syncTokenCloudChk').checked = ghConfig.syncCloud !== false;

    await reloadEditorialData();
  }

  // Event bindings
  $('togglePasswordBtn')?.addEventListener('click', () => {
    const input = $('adminPasswordInput');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    $('togglePasswordBtn').textContent = show ? 'Ẩn' : 'Hiện';
  });

  $('adminLoginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('adminEmailInput').value.trim();
    const password = $('adminPasswordInput').value;
    const btn = $('adminLoginBtn');
    const st = $('authStatus');
    btn.disabled = true;
    setStatusMsg(st, 'Đang xác thực tài khoản Admin…');
    try {
      await signInAdminWithPassword(email, password);
      $('adminPasswordInput').value = '';
      setStatusMsg(st, '');
      await enterAuthenticatedStudio();
    } catch (err) {
      setStatusMsg(st, err.message || 'Đăng nhập thất bại.', 'is-err');
    } finally {
      btn.disabled = false;
    }
  });

  $('adminLogoutBtn')?.addEventListener('click', () => {
    authSession = null;
    removeLocal(SESSION_STORAGE_KEY);
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    $('studioApp').hidden = true;
    $('authGate').hidden = false;
  });

  $('revThemeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('hsk-theme-v1', next); } catch (_) {}
  });

  $('refreshDataBtn')?.addEventListener('click', () => {
    reloadEditorialData().catch((err) => setStatusMsg($('actionStatus'), err.message, 'is-err'));
  });

  document.querySelectorAll('.rev-filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      statusFilter = btn.getAttribute('data-status-filter') || 'pending_review';
      document.querySelectorAll('.rev-filter-chip').forEach((b) => b.classList.toggle('is-active', b === btn));
      renderDraftList();
      renderSelectedDraft();
    });
  });

  $('draftSearchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value || '';
    renderDraftList();
    renderSelectedDraft();
  });

  document.querySelectorAll('.rev-subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeViewTab = btn.getAttribute('data-view-tab') || 'preview';
      document.querySelectorAll('.rev-subtab').forEach((b) => b.classList.toggle('is-active', b === btn));
      renderSelectedDraft();
    });
  });

  document.querySelectorAll('.rev-mob-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pane = btn.getAttribute('data-mob-pane') || 'list';
      $('revWorkspace')?.setAttribute('data-mobile-pane', pane);
      document.querySelectorAll('.rev-mob-tab').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
  });

  document.querySelectorAll('#starButtons .rev-star').forEach((btn) => {
    btn.addEventListener('click', () => updateStarsUi(Number(btn.getAttribute('data-star'))));
  });

  document.querySelectorAll('.rev-quick-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const snippet = chip.getAttribute('data-comment-snippet') || '';
      const area = $('reviewCommentInput');
      if (!area) return;
      area.value = area.value.trim() ? `${area.value.trim()}\n- ${snippet}` : `- ${snippet}`;
      area.focus();
    });
  });

  async function handleEditorialAction(action) {
    const items = getFilteredDrafts();
    const draft = items.find((d) => d.id === selectedDraftId);
    if (!draft) return;

    const comment = $('reviewCommentInput').value.trim();
    const st = $('actionStatus');
    if (action === 'rewrite' && !comment) {
      setStatusMsg(st, 'Hãy nhập góp ý hoặc chọn chip gợi ý để AI biết cần sửa điểm nào.', 'is-warn');
      $('reviewCommentInput').focus();
      return;
    }

    const buttons = [$('approveBtn'), $('rewriteBtn'), $('rejectBtn')];
    buttons.forEach((b) => { if (b) b.disabled = true; });
    setStatusMsg(
      st,
      action === 'rewrite'
        ? 'Đang gửi góp ý tới Cloudflare AI để viết lại & kiểm duyệt lại…'
        : action === 'approve'
          ? 'Đang xác nhận duyệt bài trên Cloudflare R2…'
          : 'Đang cập nhật trạng thái từ chối trên Cloudflare R2…'
    );

    try {
      if (action === 'rewrite') {
        const cfRes = await callCloudflareEditorialPost('/api/rewrite', {
          draftId: draft.id,
          comment,
          rating: currentRating || null,
        });
        if (cfRes?.draftsData) draftsData = cfRes.draftsData;
        $('reviewCommentInput').value = '';
        updateCounters();
        renderDraftList();
        renderSelectedDraft();
        setStatusMsg(st, `Đã viết lại xong phiên bản v${cfRes?.draft?.version || (draft.version || 1) + 1} và cập nhật đánh giá AI!`, 'is-ok');
        return;
      }

      if (action === 'reject') {
        const cfRes = await callCloudflareEditorialPost('/api/reject', {
          draftId: draft.id,
          comment,
          rating: currentRating || null,
        });
        if (cfRes?.draftsData) draftsData = cfRes.draftsData;
        $('reviewCommentInput').value = '';
        updateCounters();
        renderDraftList();
        renderSelectedDraft();
        setStatusMsg(st, 'Đã từ chối bản nháp và cập nhật bộ chống trùng lặp trên Cloudflare R2.', 'is-ok');
        return;
      }

      // action === 'approve'
      const cfRes = await callCloudflareEditorialPost('/api/approve', {
        draftId: draft.id,
        comment,
        rating: currentRating || null,
      });
      if (cfRes?.draftsData) draftsData = cfRes.draftsData;
      updateCounters();
      renderDraftList();
      renderSelectedDraft();

      if (ghConfig.token && cfRes?.article) {
        setStatusMsg(st, 'Đã duyệt trên Cloudflare R2! Đang gửi lệnh xuất bản HTML tĩnh tới GitHub Actions…');
        await dispatchEditorialWorkflow({
          action: 'approve',
          draft_id: draft.id,
          article_json_b64: encodeUtf8Base64(JSON.stringify(cfRes.article)),
          rating: currentRating ? String(currentRating) : '',
          comment,
          publish_mode: 'auto-publish',
        });
        setStatusMsg(st, 'Đã duyệt! GitHub Actions đang kiểm định SEO, build HTML và tự động xuất bản live…', 'is-ok');
        const runs = await fetchLatestWorkflowRuns();
        renderWorkflowStatus(runs, cfLastRun);
        scheduleWorkflowPolling();
      } else {
        setStatusMsg(
          st,
          'Đã đánh dấu ĐÃ DUYỆT trên Cloudflare R2. Hãy bấm “Kết nối GitHub” để nạp Token và đẩy bài lên trang công khai.',
          'is-warn'
        );
      }
    } catch (err) {
      setStatusMsg(st, err.message || 'Chưa xử lý được lệnh.', 'is-err');
    } finally {
      buttons.forEach((b) => { if (b) b.disabled = false; });
    }
  }

  $('approveBtn')?.addEventListener('click', () => handleEditorialAction('approve'));
  $('rewriteBtn')?.addEventListener('click', () => handleEditorialAction('rewrite'));
  $('rejectBtn')?.addEventListener('click', () => handleEditorialAction('reject'));

  // Modals
  function openModal(id) {
    const dlg = $(id);
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
  }
  function closeModal(id) {
    const dlg = $(id);
    if (dlg && dlg.open) dlg.close();
  }
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
  });

  $('openGithubModalBtn')?.addEventListener('click', () => openModal('githubModal'));
  $('emptyGithubBtn')?.addEventListener('click', () => openModal('githubModal'));
  $('openScanModalBtn')?.addEventListener('click', () => openModal('scanModal'));
  $('emptyScanBtn')?.addEventListener('click', () => openModal('scanModal'));

  $('githubConfigForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = $('githubModalStatus');
    const saveBtn = $('saveGithubBtn');
    saveBtn.disabled = true;
    setStatusMsg(st, 'Đang lưu và đồng bộ cấu hình…');

    const nextCfg = {
      owner: $('ghOwnerInput').value.trim() || DEFAULT_REPO_OWNER,
      repo: $('ghRepoInput').value.trim() || DEFAULT_REPO_NAME,
      draftBranch: $('ghBranchInput').value.trim() || DEFAULT_DRAFT_BRANCH,
      token: $('ghTokenInput').value.trim(),
      syncCloud: $('syncTokenCloudChk').checked,
    };

    try {
      ghConfig = nextCfg;
      writeJsonLocal(LOCAL_GH_KEY, ghConfig);
      if (ghConfig.syncCloud && ghConfig.token) {
        await saveGithubBridgeToCloud({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          draftBranch: ghConfig.draftBranch,
          token: ghConfig.token,
        });
      }
      await reloadEditorialData();
      setStatusMsg(st, 'Đã lưu cấu hình và tải danh sách bản nháp thành công.', 'is-ok');
      setTimeout(() => closeModal('githubModal'), 500);
    } catch (err) {
      setStatusMsg(st, err.message || 'Lưu cấu hình thất bại.', 'is-err');
    } finally {
      saveBtn.disabled = false;
    }
  });

  $('scanCsvFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      csvFileContent = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      csvFileContent = String(reader.result || '');
      setStatusMsg($('scanModalStatus'), `Đã nạp file CSV "${file.name}" (${csvFileContent.length} ký tự).`, 'is-ok');
    };
    reader.readAsText(file, 'utf-8');
  });

  $('scanForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = $('scanModalStatus');
    const btn = $('triggerScanBtn');
    btn.disabled = true;
    setStatusMsg(st, 'Đang quét Google Trends VN & chạy hội đồng AI trên Cloudflare (khoảng 30–60 giây)…');
    try {
      const cfRes = await callCloudflareEditorialPost('/api/scan-trends', {
        count: Math.max(1, Math.min(2, Number($('scanCountInput').value) || 1)),
        customQueries: $('scanQueriesInput').value.trim(),
        csvText: csvFileContent || '',
      });
      if (cfRes?.draftsData) draftsData = cfRes.draftsData;
      if (cfRes?.trendsSnapshot) trendsSnapshot = cfRes.trendsSnapshot;
      if (cfRes?.lastRun) cfLastRun = cfRes.lastRun;
      if (cfRes?.createdIds?.[0]) {
        selectedDraftId = cfRes.createdIds[0];
      }
      updateCounters();
      renderDraftList();
      renderSelectedDraft();
      renderWorkflowStatus([], cfLastRun);
      const createdCount = cfRes?.createdIds?.length || 0;
      setStatusMsg(st, `Đã sinh xong ${createdCount} bài nháp mới từ Google Trends và lưu trên Cloudflare R2!`, 'is-ok');
      setTimeout(() => closeModal('scanModal'), 700);
    } catch (err) {
      setStatusMsg(st, err.message || 'Không chạy được bộ quét Cloudflare.', 'is-err');
    } finally {
      btn.disabled = false;
    }
  });

  // Boot session check
  (async function boot() {
    try {
      await loadAccountConfig();
      if (accountConfig?.adminEmail && $('adminEmailInput')) {
        $('adminEmailInput').placeholder = accountConfig.adminEmail;
      }
      const savedSession = readJsonLocal(SESSION_STORAGE_KEY, null);
      if (savedSession?.uid && savedSession?.refreshToken && isExpectedAdminUid(savedSession.uid)) {
        authSession = savedSession;
        await ensureValidIdToken();
        await enterAuthenticatedStudio();
      }
    } catch (_) {
      authSession = null;
      removeLocal(SESSION_STORAGE_KEY);
    }
  })();
})();
