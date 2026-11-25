import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArticle, buildAllSeoArticles } from './build-seo-articles.mjs';
import { slugifyVi, pickNextQueueTopic, buildArticlePrompt, normalizeGeneratedArticle } from './generate-ai-article.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

test('slugifyVi normalizes Vietnamese diacritics cleanly', () => {
  assert.equal(slugifyVi('Cách đăng ký thi HSK 4 tại Việt Nam!'), 'cach-dang-ky-thi-hsk-4-tai-viet-nam');
});

test('validateArticle rejects forbidden limitation phrases', () => {
  assert.throws(() => validateArticle({
    slug: 'test-bad',
    category: 'meo-hoc',
    title: 'Tiêu đề',
    metaTitle: 'Meta',
    metaDescription: 'Có hạn mức tài khoản mỗi ngày',
    summary: 'Tóm tắt',
    publishedAt: '2026-11-24',
    sections: [{ id: 's1', heading: 'Mục 1', paragraphs: ['Nội dung'] }],
  }), /hạn mức/i);
});

test('pickNextQueueTopic skips already-published slugs', () => {
  const articles = [{ slug: 'a' }, { slug: 'b' }];
  const queue = [{ slug: 'a', topic: 'A' }, { slug: 'c', topic: 'C' }];
  assert.equal(pickNextQueueTopic(articles, queue)?.slug, 'c');
});

test('buildArticlePrompt enforces strict anti-hallucination guard for exam news', () => {
  const withoutNotes = buildArticlePrompt({
    topic: 'Kinh nghiệm thi HSK',
    slug: 'kinh-nghiem-thi-hsk',
    category: 'ky-thi',
    today: '2026-11-24',
    existingSlugs: ['cach-tra-diem-thi-hsk-online'],
  });
  assert.match(withoutNotes, /TUYỆT ĐỐI KHÔNG tự bịa ngày thi cụ thể/i);

  const withNotes = buildArticlePrompt({
    topic: 'Lịch thi HSK đợt tháng 12',
    slug: 'lich-thi-hsk-thang-12',
    category: 'ky-thi',
    sourceUrl: 'https://www.chinesetest.cn/',
    sourceNotes: 'Ngày thi dự kiến 15/12, mở cổng 01/11.',
    today: '2026-11-24',
    existingSlugs: ['cach-tra-diem-thi-hsk-online'],
  });
  assert.match(withNotes, /NGUỒN CHÍNH THỨC DO CHỦ WEB CUNG CẤP/);
  assert.match(withNotes, /Ngày thi dự kiến 15\/12/);
});

test('normalizeGeneratedArticle validates and attaches sourceUrl cleanly', () => {
  const normalized = normalizeGeneratedArticle({
    title: 'Mẹo học từ vựng HSK 3',
    metaTitle: 'Mẹo học từ vựng HSK 3 | HSK Flashcards',
    metaDescription: 'Cách học từ vựng HSK 3 nhanh thuộc bằng flashcard SRS miễn phí.',
    summary: 'Tóm tắt cách học từ vựng HSK 3 hiệu quả.',
    sections: [{ heading: 'Bước 1', paragraphs: ['Học 15 từ mỗi ngày.'] }],
    faqs: [{ q: 'Học bao lâu?', a: 'Khoảng 2 tháng.' }],
  }, {
    slug: 'meo-hoc-tu-vung-hsk-3',
    category: 'meo-hoc',
    hskTag: 'HSK 3',
    today: '2026-11-24',
    existingSlugs: ['cach-tra-diem-thi-hsk-online'],
    sourceUrl: 'https://www.chinesetest.cn/',
  });
  assert.equal(normalized.slug, 'meo-hoc-tu-vung-hsk-3');
  assert.equal(normalized.sources[0].url, 'https://www.chinesetest.cn/');
  assert.deepEqual(normalized.relatedSlugs, ['cach-tra-diem-thi-hsk-online']);
});

test('buildAllSeoArticles produces hub, article HTML files, and sitemap entries', () => {
  const res = buildAllSeoArticles();
  assert.ok(res.count >= 6);
  assert.ok(fs.existsSync(path.join(ROOT, 'tin-tuc-hsk.html')));
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('<loc>https://hskfreelearningai.pages.dev/tin-tuc-hsk</loc>'));
  assert.ok(sitemap.includes('<loc>https://hskfreelearningai.pages.dev/bai-viet/cach-tra-diem-thi-hsk-online</loc>'));
});
