#!/usr/bin/env node
/**
 * Static SEO News & Guides Generator for HSK Flashcards.
 * Aligned with PR #482 public site separation:
 *  - Public homepage: / (index.html)
 *  - Learning app: /app-hoc-hsk.html
 *  - Shared stylesheet: src/seo-landing.css
 *  - News Hub: tin-tuc-hsk.html (/tin-tuc-hsk)
 *  - Articles: bai-viet/<slug>.html (/bai-viet/<slug>)
 *  - Sitemap: sitemap.xml
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const BASE_URL = 'https://hskfreelearningai.pages.dev';
const DATA_PATH = path.join(ROOT, 'content/seo-articles/articles.json');
const OUT_DIR = path.join(ROOT, 'bai-viet');
const HUB_PATH = path.join(ROOT, 'tin-tuc-hsk.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

export const CATEGORIES = {
  'ky-thi': 'Kỳ thi & Đăng ký',
  'diem-so': 'Điểm số & Tra điểm',
  'meo-hoc': 'Mẹo học HSK',
  'ngu-phap': 'Phân biệt & Ngữ pháp',
};

const FORBIDDEN_TERMS = ['hạn mức', 'hạn ngạch', 'xác minh email', 'yêu cầu đăng nhập'];

export const SUPPORTING_SLUGS = [
  'luyen-thi-hsk-1-mien-phi',
  'luyen-thi-hsk-2-mien-phi',
  'luyen-thi-hsk-3-mien-phi',
  'luyen-thi-hsk-4-mien-phi',
  'luyen-thi-hsk-5-mien-phi',
  'luyen-thi-hsk-6-mien-phi',
  'sua-cau-tieng-trung-ai',
  'phan-biet-tu-de-nham-hsk',
  'tap-viet-chu-han-online',
  'tin-tuc-hsk',
  'tra-diem-hsk',
];

export function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export function formatDateVi(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function validateArticle(article) {
  if (!article || typeof article !== 'object') throw new Error('Article must be an object');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(article.slug || ''))) {
    throw new Error(`Invalid article slug: ${article.slug}`);
  }
  if (!CATEGORIES[article.category]) {
    throw new Error(`Invalid category "${article.category}" on ${article.slug}`);
  }
  for (const field of ['title', 'metaTitle', 'metaDescription', 'summary', 'publishedAt']) {
    if (!article[field] || typeof article[field] !== 'string' || !article[field].trim()) {
      throw new Error(`Missing required field "${field}" on ${article.slug}`);
    }
  }
  if (!Array.isArray(article.sections) || article.sections.length === 0) {
    throw new Error(`Article ${article.slug} must have at least 1 section`);
  }
  const serialized = JSON.stringify(article).toLowerCase();
  for (const bad of FORBIDDEN_TERMS) {
    if (serialized.includes(bad)) {
      throw new Error(`Forbidden limitation phrase "${bad}" detected in article ${article.slug}`);
    }
  }
}

const THEME_INIT_SCRIPT = `  <script>
    (function () {
      try {
        var saved = localStorage.getItem('hsk-theme-v1');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme = saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light');
      } catch (_) {
        document.documentElement.dataset.theme = 'light';
      }
    })();
  </script>`;

function renderHeader(prefix, currentKey) {
  const link = (href, label, key) =>
    `        <a href="${href}"${currentKey === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const toolActive = currentKey === 'editor' || currentKey === 'compare' || currentKey === 'write';
  return `  <header class="site-header">
    <div class="wrap nav-bar">
      <a class="brand" href="${prefix}" aria-label="Trang chủ HSK Flashcards">
        <span class="brand-mark" aria-hidden="true">汉</span>
        <span>HSK Flashcards</span>
      </a>
      <nav class="nav-links" aria-label="Điều hướng cụm trang học HSK">
${link(`${prefix}luyen-thi-hsk-1-mien-phi.html`, 'Luyện thi HSK', 'levels')}
${link(`${prefix}tra-diem-hsk.html`, 'Tra điểm HSK', 'score')}
${link(`${prefix}tin-tuc-hsk.html`, 'Cẩm nang HSK', 'news')}
        <details class="nav-dropdown">
          <summary${toolActive ? ' class="is-active"' : ''}>
            <span>Công cụ</span>
            <svg class="ico ico-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div class="nav-dropdown-menu">
${link(`${prefix}sua-cau-tieng-trung-ai.html`, 'Sửa câu AI', 'editor')}
${link(`${prefix}phan-biet-tu-de-nham-hsk.html`, 'Từ dễ nhầm HSK', 'compare')}
${link(`${prefix}tap-viet-chu-han-online.html`, 'Tập viết chữ Hán', 'write')}
          </div>
        </details>
      </nav>
      <div class="nav-actions">
        <details class="mobile-nav-menu">
          <summary class="mobile-nav-trigger" aria-label="Mở menu điều hướng" title="Menu trang">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </summary>
          <nav class="mobile-nav-panel" aria-label="Điều hướng di động">
${link(`${prefix}`, 'Trang chủ', 'home')}
${link(`${prefix}luyen-thi-hsk-1-mien-phi.html`, 'Luyện thi HSK 1–6', 'levels')}
${link(`${prefix}tra-diem-hsk.html`, 'Tra điểm HSK', 'score')}
${link(`${prefix}tin-tuc-hsk.html`, 'Cẩm nang HSK', 'news')}
${link(`${prefix}sua-cau-tieng-trung-ai.html`, 'Sửa câu AI', 'editor')}
${link(`${prefix}phan-biet-tu-de-nham-hsk.html`, 'Từ dễ nhầm HSK', 'compare')}
${link(`${prefix}tap-viet-chu-han-online.html`, 'Tập viết chữ Hán', 'write')}
          </nav>
        </details>
        <button type="button" class="theme-btn" id="themeToggle" aria-label="Chuyển giao diện sáng tối" title="Chuyển sáng / tối">
          <svg class="ico ico-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          <svg class="ico ico-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
        <a class="btn-primary" href="${prefix}app-hoc-hsk.html">
          <span>Vào học ngay</span>
          <svg class="ico" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>
        </a>
      </div>
    </div>
  </header>`;
}

function renderFooter(prefix) {
  return `  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a class="brand" href="${prefix}">
          <span class="brand-mark" aria-hidden="true">汉</span>
          <span>HSK Flashcards</span>
        </a>
        <p class="footer-desc">Tự học tiếng Trung HSK 1–6 miễn phí cùng Gia sư AI, đề thi thử, flashcard SRS và tra cứu kỳ thi chính thức.</p>
      </div>
      <div class="footer-col">
        <p class="footer-heading">Ôn thi &amp; Công cụ</p>
        <nav class="footer-links" aria-label="Ôn thi và công cụ HSK">
          <a href="${prefix}luyen-thi-hsk-1-mien-phi.html">Luyện thi HSK 1–6</a>
          <a href="${prefix}sua-cau-tieng-trung-ai.html">Sửa câu tiếng Trung AI</a>
          <a href="${prefix}phan-biet-tu-de-nham-hsk.html">Từ dễ nhầm HSK</a>
          <a href="${prefix}tap-viet-chu-han-online.html">Tập viết chữ Hán</a>
        </nav>
      </div>
      <div class="footer-col">
        <p class="footer-heading">Kỳ thi HSK</p>
        <nav class="footer-links" aria-label="Thông tin kỳ thi HSK">
          <a href="${prefix}tra-diem-hsk.html">Tra điểm thi HSK</a>
          <a href="${prefix}tin-tuc-hsk.html">Tin tức &amp; Lịch thi</a>
          <a href="${prefix}bai-viet/thong-bao-hsk-3-0-moi-nhat-va-cau-truc-bai-thi.html">Thông báo HSK 3.0</a>
        </nav>
      </div>
    </div>
  </footer>`;
}

function splitLeadPhrase(text, maxLen = 85) {
  const str = String(text || '').trim();
  const idx = str.indexOf(':');
  if (idx < 3 || idx > maxLen) return null;
  if (!/\s/.test(str[idx + 1] || '')) return null;
  const head = str.slice(0, idx).trim();
  if (/^https?$/i.test(head)) return null;
  const tail = str.slice(idx + 1).trim();
  if (!tail) return null;
  return { head, tail };
}

function renderBulletsOrSteps(bullets) {
  const stepParsed = bullets.map((raw) => {
    const text = String(raw || '').trim();
    const mNum = /^(\d+)\.\s+(.+)$/.exec(text);
    if (mNum) return { num: mNum[1], body: mNum[2].trim() };
    const mStep = /^Bước\s+(\d+)\s*[—–:-]\s*(.+)$/i.exec(text);
    if (mStep) return { num: mStep[1], body: mStep[2].trim() };
    return null;
  });

  if (stepParsed.every(Boolean)) {
    const items = stepParsed.map(({ num, body }) => {
      const lead = splitLeadPhrase(body, 90);
      const inner = lead
        ? `<strong class="step-lead">${escHtml(lead.head)}</strong><span class="step-desc">${escHtml(lead.tail)}</span>`
        : `<span class="step-desc">${escHtml(body)}</span>`;
      return `              <li class="article-step"><span class="step-badge" aria-hidden="true">${escHtml(num)}</span><div class="step-body">${inner}</div></li>`;
    });
    return ['            <ol class="article-steps">', ...items, '            </ol>'].join('\n');
  }

  const items = bullets.map((raw) => {
    const text = String(raw || '').trim();
    const lead = splitLeadPhrase(text, 95);
    if (lead) {
      return `              <li><strong class="bullet-lead">${escHtml(lead.head)}:</strong> ${escHtml(lead.tail)}</li>`;
    }
    return `              <li>${escHtml(text)}</li>`;
  });
  return ['            <ul class="article-bullets">', ...items, '            </ul>'].join('\n');
}

function renderTipCard(tip) {
  const lead = splitLeadPhrase(tip, 65);
  const contentHtml = lead
    ? `<div class="tip-content"><p class="tip-title">${escHtml(lead.head)}</p><p class="tip-text">${escHtml(lead.tail)}</p></div>`
    : `<div class="tip-content"><p class="tip-text">${escHtml(tip)}</p></div>`;
  return `            <div class="article-tip">
              <svg class="ico tip-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4m0-4h.01"/></svg>
              ${contentHtml}
            </div>`;
}

function getCalendarQuarter(period) {
  const m = /^(\d{2})\/(\d{4})$/.exec(String(period || '').trim());
  if (!m) return 'q1';
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (year <= 2026 || month <= 3) return 'q1';
  if (month <= 6) return 'q2';
  if (month <= 9) return 'q3';
  return 'q4';
}

function formatCalendarDateHtml(raw) {
  let str = String(raw || '').trim();
  const shifted = str.startsWith('※');
  if (shifted) str = str.slice(1).trim();

  let datePart = str;
  let dayPart = '';
  const dayMatch = /^(.+?)\s*\(([^)]+)\)$/.exec(str);
  if (dayMatch) {
    datePart = dayMatch[1].trim();
    dayPart = dayMatch[2].trim();
  }

  const dateHtml = shifted
    ? `<span class="cell-date-main is-shifted" title="Điều chỉnh ngày trả điểm do trùng kỳ nghỉ lễ tại Trung Quốc"><span class="shift-mark" aria-label="Dời lịch dịp lễ">※</span>${escHtml(datePart)}</span>`
    : `<span class="cell-date-main">${escHtml(datePart)}</span>`;

  if (!dayPart) return dateHtml;
  const sunClass = /^cn$/i.test(dayPart) ? ' is-sun' : '';
  return `${dateHtml}<span class="cell-day${sunClass}">${escHtml(dayPart)}</span>`;
}

function renderIbtResultCell(raw) {
  const str = String(raw || '').trim();
  const parts = str.split(/\s*·\s*/);
  if (parts.length < 2) {
    return formatCalendarDateHtml(str);
  }
  const rows = parts.map((segment) => {
    const m = /^(HSK|HSKK)\s*:\s*(.+)$/i.exec(segment.trim());
    if (m) {
      const label = m[1].toUpperCase();
      const cls = label === 'HSKK' ? 'cell-tag is-hskk' : 'cell-tag';
      return `<span class="cell-stack-row"><span class="${cls}">${label}</span>${formatCalendarDateHtml(m[2])}</span>`;
    }
    return `<span class="cell-stack-row"><span class="cell-tag">HSK</span>${formatCalendarDateHtml(segment.trim())}</span>`;
  });
  return `<div class="cell-stack">${rows.join('')}</div>`;
}

