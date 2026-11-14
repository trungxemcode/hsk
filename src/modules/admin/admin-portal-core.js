(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HSKAdminPortalCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ACCESS_LEVELS = ['public', 'vip', 'hidden'];
  const ACCESS_LABELS = {
    public: 'Công khai',
    vip: 'Chỉ VIP',
    hidden: 'Ẩn hoàn toàn'
  };

  const CONTROLLABLE_FEATURES = [
    { id: 'study4', route: 'study4', label: 'Luyện thi Study4 HSK 1–6', group: 'Luyện thi' },
    { id: 'exam', route: 'exam', label: 'Thi thử / Bộ đề Drive', group: 'Luyện thi' },
    { id: 'music-play', route: 'music-play', label: 'Nhạc & Nghe nhạc', group: 'Giải trí' },
    { id: 'podcast', route: 'podcast', label: 'Luyện nghe Podcast YouTube', group: 'Giải trí' },
    { id: 'real-reading', route: 'real-reading', label: 'Đọc báo / Văn bản thực tế', group: 'Đọc hiểu' },
    { id: 'ai-qa', route: 'ai-qa', label: 'Hỏi đáp AI & Gia sư', group: 'AI' },
    { id: 'sentence-editor', route: 'sentence-editor', label: 'Soạn thảo & Kiểm tra câu AI', group: 'AI' },
    { id: 'translator', route: 'translator', label: 'Dịch thuật', group: 'Công cụ' },
    { id: 'writing', route: 'writing', label: 'Luyện viết chữ Hán', group: 'Luyện tập' }
  ];

  const DEFAULT_ENDPOINTS = {
    examManifestUrl: '',
    driveExamDataUrl: './drive-exam-data.json.gz',
    musicCloudEndpoint: 'https://hsk-music-library.trung-hsk668.workers.dev'
  };

  const DEFAULT_EXAMS = [
    { id: '4905', level: 1, title: 'HSK 1 · Bộ đề chuẩn', provider: 'study4', url: '', access: 'public', note: '' },
    { id: '4918', level: 2, title: 'HSK 2 · Bộ đề chuẩn', provider: 'study4', url: '', access: 'public', note: '' },
    { id: '5048', level: 3, title: 'HSK 3 · Bộ đề chuẩn', provider: 'study4', url: '', access: 'public', note: '' },
    { id: '6743', level: 4, title: 'HSK 4 · Bộ đề chuẩn', provider: 'study4', url: '', access: 'public', note: '' },
    { id: '6753', level: 5, title: 'HSK 5 · Bộ đề chuẩn', provider: 'study4', url: '', access: 'public', note: '' },
    { id: '6785', level: 6, title: 'HSK 6 · Bộ đề chuẩn', provider: 'study4', url: '', access: 'public', note: '' }
  ];

  const DEFAULT_PODCASTS = [
    {
      id: 'bb-hsk12-hui-yao-neng',
      level: 2,
      title: 'HSK 1–3 | Phân biệt 会 · 要 · 能 (BaoBao Mandarin)',
      youtubeUrl: 'https://www.youtube.com/watch?v=hhkIZ3gOIcs',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @BaoBaoMandarin · Có sẵn phụ đề Trung – Việt đồng bộ trên YouTube'
    },
    {
      id: 'lctp-hsk12-greetings',
      level: 2,
      title: 'HSK 2–4 | Cách chào hỏi tự nhiên (Learn Chinese Through Podcast)',
      youtubeUrl: 'https://www.youtube.com/watch?v=aYrCe-KTmTg',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @LearnChineseThroughPodcast · Có sẵn phụ đề Trung – Việt'
    },
    {
      id: 'lctp-hsk3-yanerdaoling',
      level: 3,
      title: 'HSK 2–4 | Thành ngữ 掩耳盗铃 Bịt tai trộm chuông (Learn Chinese Through Podcast)',
      youtubeUrl: 'https://www.youtube.com/watch?v=CqNO2psWIyU',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @LearnChineseThroughPodcast · Có sẵn phụ đề Trung – Việt'
    },
    {
      id: 'bb-hsk3-five-habits',
      level: 3,
      title: 'HSK 2–4 | 5 thói quen học tiếng Trung dễ dàng (BaoBao Mandarin)',
      youtubeUrl: 'https://www.youtube.com/watch?v=qTKcybgpT8M',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @BaoBaoMandarin · Có sẵn phụ đề Trung – Việt'
    },
    {
      id: 'lctp-hsk3-white-snake',
      level: 3,
      title: 'HSK 2–4 | Truyền thuyết Bạch Xà & Tây Hồ (Learn Chinese Through Podcast)',
      youtubeUrl: 'https://www.youtube.com/watch?v=huEhDinrgQQ',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @LearnChineseThroughPodcast · Có sẵn phụ đề Trung – Việt'
    },
    {
      id: 'lctp-hsk4-eight-cuisines',
      level: 4,
      title: 'HSK 2–4 | Bát đại thái hệ & Lẩu Tứ Xuyên (Learn Chinese Through Podcast)',
      youtubeUrl: 'https://www.youtube.com/watch?v=xivjMEMEAvE',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @LearnChineseThroughPodcast · Có sẵn phụ đề Trung – Việt'
    },
    {
      id: 'bb-hsk4-short-drama',
      level: 4,
      title: 'HSK 3–5 | Vì sao phim ngắn Trung Quốc gây sốt? (BaoBao Mandarin)',
      youtubeUrl: 'https://www.youtube.com/watch?v=MupmlHHMU7k',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @BaoBaoMandarin · Có sẵn phụ đề Trung – Việt'
    },
    {
      id: 'bb-hsk56-overtime-996',
      level: 5,
      title: 'HSK 3+ | Văn hóa tăng ca 996 ở Trung Quốc (BaoBao Mandarin)',
      youtubeUrl: 'https://www.youtube.com/watch?v=i8emBnSpS3I',
      subtitleText: '',
      access: 'public',
      note: 'Kênh @BaoBaoMandarin · Có sẵn phụ đề Trung – Việt – Anh'
    }
  ];

  function cleanText(value, maxLen = 200) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, maxLen);
  }

  function cleanMultiline(value, maxLen = 40000) {
    return String(value == null ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, maxLen);
  }

  function cleanId(value, fallbackPrefix = 'item') {
    const raw = String(value == null ? '' : value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (raw) return raw.slice(0, 80);
    return `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeAccess(value) {
    const v = String(value || '').trim().toLowerCase();
    return ACCESS_LEVELS.includes(v) ? v : 'public';
  }

  function normalizeLevel(value) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 && n <= 6 ? n : 1;
  }

  function validateHttpsUrl(value, options = {}) {
    const allowEmpty = Boolean(options.allowEmpty);
    const allowRelative = Boolean(options.allowRelative);
    const raw = String(value == null ? '' : value).trim();
    if (!raw) {
      return allowEmpty
        ? { valid: true, url: '' }
        : { valid: false, url: '', error: 'URL không được để trống.' };
    }
    if (allowRelative && /^\.?\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/.test(raw) && !raw.startsWith('//')) {
      return { valid: true, url: raw };
    }
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:') {
        return { valid: false, url: '', error: 'Chỉ chấp nhận đường dẫn HTTPS (https://).' };
      }
      const normalized =
        parsed.pathname === '/' && !parsed.search && !parsed.hash && !raw.endsWith('/')
          ? parsed.origin
          : parsed.toString();
      return { valid: true, url: normalized };
    } catch (_) {
      return { valid: false, url: '', error: 'Đường dẫn URL không hợp lệ.' };
    }
  }

  function defaultFeaturesMap() {
    const features = {};
    for (const item of CONTROLLABLE_FEATURES) {
      features[item.id] = 'public';
    }
    return features;
  }

  function createDefaultManifest() {
    return {
      version: 1,
      updatedAt: 0,
      updatedBy: '',
      endpoints: { ...DEFAULT_ENDPOINTS },
      features: defaultFeaturesMap(),
      exams: DEFAULT_EXAMS.map((item) => ({ ...item })),
      music: [],
      podcasts: DEFAULT_PODCASTS.map((item) => ({ ...item })),
      documents: []
    };
  }

  function normalizeEndpointUrl(value, fallback, allowRelative) {
    const check = validateHttpsUrl(value, { allowEmpty: true, allowRelative });
    return check.valid ? (check.url || fallback) : fallback;
  }

  function normalizeExamItem(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const id = cleanId(raw.id || raw.title || `exam-${index + 1}`, 'exam');
    const title = cleanText(raw.title || `Bộ đề ${id}`, 160);
    const provider = cleanText(raw.provider || (raw.url ? 'external' : 'study4'), 40).toLowerCase() || 'external';
    const urlCheck = validateHttpsUrl(raw.url, { allowEmpty: true, allowRelative: true });
    return {
      id,
      level: normalizeLevel(raw.level),
      title,
      provider,
      url: urlCheck.valid ? urlCheck.url : '',
      access: normalizeAccess(raw.access),
      note: cleanText(raw.note || '', 280)
    };
  }

  function normalizeMusicItem(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const urlCheck = validateHttpsUrl(raw.url, { allowEmpty: false });
    if (!urlCheck.valid) return null;
    return {
      id: cleanId(raw.id || raw.title || `music-${index + 1}`, 'music'),
      title: cleanText(raw.title || `Bài nhạc ${index + 1}`, 160),
      artist: cleanText(raw.artist || '', 120),
      level: normalizeLevel(raw.level),
      url: urlCheck.url,
      access: normalizeAccess(raw.access),
      note: cleanText(raw.note || '', 240)
    };
  }

  function normalizePodcastItem(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const urlCheck = validateHttpsUrl(raw.youtubeUrl || raw.url, { allowEmpty: false });
    if (!urlCheck.valid) return null;
    return {
      id: cleanId(raw.id || raw.title || `podcast-${index + 1}`, 'podcast'),
      title: cleanText(raw.title || `Podcast ${index + 1}`, 160),
      level: normalizeLevel(raw.level),
      youtubeUrl: urlCheck.url,
      subtitleText: cleanMultiline(raw.subtitleText || '', 40000),
      access: normalizeAccess(raw.access),
      note: cleanText(raw.note || '', 240)
    };
  }

  function normalizeDocumentItem(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const urlCheck = validateHttpsUrl(raw.url, { allowEmpty: false });
    if (!urlCheck.valid) return null;
    const kindRaw = cleanText(raw.kind || 'pdf', 30).toLowerCase();
    const kind = ['pdf', 'drive', 'reading', 'video', 'link'].includes(kindRaw) ? kindRaw : 'link';
    return {
      id: cleanId(raw.id || raw.title || `doc-${index + 1}`, 'doc'),
      title: cleanText(raw.title || `Tài liệu ${index + 1}`, 160),
      level: normalizeLevel(raw.level),
      kind,
      url: urlCheck.url,
      access: normalizeAccess(raw.access),
      description: cleanText(raw.description || '', 280)
    };
  }

  function dedupeById(items) {
    const out = [];
    const seen = new Set();
    for (const item of items) {
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    return out;
  }

  function normalizeManifest(raw) {
    const base = createDefaultManifest();
    if (!raw || typeof raw !== 'object') return base;
    const srcEndpoints = raw.endpoints && typeof raw.endpoints === 'object' ? raw.endpoints : {};
    base.endpoints = {
      examManifestUrl: normalizeEndpointUrl(srcEndpoints.examManifestUrl, '', true),
      driveExamDataUrl: normalizeEndpointUrl(srcEndpoints.driveExamDataUrl, DEFAULT_ENDPOINTS.driveExamDataUrl, true),
      musicCloudEndpoint: normalizeEndpointUrl(srcEndpoints.musicCloudEndpoint, DEFAULT_ENDPOINTS.musicCloudEndpoint, false)
    };
    const srcFeatures = raw.features && typeof raw.features === 'object' ? raw.features : {};
    for (const feat of CONTROLLABLE_FEATURES) {
      base.features[feat.id] = normalizeAccess(srcFeatures[feat.id] || srcFeatures[feat.route]);
    }
    if (Array.isArray(raw.exams)) {
      base.exams = dedupeById(raw.exams.map(normalizeExamItem).filter(Boolean));
    }
    if (Array.isArray(raw.music)) {
      base.music = dedupeById(raw.music.map(normalizeMusicItem).filter(Boolean));
    }
    if (Array.isArray(raw.podcasts)) {
      base.podcasts = dedupeById(raw.podcasts.map(normalizePodcastItem).filter(Boolean));
    }
    if (Array.isArray(raw.documents)) {
      base.documents = dedupeById(raw.documents.map(normalizeDocumentItem).filter(Boolean));
    }
    base.version = Number.isFinite(Number(raw.version)) && Number(raw.version) > 0 ? Math.floor(Number(raw.version)) : 1;
    base.updatedAt = Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) >= 0 ? Math.floor(Number(raw.updatedAt)) : 0;
    base.updatedBy = cleanText(raw.updatedBy || '', 120);
    return base;
  }

  function getFeatureAccess(manifest, routeOrId) {
    const rawKey = cleanText(routeOrId, 80);
    const key = rawKey === 'music' ? 'music-play' : rawKey;
    if (!manifest || !manifest.features || !key) return 'public';
    const direct = manifest.features[key];
    if (direct) return normalizeAccess(direct);
    const match = CONTROLLABLE_FEATURES.find((item) => item.route === key || item.id === key);
    return match ? normalizeAccess(manifest.features[match.id]) : 'public';
  }

  function canLearnerAccess(access, role = 'regular') {
    const level = normalizeAccess(access);
    if (level === 'hidden') {
      return { allowed: false, reason: 'hidden', access: 'hidden' };
    }
    if (level === 'vip') {
      const ok = role === 'vip' || role === 'admin';
      return { allowed: ok, reason: ok ? 'ok' : 'vip-required', access: 'vip' };
    }
    return { allowed: true, reason: 'ok', access: 'public' };
  }

  return {
    ACCESS_LEVELS,
    ACCESS_LABELS,
    CONTROLLABLE_FEATURES,
    DEFAULT_ENDPOINTS,
    DEFAULT_EXAMS,
    DEFAULT_PODCASTS,
    normalizeAccess,
    normalizeLevel,
    validateHttpsUrl,
    createDefaultManifest,
    normalizeManifest,
    getFeatureAccess,
    canLearnerAccess
  };
});
