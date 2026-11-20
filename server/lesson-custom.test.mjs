import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHandler } from './translator-worker-bundled.mjs';

const require = createRequire(import.meta.url);
const C = require('../src/modules/lessons/lesson-custom-core.js');
const S = require('../src/modules/account/study-sync-core.js');
const A = require('../src/modules/account/account-core.js');
const B = require('../src/modules/backup/backup-core.js');

const now = Date.now();
const project = 'hsk-flashcards-44631';
const token = 'h.' + Buffer.from(JSON.stringify({
  aud: project,
  iss: 'https://securetoken.google.com/' + project,
  sub: 'custom-lesson-tester',
  exp: Math.floor(now / 1000) + 3600
})).toString('base64url') + '.s';

function setupWorker(aiResult, status = 200) {
  const calls = [];
  const handler = createHandler(async (url, req) => {
    calls.push({ url, body: JSON.parse(req.body) });
    if (url.includes('identitytoolkit')) return Response.json({ users: [{ localId: 'custom-lesson-tester' }] });
    if (status !== 200) return new Response(JSON.stringify({ error: { message: 'fail' } }), { status });
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(aiResult) }] } }] });
  }, () => now);
  return {
    calls,
    run: (body, auth = token) => handler(new Request('https://test/custom-lesson-profile', {
      method: 'POST',
      headers: { Origin: 'https://trungxemcode.github.io', Authorization: 'Bearer ' + auth },
      body: JSON.stringify(body)
    }), { FIREBASE_API_KEY: 'fake', GEMINI_API_KEY: 'fake' })
  };
}

const sampleLesson = {
  id: 'standard-2-01',
  number: 1,
  vi: 'Du lịch Bắc Kinh',
  title: '九月去北京旅游最好',
  words: ['旅游', '觉得', '最', '为什么', '也', '运动', '踢足球', '一起', '要', '新', '它', '眼睛'],
  miniReviewKeys: ['mini-listen', 'mini-gap', 'mini-reading', 'mini-structure', 'mini-vocabulary'],
  content: {
    grammar: [
      { title: '要 + Động từ', pattern: 'Chủ ngữ + 要 + V', usage: 'Diễn tả dự định sắp tới', examples: [{ cn: '我要去北京。', pin: 'Wǒ yào qù Běijīng.', vi: 'Tôi sắp đi Bắc Kinh.' }], error: 'Nhầm 要 và 想' },
      { title: '最 + Tính từ', pattern: '最 + Adj', usage: 'So sánh nhất', examples: [{ cn: '九月最好。', pin: 'Jiǔyuè zuì hǎo.', vi: 'Tháng chín đẹp nhất.' }], error: 'Đặt 最 sau tính từ' },
      { title: '也 đứng trước động từ', pattern: 'S + 也 + V', usage: 'Cũng làm gì đó', examples: [{ cn: '我也去。', pin: 'Wǒ yě qù.', vi: 'Tôi cũng đi.' }], error: 'Đặt 也 cuối câu' }
    ],
    reading: {
      title: 'Bài đọc mẫu',
      lines: [{ cn: '九月去北京旅游最好。', pin: 'Jiǔyuè qù Běijīng lǚyóu zuì hǎo.', vi: 'Tháng 9 đi du lịch Bắc Kinh là đẹp nhất.' }]
    },
    dialogues: [
      { title: 'Hội thoại 1', lines: [{ speaker: 'A', cn: '你喜欢什么运动？', pin: 'Nǐ xǐhuan shénme yùndòng?', vi: 'Bạn thích môn thể thao nào?' }] }
    ],
    practice: [
      { id: 'q1', prompt: 'Câu hỏi 1', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'Giải thích' }
    ]
  }
};

test('HSKLessonCustomCore normalizes weights to 100 and validates profiles strictly', () => {
  for (const choice of Object.keys(C.FOCUS_PRESETS)) {
    const w = C.normalizeWeights(null, choice);
    const sum = C.SKILLS.reduce((acc, s) => acc + w[s], 0);
    assert.equal(sum, 100);
    for (const s of C.SKILLS) assert.ok(w[s] >= 5 && w[s] <= 70);
  }
  const skewed = C.normalizeWeights({ vocab: 99, grammar: 99, reading: 1, listening: 0, writing: -5 });
  assert.equal(C.SKILLS.reduce((acc, s) => acc + skewed[s], 0), 100);
  assert.ok(C.SKILLS.every(s => skewed[s] >= 5 && skewed[s] <= 70));

  const p = C.createProfile({ hsk: 3, focusChoice: 'vocab_heavy', minutes: 25, style: 'spare_time', days: 6, goal: 'exam' }, 1234);
  assert.equal(C.validProfile(p), true);
  assert.equal(C.validProfile({ ...p, minutes: 3 }), false);
  assert.equal(C.validProfile({ ...p, weights: { ...p.weights, vocab: 99 } }), false);
  assert.equal(C.validProfile({ ...p, style: 'unknown_style' }), false);
  assert.equal(S.validCustom(p), true);
  assert.equal(S.validCustom({ ...p, style: 'unknown_style' }), false);
  assert.equal(S.validCustom({ ...p, extraPayload: 'not allowed' }), false);
  assert.equal(S.validCustom({ ...p, sessionsDone: { invalid: ['step-1'] } }), false);
});