function renderExamCalendarSheet(table, idx) {
  const quarterMeta = [
    { id: 'q1', label: '12/2026 – Q1' },
    { id: 'q2', label: 'Q2/2027' },
    { id: 'q3', label: 'Q3/2027' },
    { id: 'q4', label: 'Q4/2027' },
  ];
  const counts = Object.create(null);
  const rowsHtml = table.rows.map((row) => {
    const q = getCalendarQuarter(row[0]);
    counts[q] = (counts[q] || 0) + 1;
    const cells = [
      `<td class="cell-period"><span>${escHtml(row[0] || '')}</span></td>`,
      `<td class="cell-exam-date">${formatCalendarDateHtml(row[1] || '')}</td>`,
      `<td class="col-group-start">${formatCalendarDateHtml(row[2] || '')}</td>`,
      `<td>${formatCalendarDateHtml(row[3] || '')}</td>`,
      `<td class="col-group-start">${formatCalendarDateHtml(row[4] || '')}</td>`,
      `<td class="cell-result-ibt">${renderIbtResultCell(row[5] || '')}</td>`,
    ];
    return `                <tr data-quarter="${escHtml(q)}">${cells.join('')}</tr>`;
  });

  const filterButtons = [
    `<button type="button" class="sheet-filter-btn is-active" data-quarter="all" aria-pressed="true">Tất cả (${table.rows.length})</button>`,
    ...quarterMeta
      .filter((q) => counts[q.id])
      .map((q) => `<button type="button" class="sheet-filter-btn" data-quarter="${q.id}" aria-pressed="false">${q.label}</button>`),
  ].join('');

  return [
    `            <div class="data-sheet is-calendar" data-table-idx="${idx}">`,
    '              <div class="data-sheet-bar">',
    `                <div class="data-sheet-filters" role="group" aria-label="Lọc đợt thi theo quý">${filterButtons}</div>`,
    '                <p class="data-sheet-legend" title="Điều chỉnh ngày trả điểm do trùng kỳ nghỉ lễ tại Trung Quốc"><span class="legend-mark" aria-hidden="true">※</span><span>Dời lịch do nghỉ lễ</span></p>',
    '              </div>',
    '              <div class="data-sheet-scroll">',
    '                <table class="article-table article-table-calendar">',
    '                  <thead>',
    '                    <tr class="thead-groups">',
    '                      <th colspan="2" scope="colgroup">Lịch thi</th>',
    '                      <th colspan="2" scope="colgroup" class="col-group-start">Hạn đăng ký hệ thống</th>',
    '                      <th colspan="2" scope="colgroup" class="col-group-start">Ngày công bố kết quả</th>',
    '                    </tr>',
    '                    <tr class="thead-cols">',
    '                      <th scope="col">Đợt</th>',
    '                      <th scope="col">Ngày thi</th>',
    '                      <th scope="col" class="col-group-start">Giấy (PBT)</th>',
    '                      <th scope="col">Máy (iBT)</th>',
    '                      <th scope="col" class="col-group-start">Thi giấy</th>',
    '                      <th scope="col">Thi máy HSK &amp; HSKK</th>',
    '                    </tr>',
    '                  </thead>',
    '                  <tbody>',
    ...rowsHtml,
    '                  </tbody>',
    '                </table>',
    '              </div>',
    '            </div>',
  ].join('\n');
}

