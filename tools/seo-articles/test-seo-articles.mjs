import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildAllSeoArticles, escHtml, formatDateVi, safeJsonLd, validateArticle } from './build-seo-articles.mjs';
import {
  buildArticlePrompt,
  defaultChineseTestSources,
  normalizeGeneratedArticle,
  pickNextQueueTopic,
  slugifyVi,
} from './generate-ai-article.mjs';
import {
  LEGACY_SOURCE_URL,
  SNAPSHOT_PATH,
  dedupeRepeatedLead,
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

test('dedupeRepeatedLead collapses duplicated breadcrumb/headline prefixes', () => {
  assert.equal(
    dedupeRepeatedLead(
      'HSK 3.0 will be officially launched worldwide on December 13, 2026! HSK 3.0 will be officially launched worldwide on December 13, 2026!'
    ),
    'HSK 3.0 will be officially launched worldwide on December 13, 2026!'
  );
});

test('official ChineseTest snapshot exists, references goKdInfoOrPlan.do, and formats grounding summary', () => {
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

test('buildArticlePrompt injects ChineseTest official grounding and normalizeGeneratedArticle sanitizes AI output', () => {
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
      title: 'Lịch thi HSK 2027 chính thức trên ChineseTest',
      metaTitle: 'Lịch thi HSK 2027 chính thức | HSK Flashcards',
      metaDescription: 'Tra cứu lịch thi HSK 2027 và lịch trả kết quả chính thức từ ChineseTest.',
      summary: 'Tổng hợp lịch thi và hạn đăng ký HSK 2027.',
      keywords: ['lịch thi HSK 2027'],
      sections: [{ heading: 'Các đợt thi đầu năm', paragraphs: ['Thông tin chi tiết từ ChineseTest.'] }],
      faqs: [{ q: 'Xem lịch thi ở đâu?', a: 'Xem trực tiếp trên cổng ChineseTest.' }],
      relatedSlugs: ['khong-ton-tai'],
    },
    {
      slug: 'lich-thi-hsk-2027-moi-nhat',
      category: 'ky-thi',
      hskTag: 'HSK 1–6',
      today: '2026-11-25',
      existingSlugs: ['cach-tra-diem-thi-hsk-online'],
      sourceUrl: '',
      fallbackSources: [{ label: 'Lịch thi HSK 2027 (ChineseTest)', url: 'https://www.chinesetest.cn/news/51619013' }],
    }
  );
  assert.deepEqual(normalized.relatedSlugs, ['cach-tra-diem-thi-hsk-online']);
  assert.equal(normalized.sources[0].url, 'https://www.chinesetest.cn/news/51619013');
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

test('all published articles build cleanly into tin-tuc-hsk.html, bai-viet/*.html, and sitemap.xml', () => {
  const result = buildAllSeoArticles();
  assert.ok(result.count >= 8, 'expected at least 8 seed SEO articles');

  const hubHtml = fs.readFileSync(path.join(ROOT, 'tin-tuc-hsk.html'), 'utf8');
  assert.match(hubHtml, /<link rel="canonical" href="https:\/\/hskfreelearningai\.pages\.dev\/tin-tuc-hsk">/);
  assert.match(hubHtml, /data-cat-btn="ky-thi"/);
  assert.match(hubHtml, /app-hoc-hsk\.html/);
  assert.match(hubHtml, /seo-offline-prewarm\.js/);

  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /https:\/\/hskfreelearningai\.pages\.dev\/tin-tuc-hsk/);
  assert.match(sitemap, /https:\/\/hskfreelearningai\.pages\.dev\/bai-viet\/lich-thi-hsk-va-lich-tra-ket-qua-chinh-thuc/);
});
