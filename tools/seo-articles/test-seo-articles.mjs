import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildAllSeoArticles, escHtml, formatDateVi, safeJsonLd, selectClusterArticles, validateArticle } from './build-seo-articles.mjs';
import {
  DEFAULT_OPENROUTER_MODEL,
  EDITORIAL_VOICES,
  buildArticlePrompt,
  buildNewsRewritePrompt,
  callOpenRouterJson,
  defaultChineseTestSources,
  extractJsonObject,
  inferCategoryFromNews,
  normalizeGeneratedArticle,
  pickEditorialVoice,
  pickNextQueueTopic,
  resolveAiConfig,
  slugifyVi,
} from './generate-ai-article.mjs';
import {
  LEGACY_SOURCE_URL,
  SEEN_NEWS_PATH,
  SNAPSHOT_PATH,
  cleanNewsHeadline,
  dedupeRepeatedLead,
  extractNewsId,
  findUnseenNewsItems,
  formatChineseTestGroundingSummary,
  parseCalendarTables,
} from './sync-chinesetest-official.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

test('slugifyVi converts Vietnamese headlines into clean SEO URLs', () => {
  assert.equal(
    slugifyVi('Cách tra điểm thi HSK online & đọc phiếu điểm trên ChineseTest'),
    'cach-tra-diem-thi-hsk-online-doc-phieu-diem-tren-chinesetest'
  );
  assert.equal(slugifyVi('Phân biệt 的, 地, 得!'), 'phan-biet');
});

test('formatDateVi & HTML/JSON-LD escaping preserve safety', () => {
  assert.equal(formatDateVi('2026-11-25'), '25/11/2026');
  assert.equal(escHtml('<script>"test" & ok</script>'), '&lt;script&gt;&quot;test&quot; &amp; ok&lt;/script&gt;');
  assert.ok(!safeJsonLd({ text: '</script><script>alert(1)</script>' }).includes('</script>'));
});

test('parseCalendarTables separates HSK 1-6 and HSK 7-9 and excludes YCT/BCT', () => {
  const parsed = parseCalendarTables([
    {
      heading: 'Chinese Proficiency Test/HSK(Levels 1-6)+HSK Speaking Test',
      rows: [
        ['Test Date (HSK/HSK Speaking Test)', 'Test Form', 'Registration Deadline', 'Result Releasing Date'],
        ['Dec.', '13th December (Sun)', 'PBT+iBT at-center', '16th November', '3rd December', '※15th January 2027', '28th December', '31st December'],
        ['27th December (Sun)', 'iBT at-center', '-', '17th December', '-', '11th January 2027', '15th January 2027'],
      ],
    },
    {
      heading: 'Chinese Proficiency Test/HSK (Levels 7-9)',
      rows: [
        ['Test Date', 'Test Form', 'Registration Deadline', 'Result Releasing Date'],
        ['Nov.', '22nd November (Sun)', 'iBT at-center', '8th November', '22nd December'],
      ],
    },
    {
      heading: 'Chinese Proficiency Test (Youth) /YCT',
      rows: [
        ['Jan.', '10th January (Sat)', 'Written', 'PBT', '14th December 2025', '-', '10th February', '-', '-'],
      ],
    },
  ]);

  assert.equal(parsed.hsk1to6.length, 2);
  assert.equal(parsed.hsk1to6[0].month, 'Dec.');
  assert.equal(parsed.hsk1to6[0].testDate, '13th December (Sun)');
  assert.equal(parsed.hsk1to6[0].regDeadlinePbt, '16th November');
  assert.equal(parsed.hsk1to6[0].resultDateIbtHskk, '31st December');
  assert.equal(parsed.hsk1to6[1].month, 'Dec.');
  assert.equal(parsed.hsk1to6[1].testDate, '27th December (Sun)');

  assert.equal(parsed.hsk7to9.length, 1);
  assert.equal(parsed.hsk7to9[0].testDate, '22nd November (Sun)');
  assert.equal(parsed.hsk7to9[0].resultDate, '22nd December');
});

