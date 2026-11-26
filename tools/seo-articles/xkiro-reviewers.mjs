#!/usr/bin/env node
/**
 * Dual xKiro Editorial Reviewer Council for HSK Flashcards SEO Drafts.
 *
 * Step 1: Gemma 4 generates or rewrites the Vietnamese HSK article draft.
 * Step 2: Command A+ (`cohere/command-a-plus`) audits Mandarin characters, Pinyin tone accuracy & HSK grammar.
 * Step 3: Mistral Large 3 (`mistralai/mistral-large-2512`) audits SEO depth, <=6 row tables, natural Vietnamese & policy rules.
 * Step 4: Admin makes the final publish / rewrite decision on the private review studio.
 */
import { extractJsonObject } from './generate-ai-article.mjs';

export const XKIRO_API_URL = 'https://api.xkiro.com/v1/chat/completions';

export const DEFAULT_XKIRO_REVIEWERS = Object.freeze([
  {
    id: 'command-a-plus',
    label: 'Command A+',
    model: 'cohere/command-a-plus',
    role: 'Chuyên gia Ngữ pháp & Pinyin HSK',
    focus:
      'Kiểm tra độ chính xác của chữ Hán giản thể, dấu thanh điệu Pinyin (ā á ǎ à...), giải thích ngữ pháp HSK, sự khớp nghĩa giữa câu tiếng Trung và tiếng Việt, và các lỗi dịch máy thường gặp ở người Việt.',
  },
  {
    id: 'mistral-large-3',
    label: 'Mistral Large 3',
    model: 'mistralai/mistral-large-2512',
    role: 'Biên tập viên SEO & Độ tự nhiên tiếng Việt',
    focus:
      'Kiểm tra bố cục SEO (metaTitle 35–75 ký tự, metaDescription 110–170 ký tự), văn phong tiếng Việt tự nhiên không sáo rỗng AI, mỗi bảng <= 6 dòng dễ quét, đủ FAQ/CTA thực tế, và tuyệt đối không chứa các cụm bị cấm ("hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập").',
  },
]);

export function resolveXkiroReviewConfig(env = process.env, args = {}) {
  const skipped = Boolean(args['skip-xkiro-review'] || env.SKIP_XKIRO_REVIEW === 'true');
  const apiKey = String(env.XKIRO_API_KEY || env.SECONDARY_AI_API_KEY || '').trim();
  const apiUrl = String(env.XKIRO_API_URL || XKIRO_API_URL).trim();
  const m1 = String(env.XKIRO_REVIEW_MODEL_1 || DEFAULT_XKIRO_REVIEWERS[0].model).trim();
  const m2 = String(env.XKIRO_REVIEW_MODEL_2 || DEFAULT_XKIRO_REVIEWERS[1].model).trim();

  const reviewers = [
    { ...DEFAULT_XKIRO_REVIEWERS[0], model: m1 },
    { ...DEFAULT_XKIRO_REVIEWERS[1], model: m2 },
  ];

  return {
    enabled: !skipped && apiKey.length > 0,
    skipped,
    apiKey,
    apiUrl,
    reviewers,
  };
}

export async function callXkiroJson({
  apiUrl = XKIRO_API_URL,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  fetchImpl = fetch,
}) {
  if (!apiKey) throw new Error('Missing XKIRO_API_KEY / SECONDARY_AI_API_KEY');
  const modes = [true, false];
  let lastError;

  for (const useJsonMode of modes) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const body = {
          model,
          temperature: 0.25,
          max_tokens: 2200,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        };
        if (useJsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetchImpl(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(45000),
        });

        if (!res.ok) {
          const errText = await res.text();
          if (useJsonMode && res.status === 400) {
            lastError = new Error(`xKiro HTTP 400 with response_format (${errText.slice(0, 120)})`);
            break;
          }
          if ([429, 500, 502, 503, 504].includes(res.status) && attempt === 1) {
            await new Promise((r) => setTimeout(r, 1800));
            continue;
          }
          throw new Error(`xKiro (${model}) HTTP ${res.status}: ${errText.slice(0, 200)}`);
        }

        const payload = await res.json();
        const text = String(payload?.choices?.[0]?.message?.content || '').trim();
        if (!text) throw new Error(`xKiro (${model}) returned empty content`);
        return extractJsonObject(text);
      } catch (err) {
        lastError = err;
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
  throw lastError || new Error(`xKiro (${model}) request failed`);
}

export function buildReviewerPrompt(reviewer, article, trendQuery = '') {
  return {
    systemPrompt: `Bạn là ${reviewer.label} giữ vai trò "${reviewer.role}" trong hội đồng kiểm duyệt chất lượng bài viết SEO tiếng Trung HSK cho người Việt trước khi gửi tới Admin duyệt cuối.
Chuyên môn trọng tâm của bạn: ${reviewer.focus}
Hãy đánh giá trung thực, khắt khe nhưng mang tính xây dựng, chỉ trả về DUY NHẤT một JSON object hợp lệ (không markdown ngoài JSON) theo schema:
{
  "score": 88,
  "verdict": "pass" | "revise",
  "summary": "Nhận xét tổng quan 1-2 câu bằng tiếng Việt",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "issues": ["Điểm cần lưu ý hoặc còn yếu nếu có"],
  "mustFix": ["Lỗi sai nghiêm trọng bắt buộc AI viết lại phải sửa, để [] nếu không có"]
}`,
    userPrompt: `Hãy kiểm duyệt bài viết SEO tiếng Trung sau (từ khóa xu hướng: "${trendQuery || article?.title || ''}"):

${JSON.stringify(article, null, 2)}

Quy tắc chấm điểm:
- score >= 82 và verdict = "pass" nếu chính xác chữ Hán/Pinyin/ngữ pháp, tiếng Việt tự nhiên, bảng <= 6 dòng, đủ ví dụ và FAQ, không có lỗi cấm.
- verdict = "revise" và liệt kê rõ mustFix[] nếu phát hiện sai Pinyin, sai nghĩa Hán–Việt, văn mẫu cứng nhắc, thiếu ví dụ/bảng, bảng > 6 dòng, hoặc chứa từ cấm ("hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập").`,
  };
}

