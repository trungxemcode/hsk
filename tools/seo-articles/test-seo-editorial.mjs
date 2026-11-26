import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEducationalTopicTitle,
  filterAndRankTrendTopics,
  inferCategoryAndTag,
  isQueryAllowed,
  parseGoogleTrendsCsv,
} from './fetch-google-trends.mjs';
import {
  approveDraftIntoArticles,
  buildAutoPolishPrompt,
  buildRewriteDraftPrompt,
  buildTrendDraftPrompt,
  evaluateDraftQuality,
  rejectDraftRecord,
  syncApprovedQueueIntoArticles,
} from './seo-editorial-pipeline.mjs';
import {
  XKIRO_API_URL,
  callXkiroJson,
  resolveXkiroReviewConfig,
  runDualXkiroReview,
} from './xkiro-reviewers.mjs';

test('parseGoogleTrendsCsv parses Vietnamese and English Google Trends CSV exports cleanly', () => {
  const viCsv = [
    'Danh mục: Tất cả danh mục',
    '',
    'TÌM KIẾM TĂNG VỌT',
    'Cụm từ tìm kiếm,Thay đổi',
    'xin lỗi trong tiếng trung,Đột biến',
    'chửi bậy tiếng trung,+3.150%',
    '"dịch tiếng trung",+160%',
    'tiếng trung công xưởng,+40%',
    'lộ trình học tiếng trung cho người mới bắt đầu,+40%',
  ].join('\n');

  const parsed = parseGoogleTrendsCsv(viCsv);
  assert.equal(parsed.length, 5);
  assert.deepEqual(parsed[0], { query: 'xin lỗi trong tiếng trung', spike: 'Đột biến', source: 'google-trends-csv' });
  assert.deepEqual(parsed[3], { query: 'tiếng trung công xưởng', spike: '+40%', source: 'google-trends-csv' });
});

test('filterAndRankTrendTopics blocks toxic/translator noise, avoids duplicates across 3 layers, and ranks spikes higher', () => {
  assert.equal(isQueryAllowed('chửi bậy tiếng trung'), false);
  assert.equal(isQueryAllowed('dịch tiếng trung'), false);
  assert.equal(isQueryAllowed('tiếng trung sang tiếng việt'), false);
  assert.equal(isQueryAllowed('xin lỗi trong tiếng trung'), true);

  const candidates = [
    { query: 'chửi bậy tiếng trung', spike: '+3.150%', source: 'google-trends-csv' },
    { query: 'dịch tiếng trung', spike: '+160%', source: 'google-trends-csv' },
    { query: 'phân biệt 的 地 得 trong tiếng trung', spike: '+50%', source: 'google-trends-csv' },
    { query: 'xin lỗi trong tiếng trung', spike: 'Đột biến', source: 'google-trends-csv' },
    { query: 'tiếng trung công xưởng', spike: '+40%', source: 'google-trends-csv' },
  ];

  const publishedArticles = [
    {
      slug: 'phan-biet-de-de-de-trong-tieng-trung-hsk',
      title: 'Phân biệt 的, 地, 得 trong tiếng Trung',
      keywords: ['phân biệt 的 地 得'],
    },
  ];
  const drafts = [
    {
      status: 'pending_review',
      trendQuery: 'tiếng trung công xưởng',
      article: { slug: 'tieng-trung-cong-xuong', title: 'Tiếng Trung công xưởng cho người đi làm' },
    },
  ];
  const queueTopics = [
    { slug: 'bang-chu-cai-tieng-trung', category: 'meo-hoc', hskTag: 'HSK 1', topic: 'Bảng chữ cái tiếng Trung Pinyin chuẩn cho người mới' },
  ];

  const picked = filterAndRankTrendTopics(candidates, {
    publishedArticles,
    drafts,
    queueTopics,
    count: 2,
  });

  assert.equal(picked.length, 2);
  assert.equal(picked[0].query, 'xin lỗi trong tiếng trung');
  // Second falls back cleanly to queue since 'tiếng trung công xưởng' is already in drafts and 'phân biệt...' matches published
  assert.equal(picked[1].source, 'topic-queue');
  assert.equal(picked[1].slug, 'bang-chu-cai-tieng-trung');
});