test('HSKLessonCustomCore parses free-text Vietnamese interview answers accurately', () => {
  assert.equal(C.parseNaturalReply('focus', 'Mình muốn học từ vựng nhiều hơn ngữ pháp'), 'vocab_heavy');
  assert.equal(C.parseNaturalReply('focus', 'Em hay sai ngữ pháp và đặt câu'), 'grammar_heavy');
  assert.equal(C.parseNaturalReply('focus', 'Ưu tiên luyện nghe và giao tiếp'), 'listening_speaking');
  assert.equal(C.parseNaturalReply('minutes', 'khoảng nửa tiếng mỗi ngày'), 30);
  assert.equal(C.parseNaturalReply('minutes', 'tôi có 1 tiếng rảnh'), 60);
  assert.equal(C.parseNaturalReply('style', 'học tranh thủ giờ trống giờ nghỉ giữa ca'), 'spare_time');
  assert.equal(C.parseNaturalReply('style', 'nghe rảnh tay khi đi xe buýt'), 'hands_free');
  assert.equal(C.parseNaturalReply('goal', 'Ôn thi HSK 4'), 'exam');
});

test('buildLessonPlan restructures lessons by focus, time budget and study style without exceeding minutes', () => {
  const spareVocab = C.createProfile({ hsk: 2, focusChoice: 'vocab_heavy', minutes: 24, style: 'spare_time', days: 6, goal: 'conversation' }, now);
  const planA = C.buildLessonPlan(spareVocab, sampleLesson, {}, { dayKey: '2026-11-20', now });
  assert.equal(planA.sessions.length, 3);
  assert.equal(planA.sessions.reduce((acc, s) => acc + s.minutes, 0), 24);
  for (const s of planA.sessions) {
    assert.equal(s.steps.reduce((acc, st) => acc + st.minutes, 0), s.minutes);
    assert.ok(s.steps.length >= 1);
  }
  assert.equal(planA.sessions[0].steps[0].id, 'vocab_cards');

  const focusedGrammar = C.createProfile({ hsk: 2, focusChoice: 'grammar_heavy', minutes: 40, style: 'focused_block', days: 5, goal: 'exam' }, now);
  const planB = C.buildLessonPlan(focusedGrammar, sampleLesson, {}, { dayKey: '2026-11-20', now });
  assert.equal(planB.sessions.length, 1);
  assert.equal(planB.sessions[0].minutes, 40);
  assert.equal(planB.sessions[0].steps[0].id, 'grammar_focus');

  const handsFree = C.createProfile({ hsk: 2, focusChoice: 'listening_speaking', minutes: 30, style: 'hands_free', days: 7, goal: 'conversation' }, now);
  const planC = C.buildLessonPlan(handsFree, sampleLesson, {}, { dayKey: '2026-11-20', now });
  assert.ok(planC.sessions[0].steps[0].skill === 'listening');
  assert.equal(planC.sessions.reduce((acc, s) => acc + s.minutes, 0), 30);

  const previouslyRead = C.buildLessonPlan(focusedGrammar, sampleLesson, { read: true }, { dayKey: '2026-11-20', now });
  assert.equal(previouslyRead.completedSteps, 0, 'general lesson read state must not auto-complete custom activities');

  const weekendSprint = C.createProfile({ hsk: 2, focusChoice: 'balanced', minutes: 30, style: 'weekend_sprint', days: 5, goal: 'exam' }, now);
  const saturday = C.buildLessonPlan(weekendSprint, sampleLesson, {}, { now: Date.parse('2026-11-21T03:00:00Z') });
  const monday = C.buildLessonPlan(weekendSprint, sampleLesson, {}, { now: Date.parse('2026-11-23T03:00:00Z') });
  assert.equal(saturday.sessions.length, 1, 'weekend sprint consolidates a 30-minute Saturday into one session');
  assert.equal(monday.sessions.length, 2, 'weekend sprint splits a 30-minute weekday into two sessions');
  assert.match(monday.noteVi, /Ngày thường học gọn nhẹ/);
  assert.doesNotMatch(saturday.noteVi, /Ngày thường học gọn nhẹ/);
});