function renderSectionTable(table, idx) {
  const headers = table.headers || [];
  const rows = table.rows || [];
  if (headers.length === 6 && /^Đợt thi$/i.test(String(headers[0] || '').trim())) {
    return renderExamCalendarSheet(table, idx);
  }

  const searchable = rows.length >= 8;
  const barHtml = searchable
    ? [
        '              <div class="data-sheet-bar">',
        '                <label class="table-search-wrap">',
        '                  <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
        '                  <input type="search" class="table-filter-input" placeholder="Tìm nhanh trong bảng (tỉnh thành, trường, hình thức)..." aria-label="Tìm nhanh trong bảng">',
        '                </label>',
        `                <span class="table-count" aria-live="polite">Hiển thị ${rows.length}/${rows.length} dòng</span>`,
        '              </div>',
      ].join('\n')
    : '';

  const emptyRowHtml = searchable
    ? `\n                  <tr class="table-empty-row" hidden><td colspan="${headers.length}">Không tìm thấy dòng phù hợp với từ khóa vừa nhập.</td></tr>`
    : '';

  return [
    `            <div class="data-sheet${searchable ? ' is-searchable' : ' is-compact'}" data-table-idx="${idx}">`,
    ...(barHtml ? [barHtml] : []),
    '              <div class="data-sheet-scroll">',
    '                <table class="article-table">',
    '                  <thead><tr>',
    ...headers.map((h) => `                    <th scope="col">${escHtml(h)}</th>`),
    '                  </tr></thead>',
    '                  <tbody>',
    ...rows.map((row) => `                    <tr>${row.map((cell) => `<td>${escHtml(cell)}</td>`).join('')}</tr>`),
    ...(emptyRowHtml ? [emptyRowHtml.slice(1)] : []),
    '                  </tbody>',
    '                </table>',
    '              </div>',
    '            </div>',
  ].join('\n');
}

function renderArticleHtml(article, bySlug) {
  const canonical = `${BASE_URL}/bai-viet/${article.slug}`;
  const catLabel = article.categoryLabel || CATEGORIES[article.category];
  const updatedAt = article.updatedAt || article.publishedAt;
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];
  const sources = Array.isArray(article.sources) ? article.sources : [];

  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'HSK Flashcards', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Tin tức & Mẹo HSK', item: `${BASE_URL}/tin-tuc-hsk` },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
      ],
    },
    {
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription,
      inLanguage: 'vi',
      datePublished: article.publishedAt,
      dateModified: updatedAt,
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: 'HSK Flashcards', url: `${BASE_URL}/` },
      publisher: {
        '@type': 'Organization',
        name: 'HSK Flashcards',
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
      },
      image: `${BASE_URL}/icon-512.png`,
      articleSection: catLabel,
      keywords: (article.keywords || []).join(', '),
    },
  ];
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const tocHtml = article.sections
    .map((s, i) => `            <li><a href="#${escHtml(s.id || `muc-${i + 1}`)}">${escHtml(s.heading)}</a></li>`)
    .join('\n');

  let tableCounter = 0;
  const sectionsHtml = article.sections.map((s, i) => {
    const sid = escHtml(s.id || `muc-${i + 1}`);
    const parts = [`          <section class="article-section" aria-labelledby="${sid}">`, `            <h2 id="${sid}">${escHtml(s.heading)}</h2>`];
    for (const p of s.paragraphs || []) {
      parts.push(`            <p>${escHtml(p)}</p>`);
    }
    if (Array.isArray(s.bullets) && s.bullets.length) {
      parts.push(renderBulletsOrSteps(s.bullets));
    }
    if (s.table && Array.isArray(s.table.headers) && Array.isArray(s.table.rows)) {
      parts.push(renderSectionTable(s.table, tableCounter++));
    }
    if (s.example && s.example.han) {
      parts.push(`            <div class="article-example">
              <span class="cn" lang="zh-Hans">${escHtml(s.example.han)}</span>
              ${s.example.py ? `<span class="py">${escHtml(s.example.py)}</span>` : ''}
              ${s.example.vi ? `<span class="vi">${escHtml(s.example.vi)}</span>` : ''}
            </div>`);
    }
    if (s.tip) {
      parts.push(renderTipCard(s.tip));
    }
    parts.push('          </section>');
    return parts.join('\n');
  }).join('\n');

  const sourcesHtml = sources.length
    ? `          <div class="article-sources">
            <h3>Nguồn đối chiếu chính thức</h3>
            <ul>
${sources.map((src) => `              <li><a href="${escHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escHtml(src.label)}</a></li>`).join('\n')}
            </ul>
          </div>`
    : '';

  const faqSectionHtml = faqs.length
    ? `    <section class="band band-surface" aria-labelledby="faq-title">
      <div class="wrap faq-grid">
        <div class="faq-aside">
          <h2 id="faq-title">Câu hỏi thường gặp</h2>
          <p>Giải đáp nhanh những thắc mắc phổ biến liên quan trực tiếp tới chủ đề bài viết này.</p>
        </div>
        <div class="faq-list">