test('dedupeRepeatedLead & news scanner helpers extract IDs, clean titles, and filter unseen news', () => {
  assert.equal(
    dedupeRepeatedLead(
      'HSK 3.0 will be officially launched worldwide on December 13, 2026! HSK 3.0 will be officially launched worldwide on December 13, 2026!'
    ),
    'HSK 3.0 will be officially launched worldwide on December 13, 2026!'
  );

  assert.equal(extractNewsId('/news/51619013'), '51619013');
  assert.equal(extractNewsId('https://www.chinesetest.cn/news/51336883'), '51336883');
  assert.equal(extractNewsId('/test-centers'), '');

  assert.equal(
    cleanNewsHeadline('2026年考试日期 2026年考试日期 2025-12-25 More'),
    '2026年考试日期'
  );
  assert.equal(
    cleanNewsHeadline('2025年考试日期 View Details 07 2025年01月'),
    '2025年考试日期'
  );

  const unseen = findUnseenNewsItems(
    [
      { href: '/news/51336883', text: 'Existing announcement' },
      { href: '/news/52000100', text: 'Brand new exam adjustment' },
      { href: '/news/52000250', text: '2027 Spring Score Notice View Details 10 2026年12月' },
      { href: '/news/51999999', text: 'Already cited in articles.json' },
    ],
    ['51336883'],
    [{ slug: 'old-art', sources: [{ url: 'https://www.chinesetest.cn/news/51999999' }] }]
  );
  assert.deepEqual(
    unseen.map((u) => u.id),
    ['52000250', '52000100']
  );
  assert.equal(unseen[0].title, '2027 Spring Score Notice');
});

test('seen-news ledger and official ChineseTest snapshot exist and validate', () => {
  assert.ok(fs.existsSync(SEEN_NEWS_PATH), 'seen-news.json must exist');
  const seen = JSON.parse(fs.readFileSync(SEEN_NEWS_PATH, 'utf8'));
  assert.ok(Array.isArray(seen.seenIds) && seen.seenIds.includes('51336883'));
  assert.ok(seen.seenIds.includes('51619013'));

  assert.ok(fs.existsSync(SNAPSHOT_PATH), 'chinesetest-official.json must exist');
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  assert.equal(snap.requestedSourceUrl, LEGACY_SOURCE_URL);
  assert.ok(snap.vietnamTestCenters.length >= 20, 'expected Vietnam test centers from chinesetest.cn');
  assert.ok(snap.calendars['2026']?.hsk1to6?.length >= 10, 'expected 2026 HSK 1-6 dates');
  assert.ok(snap.calendars['2027']?.hsk1to6?.length >= 10, 'expected 2027 HSK 1-6 dates');

  const grounding = formatChineseTestGroundingSummary(snap);
  assert.match(grounding, /goKdInfoOrPlan\.do/);
  assert.match(grounding, /LỊCH THI & LỊCH TRẢ KẾT QUẢ HSK 1–6/);
  assert.match(grounding, /ĐỊA ĐIỂM THI HSK CHÍNH THỨC TẠI VIỆT NAM/);

  const sources = defaultChineseTestSources(snap, 'ky-thi');
  assert.ok(sources.length >= 3);
  assert.ok(sources.some((s) => s.url.includes('chinesetest.cn')));
});

test('pickEditorialVoice rotates across voices and honors explicit override', () => {
  const voiceKeys = Object.keys(EDITORIAL_VOICES);
  assert.equal(voiceKeys.length, 4);

  const explicit = pickEditorialVoice('52000100', 'hoi-dap-thuc-chien');
  assert.equal(explicit.id, 'hoi-dap-thuc-chien');

  const pickedSet = new Set();
  for (let i = 52000000; i < 52000025; i++) {
    pickedSet.add(pickEditorialVoice(String(i)).id);
  }
  assert.equal(pickedSet.size, 4, 'expected all 4 editorial voices to rotate across seed IDs');
});

test('buildNewsRewritePrompt rewrites news in fresh Vietnamese voice with strict grounding', () => {
  const newsDetail = {
    id: '52000999',
    url: 'https://www.chinesetest.cn/news/52000999',
    title: 'Notice on Score Query Window for December HSK',
    publishedTime: '2026-11-25',
    bodyText: 'Scores for iBT HSK on Dec 13 will open on query-score on Dec 28, 2026.',
    tables: [],
  };
  assert.equal(inferCategoryFromNews(newsDetail), 'diem-so');

  const voice = pickEditorialVoice('52000999', 'ban-tin-phan-tich');
  const prompt = buildNewsRewritePrompt({
    newsDetail,
    voice,
    slug: 'thong-bao-tra-diem-hsk-thang-12',
    category: 'diem-so',
    chineseTestSummary: 'Nguồn đối chiếu chính thức ChineseTest',
    today: '2026-11-25',
    existingSlugs: ['cach-tra-diem-thi-hsk-online'],
  });
  assert.match(prompt, /VIẾT LẠI HOÀN TOÀN/);
  assert.match(prompt, /Bản tin phân tích sắc gọn/);
  assert.match(prompt, /52000999/);
  assert.match(prompt, /TUYỆT ĐỐI KHÔNG tự bịa/);
  assert.match(prompt, /hạn mức/);
});

