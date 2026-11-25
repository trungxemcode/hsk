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
  return `  <header class="site-header">
    <div class="wrap nav-bar">
      <a class="brand" href="${prefix}" aria-label="Trang chủ HSK Flashcards">
        <span class="brand-mark" aria-hidden="true">汉</span>
        <span>HSK Flashcards</span>
      </a>
      <nav class="nav-links" aria-label="Điều hướng cụm trang học HSK">
${link(`${prefix}`, 'Học HSK cùng AI', 'home')}
${link(`${prefix}tra-diem-hsk.html`, 'Tra điểm HSK', 'score')}
${link(`${prefix}tin-tuc-hsk.html`, 'Tin tức HSK', 'news')}
${link(`${prefix}sua-cau-tieng-trung-ai.html`, 'Sửa câu AI', 'editor')}
${link(`${prefix}phan-biet-tu-de-nham-hsk.html`, 'Từ dễ nhầm', 'compare')}
${link(`${prefix}tap-viet-chu-han-online.html`, 'Tập viết chữ Hán', 'write')}
      </nav>
      <div class="nav-actions">
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
    <div class="wrap footer-inner">
      <a class="brand" href="${prefix}">
        <span class="brand-mark" aria-hidden="true">汉</span>
        <span>HSK Flashcards</span>
      </a>
      <nav class="footer-links" aria-label="Liên kết cuối trang">
        <a href="${prefix}">Học HSK cùng AI</a>
        <a href="${prefix}tra-diem-hsk.html">Tra điểm HSK</a>
        <a href="${prefix}tin-tuc-hsk.html">Tin tức &amp; Mẹo HSK</a>
        <a href="${prefix}luyen-thi-hsk-1-mien-phi.html">Luyện thi HSK 1–6</a>
        <a href="${prefix}phan-biet-tu-de-nham-hsk.html">Từ dễ nhầm</a>
        <a href="${prefix}app-hoc-hsk.html">Mở ứng dụng</a>
      </nav>
    </div>
  </footer>`;
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

  const sectionsHtml = article.sections.map((s, i) => {
    const sid = escHtml(s.id || `muc-${i + 1}`);
    const parts = [`          <section class="article-section" aria-labelledby="${sid}">`, `            <h2 id="${sid}">${escHtml(s.heading)}</h2>`];
    for (const p of s.paragraphs || []) {
      parts.push(`            <p>${escHtml(p)}</p>`);
    }
    if (Array.isArray(s.bullets) && s.bullets.length) {
      parts.push('            <ul>');
      for (const b of s.bullets) parts.push(`              <li>${escHtml(b)}</li>`);
      parts.push('            </ul>');
    }
    if (s.table && Array.isArray(s.table.headers) && Array.isArray(s.table.rows)) {
      parts.push('            <div class="article-table-wrap"><table class="article-table"><thead><tr>');
      for (const h of s.table.headers) parts.push(`              <th>${escHtml(h)}</th>`);
      parts.push('            </tr></thead><tbody>');
      for (const row of s.table.rows) {
        parts.push('              <tr>' + row.map((cell) => `<td>${escHtml(cell)}</td>`).join('') + '</tr>');
      }
      parts.push('            </tbody></table></div>');
    }
    if (s.example && s.example.han) {
      parts.push(`            <div class="article-example">
              <span class="cn" lang="zh-Hans">${escHtml(s.example.han)}</span>
              ${s.example.py ? `<span class="py">${escHtml(s.example.py)}</span>` : ''}
              ${s.example.vi ? `<span class="vi">${escHtml(s.example.vi)}</span>` : ''}
            </div>`);
    }
    if (s.tip) {
      parts.push(`            <div class="article-tip">${escHtml(s.tip)}</div>`);
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
          <a class="btn-primary" href="../app-hoc-hsk.html">
            <span>Hỏi thêm Gia sư AI miễn phí</span>
            <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </a>
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
        <div class="hub-links-grid">
${related.map((r) => `          <a class="hub-link-card" href="./${escHtml(r.slug)}.html">
            <strong><span>${escHtml(r.title)}</span><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></strong>
            <span>${escHtml(r.summary)}</span>
          </a>`).join('\n')}
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
    <section class="hero hero-compact" aria-labelledby="hero-title">
      <span class="hero-watermark" aria-hidden="true">资讯</span>
      <div class="wrap">
        <ol class="crumb" aria-label="Đường dẫn">
          <li><a href="../">HSK Flashcards</a></li>
          <li><a href="../tin-tuc-hsk.html">Tin tức &amp; Mẹo HSK</a></li>
          <li aria-current="page">${escHtml(catLabel)}</li>
        </ol>
        <div class="hero-copy">
          <h1 id="hero-title">${escHtml(article.title)}</h1>
          <p class="hero-lead">${escHtml(article.summary)}</p>
          <div class="hero-cta-row">
            <a class="btn-hero-main" href="../app-hoc-hsk.html">
              <span>Vào học HSK miễn phí ngay</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
            <a class="btn-hero-ghost" href="../tin-tuc-hsk.html">
              <span>Xem thêm tin tức HSK</span>
            </a>
          </div>
          <ul class="hero-proof">
            <li><span>Chuyên mục: ${escHtml(catLabel)}</span></li>
            <li><span>Trọng tâm: ${escHtml(article.hskTag || 'HSK 1–6')}</span></li>
            <li><span>Cập nhật: ${escHtml(formatDateVi(updatedAt))}</span></li>
            <li><span>Đọc khoảng ${Number(article.readMinutes) || 5} phút</span></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="band" aria-label="Nội dung bài viết">
      <div class="wrap article-layout">
        <article class="article-body">
${sectionsHtml}
${sourcesHtml}
        </article>

        <aside class="article-sidebar" aria-label="Mục lục và lối tắt học HSK">
          <nav class="toc-box" aria-label="Mục lục bài viết">
            <h3>Nội dung chính</h3>
            <ul class="toc-list">
${tocHtml}
            </ul>
          </nav>

          <div class="side-cta-box">
            <h3>Học HSK &amp; hỏi Gia sư AI miễn phí</h3>
            <p>Thực hành ngay đề thi thử HSK 1–6, flashcard SRS, sửa câu tiếng Trung và hỏi đáp 1–1 bằng tiếng Việt.</p>
            <a class="btn-primary" href="../app-hoc-hsk.html">
              <span>Mở ứng dụng ngay</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
            <a class="text-link" href="../tin-tuc-hsk.html">
              <span>Xem tất cả bài viết HSK</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
          </div>
        </aside>
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
          <a class="btn-hero-main" href="../app-hoc-hsk.html">
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
  const canonical = `${BASE_URL}/tin-tuc-hsk`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HSK Flashcards', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Tin tức & Mẹo thi HSK', item: canonical },
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
    ? `        <article class="news-featured" aria-label="Bài viết nổi bật">
          <div>
            <div class="news-meta-row">
              <span class="news-cat-pill">${escHtml(featured.categoryLabel || CATEGORIES[featured.category])}</span>
              <span>${escHtml(featured.hskTag || 'HSK 1–6')}</span>
              <span>Cập nhật ${escHtml(formatDateVi(featured.updatedAt || featured.publishedAt))}</span>
              <span>${Number(featured.readMinutes) || 5} phút đọc</span>
            </div>
            <h2><a href="./bai-viet/${escHtml(featured.slug)}.html">${escHtml(featured.title)}</a></h2>
            <p>${escHtml(featured.summary)}</p>
            <a class="btn-primary" href="./bai-viet/${escHtml(featured.slug)}.html">
              <span>Đọc thông tin chi tiết</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
          </div>
          <div class="news-featured-side">
            <h3>Chủ đề chính trong bài</h3>
            <ul class="news-kw-list">
${(featured.keywords || []).slice(0, 5).map((k) => `              <li>${escHtml(k)}</li>`).join('\n')}
            </ul>
            <a class="text-link" href="./app-hoc-hsk.html">
              <span>Vào luyện đề &amp; hỏi Gia sư AI</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
          </div>
        </article>`
    : '';

  const cardsHtml = sorted.map((a) => {
    const catLabel = a.categoryLabel || CATEGORIES[a.category];
    const kw = [a.title, a.summary, a.hskTag, catLabel, ...(a.keywords || [])].join(' ');
    return `          <article class="news-card" data-cat="${escHtml(a.category)}" data-kw="${escHtml(kw)}">
            <div class="news-meta-row">
              <span class="news-cat-pill">${escHtml(catLabel)}</span>
              <span>${escHtml(a.hskTag || 'HSK 1–6')}</span>
            </div>
            <h3><a href="./bai-viet/${escHtml(a.slug)}.html">${escHtml(a.title)}</a></h3>
            <p>${escHtml(a.summary)}</p>
            <div class="news-card-foot">
              <span>${escHtml(formatDateVi(a.updatedAt || a.publishedAt))} · ${Number(a.readMinutes) || 5} phút</span>
              <a class="text-link" href="./bai-viet/${escHtml(a.slug)}.html">Đọc bài →</a>
            </div>
          </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Tin tức kỳ thi HSK, lịch thi 2026–2027, điểm thi &amp; ngữ pháp | HSK Flashcards</title>
  <meta name="description" content="Cập nhật chính thức từ chinesetest.cn: lịch thi &amp; lịch trả điểm HSK 2026–2027, danh sách điểm thi tại Việt Nam, thông báo HSK 3.0, cách tra điểm, mẹo học và ngữ pháp HSK.">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="./icon-192.png" type="image/png">
  <link rel="apple-touch-icon" href="./icon-180.png">
  <meta name="theme-color" content="#37299e">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:site_name" content="HSK Flashcards">
  <meta property="og:title" content="Tin tức kỳ thi HSK, lịch thi 2026–2027, điểm thi &amp; ngữ pháp">
  <meta property="og:description" content="Tổng hợp lịch thi &amp; lịch trả kết quả HSK từ chinesetest.cn, điểm thi Việt Nam, thông báo thay đổi kỳ thi HSK 3.0, mẹo học và phân biệt ngữ pháp.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE_URL}/icon-512.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Tin tức kỳ thi HSK, lịch thi 2026–2027, điểm thi &amp; ngữ pháp">
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
    <section class="hero hero-compact" aria-labelledby="hero-title">
      <span class="hero-watermark" aria-hidden="true">考试</span>
      <div class="wrap">
        <ol class="crumb" aria-label="Đường dẫn">
          <li><a href="./">HSK Flashcards</a></li>
          <li aria-current="page">Tin tức &amp; Mẹo HSK</li>
        </ol>
        <div class="hero-copy">
          <h1 id="hero-title">Tin tức kỳ thi HSK chính thức, lịch thi – trả điểm, mẹo học &amp; ngữ pháp</h1>
          <p class="hero-lead">
            Đối chiếu trực tiếp từ cổng chính thức ChineseTest (chinesetest.cn): lịch thi và lịch trả điểm HSK 2026–2027, địa điểm thi tại Việt Nam, thông báo thay đổi kỳ thi HSK 3.0, cùng kho mẹo học và phân biệt ngữ pháp dễ nhớ.
          </p>
          <div class="hero-cta-row">
            <a class="btn-hero-main" href="./app-hoc-hsk.html">
              <span>Vào luyện thi HSK miễn phí ngay</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
            <a class="btn-hero-ghost" href="#danh-sach-bai-viet">
              <span>Xem tất cả bài viết (${sorted.length})</span>
              <svg class="ico" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="band" id="danh-sach-bai-viet" aria-labelledby="list-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="list-title">Kho tin tức kỳ thi HSK &amp; cẩm nang tự học</h2>
          <p>Tìm nhanh theo chủ đề bạn đang quan tâm hoặc gõ từ khóa như “lịch thi 2027”, “HSK 3.0”, “tra điểm”, “điểm thi Việt Nam”, “ngữ pháp”.</p>
        </div>

${featuredHtml}

        <div class="filter-bar">
          <div class="search-input-wrap">
            <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" id="newsSearch" class="search-input" placeholder="Tìm bài viết: lịch thi 2027, HSK 3.0, tra điểm, ngữ pháp..." aria-label="Tìm bài viết HSK">
          </div>
          <div class="level-tabs" role="tablist" aria-label="Lọc bài viết theo chuyên mục" style="margin-bottom:0">
            <button type="button" class="level-tab" role="tab" aria-selected="true" data-cat-btn="all">Tất cả (${sorted.length})</button>
            <button type="button" class="level-tab" role="tab" aria-selected="false" data-cat-btn="ky-thi">Kỳ thi &amp; Đăng ký</button>
            <button type="button" class="level-tab" role="tab" aria-selected="false" data-cat-btn="diem-so">Điểm số &amp; Tra điểm</button>
            <button type="button" class="level-tab" role="tab" aria-selected="false" data-cat-btn="meo-hoc">Mẹo học HSK</button>
            <button type="button" class="level-tab" role="tab" aria-selected="false" data-cat-btn="ngu-phap">Phân biệt &amp; Ngữ pháp</button>
          </div>
        </div>

        <div class="news-grid" id="newsGrid">
${cardsHtml}
        </div>

        <p class="empty-state" id="newsEmpty" hidden>
          Không tìm thấy bài viết khớp từ khóa vừa nhập. Bạn có thể mở <strong>Gia sư AI tiếng Trung</strong> trong ứng dụng để hỏi trực tiếp câu hỏi của mình!
        </p>
      </div>
    </section>

    <section class="band band-surface" aria-labelledby="cluster-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="cluster-title">Thực hành ngay với bộ công cụ học HSK 1–6 miễn phí</h2>
          <p>Đọc xong lịch thi và ngữ pháp, áp dụng liền vào luyện đề, sửa câu AI và flashcard SRS để nhớ chắc hơn.</p>
        </div>
        <div class="hub-links-grid">
          <a class="hub-link-card" href="./tra-diem-hsk.html">
            <strong><span>Tra điểm thi HSK online trực tiếp</span><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></strong>
            <span>Mở cổng ChineseTest ngay trên web kèm chuẩn hóa họ tên và tính điểm đậu HSK 1–6.</span>
          </a>
          <a class="hub-link-card" href="./">
            <strong><span>Học HSK miễn phí cùng Gia sư AI</span><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></strong>
            <span>Hỏi đáp tiếng Trung 1–1 bằng tiếng Việt, giải thích đáp án đề HSK.</span>
          </a>
          <a class="hub-link-card" href="./sua-cau-tieng-trung-ai.html">
            <strong><span>Sửa câu tiếng Trung bằng AI</span><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></strong>
            <span>Kiểm tra ngữ pháp, sửa lỗi trật tự từ cho phần Viết HSK 3–6.</span>
          </a>
          <a class="hub-link-card" href="./phan-biet-tu-de-nham-hsk.html">
            <strong><span>Phân biệt 16 cặp từ dễ nhầm HSK</span><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></strong>
            <span>Bảng tra cứu có bộ lọc cho 16 cặp từ tiếng Trung hay thi nhất.</span>
          </a>
        </div>
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

      var searchEl = document.getElementById('newsSearch');
      var catBtns = document.querySelectorAll('[data-cat-btn]');
      var cards = Array.prototype.slice.call(document.querySelectorAll('#newsGrid .news-card'));
      var emptyEl = document.getElementById('newsEmpty');
      var activeCat = 'all';

      function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      function applyFilter() {
        var q = norm(searchEl ? searchEl.value.trim() : '');
        var shown = 0;
        cards.forEach(function (card) {
          var okCat = activeCat === 'all' || card.getAttribute('data-cat') === activeCat;
          var okQ = !q || norm(card.getAttribute('data-kw')).indexOf(q) !== -1;
          var vis = okCat && okQ;
          card.hidden = !vis;
          if (vis) shown++;
        });
        if (emptyEl) emptyEl.hidden = shown > 0;
      }

      if (searchEl) searchEl.addEventListener('input', applyFilter);
      catBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeCat = btn.getAttribute('data-cat-btn') || 'all';
          catBtns.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
          applyFilter();
        });
      });
    })();
  </script>
  <script src="./src/seo-offline-prewarm.js" defer></script>
</body>
</html>
`;
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

  return { count: articles.length, urls: uniqueUrls.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const res = buildAllSeoArticles();
  console.log(`Built tin-tuc-hsk.html + ${res.count} SEO articles in bai-viet/ + sitemap.xml (${res.urls} URLs)`);
}