test('markStepCompleted and adaptProfileWeekly track progress cleanly and rebalance weak skills', () => {
  const p = C.createProfile({ hsk: 2, focusChoice: 'balanced', minutes: 20, style: 'spare_time', days: 6, goal: 'exam' }, now);
  const plan = C.buildLessonPlan(p, sampleLesson, {}, { dayKey: '2026-11-20', now });
  const stepId = plan.sessions[0].steps[0].stepId;
  const doneProf = C.markStepCompleted(p, '2026-11-20', stepId, now + 1000);
  const planAfter = C.buildLessonPlan(doneProf, sampleLesson, {}, { dayKey: '2026-11-20', now: now + 1000 });
  assert.equal(planAfter.completedSteps, plan.completedSteps + 1);

  const keepRes = C.adaptProfileWeekly(doneProf, { attempts: 5 });
  assert.equal(keepRes.action, 'keep');

  const rebalanceRes = C.adaptProfileWeekly(doneProf, {
    attempts: 20,
    bySkill: { grammar: { attempts: 10, correct: 4 }, vocab: { attempts: 10, correct: 9 } }
  }, now + 2000);
  assert.equal(rebalanceRes.action, 'rebalance');
  assert.equal(rebalanceRes.weakSkill, 'grammar');
  assert.ok(rebalanceRes.profile.weights.grammar > doneProf.weights.grammar);
  assert.equal(C.SKILLS.reduce((n, k) => n + rebalanceRes.profile.weights[k], 0), 100);
});

test('customLesson syncs via study-plan:custom-lesson, isolates owners and preserves existing data', () => {
  const profile = C.createProfile({ hsk: 4, focusChoice: 'vocab_heavy', minutes: 25, style: 'spare_time', days: 6, goal: 'exam' }, now);
  let state = S.savePlan(S.empty('user-a'), { version: 1, id: 'g1', target: 4, created: 1, end: 99999999, keys: ['w1'], journal: {} }, 'dev-1');
  state = S.saveCustomLesson(state, profile);
  assert.deepEqual(S.customLesson(state), profile);

  const storage = {
    [S.KEY]: JSON.stringify(state),
    'hsk-flashcards-progress-v1': JSON.stringify({ words: { '1|好|hǎo': { status: 'known' } } }),
    'hsk-course-lessons-v1': JSON.stringify({ version: 1, lessons: { 'standard-1-01': { read: true } } })
  };
  const captured = A.capture({}, {}, storage, now, 'dev-1');
  assert.ok(captured.changed.includes('study-plan:custom-lesson'));
  assert.ok(A.supportedId('study-plan:custom-lesson'));

  const validated = B.validate({ version: 1, storage }, A);
  assert.ok(validated.count > 0);

  const materialized = A.materialize(captured.items, 'user-b');
  const restoredState = JSON.parse(materialized[S.KEY]);
  assert.deepEqual(S.customLesson(restoredState), profile);
  assert.equal(restoredState.owner, 'user-b');
  assert.equal(JSON.parse(materialized['hsk-flashcards-progress-v1']).words['1|好|hǎo'].status, 'known');
  assert.equal(JSON.parse(materialized['hsk-course-lessons-v1']).lessons['standard-1-01'].read, true);
});

test('Worker POST /custom-lesson-profile validates auth/input, returns schema-checked profile and fails closed on bad AI JSON', async () => {
  const validAi = {
    focusChoice: 'vocab_heavy',
    minutes: 25,
    days: 6,
    style: 'spare_time',
    goal: 'conversation',
    weights: { vocab: 50, grammar: 15, reading: 15, listening: 15, writing: 5 },
    summaryVi: 'Ưu tiên học từ vựng ngắn gọn theo từng giờ trống 25 phút/ngày.',
    followUpVi: 'Tranh thủ 2-3 phiên ngắn mỗi ngày.'
  };

  // Auth required
  const unauth = setupWorker(validAi);
  assert.equal((await unauth.run({ hsk: 2, answers: [{ id: 'focus', answer: 'từ vựng' }] }, 'bad-token')).status, 401);
  assert.equal(unauth.calls.length, 0);

  // Input validation before provider call
  const badInput = setupWorker(validAi);
  assert.equal((await badInput.run({ hsk: 2, answers: [{ id: 'focus', answer: 'ok' }], extra: true })).status, 400);
  assert.equal((await badInput.run({ hsk: 7, answers: [{ id: 'focus', answer: 'ok' }] })).status, 400);
  assert.equal((await badInput.run({ hsk: 2, answers: [{ id: 'unknown_id', answer: 'ok' }] })).status, 400);
  assert.equal(badInput.calls.length, 0);

  // Valid request
  const okWorker = setupWorker(validAi);
  const okRes = await okWorker.run({
    hsk: 2,
    answers: [
      { id: 'focus', answer: 'Tôi muốn học từ vựng nhiều hơn ngữ pháp' },
      { id: 'minutes', answer: '25 phút mỗi ngày' },
      { id: 'style', answer: 'Học tranh thủ giờ trống' }
    ]
  });
  assert.equal(okRes.status, 200);
  const okData = await okRes.json();
  assert.equal(okData.profile.focusChoice, 'vocab_heavy');
  assert.equal(okData.profile.minutes, 25);
  assert.equal(okData.profile.style, 'spare_time');
  assert.equal(okData.profile.weights.vocab, 50);

  // Malformed AI output fails closed (502)
  const badAi = setupWorker({ ...validAi, weights: { vocab: 90, grammar: 10, reading: 10, listening: 10, writing: 10 } });
  const badAiRes = await badAi.run({ hsk: 2, answers: [{ id: 'focus', answer: 'từ vựng' }] });
  assert.equal(badAiRes.status, 502);
});