function normalizeReviewerResult(reviewer, raw) {
  const numScore = Number(raw?.score);
  const score = Number.isFinite(numScore) ? Math.max(0, Math.min(100, Math.round(numScore))) : 75;
  const mustFix = Array.isArray(raw?.mustFix) ? raw.mustFix.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const issues = Array.isArray(raw?.issues) ? raw.issues.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const strengths = Array.isArray(raw?.strengths) ? raw.strengths.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const rawVerdict = String(raw?.verdict || '').toLowerCase();
  const verdict = rawVerdict === 'revise' || mustFix.length > 0 || score < 82 ? 'revise' : 'pass';

  return {
    id: reviewer.id,
    label: reviewer.label,
    model: reviewer.model,
    role: reviewer.role,
    status: 'completed',
    score,
    verdict,
    summary: String(raw?.summary || '').trim() || (verdict === 'pass' ? 'Đạt chuẩn kiểm duyệt.' : 'Cần chỉnh sửa thêm.'),
    strengths,
    issues,
    mustFix,
    reviewedAt: new Date().toISOString(),
  };
}

export async function runDualXkiroReview({
  article,
  trendQuery = '',
  env = process.env,
  args = {},
  fetchImpl = fetch,
}) {
  const cfg = resolveXkiroReviewConfig(env, args);
  const nowIso = new Date().toISOString();

  if (!cfg.enabled) {
    const reason = cfg.skipped
      ? 'Đã bỏ qua kiểm duyệt xKiro theo cờ chạy.'
      : 'Chưa cấu hình XKIRO_API_KEY / SECONDARY_AI_API_KEY — bỏ qua bước kiểm duyệt AI xKiro.';
    return {
      status: 'skipped',
      provider: 'xkiro',
      pipeline: ['gemma-4', 'command-a-plus', 'mistral-large-3', 'admin'],
      averageScore: null,
      needsAutoPolish: false,
      autoPolished: false,
      polishSummary: '',
      combinedFeedback: '',
      reviewedAt: nowIso,
      reviewers: cfg.reviewers.map((r) => ({
        id: r.id,
        label: r.label,
        model: r.model,
        role: r.role,
        status: 'skipped',
        score: null,
        verdict: 'skipped',
        summary: reason,
        strengths: [],
        issues: [],
        mustFix: [],
        reviewedAt: nowIso,
      })),
    };
  }

  const results = [];
  for (const reviewer of cfg.reviewers) {
    const { systemPrompt, userPrompt } = buildReviewerPrompt(reviewer, article, trendQuery);
    try {
      const raw = await callXkiroJson({
        apiUrl: cfg.apiUrl,
        apiKey: cfg.apiKey,
        model: reviewer.model,
        systemPrompt,
        userPrompt,
        fetchImpl,
      });
      results.push(normalizeReviewerResult(reviewer, raw));
    } catch (err) {
      results.push({
        id: reviewer.id,
        label: reviewer.label,
        model: reviewer.model,
        role: reviewer.role,
        status: 'error',
        score: null,
        verdict: 'error',
        summary: `Chưa gọi được ${reviewer.label}: ${err.message}`,
        strengths: [],
        issues: [],
        mustFix: [],
        reviewedAt: new Date().toISOString(),
      });
    }
  }

  const scored = results.filter((r) => typeof r.score === 'number');
  const averageScore = scored.length
    ? Math.round(scored.reduce((acc, r) => acc + r.score, 0) / scored.length)
    : null;
  const needsAutoPolish = results.some(
    (r) => r.status === 'completed' && (r.verdict === 'revise' || r.score < 82 || r.mustFix.length > 0)
  );
  const combinedFeedback = results
    .filter((r) => r.status === 'completed')
    .map((r) => {
      const items = [...r.mustFix.map((x) => `[Bắt buộc sửa] ${x}`), ...r.issues];
      return `### ${r.label} (${r.model} · ${r.score}/100 · ${r.verdict})\nTóm tắt: ${r.summary}\n${items.map((x) => `- ${x}`).join('\n')}`;
    })
    .join('\n\n');

  const completedCount = scored.length;
  return {
    status: completedCount === cfg.reviewers.length ? 'completed' : completedCount > 0 ? 'partial' : 'error',
    provider: 'xkiro',
    pipeline: ['gemma-4', 'command-a-plus', 'mistral-large-3', 'admin'],
    averageScore,
    needsAutoPolish,
    autoPolished: false,
    polishSummary: '',
    combinedFeedback,
    reviewedAt: new Date().toISOString(),
    reviewers: results,
  };
}