${faqs.map((f, i) => `          <details${i === 0 ? ' open' : ''}>
            <summary><span>${escHtml(f.q)}</span><svg class="ico" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq-answer"><p>${escHtml(f.a)}</p></div>
          </details>`).join('\n')}
        </div>
      </div>
    </section>`
    : '';

  const related = (article.relatedSlugs || [])
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 3);
  const relatedHtml = related.length
    ? `    <section class="band" aria-labelledby="related-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="related-title">Bài viết liên quan nên đọc tiếp</h2>
          <p>Khám phá thêm hướng dẫn kỳ thi HSK, mẹo tăng điểm và phân biệt ngữ pháp dễ hiểu.</p>
        </div>
        <div class="news-grid related-grid">
${related.map((r) => {
  const rCatLabel = r.categoryLabel || CATEGORIES[r.category];
  return `          <article class="news-card">
            <h3><a href="./${escHtml(r.slug)}.html">${escHtml(r.title)}</a></h3>
            <p>${escHtml(r.summary)}</p>
            <div class="news-card-foot">
              <span class="cat-badge cat-${escHtml(r.category)}">${escHtml(rCatLabel)}</span>
              <a class="text-link" href="./${escHtml(r.slug)}.html">Đọc bài →</a>
            </div>
          </article>`;
}).join('\n')}
        </div>
      </div>
    </section>`
    : '';

  const cta = article.cta || {
    heading: 'Học HSK 1–6 và hỏi đáp cùng Gia sư AI miễn phí ngay hôm nay',
    body: 'Mở trực tiếp trên trình duyệt để luyện đề thi thử HSK, học flashcard SRS và hỏi Gia sư AI bằng tiếng Việt.',
    buttonLabel: 'Mở HSK Flashcards miễn phí',
  };

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escHtml(article.metaTitle)}</title>
  <meta name="description" content="${escHtml(article.metaDescription)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="../icon-192.png" type="image/png">
  <link rel="apple-touch-icon" href="../icon-180.png">
  <meta name="theme-color" content="#37299e">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:site_name" content="HSK Flashcards">
  <meta property="og:title" content="${escHtml(article.metaTitle)}">
  <meta property="og:description" content="${escHtml(article.metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE_URL}/icon-512.png">
  <meta property="article:published_time" content="${escHtml(article.publishedAt)}">
  <meta property="article:modified_time" content="${escHtml(updatedAt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(article.metaTitle)}">
  <meta name="twitter:description" content="${escHtml(article.metaDescription)}">
  <meta name="twitter:image" content="${BASE_URL}/icon-512.png">
  <link rel="stylesheet" href="../src/seo-news.css">
${THEME_INIT_SCRIPT}
  <script type="application/ld+json">${safeJsonLd({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
  <a class="skip-link" href="#main-content">Chuyển tới nội dung chính</a>
${renderHeader('../', 'news')}

  <main id="main-content">
    <header class="article-hero" aria-labelledby="hero-title">
      <div class="wrap article-wrap article-hero-inner">
        <ol class="article-crumb" aria-label="Đường dẫn">
          <li><a href="../">HSK Flashcards</a></li>
          <li><a href="../tin-tuc-hsk.html">Tin tức &amp; Mẹo HSK</a></li>
          <li aria-current="page">${escHtml(catLabel)}</li>
        </ol>
        <h1 id="hero-title">${escHtml(article.title)}</h1>
        <p class="article-deck">${escHtml(article.summary)}</p>
        <div class="article-meta-bar">
          <div class="article-meta-items">
            <span class="cat-badge cat-${escHtml(article.category)}">${escHtml(catLabel)}</span>
            <span>${escHtml(article.hskTag || 'HSK 1–6')}</span>
            <span>Cập nhật ${escHtml(formatDateVi(updatedAt))}</span>
            <span>Đọc ${Number(article.readMinutes) || 5} phút</span>
            ${sources.length ? '<span>Đối chiếu ChineseTest</span>' : ''}
          </div>
          <a class="text-link article-back-link" href="../tin-tuc-hsk.html">
            <span>← Tất cả tin tức HSK</span>
          </a>
        </div>
      </div>
    </header>

    <section class="band article-band" aria-label="Nội dung bài viết">
      <div class="wrap article-wrap article-shell">
        <aside class="article-toc-rail" aria-label="Mục lục bài viết">
          <nav class="article-toc-nav" aria-label="Điều hướng trong bài">
            <p class="article-toc-title">Trong bài viết</p>
            <ul class="article-toc-list">
${tocHtml}
            </ul>
            <div class="article-rail-links">
              <a href="../tra-diem-hsk.html">Tra điểm thi HSK →</a>
              <a href="../tin-tuc-hsk.html">← Tất cả bài viết</a>
            </div>
          </nav>
        </aside>

        <div class="article-main-col">
          <details class="article-toc-mobile">
            <summary>
              <span>Mục lục bài viết (${article.sections.length} phần)</span>
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </summary>
            <ul class="article-toc-list">
${tocHtml}
            </ul>
          </details>

          <article class="article-content">
${sectionsHtml}
${sourcesHtml}
          </article>
        </div>
      </div>
    </section>

${faqSectionHtml}
${relatedHtml}

    <section class="closing-wrap" aria-labelledby="closing-title">
      <div class="wrap">
        <div class="closing-banner">
          <div class="closing-copy">
            <h2 id="closing-title">${escHtml(cta.heading)}</h2>
            <p>${escHtml(cta.body)}</p>
          </div>
          <a class="btn-hero-main" href="../app-hoc-hsk.html${article.slug.includes('phan-biet') ? '#compare' : article.category === 'ngu-phap' ? '#sentence-editor' : '#study4'}">
            <span>${escHtml(cta.buttonLabel)}</span>
            <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </section>
  </main>

${renderFooter('../')}

  <script>
    (function () {
      var themeBtn = document.getElementById('themeToggle');
      if (themeBtn) {
        themeBtn.addEventListener('click', function () {
          var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.dataset.theme = next;
          try { localStorage.setItem('hsk-theme-v1', next); } catch (_) {}
        });
      }

      var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.article-toc-rail .article-toc-list a'));
      var mobileToc = document.querySelector('.article-toc-mobile');
      if (mobileToc) {
        mobileToc.addEventListener('click', function (e) {
          if (e.target && e.target.closest('a')) mobileToc.open = false;
        });
      }

      if (tocLinks.length && 'IntersectionObserver' in window) {
        var byId = Object.create(null);
        tocLinks.forEach(function (a) {
          var id = (a.getAttribute('href') || '').replace(/^#/, '');
          if (id) byId[id] = a;
        });
        var setActive = function (id) {
          tocLinks.forEach(function (a) { a.classList.toggle('is-active', a === byId[id]); });
        };
        setActive(Object.keys(byId)[0]);
        var observer = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              var h = entries[i].target.querySelector('h2[id]');
              if (h && byId[h.id]) setActive(h.id);
              break;
            }
          }
        }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
        document.querySelectorAll('.article-section').forEach(function (sec) { observer.observe(sec); });
      }

      function normText(s) {
        return String(s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd');
      }

      document.querySelectorAll('.data-sheet').forEach(function (sheet) {
        var filterBtns = sheet.querySelectorAll('[data-quarter]');
        if (filterBtns.length) {
          var calRows = sheet.querySelectorAll('tbody tr[data-quarter]');
          filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
              var q = btn.getAttribute('data-quarter');
              filterBtns.forEach(function (b) {
                var active = b === btn;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-pressed', active ? 'true' : 'false');
              });
              calRows.forEach(function (row) {
                row.hidden = q !== 'all' && row.getAttribute('data-quarter') !== q;
              });
            });
          });
        }

        var searchInput = sheet.querySelector('.table-filter-input');
        if (searchInput) {
          var dataRows = Array.prototype.slice.call(sheet.querySelectorAll('tbody tr:not(.table-empty-row)'));
          var emptyRow = sheet.querySelector('.table-empty-row');
          var countEl = sheet.querySelector('.table-count');
          var total = dataRows.length;
          searchInput.addEventListener('input', function () {
            var q = normText(searchInput.value.trim());
            var visible = 0;
            dataRows.forEach(function (row) {
              var match = !q || normText(row.textContent).indexOf(q) !== -1;
              row.hidden = !match;
              if (match) visible++;
            });
            if (emptyRow) emptyRow.hidden = visible !== 0;
            if (countEl) countEl.textContent = 'Hiển thị ' + visible + '/' + total + ' dòng';
          });
        }
      });
    })();
  </script>
  <script src="../src/seo-offline-prewarm.js" defer></script>
</body>
</html>
`;
}