test('inferCategoryAndTag and buildEducationalTopicTitle map queries accurately', () => {
  assert.deepEqual(inferCategoryAndTag('câu chữ 把 trong tiếng trung'), { category: 'ngu-phap', hskTag: 'Ngữ pháp HSK' });
  assert.deepEqual(inferCategoryAndTag('bao giờ có điểm thi hsk 2027'), { category: 'diem-so', hskTag: 'Điểm số HSK' });
  assert.match(buildEducationalTopicTitle('xin lỗi trong tiếng trung'), /xin lỗi trong tiếng trung/);
});

test('evaluateDraftQuality grades high-quality SEO articles and warns on missing elements', () => {
  const strongArticle = {
    slug: 'xin-loi-trong-tieng-trung',
    category: 'meo-hoc',
    title: 'Cách nói xin lỗi trong tiếng Trung tự nhiên theo từng tình huống',
    metaTitle: 'Cách nói xin lỗi trong tiếng Trung tự nhiên | HSK Flashcards',
    metaDescription: 'Phân biệt cách dùng 对不起, 不好意思, 抱歉 khi nói xin lỗi trong tiếng Trung theo từng mức độ lịch sự và ngữ cảnh giao tiếp HSK 1 đến 4.',
    summary: 'Hướng dẫn ngắn gọn.',
    publishedAt: '2026-11-26',
    sections: [
      {
        id: 'muc-1',
        heading: 'Mục 1',
        paragraphs: ['Đoạn 1.'],
        table: { headers: ['A', 'B'], rows: [['1', '2'], ['3', '4']] },
      },
      {
        id: 'muc-2',
        heading: 'Mục 2',
        paragraphs: ['Đoạn 2.'],
        example: { han: '不好意思，让你久等了。', py: 'Bù hǎoyìsi, ràng nǐ jiǔ děng le.', vi: 'Ngại quá, để bạn đợi lâu rồi.' },
      },
      {
        id: 'muc-3',
        heading: 'Mục 3',
        paragraphs: ['Đoạn 3.'],
        tip: 'Mẹo dùng: Ngại nhẹ dùng 不好意思, lỗi rõ dùng 对不起.',
      },
    ],
    faqs: [
      { q: 'Câu 1?', a: 'Đáp 1.' },
      { q: 'Câu 2?', a: 'Đáp 2.' },
    ],
  };

  const high = evaluateDraftQuality(strongArticle);
  assert.equal(high.score, 100);
  assert.equal(high.warnings.length, 0);

  const weak = evaluateDraftQuality({
    slug: 'bai-thieu',
    category: 'meo-hoc',
    title: 'Bài thiếu',
    metaTitle: 'Ngắn',
    metaDescription: 'Quá ngắn',
    summary: 'Ngắn',
    publishedAt: '2026-11-26',
    sections: [{ id: 'muc-1', heading: 'Chỉ 1 mục', paragraphs: ['Chưa có ví dụ hay bảng.'] }],
    faqs: [],
  });
  assert.ok(weak.score < 50);
  assert.ok(weak.warnings.length >= 4);
});