test('validateArticle rejects forbidden limitation phrases & invalid categories', () => {
  const base = {
    slug: 'bai-kiem-tra',
    category: 'meo-hoc',
    title: 'Mẹo học từ vựng HSK',
    metaTitle: 'Mẹo học từ vựng HSK | HSK Flashcards',
    metaDescription: 'Hướng dẫn học từ vựng HSK miễn phí cùng Gia sư AI.',
    summary: 'Tóm tắt ngắn gọn.',
    publishedAt: '2026-11-25',
    sections: [{ id: 'muc-1', heading: 'Mục 1', paragraphs: ['Nội dung hoàn toàn miễn phí.'] }],
  };
  assert.doesNotThrow(() => validateArticle(base));

  assert.throws(
    () =>
      validateArticle({
        ...base,
        sections: [{ id: 'muc-1', heading: 'Mục 1', paragraphs: ['Tính năng áp dụng hạn mức mỗi ngày.'] }],
      }),
    /Forbidden limitation phrase/
  );

  assert.throws(() => validateArticle({ ...base, category: 'unknown' }), /Invalid category/);
});

test('buildArticlePrompt & normalizeGeneratedArticle support suggestedSlug collision resolution and grounding', () => {
  const prompt = buildArticlePrompt({
    topic: 'Lịch thi HSK 2027 mới nhất',
    slug: 'lich-thi-hsk-2027-moi-nhat',
    category: 'ky-thi',
    hskTag: 'HSK 1–6',
    keywords: ['lịch thi HSK 2027'],
    sourceUrl: '',
    sourceNotes: '',
    chineseTestSummary: 'Ngày thi: 9th January (Sat) | Hạn ĐK giấy: 13th December 2026',
    today: '2026-11-25',
    existingSlugs: ['cach-tra-diem-thi-hsk-online'],
  });
  assert.match(prompt, /goKdInfoOrPlan\.do/);
  assert.match(prompt, /9th January \(Sat\)/);
  assert.match(prompt, /KHÔNG nhắc đến các điểm hạn chế/);

  const normalized = normalizeGeneratedArticle(
    {
      suggestedSlug: 'cach-tra-diem-thi-hsk-online',
      title: 'Cách tra điểm thi HSK đợt mới nhất nhanh và chuẩn xác',
      metaTitle: 'Cách tra điểm thi HSK đợt mới nhất | HSK Flashcards',
      metaDescription: 'Hướng dẫn tra điểm thi HSK đợt mới trên ChineseTest nhanh chóng.',
      summary: 'Hướng dẫn xem điểm mới trên ChineseTest.',
      keywords: ['tra điểm HSK'],
      sections: [{ heading: 'Thời gian mở cổng xem điểm', paragraphs: ['Thông tin chi tiết từ ChineseTest.'] }],
      faqs: [{ q: 'Xem điểm ở đâu?', a: 'Xem tại chinesetest.cn/query-score.' }],
      relatedSlugs: ['khong-ton-tai'],
    },
    {
      slug: 'fallback-slug',
      allowSuggestedSlug: true,
      sourceNewsId: '52000999',
      editorialVoice: 'hoi-dap-thuc-chien',
      category: 'diem-so',
      hskTag: 'Tin mới ChineseTest',
      today: '2026-11-25',
      existingSlugs: ['cach-tra-diem-thi-hsk-online'],
      sourceUrl: 'https://www.chinesetest.cn/news/52000999',
      fallbackSources: [{ label: 'Lịch thi HSK 2027 (ChineseTest)', url: 'https://www.chinesetest.cn/news/51619013' }],
    }
  );
  assert.equal(normalized.slug, 'cach-tra-diem-thi-hsk-online-0999');
  assert.equal(normalized.sourceNewsId, '52000999');
  assert.equal(normalized.editorialVoice, 'hoi-dap-thuc-chien');
  assert.deepEqual(normalized.relatedSlugs, ['cach-tra-diem-thi-hsk-online']);
  assert.equal(normalized.sources[0].url, 'https://www.chinesetest.cn/news/52000999');
});

test('pickNextQueueTopic skips already published slugs', () => {
  const next = pickNextQueueTopic(
    [{ slug: 'a' }, { slug: 'b' }],
    [
      { slug: 'a', topic: 'Topic A' },
      { slug: 'c', topic: 'Topic C' },
    ]
  );
  assert.equal(next?.slug, 'c');
});