function renderHubHtml(articles) {
  const sorted = [...articles].sort((a, b) => String(b.updatedAt || b.publishedAt).localeCompare(String(a.updatedAt || a.publishedAt)));
  const featured = sorted.find((a) => a.featured) || sorted[0];
  const dispatchItems = sorted.filter((a) => !featured || a.slug !== featured.slug).slice(0, 3);
  const leadSlugs = new Set([featured?.slug, ...dispatchItems.map((i) => i.slug)].filter(Boolean));
  const canonical = `${BASE_URL}/tin-tuc-hsk`;
  const latestUpdated = sorted[0] ? formatDateVi(sorted[0].updatedAt || sorted[0].publishedAt) : '';

  const catCounts = { 'ky-thi': 0, 'diem-so': 0, 'meo-hoc': 0, 'ngu-phap': 0 };
  for (const a of sorted) {
    if (catCounts[a.category] !== undefined) catCounts[a.category]++;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HSK Flashcards', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Cẩm nang & Tin tức HSK', item: canonical },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'Tin tức kỳ thi HSK, lịch thi 2026–2027, điểm thi & ngữ pháp miễn phí',
        url: canonical,
        inLanguage: 'vi',
        description: 'Cập nhật lịch thi & lịch trả điểm HSK từ chinesetest.cn, địa điểm thi tại Việt Nam, thông báo HSK 3.0, thang điểm đậu, mẹo học và ngữ pháp tiếng Trung.',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: sorted.map((a, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${BASE_URL}/bai-viet/${a.slug}`,
            name: a.title,
          })),
        },
      },
    ],
  };

  const featuredHtml = featured
    ? `        <div class="news-lead-grid">
          <article class="news-lead-card" aria-label="Tin tiêu điểm">
            <span class="lead-watermark" aria-hidden="true">讯</span>
            <div class="lead-body">
              <h2><a href="./bai-viet/${escHtml(featured.slug)}.html">${escHtml(featured.title)}</a></h2>
              <p>${escHtml(featured.summary)}</p>
            </div>
            <div class="news-lead-foot">
              <div class="news-lead-meta">
                <span class="lead-cat-pill">${escHtml(featured.categoryLabel || CATEGORIES[featured.category])}</span>
                <span>${escHtml(featured.hskTag || 'HSK 1–6')}</span>
                <span>Cập nhật ${escHtml(formatDateVi(featured.updatedAt || featured.publishedAt))}</span>
              </div>
              <a class="lead-btn" href="./bai-viet/${escHtml(featured.slug)}.html">
                <span>Đọc chi tiết</span>
                <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
              </a>
            </div>
          </article>

          <aside class="news-dispatch" aria-label="Bài viết mới cập nhật">
            <div class="news-dispatch-head">
              <h2>Mới cập nhật</h2>
              <a href="#danh-sach-bai-viet">Tất cả (${sorted.length}) ↓</a>
            </div>
            <div class="news-dispatch-list">
${dispatchItems.map((item) => {
  const itemCat = item.categoryLabel || CATEGORIES[item.category];
  return `              <a class="news-dispatch-item" href="./bai-viet/${escHtml(item.slug)}.html">
                <strong>${escHtml(item.title)}</strong>
                <div class="dispatch-meta">
                  <span class="cat-badge cat-${escHtml(item.category)}">${escHtml(itemCat)}</span>
                  <span>${escHtml(formatDateVi(item.updatedAt || item.publishedAt))} · ${Number(item.readMinutes) || 5} phút</span>
                </div>
              </a>`;
}).join('\n')}
            </div>
          </aside>
        </div>`
    : '';

  const cardsHtml = sorted.map((a) => {
    const catLabel = a.categoryLabel || CATEGORIES[a.category];
    const kw = [a.title, a.summary, a.hskTag, catLabel, ...(a.keywords || [])].join(' ');
    const inLeadAttr = leadSlugs.has(a.slug) ? ' data-in-lead="1"' : '';
    return `          <article class="news-card" data-cat="${escHtml(a.category)}" data-kw="${escHtml(kw)}"${inLeadAttr}>
            <h3><a href="./bai-viet/${escHtml(a.slug)}.html">${escHtml(a.title)}</a></h3>
            <p>${escHtml(a.summary)}</p>
            <div class="news-card-foot">
              <div class="news-card-tags">
                <span class="cat-badge cat-${escHtml(a.category)}">${escHtml(catLabel)}</span>
                <span class="news-read-meta">${escHtml(formatDateVi(a.updatedAt || a.publishedAt))} · ${Number(a.readMinutes) || 5}p</span>
              </div>
              <a class="text-link" href="./bai-viet/${escHtml(a.slug)}.html">Đọc →</a>
            </div>
          </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Cẩm nang HSK: Lịch thi 2026–2027, điểm thi &amp; ngữ pháp | HSK Flashcards</title>
  <meta name="description" content="Cập nhật chính thức từ chinesetest.cn: lịch thi &amp; lịch trả điểm HSK 2026–2027, danh sách điểm thi tại Việt Nam, thông báo HSK 3.0, cách tra điểm, mẹo học và ngữ pháp HSK.">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="./icon-192.png" type="image/png">
  <link rel="apple-touch-icon" href="./icon-180.png">
  <meta name="theme-color" content="#37299e">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:site_name" content="HSK Flashcards">
  <meta property="og:title" content="Cẩm nang HSK: Lịch thi 2026–2027, điểm thi &amp; ngữ pháp">
  <meta property="og:description" content="Tổng hợp lịch thi &amp; lịch trả kết quả HSK từ chinesetest.cn, điểm thi Việt Nam, thông báo thay đổi kỳ thi HSK 3.0, mẹo học và phân biệt ngữ pháp.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE_URL}/icon-512.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Cẩm nang HSK: Lịch thi 2026–2027, điểm thi &amp; ngữ pháp">
  <meta name="twitter:description" content="Tra cứu nhanh lịch thi HSK 2026–2027, lịch trả kết quả, địa điểm thi tại Việt Nam, cấu trúc bài thi và mẹo học HSK.">
  <meta name="twitter:image" content="${BASE_URL}/icon-512.png">
  <link rel="stylesheet" href="./src/seo-news.css">
${THEME_INIT_SCRIPT}
  <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>
</head>
<body>
  <a class="skip-link" href="#main-content">Chuyển tới nội dung chính</a>
${renderHeader('./', 'news')}

  <main id="main-content">
    <header class="news-masthead" aria-labelledby="hero-title">
      <div class="wrap">
        <ol class="article-crumb" aria-label="Đường dẫn">
          <li><a href="./">HSK Flashcards</a></li>
          <li aria-current="page">Cẩm nang HSK</li>
        </ol>
        <div class="news-masthead-row">
          <div class="news-masthead-copy">
            <h1 id="hero-title">Cẩm nang &amp; Tin tức kỳ thi HSK</h1>
            <p>Đối chiếu trực tiếp từ ChineseTest (chinesetest.cn): lịch thi và trả điểm 2026–2027, điểm thi Việt Nam, thông báo HSK 3.0 cùng hệ thống bài ngữ pháp – phân biệt trọng tâm.</p>
          </div>
          <div class="news-masthead-actions">
            <a class="btn-secondary" href="./tra-diem-hsk.html">
              <span>Tra điểm HSK ChineseTest</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>
            </a>
            ${latestUpdated ? `<span class="masthead-sync">Đồng bộ mới nhất: ${escHtml(latestUpdated)}</span>` : ''}
          </div>
        </div>
      </div>
    </header>

    <section class="band news-hub-band" aria-label="Tin nổi bật và kho bài viết HSK">
      <div class="wrap">
${featuredHtml}

        <div class="news-toolbar" id="danh-sach-bai-viet">
          <div class="news-tabs" role="tablist" aria-label="Lọc bài viết theo chuyên mục">
            <button type="button" class="news-tab" role="tab" aria-selected="true" data-cat-btn="all">Tất cả (${sorted.length})</button>
            <button type="button" class="news-tab" role="tab" aria-selected="false" data-cat-btn="ngu-phap">Phân biệt &amp; Ngữ pháp (${catCounts['ngu-phap']})</button>
            <button type="button" class="news-tab" role="tab" aria-selected="false" data-cat-btn="ky-thi">Kỳ thi &amp; Đăng ký (${catCounts['ky-thi']})</button>
            <button type="button" class="news-tab" role="tab" aria-selected="false" data-cat-btn="diem-so">Điểm số &amp; Tra điểm (${catCounts['diem-so']})</button>
            <button type="button" class="news-tab" role="tab" aria-selected="false" data-cat-btn="meo-hoc">Mẹo học HSK (${catCounts['meo-hoc']})</button>
          </div>
          <div class="search-input-wrap news-search-wrap">
            <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" id="newsSearch" class="search-input" placeholder="Tìm lịch thi 2027, HSK 3.0, từ loại, lỗi sai..." aria-label="Tìm bài viết HSK">
          </div>
        </div>

        <div class="news-grid" id="newsGrid">
${cardsHtml}
        </div>

        <div class="news-pagination" id="newsPagination" hidden>
          <span class="news-page-status" id="newsPageStatus" aria-live="polite"></span>
          <div class="news-load-actions">
            <button type="button" class="news-load-btn is-primary" id="newsLoadMoreBtn">Xem thêm bài viết</button>
            <button type="button" class="news-load-btn" id="newsShowAllBtn">Xem tất cả</button>
          </div>
        </div>

        <p class="empty-state" id="newsEmpty" hidden>
          Không tìm thấy bài viết khớp từ khóa vừa nhập. Bạn có thể mở <strong>Gia sư AI tiếng Trung</strong> trong ứng dụng để hỏi trực tiếp câu hỏi của mình!
        </p>
      </div>
    </section>

    <section class="closing-wrap" aria-labelledby="closing-title">
      <div class="wrap">
        <div class="closing-banner">
          <div class="closing-copy">
            <h2 id="closing-title">Sẵn sàng luyện thi HSK 1–6 miễn phí cùng Gia sư AI?</h2>
            <p>Mở thẳng ứng dụng trên điện thoại hoặc máy tính — hỗ trợ học offline sau lần mở đầu tiên.</p>
          </div>
          <a class="btn-hero-main" href="./app-hoc-hsk.html">
            <span>Mở HSK Flashcards miễn phí</span>
            <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </section>
  </main>

${renderFooter('./')}

  <script>
    (function () {
      var themeBtn = document.getElementById('themeToggle');
      if (themeBtn) {
        themeBtn.addEventListener('click', function () {
          var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.dataset.theme = next;
          try { localStorage.setItem('hsk-theme-v1', next); } catch (_) {}
        });
      }

      var PAGE_SIZE = 6;
      var visibleLimit = PAGE_SIZE;
      var searchEl = document.getElementById('newsSearch');
      var catBtns = document.querySelectorAll('[data-cat-btn]');
      var cards = Array.prototype.slice.call(document.querySelectorAll('#newsGrid .news-card'));
      var emptyEl = document.getElementById('newsEmpty');
      var paginationEl = document.getElementById('newsPagination');
      var pageStatusEl = document.getElementById('newsPageStatus');
      var loadMoreBtn = document.getElementById('newsLoadMoreBtn');
      var showAllBtn = document.getElementById('newsShowAllBtn');
      var activeCat = 'all';

      function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      function applyFilter() {
        var q = norm(searchEl ? searchEl.value.trim() : '');
        var matched = [];
        cards.forEach(function (card) {
          var okCat = activeCat === 'all' || card.getAttribute('data-cat') === activeCat;
          var okQ = !q || norm(card.getAttribute('data-kw')).indexOf(q) !== -1;
          var skipDuplicateLead = activeCat === 'all' && !q && card.getAttribute('data-in-lead') === '1';
          if (okCat && okQ && !skipDuplicateLead) {
            matched.push(card);
          } else {
            card.hidden = true;
          }
        });

        var shownCount = Math.min(matched.length, visibleLimit);
        matched.forEach(function (card, idx) {
          card.hidden = idx >= shownCount;
        });

        if (emptyEl) emptyEl.hidden = matched.length > 0;

        var remaining = matched.length - shownCount;
        if (paginationEl) {
          paginationEl.hidden = remaining <= 0;
        }
        if (pageStatusEl) {
          pageStatusEl.textContent = 'Đang hiển thị ' + shownCount + ' / ' + matched.length + ' bài viết';
        }
        if (loadMoreBtn) {
          var nextBatch = Math.min(PAGE_SIZE, remaining);
          loadMoreBtn.textContent = 'Xem thêm ' + nextBatch + ' bài viết';
        }
        if (showAllBtn) {
          showAllBtn.textContent = 'Xem tất cả (' + matched.length + ')';
        }
      }

      if (searchEl) {
        searchEl.addEventListener('input', function () {
          visibleLimit = PAGE_SIZE;
          applyFilter();
        });
      }
      catBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeCat = btn.getAttribute('data-cat-btn') || 'all';
          visibleLimit = PAGE_SIZE;
          catBtns.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
          applyFilter();
        });
      });
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
          visibleLimit += PAGE_SIZE;
          applyFilter();
        });
      }
      if (showAllBtn) {
        showAllBtn.addEventListener('click', function () {
          visibleLimit = cards.length;
          applyFilter();
        });
      }

      applyFilter();
    })();
  </script>
  <script src="./src/seo-offline-prewarm.js" defer></script>