test('buildTrendDraftPrompt, buildRewriteDraftPrompt, approveDraftIntoArticles, and rejectDraftRecord work end to end', () => {
  const prompt = buildTrendDraftPrompt({
    topic: 'Cách nói xin lỗi trong tiếng Trung',
    slug: 'xin-loi-trong-tieng-trung',
    category: 'meo-hoc',
    hskTag: 'HSK 1–3',
    trendQuery: 'xin lỗi trong tiếng trung',
    trendSource: 'google-trends-csv',
    trendSpike: 'Đột biến',
    today: '2026-11-26',
    existingSlugs: ['thang-diem-dau-hsk-1-den-6'],
  });
  assert.match(prompt, /xin lỗi trong tiếng trung/);
  assert.match(prompt, /hạn mức/);

  const draft = {
    id: 'draft-20261126-xin-loi',
    status: 'pending_review',
    version: 1,
    trendQuery: 'xin lỗi trong tiếng trung',
    category: 'meo-hoc',
    hskTag: 'HSK 1–3',
    reviewHistory: [],
    article: {
      slug: 'xin-loi-trong-tieng-trung',
      category: 'meo-hoc',
      title: 'Cách nói xin lỗi trong tiếng Trung',
      metaTitle: 'Cách nói xin lỗi trong tiếng Trung | HSK Flashcards',
      metaDescription: 'Hướng dẫn dùng 对不起, 不好意思, 抱歉 chuẩn bản xứ cho người học HSK 1 đến 4 kèm ví dụ và lỗi hay sai.',
      summary: 'Tóm tắt ngắn gọn.',
      publishedAt: '2026-11-26',
      sections: [{ id: 'muc-1', heading: 'Mục 1', paragraphs: ['Nội dung chuẩn.'] }],
    },
  };

  const rwPrompt = buildRewriteDraftPrompt({
    draft,
    comment: 'Thêm bảng đối chiếu 3 dòng',
    rating: 3,
    existingSlugs: [],
    today: '2026-11-26',
  });
  assert.match(rwPrompt, /Thêm bảng đối chiếu 3 dòng/);
  assert.match(rwPrompt, /3\/5 sao/);

  const draftsData = { schema: 1, updatedAt: '', drafts: [structuredClone(draft)] };
  const articlesData = {
    schema: 1,
    articles: [{ slug: 'xin-loi-trong-tieng-trung', title: 'Existing article' }],
  };

  const approved = approveDraftIntoArticles({
    draftsData,
    articlesData,
    draftId: draft.id,
    rating: 5,
    comment: 'Đạt chuẩn, xuất bản',
    today: '2026-11-26',
  });
  assert.equal(approved.publishedArticle.slug, 'xin-loi-trong-tieng-trung-2');
  assert.equal(draftsData.drafts[0].status, 'approved');
  assert.equal(draftsData.drafts[0].rating, 5);
  assert.equal(articlesData.articles.length, 2);

  const rejectData = { schema: 1, updatedAt: '', drafts: [structuredClone(draft)] };
  rejectDraftRecord({ draftsData: rejectData, draftId: draft.id, comment: 'Trùng ý', rating: 2 });
  assert.equal(rejectData.drafts[0].status, 'rejected');
});

test('resolveXkiroReviewConfig and callXkiroJson target api.xkiro.com with Command A+ and Mistral Large 3', async () => {
  const skipped = resolveXkiroReviewConfig({}, {});
  assert.equal(skipped.enabled, false);

  const cfg = resolveXkiroReviewConfig({ SECONDARY_AI_API_KEY: 'xkiro-secret-key-123456' }, {});
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.apiUrl, XKIRO_API_URL);
  assert.equal(cfg.reviewers[0].model, 'cohere/command-a-plus');
  assert.equal(cfg.reviewers[1].model, 'mistralai/mistral-large-2512');

  const calls = [];
  const fakeFetch = async (url, init) => {
    const payload = JSON.parse(init.body);
    calls.push({ url, auth: init.headers.Authorization, payload });
    if (calls.length === 1) {
      return new Response('json_object unsupported', { status: 400 });
    }
    return Response.json({
      choices: [{ message: { content: '```json\n{"score":91,"verdict":"pass","summary":"OK"}\n```' } }],
    });
  };

  const parsed = await callXkiroJson({
    apiKey: 'xkiro-secret-key-123456',
    model: 'cohere/command-a-plus',
    systemPrompt: 'sys',
    userPrompt: 'usr',
    fetchImpl: fakeFetch,
  });
  assert.equal(parsed.score, 91);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.xkiro.com/v1/chat/completions');
  assert.equal(calls[0].auth, 'Bearer xkiro-secret-key-123456');
  assert.deepEqual(calls[0].payload.response_format, { type: 'json_object' });
  assert.equal(calls[1].payload.response_format, undefined);
});