test('all published articles build cleanly into tin-tuc-hsk.html, bai-viet/*.html, 9 cluster bands, and sitemap.xml', () => {
  const result = buildAllSeoArticles();
  assert.ok(result.count >= 8, 'expected at least 8 seed SEO articles');

  const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/seo-articles/articles.json'), 'utf8')).articles;
  for (const key of ['index', 'compare', 'editor', 'hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6']) {
    const selected = selectClusterArticles(articles, key, 3);
    assert.equal(selected.length, 3, `expected 3 cluster articles for ${key}`);
  }

  const hubHtml = fs.readFileSync(path.join(ROOT, 'tin-tuc-hsk.html'), 'utf8');
  assert.match(hubHtml, /<link rel="canonical" href="https:\/\/hskfreelearningai\.pages\.dev\/tin-tuc-hsk">/);
  assert.match(hubHtml, /data-cat-btn="ky-thi"/);
  assert.match(hubHtml, /id="newsLoadMoreBtn"/);
  assert.match(hubHtml, /data-in-lead="1"/);
  assert.match(hubHtml, /app-hoc-hsk\.html/);
  assert.match(hubHtml, /seo-offline-prewarm\.js/);

  for (const file of [
    'index.html',
    'phan-biet-tu-de-nham-hsk.html',
    'sua-cau-tieng-trung-ai.html',
    'luyen-thi-hsk-1-mien-phi.html',
    'luyen-thi-hsk-2-mien-phi.html',
    'luyen-thi-hsk-3-mien-phi.html',
    'luyen-thi-hsk-4-mien-phi.html',
    'luyen-thi-hsk-5-mien-phi.html',
    'luyen-thi-hsk-6-mien-phi.html',
  ]) {
    const pageHtml = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.equal((pageHtml.match(/class="cluster-card"/g) || []).length, 3, `expected 3 cluster cards in ${file}`);
  }

  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /https:\/\/hskfreelearningai\.pages\.dev\/tin-tuc-hsk/);
  assert.match(sitemap, /https:\/\/hskfreelearningai\.pages\.dev\/bai-viet\/lich-thi-hsk-va-lich-tra-ket-qua-chinh-thuc/);
});

test('resolveAiConfig prioritizes OpenRouter with gemma-4-31b-it:free and supports Gemini fallback', () => {
  assert.equal(DEFAULT_OPENROUTER_MODEL, 'google/gemma-4-31b-it:free');

  const cfg = resolveAiConfig({ OPENROUTER_API_KEY: 'test-or-key', GEMINI_API_KEY: 'test-gem-key' }, {});
  assert.equal(cfg.provider, 'openrouter');
  assert.equal(cfg.model, 'google/gemma-4-31b-it:free');
  assert.equal(cfg.fallback?.provider, 'gemini');

  const customCfg = resolveAiConfig({ OPENROUTER_API_KEY: 'test-or-key', OPENROUTER_MODEL: 'custom/model:free' }, {});
  assert.equal(customCfg.model, 'custom/model:free');

  const gemOnly = resolveAiConfig({ GEMINI_API_KEY: 'test-gem-key' }, {});
  assert.equal(gemOnly.provider, 'gemini');

  const forcedGem = resolveAiConfig({ OPENROUTER_API_KEY: 'test-or-key', GEMINI_API_KEY: 'test-gem-key' }, { provider: 'gemini' });
  assert.equal(forcedGem.provider, 'gemini');

  assert.throws(() => resolveAiConfig({}, {}), /OPENROUTER_API_KEY/);
});

test('extractJsonObject parses plain, fenced, think-tagged, and prose-wrapped JSON cleanly', () => {
  assert.deepEqual(extractJsonObject('{"ok":true,"n":2}'), { ok: true, n: 2 });
  assert.deepEqual(extractJsonObject('<think>reasoning {ignored}</think>\n```json\n{"title":"Lịch thi HSK"}\n```'), {
    title: 'Lịch thi HSK',
  });
  assert.deepEqual(extractJsonObject('Here is your JSON:\n{"text":"Brace } inside string","ok":1}\nDone.'), {
    text: 'Brace } inside string',
    ok: 1,
  });
});

test('callOpenRouterJson sends correct payload and retries without response_format on HTTP 400', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, headers: init.headers, body });
    if (calls.length === 1) {
      return { ok: false, status: 400, text: async () => 'response_format json_object unsupported' };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '```json\n{"title":"Tin mới HSK"}\n```' } }],
      }),
    };
  };

  const result = await callOpenRouterJson('Viết bài JSON', 'test-or-key', undefined, fakeFetch);
  assert.deepEqual(result, { title: 'Tin mới HSK' });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].headers.Authorization, 'Bearer test-or-key');
  assert.equal(calls[0].body.model, 'google/gemma-4-31b-it:free');
  assert.deepEqual(calls[0].body.response_format, { type: 'json_object' });
  assert.equal(calls[1].body.response_format, undefined);
});