</body>
</html>
`;
}

const TOPIC_CLUSTER_PAGES = [
  {
    key: 'index',
    file: 'index.html',
    bandClass: 'band band-surface',
    sectionId: 'cam-nang-hsk',
    heading: 'Cẩm nang tự học & kỳ thi HSK chọn lọc',
    subtitle: 'Tổng hợp bài hướng dẫn ngữ pháp cốt lõi, mẹo tránh lỗi người Việt và lịch ChineseTest cập nhật mới nhất.',
    preferredSlugs: [
      'cac-loai-tu-trong-tieng-trung-co-ban',
      'lich-thi-hsk-va-lich-tra-ket-qua-chinh-thuc',
      '10-loi-sai-ngu-phap-tieng-trung-co-ban-nguoi-viet-hay-mac',
    ],
    preferredCategories: ['ngu-phap', 'ky-thi', 'meo-hoc'],
  },
  {
    key: 'compare',
    file: 'phan-biet-tu-de-nham-hsk.html',
    bandClass: 'band',
    sectionId: 'bai-viet-phan-biet-lien-quan',
    heading: 'Bài hướng dẫn phân biệt chuyên sâu nên đọc tiếp',
    subtitle: 'Đi sâu vào từng nhóm từ hay gài bẫy trong đề thi HSK kèm bảng đối chiếu và ví dụ Pinyin – tiếng Việt.',
    preferredSlugs: [
      'phan-biet-de-de-de-trong-tieng-trung-hsk',
      'phan-biet-guo-zhe-le-tro-tu-dong-thai-hsk',
      'phan-biet-xiang-yao-hui-neng-keyi-hsk',
      'phan-biet-cac-cap-tu-hay-nham-khi-thi-hsk',
    ],
    preferredCategories: ['ngu-phap'],
  },
  {
    key: 'editor',
    file: 'sua-cau-tieng-trung-ai.html',
    bandClass: 'band band-surface',
    sectionId: 'bai-viet-sua-loi-lien-quan',
    heading: 'Cẩm nang tránh lỗi ngữ pháp & đặt câu chuẩn HSK',
    subtitle: 'Nắm chắc các lỗi người Việt hay mắc nhất trước khi viết câu HSK 3–5 hoặc đưa vào Sửa câu AI.',
    preferredSlugs: [
      '10-loi-sai-ngu-phap-tieng-trung-co-ban-nguoi-viet-hay-mac',
      'cac-loai-tu-trong-tieng-trung-co-ban',
      'cau-chu-ba-va-cau-chu-bei-trong-tieng-trung',
      'tong-hop-ngu-phap-hsk-quan-trong-hay-thi',
    ],
    preferredCategories: ['ngu-phap', 'meo-hoc'],
  },
  {
    key: 'hsk1',
    file: 'luyen-thi-hsk-1-mien-phi.html',
    bandClass: 'band',
    sectionId: 'cam-nang-hsk-1',
    heading: 'Bài đọc nền tảng dành riêng cho người học HSK 1',
    subtitle: 'Củng cố từ loại tiếng Trung, động từ năng nguyện cơ bản và tránh các lỗi dịch từng chữ thường gặp.',
    preferredSlugs: [
      'cac-loai-tu-trong-tieng-trung-co-ban',
      'phan-biet-xiang-yao-hui-neng-keyi-hsk',
      '10-loi-sai-ngu-phap-tieng-trung-co-ban-nguoi-viet-hay-mac',
    ],
    preferredCategories: ['ngu-phap', 'meo-hoc'],
  },
  {
    key: 'hsk2',
    file: 'luyen-thi-hsk-2-mien-phi.html',
    bandClass: 'band',
    sectionId: 'cam-nang-hsk-2',
    heading: 'Bài đọc trọng tâm giúp vững nền tảng HSK 2',
    subtitle: 'Hiểu đúng bản chất trợ từ 了/着/过, phân biệt 想/要/会/能/可以 và sửa 10 lỗi câu cơ bản.',
    preferredSlugs: [
      'phan-biet-guo-zhe-le-tro-tu-dong-thai-hsk',
      'phan-biet-xiang-yao-hui-neng-keyi-hsk',
      '10-loi-sai-ngu-phap-tieng-trung-co-ban-nguoi-viet-hay-mac',
    ],
    preferredCategories: ['ngu-phap', 'meo-hoc'],
  },
  {
    key: 'hsk3',
    file: 'luyen-thi-hsk-3-mien-phi.html',
    bandClass: 'band',
    sectionId: 'cam-nang-hsk-3',
    heading: 'Bài đọc chuyên sâu cho lộ trình HSK 3',
    subtitle: 'Xử lý gọn 3 chữ 的/地/得, câu chữ 把/被 và các trợ từ động thái hay ra nhất trong đề HSK 3.',
    preferredSlugs: [
      'phan-biet-de-de-de-trong-tieng-trung-hsk',
      'cau-chu-ba-va-cau-chu-bei-trong-tieng-trung',
      'phan-biet-guo-zhe-le-tro-tu-dong-thai-hsk',
    ],
    preferredCategories: ['ngu-phap', 'meo-hoc'],
  },
  {
    key: 'hsk4',
    file: 'luyen-thi-hsk-4-mien-phi.html',
    bandClass: 'band',
    sectionId: 'cam-nang-hsk-4',
    heading: 'Bài đọc tăng điểm Đọc & Viết HSK 4',
    subtitle: 'Hệ thống cấu trúc câu chữ 把/被, phân biệt 的/地/得 và 10 khung ngữ pháp trọng tâm HSK 4.',
    preferredSlugs: [
      'tong-hop-ngu-phap-hsk-quan-trong-hay-thi',
      'cau-chu-ba-va-cau-chu-bei-trong-tieng-trung',
      'phan-biet-de-de-de-trong-tieng-trung-hsk',
    ],
    preferredCategories: ['ngu-phap', 'meo-hoc'],
  },
  {
    key: 'hsk5',
    file: 'luyen-thi-hsk-5-mien-phi.html',
    bandClass: 'band',
    sectionId: 'cam-nang-hsk-5',
    heading: 'Cẩm nang chiến lược & cấu trúc nâng cao cho HSK 5',
    subtitle: 'Nâng tốc độ đọc hiểu – viết đoạn và theo dõi chuẩn thang điểm, lịch thi chính thức.',
    preferredSlugs: [
      'meo-luyen-nghe-va-doc-hieu-hsk-tang-diem-nhanh',
      'cau-chu-ba-va-cau-chu-bei-trong-tieng-trung',
      'thang-diem-dau-hsk-1-den-6',
    ],
    preferredCategories: ['meo-hoc', 'ngu-phap', 'diem-so'],
  },
  {
    key: 'hsk6',
    file: 'luyen-thi-hsk-6-mien-phi.html',
    bandClass: 'band',
    sectionId: 'cam-nang-hsk-6',
    heading: 'Cẩm nang luyện đề & thông tin kỳ thi HSK 6 – HSK 3.0',
    subtitle: 'Tổng hợp mẹo xử lý bài đọc dài, quy chế điểm xét học bổng và lộ trình HSK 7–9 mới.',
    preferredSlugs: [
      'thong-bao-hsk-3-0-moi-nhat-va-cau-truc-bai-thi',
      'meo-luyen-nghe-va-doc-hieu-hsk-tang-diem-nhanh',
      'thang-diem-dau-hsk-1-den-6',
    ],
    preferredCategories: ['ky-thi', 'meo-hoc', 'diem-so'],
  },
];

export function selectClusterArticles(articles, pageKey, limit = 3) {
  const cfg = TOPIC_CLUSTER_PAGES.find((p) => p.key === pageKey || p.file === pageKey);
  const sorted = [...articles].sort((a, b) =>
    String(b.updatedAt || b.publishedAt).localeCompare(String(a.updatedAt || a.publishedAt))
  );
  const bySlug = new Map(sorted.map((a) => [a.slug, a]));
  const picked = [];
  const seen = new Set();

  const pushUnique = (item) => {
    if (!item || seen.has(item.slug) || picked.length >= limit) return;
    seen.add(item.slug);
    picked.push(item);
  };

  if (pageKey === 'index') {
    for (const cat of cfg.preferredCategories) {
      const newestCat = sorted.find((a) => a.category === cat && !seen.has(a.slug));
      pushUnique(newestCat);
    }
  }

  for (const slug of cfg?.preferredSlugs || []) {
    pushUnique(bySlug.get(slug));
  }

  for (const cat of cfg?.preferredCategories || []) {
    for (const art of sorted) {
      if (art.category === cat) pushUnique(art);
    }
  }

  for (const art of sorted) {
    pushUnique(art);
  }

  return picked.slice(0, limit);
}

function renderClusterBlock(cfg, selectedArticles) {
  const cards = selectedArticles
    .map((a) => {
      const catLabel = a.categoryLabel || CATEGORIES[a.category];
      return `          <a class="cluster-card" href="./bai-viet/${escHtml(a.slug)}.html">
            <h3>${escHtml(a.title)}</h3>
            <p>${escHtml(a.summary)}</p>
            <div class="cluster-card-foot">
              <span class="cluster-cat is-${escHtml(a.category)}">${escHtml(catLabel)}</span>
              <span class="cluster-read">Đọc bài →</span>
            </div>
          </a>`;
    })
    .join('\n');

  return `<!-- SEO_CLUSTER:START -->
    <section class="${cfg.bandClass}" id="${cfg.sectionId}" aria-labelledby="${cfg.sectionId}-title">
      <div class="wrap">
        <div class="cluster-head-row">
          <div class="section-head">
            <h2 id="${cfg.sectionId}-title">${escHtml(cfg.heading)}</h2>
            <p>${escHtml(cfg.subtitle)}</p>
          </div>
          <a class="cluster-all-link" href="./tin-tuc-hsk.html">Xem tất cả cẩm nang →</a>
        </div>
        <div class="cluster-grid">