test('runDualXkiroReview runs Command A+ then Mistral Large 3, detects revise & builds auto-polish prompt', async () => {
  const sampleArticle = {
    slug: 'xin-loi-trong-tieng-trung',
    category: 'meo-hoc',
    title: 'Cách nói xin lỗi trong tiếng Trung',
    metaTitle: 'Cách nói xin lỗi trong tiếng Trung | HSK Flashcards',
    metaDescription: 'Phân biệt 对不起 và 不好意思 cho người Việt.',
    summary: 'Tóm tắt.',
    publishedAt: '2026-11-26',
    sections: [{ id: 'm1', heading: 'Bảng so sánh', paragraphs: ['...'] }],
  };

  const skipRes = await runDualXkiroReview({ article: sampleArticle, trendQuery: 'xin lỗi trong tiếng trung', env: {} });
  assert.equal(skipRes.status, 'skipped');
  assert.equal(skipRes.needsAutoPolish, false);
  assert.equal(skipRes.reviewers.length, 2);

  const modelsCalled = [];
  const dualFetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    modelsCalled.push(body.model);
    if (body.model === 'cohere/command-a-plus') {
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify({
              score: 76,
              verdict: 'revise',
              summary: 'Cần sửa dấu thanh điệu Pinyin.',
              strengths: ['Ví dụ sát thực tế'],
              issues: ['Thiếu thanh 3 biến điệu'],
              mustFix: ['Sửa thanh điệu cho 不好意思'],
            }),
          },
        }],
      });
    }
    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify({
            score: 88,
            verdict: 'pass',
            summary: 'Bố cục SEO và tiếng Việt tự nhiên.',
            strengths: ['Không sáo rỗng'],
            issues: [],
            mustFix: [],
          }),
        },
      }],
    });
  };

  const dualRes = await runDualXkiroReview({
    article: sampleArticle,
    trendQuery: 'xin lỗi trong tiếng trung',
    env: { XKIRO_API_KEY: 'test-key-long-enough' },
    fetchImpl: dualFetch,
  });

  assert.deepEqual(modelsCalled, ['cohere/command-a-plus', 'mistralai/mistral-large-2512']);
  assert.equal(dualRes.status, 'completed');
  assert.equal(dualRes.averageScore, 82);
  assert.equal(dualRes.needsAutoPolish, true);
  assert.match(dualRes.combinedFeedback, /Command A\+/);
  assert.match(dualRes.combinedFeedback, /Mistral Large 3/);

  const polishPrompt = buildAutoPolishPrompt({
    article: sampleArticle,
    trendQuery: 'xin lỗi trong tiếng trung',
    reviewBundle: dualRes,
    existingSlugs: [],
    today: '2026-11-26',
  });
  assert.match(polishPrompt, /Sửa thanh điệu cho 不好意思/);
});

test('syncApprovedQueueIntoArticles imports approved articles cleanly and stays idempotent across runs', () => {
  const queueItems = [
    {
      id: 'draft-queue-newest',
      approvedAt: '2026-11-26T15:00:00.000Z',
      article: {
        slug: 'cach-dung-tu-yi-dian-trong-tieng-trung',
        category: 'ngu-phap',
        title: 'Cách dùng 一点儿 và 有点儿 trong tiếng Trung không bị nhầm',
        metaTitle: 'Cách dùng 一点儿 và 有点儿 trong tiếng Trung | HSK Flashcards',
        metaDescription: 'Phân biệt chính xác vị trí và sắc thái giữa 一点儿 và 有点儿 khi nói và thi HSK.',
        summary: 'Tổng hợp vị trí đứng sau tính từ và trước tính từ kèm ví dụ Hán Pinyin Việt.',
        sections: [
          {
            id: 'muc-1',
            heading: 'Điểm khác biệt cốt lõi',
            paragraphs: ['有点儿 đứng trước tính từ, 一点儿 đứng sau tính từ hoặc động từ.'],
          },
          {
            id: 'muc-2',
            heading: 'Ví dụ phân biệt thực tế',
            paragraphs: ['Dùng đúng sắc thái khen chê hay nhờ vả.'],
          },
        ],
      },
    },
  ];
  const articlesData = {
    schema: 1,
    articles: [{ slug: 'bai-co-san', title: 'Bài viết có sẵn' }],
  };

  const first = syncApprovedQueueIntoArticles({ queueItems, articlesData, today: '2026-11-26' });
  assert.equal(first.added.length, 1);
  assert.equal(first.added[0].sourceDraftId, 'draft-queue-newest');
  assert.equal(articlesData.articles.length, 2);
  assert.equal(articlesData.articles[0].slug, 'cach-dung-tu-yi-dian-trong-tieng-trung');

  const second = syncApprovedQueueIntoArticles({ queueItems, articlesData, today: '2026-11-26' });
  assert.equal(second.added.length, 0);
  assert.equal(articlesData.articles.length, 2);
});
