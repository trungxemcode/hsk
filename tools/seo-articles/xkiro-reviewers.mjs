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
import {
  AUDIT_PROTOCOL_ID,
  AUDITOR_SYSTEM_PROMPT,
  buildAuditorPrompt,
  computeAuditScoreAndVerdict,
  sanitizeAuditFeedbackForWriter,
} from '../../server/seo-editorial/audit-protocol.mjs';

export const XKIRO_API_URL = 'https://api.xkiro.com/v1/chat/completions';

export const DEFAULT_XKIRO_REVIEWERS = Object.freeze([
  {
    id: 'command-a-plus',
    round: 1,
    label: 'Command A+',
    model: 'cohere/command-a-plus',
    role: 'Vòng 1 · Kiểm duyệt sơ bộ Ngữ pháp, Pinyin & Search Intent',
    focus:
      'Thực hiện Kiểm duyệt Vòng 1 (SEO-AUDITOR-01): khóa Search Intent độc lập, soát chữ Hán giản thể, dấu thanh điệu Pinyin, ngoại lệ ngữ pháp HSK và ví dụ.',
  },
  {
    id: 'mistral-large-3',
    round: 2,
    label: 'Mistral Large 3',
    model: 'mistralai/mistral-large-2512',
    role: 'Vòng 2 · Kiểm duyệt độc lập Thang 100 điểm & Phê duyệt',
    focus:
      'Thực hiện Kiểm duyệt Vòng 2 độc lập (SEO-AUDITOR-01): rà soát lại toàn bài như bản thảo mới, chấm thang điểm 100 (A..J), kiểm tra Hard Fail và quyết định APPROVED / REVISION_REQUIRED / REJECTED.',
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

export function buildReviewerPrompt(reviewer, article, trendQuery = '', extra = {}) {
  const round = Number(extra?.round || reviewer?.round) === 2 ? 2 : 1;
  return {
    systemPrompt: AUDITOR_SYSTEM_PROMPT,
    userPrompt: buildAuditorPrompt({
      round,
      reviewerLabel: reviewer.label,
      reviewerRole: reviewer.role,
      article,
      writerBrief: extra?.writerBrief || null,
      trendQuery,
      category: extra?.category || article?.category || 'meo-hoc',
    }),
  };
}

function normalizeReviewerResult(reviewer, raw) {
  const round = Number(reviewer?.round) === 2 ? 2 : 1;
  const computed = computeAuditScoreAndVerdict(raw, { round });
  return {
    id: reviewer.id,
    label: reviewer.label,
    model: reviewer.model,
    role: reviewer.role,
    status: 'completed',
    ...computed,
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
    const candidateModels =
      reviewer.id === 'mistral-large-3'
        ? Array.from(new Set([reviewer.model, env.XKIRO_REVIEW_MODEL_2_FALLBACK || 'deepseek/deepseek-v4.1-flash'].filter(Boolean)))
        : [reviewer.model];

    let parsedRaw = null;
    let usedModel = reviewer.model;
    let lastErr = null;
    for (const candidateModel of candidateModels) {
      try {
        parsedRaw = await callXkiroJson({
          apiUrl: cfg.apiUrl,
          apiKey: cfg.apiKey,
          model: candidateModel,
          systemPrompt,
          userPrompt,
          fetchImpl,
        });
        usedModel = candidateModel;
        break;
      } catch (err) {
        lastErr = err;
        if (!/HTTP (?:400|404)/.test(String(err?.message || ''))) {
          break;
        }
      }
    }

    if (parsedRaw) {
      results.push(normalizeReviewerResult({ ...reviewer, model: usedModel }, parsedRaw));
    } else {
      results.push({
        id: reviewer.id,
        label: reviewer.label,
        model: usedModel,
        role: reviewer.role,
        status: 'error',
        score: null,
        verdict: 'error',
        summary: `Chưa gọi được ${reviewer.label}: ${lastErr?.message || 'unknown error'}`,
        strengths: [],
        issues: [],
        mustFix: [],
        reviewedAt: new Date().toISOString(),
      });
    }
  }

  const scored = results.filter((r) => typeof r.score === 'number');
  const round2 = results.find((r) => r.round === 2 && typeof r.score === 'number');
  const averageScore = scored.length
    ? Math.round(scored.reduce((acc, r) => acc + r.score, 0) / scored.length)
    : null;
  const finalScore = round2 ? round2.score : averageScore;
  const needsAutoPolish = results.some(
    (r) =>
      r.status === 'completed' &&
      (r.auditVerdict === 'REVISION_REQUIRED' || r.verdict === 'revise' || r.score < 85 || r.mustFix.length > 0)
  );
  const combinedFeedback = results
    .filter((r) => r.status === 'completed')
    .map((r) => `### ${r.label} (${r.model} · ${r.score}/100 · ${r.auditVerdict || r.verdict})\n${sanitizeAuditFeedbackForWriter(r)}`)
    .join('\n\n');

  const completedCount = scored.length;
  return {
    protocol: AUDIT_PROTOCOL_ID,
    status: completedCount === cfg.reviewers.length ? 'completed' : completedCount > 0 ? 'partial' : 'error',
    provider: 'xkiro',
    pipeline: ['writer-seo-01', 'command-a-plus', 'mistral-large-3', 'admin'],
    averageScore,
    finalScore,
    needsAutoPolish,
    autoPolished: false,
    polishSummary: '',
    combinedFeedback,
    reviewedAt: new Date().toISOString(),
    reviewers: results,
  };
}