${cards}
        </div>
      </div>
    </section>
    <!-- SEO_CLUSTER:END -->`;
}

export function syncTopicClusters(articles) {
  let updatedPages = 0;
  for (const cfg of TOPIC_CLUSTER_PAGES) {
    const filePath = path.join(ROOT, cfg.file);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, 'utf8');
    const markerRe = /<!--\s*SEO_CLUSTER:START\s*-->[\s\S]*?<!--\s*SEO_CLUSTER:END\s*-->/;
    if (!markerRe.test(html)) continue;
    const picked = selectClusterArticles(articles, cfg.key, 3);
    const nextHtml = html.replace(markerRe, renderClusterBlock(cfg, picked));
    if (nextHtml !== html) {
      fs.writeFileSync(filePath, nextHtml, 'utf8');
      updatedPages++;
    }
  }
  return updatedPages;
}

export function buildAllSeoArticles() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const articles = Array.isArray(data.articles) ? data.articles : [];
  if (!articles.length) throw new Error('No articles found in content/seo-articles/articles.json');

  const seen = new Set();
  const bySlug = new Map();
  for (const a of articles) {
    validateArticle(a);
    if (seen.has(a.slug)) throw new Error(`Duplicate article slug: ${a.slug}`);
    seen.add(a.slug);
    bySlug.set(a.slug, a);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const article of articles) {
    const html = renderArticleHtml(article, bySlug);
    fs.writeFileSync(path.join(OUT_DIR, `${article.slug}.html`), html, 'utf8');
  }
  fs.writeFileSync(HUB_PATH, renderHubHtml(articles), 'utf8');
  const clustersSynced = syncTopicClusters(articles);

  const urls = [
    `${BASE_URL}/`,
    ...SUPPORTING_SLUGS.map((s) => `${BASE_URL}/${s}`),
    ...articles.map((a) => `${BASE_URL}/bai-viet/${a.slug}`),
  ];
  const uniqueUrls = [...new Set(urls)];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    uniqueUrls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');

  return { count: articles.length, urls: uniqueUrls.length, clustersSynced };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const res = buildAllSeoArticles();
  console.log(`Built tin-tuc-hsk.html + ${res.count} SEO articles in bai-viet/ + ${res.clustersSynced} cluster bands + sitemap.xml (${res.urls} URLs)`);
}
