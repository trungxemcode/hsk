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

  const aiDesign = {
    coachIntroVi: 'AI chia bài thành hai phiên theo quỹ thời gian của bạn.',
    sessions: [{ label: 'Phiên 1 · 10 phút', minutes: 10, goalVi: 'Luyện từ vựng và phản xạ', steps: [
      { id: 'vocab-ai', skill: 'vocab', action: 'ai_vocab_coach', minutes: 5, titleVi: 'Từ trọng tâm', detailVi: 'Học từ theo ngữ cảnh', coachTipVi: 'Đọc to ví dụ', focusWords: [{ han: '旅游', pin: 'lǚyóu', mean: 'du lịch', mnemonicVi: 'Lữ hành', exampleCn: '我去旅游。', examplePin: 'Wǒ qù lǚyóu.', exampleVi: 'Tôi đi du lịch.' }] },
      { id: 'drill-ai', skill: 'grammar', action: 'ai_drill', minutes: 5, titleVi: 'Luyện tập', detailVi: 'Chọn đáp án đúng', coachTipVi: 'Đọc kỹ câu hỏi', drills: [0, 1].map(i => ({ promptVi: `Câu ${i + 1}`, questionCn: '我___去。', options: ['要', '最', '也', '新'], answerIndex: 0, explanationVi: '要 chỉ dự định.' })) }
    ] }]
  };
  const aiProfile = C.saveLessonDesign({ ...p, aiGenerated: true, aiProvider: 'deepseek', aiModel: 'deepseek-chat', learnerContextVi: 'Học viên ưu tiên giao tiếp.', aiBlueprint: aiDesign.sessions }, 'standard-2-01', aiDesign, 2000);
  assert.equal(S.validCustom(aiProfile), true);
  const aiState = S.saveCustomLesson(S.empty('user-ai'), aiProfile);
  assert.deepEqual(S.customLesson(aiState), aiProfile);
  const aiCaptured = A.capture({}, {}, { [S.KEY]: JSON.stringify(aiState) }, now, 'dev-ai');
  assert.ok(aiCaptured.changed.includes('study-plan:custom-lesson'));
  assert.equal(S.validCustom(A.materialize(aiCaptured.items, 'user-ai')[S.KEY] ? JSON.parse(A.materialize(aiCaptured.items, 'user-ai')[S.KEY]).customLesson : null), true);
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

test('Worker POST /custom-lesson-profile supports real AI interview turns (mode=interview) and bespoke lesson design (mode=design)', async () => {
  // 1. mode=interview returning next question + dynamic chips
  const interviewTurnWorker = setupWorker({
    ready: false,
    replyVi: 'Tuyệt vời! Bạn muốn ưu tiên từ vựng giao tiếp. Mỗi ngày bạn có khoảng bao nhiêu phút rảnh để học?',
    suggestedReplies: ['15 phút giờ nghỉ trưa', '25 phút chia 2 lần', '45 phút buổi tối']
  });
  const turnRes = await interviewTurnWorker.run({
    hsk: 2,
    mode: 'interview',
    messages: [{ role: 'user', text: 'Mình muốn tập trung học nhiều từ vựng để giao tiếp công việc' }]
  });
  assert.equal(turnRes.status, 200);
  const turnData = await turnRes.json();
  assert.equal(turnData.ready, false);
  assert.match(turnData.replyVi, /bao nhiêu phút/);
  assert.equal(turnData.suggestedReplies.length, 3);

  // 2. mode=design returning AI-authored sessions, focusWords mnemonics, interactive drills and scenario
  const aiLessonDesign = {
    coachIntroVi: 'Vì bạn học 24 phút/ngày theo giờ trống và ưu tiên từ vựng du lịch, AI chia Bài 1 thành 2 phiên ngắn kèm bài tập phản xạ.',
    sessions: [
      {
        label: 'Phiên 1 · Từ vựng du lịch cốt lõi',
        minutes: 12,
        goalVi: 'Nắm chắc 4 từ trọng tâm và mẹo nhớ nhanh.',
        steps: [
          {
            id: 'ai_vocab_1',
            skill: 'vocab',
            action: 'ai_vocab_coach',
            minutes: 7,
            titleVi: 'Từ vựng du lịch Bắc Kinh (AI chọn lọc)',
            detailVi: 'Học từ kèm mẹo nhớ và câu ví dụ sát giao tiếp.',
            coachTipVi: 'Đọc to câu ví dụ 2 lần sau khi xem mẹo nhớ.',
            focusWords: [
              {
                han: '旅游',
                pin: 'lǚyóu',
                mean: 'du lịch',
                mnemonicVi: 'Lữ (đi xa) + Du (rong chơi) = đi du lịch.',
                exampleCn: '九月去北京旅游最好。',
                examplePin: 'Jiǔyuè qù Běijīng lǚyóu zuì hǎo.',
                exampleVi: 'Tháng 9 đi Bắc Kinh du lịch là tuyệt nhất.'
              }
            ]
          },
          {
            id: 'ai_drill_1',
            skill: 'grammar',
            action: 'ai_drill',
            minutes: 5,
            titleVi: 'Bài tập AI: Phân biệt 要 và 最',
            detailVi: '2 câu trắc nghiệm tình huống do AI biên soạn từ bài.',
            coachTipVi: 'Chú ý vị trí của 最 trước tính từ.',
            drills: [
              {
                promptVi: 'Chọn câu diễn tả đúng "Tháng 9 đi Bắc Kinh là đẹp nhất":',
                questionCn: '九月去北京旅游___好。',
                options: ['最', '要', '也', '新'],
                answerIndex: 0,
                explanationVi: 'Dùng 最 + tính từ (最好) để chỉ mức độ cao nhất.'
              },
              {
                promptVi: 'Chọn từ phù hợp để nói "Tôi muốn đi du lịch":',
                questionCn: '我___去旅游。',
                options: ['要', '最', '也', '新'],
                answerIndex: 0,
                explanationVi: '要 diễn tả mong muốn hoặc dự định làm việc gì.'
              }
            ]
          }
        ]
      },
      {
        label: 'Phiên 2 · Phản xạ đặt câu thực tế',
        minutes: 12,
        goalVi: 'Ứng dụng hội thoại đặt vé và rủ bạn đi chơi.',
        steps: [
          {
            id: 'ai_scenario_1',
            skill: 'listening',
            action: 'ai_scenario',
            minutes: 12,
            titleVi: 'Tình huống AI: Rủ đồng nghiệp đi du lịch',
            detailVi: 'Đặt câu với 一起 và 要.',
            coachTipVi: 'Thử tự nói trước khi mở đáp án mẫu của AI.',
            scenario: {
              contextVi: 'Bạn muốn rủ đồng nghiệp cuối tuần cùng đi đá bóng hoặc du lịch.',
              promptVi: 'Hãy nói: "Cuối tuần chúng mình cùng đi đá bóng nhé!"',
              sampleCn: '周末我们一起去踢足球吧！',
              samplePin: 'Zhōumò wǒmen yìqǐ qù tī zúqiú ba!',
              sampleVi: 'Cuối tuần chúng mình cùng đi đá bóng nhé!'
            }
          },
          {
            id: 'ai_reading_2',
            skill: 'reading',
            action: 'reading_dialogue',
            minutes: 4,
            titleVi: 'Đọc lại câu mẫu theo ngữ cảnh',
            detailVi: 'Đọc to câu mẫu và tự thay đổi thời gian hoặc địa điểm.',
            coachTipVi: 'Thay 周末 bằng một mốc thời gian khác để tạo câu mới.'
          }
        ]
      }
    ]
  };

  const designWorker = setupWorker(aiLessonDesign);
  const designRes = await designWorker.run({
    hsk: 2,
    mode: 'design',
    customPrompt: 'Tạo thêm bài tập phân biệt 要 và 最',
    lesson: {
      id: sampleLesson.id,
      number: sampleLesson.number,
      title: sampleLesson.title,
      vi: sampleLesson.vi,
      words: sampleLesson.words.map(w => ({ han: w, pin: '', mean: '' }))
    }
  });
  assert.equal(designRes.status, 200);
  const designData = await designRes.json();
  assert.equal(designData.lessonDesign.lessonId, 'standard-2-01');
  assert.equal(designData.lessonDesign.sessions.length, 2);

  const hallucinatedDesign = structuredClone(aiLessonDesign);
  hallucinatedDesign.sessions[0].steps[0].focusWords[0].han = '银行';
  const hallucinatedWorker = setupWorker(hallucinatedDesign);
  const hallucinatedRes = await hallucinatedWorker.run({
    hsk: 2,
    mode: 'design',
    lesson: { id: sampleLesson.id, number: sampleLesson.number, title: sampleLesson.title, vi: sampleLesson.vi, words: sampleLesson.words.map(han => ({ han, pin: '', mean: '' })) }
  });
  assert.equal(hallucinatedRes.status, 502, 'AI may only select focus words from the actual lesson');

  // 3. Verify HSKLessonCustomCore saves and builds plan directly from AI lesson design
  const baseProf = C.createProfile({ hsk: 2, focusChoice: 'vocab_heavy', minutes: 24, style: 'spare_time', days: 6, goal: 'conversation' }, now);
  const profWithAi = C.saveLessonDesign(baseProf, sampleLesson.id, designData.lessonDesign, now + 500);
  assert.equal(profWithAi.aiGenerated, true);
  const aiPlan = C.buildLessonPlan(profWithAi, sampleLesson, {}, { dayKey: '2026-11-20', now: now + 500 });
  assert.equal(aiPlan.aiDesigned, true);
  assert.equal(aiPlan.hasLessonAiDesign, true);
  assert.equal(aiPlan.sessions.length, 2);
  assert.equal(aiPlan.sessions[0].steps[0].focusWords[0].han, '旅游');
  assert.equal(aiPlan.sessions[0].steps[1].drills[0].options[0], '最');
  assert.equal(aiPlan.sessions[1].steps[0].scenario.sampleCn, '周末我们一起去踢足球吧！');

  const hallucinatedClientDesign = structuredClone(designData.lessonDesign);
  hallucinatedClientDesign.sessions[0].steps[0].focusWords[0].han = '银行';
  const filteredProfile = C.saveLessonDesign(baseProf, sampleLesson.id, hallucinatedClientDesign, now + 700, new Set(sampleLesson.words));
  assert.equal(JSON.stringify(filteredProfile.aiLessonDesigns[sampleLesson.id]).includes('银行'), false);
});


test('AI session sanitizer preserves 2–4 steps and never exceeds the learner time budget', () => {
  const step = (id, minutes = 5) => ({ id, skill: 'vocab', action: 'vocab_cards', minutes, titleVi: id, detailVi: id, coachTipVi: 'Làm chậm và đọc thành tiếng.' });
  const raw = Array.from({ length: 4 }, (_, index) => ({
    label: `Phiên ${index + 1} · 20 phút`, minutes: 20, goalVi: 'Ôn tập trọng tâm',
    steps: Array.from({ length: 4 }, (_, stepIndex) => step(`s${index}-${stepIndex}`, stepIndex + 1))
  }));
  const sessions = C.sanitizeAiSessions(raw, 10);
  assert.equal(sessions.length, 4);
  assert.equal(sessions.reduce((sum, session) => sum + session.minutes, 0), 10);
  assert.equal(sessions.reduce((sum, session) => sum + session.steps.length, 0), 10);
  for (const session of sessions) {
    assert.ok(session.steps.length >= 2 && session.steps.length <= 4);
    assert.ok(session.minutes >= session.steps.length);
    assert.equal(session.steps.reduce((sum, item) => sum + item.minutes, 0), session.minutes);
    assert.ok(session.steps.every(item => item.minutes >= 1));
    assert.doesNotMatch(session.label, /20 phút/);
  }
  const weighted = C.sanitizeAiSessions([
    { label: 'Phiên dài', minutes: 16, goalVi: 'Chuyên sâu', steps: [step('long-1'), step('long-2')] },
    { label: 'Phiên ngắn', minutes: 4, goalVi: 'Ôn nhanh', steps: [step('short-1'), step('short-2')] }
  ], 10);
  assert.deepEqual(weighted.map(session => session.minutes), [7, 3]);
});

test('profile-level interview blueprint is not reused as lesson content in another HSK lesson', () => {
  const profile = C.createProfile({
    hsk: 2, minutes: 20, aiGenerated: true, focusChoice: 'vocab_heavy', style: 'spare_time', goal: 'conversation',
    aiBlueprint: [{ label: 'Phiên mẫu', minutes: 20, goalVi: 'Luyện hội thoại', steps: [
      { id: 'old-vocab', skill: 'vocab', action: 'ai_vocab_coach', minutes: 10, titleVi: 'Từ cũ', detailVi: 'Từ của bài trước', coachTipVi: 'Ôn lại', focusWords: [{ han: '旅游', pin: 'lǚyóu', mean: 'du lịch', mnemonicVi: 'Lữ hành', exampleCn: '我去旅游。', examplePin: 'Wǒ qù lǚyóu.', exampleVi: 'Tôi đi du lịch.' }] },
      { id: 'old-drill', skill: 'grammar', action: 'grammar_focus', minutes: 10, titleVi: 'Ngữ pháp cũ', detailVi: 'Bài trước', coachTipVi: 'Đọc lại' }
    ] }]
  });
  const nextLesson = { id: 'standard-2-02', number: 2, vi: 'Bài 2', words: [{ han: '学校', pin: 'xuéxiào', mean: 'trường học' }], content: { grammar: [] } };
  const plan = C.buildLessonPlan(profile, nextLesson, {}, { dayKey: '2026-11-20', now });
  assert.equal(plan.hasLessonAiDesign, false);
  assert.equal(plan.sessions.some(session => session.steps.some(item => item.aiAuthored)), false);
  assert.equal(JSON.stringify(plan).includes('旅游'), false);
});

test('custom micro-interval & hybrid schedule splits 60m into 5-10m micro-sessions instead of 2 large 36m/24m blocks', () => {
  const hsk3Lesson1 = {
    id: 'standard-3-01',
    number: 1,
    title: '周末你有什么打算',
    vi: 'Cuối tuần bạn có dự định gì?',
    words: Array.from({ length: 17 }, (_, i) => ({
      han: `词${i + 1}`,
      pin: `cí${i + 1}`,
      mean: `từ ${i + 1}`
    })),
    content: {
      grammar: [{ title: '打算', pattern: 'S + 打算 + V', usage: 'Dự định làm gì' }],
      dialogues: [{ lines: [{ speaker: 'A', cn: '周末你有什么打算？', pin: 'Zhōumò nǐ yǒu shénme dǎsuàn?', vi: 'Cuối tuần bạn có dự định gì?' }] }]
    }
  };

  // 1. Exact user scenario from screenshot: saved as focused_block with hybrid morning 5-10m + evening 30m context
  const hybridProfile = C.createProfile({
    hsk: 3,
    minutes: 60,
    days: 5,
    focusChoice: 'vocab_heavy',
    style: 'focused_block',
    goal: 'reading_comprehension',
    aiGenerated: true,
    learnerContextVi: 'Người học HSK 3, có 60 phút/ngày, 5 ngày/tuần; muốn 55-65% là từ vựng; thích học tranh thủ buổi sáng theo nhịp 5-10 phút và buổi tối tập trung khoảng 30 phút; mục tiêu bao quát tất cả kỹ năng.'
  }, now);

  assert.equal(hybridProfile.style, 'spare_time', 'focused_block is normalized to spare_time when learnerContextVi requests 5-10m intervals');
  const hybridPlan = C.buildLessonPlan(hybridProfile, hsk3Lesson1, {}, { dayKey: '2026-11-20', now });
  assert.equal(hybridPlan.totalMinutes, 60);
  assert.equal(hybridPlan.sessions.reduce((sum, s) => sum + s.minutes, 0), 60);
  assert.equal(hybridPlan.sessions.length, 5, '30m morning split into four 7-8m micro-sessions + one 30m evening session');
  assert.deepEqual(hybridPlan.sessions.map(s => s.minutes), [8, 8, 7, 7, 30]);
  assert.match(hybridPlan.styleLabel, /5–10p\/phiên/);
  for (let i = 0; i < 4; i++) {
    assert.ok(hybridPlan.sessions[i].minutes >= 5 && hybridPlan.sessions[i].minutes <= 10);
    assert.match(hybridPlan.sessions[i].label, /^Phiên sáng \d+ · [78] phút$/);
    assert.equal(hybridPlan.sessions[i].steps.length, 1);
  }
  // 17 vocab words must be chunked into 3 bite-sized groups (6, 6, 5) with non-overlapping wordOffset
  assert.equal(hybridPlan.sessions[0].steps[0].wordLimit, 6);
  assert.equal(hybridPlan.sessions[0].steps[0].wordOffset, 0);
  assert.equal(hybridPlan.sessions[1].steps[0].wordLimit, 6);
  assert.equal(hybridPlan.sessions[1].steps[0].wordOffset, 6);
  assert.equal(hybridPlan.sessions[2].steps[0].wordLimit, 5);
  assert.equal(hybridPlan.sessions[2].steps[0].wordOffset, 12);

  // 2. Pure daytime 5-10m micro-interval request (60m/day -> eight 7-8m micro-sessions)
  const pureMicroPlan = C.buildLessonPlan(hybridProfile, hsk3Lesson1, {}, {
    dayKey: '2026-11-20',
    now,
    customPrompt: 'Ban ngày tôi muốn học theo kiểu ngắt quãng nhỏ kiểu 5-10p một lần'
  });
  assert.equal(pureMicroPlan.sessions.length, 8);
  assert.equal(pureMicroPlan.sessions.reduce((sum, s) => sum + s.minutes, 0), 60);
  assert.ok(pureMicroPlan.sessions.every(s => s.minutes >= 5 && s.minutes <= 10));

  // 3. AI-authored custom session structure (aiBlueprint / lessonDesign) directly controls session count, names and exact minutes
  const aiCustomBlueprintProfile = C.createProfile({
    hsk: 3,
    minutes: 60,
    days: 5,
    focusChoice: 'vocab_heavy',
    style: 'spare_time',
    goal: 'conversation',
    aiGenerated: true,
    learnerContextVi: 'AI tự thiết kế cấu trúc phiên riêng theo mục đích học viên.',
    aiBlueprint: [
      {
        label: 'Cà phê sáng · Khởi động từ mới',
        minutes: 6,
        goalVi: 'Nắm nhóm từ mở đầu',
        steps: [{ id: 's1', skill: 'vocab', action: 'vocab_cards', minutes: 6, titleVi: 'Từ nhóm 1', detailVi: 'Học nhanh', coachTipVi: 'Đọc to' }]
      },
      {
        label: 'Giờ nghỉ trưa · Từ vựng & phản xạ',
        minutes: 9,
        goalVi: 'Học nhóm từ 2 và trắc nghiệm',
        steps: [
          { id: 's2', skill: 'vocab', action: 'vocab_cards', minutes: 5, titleVi: 'Từ nhóm 2', detailVi: 'Học tiếp', coachTipVi: 'Nhớ ngữ cảnh' },
          { id: 's3', skill: 'vocab', action: 'vocab_quiz', minutes: 4, titleVi: 'Quiz nhanh', detailVi: 'Kiểm tra', coachTipVi: 'Phản xạ 3s' }
        ]
      },
      {
        label: 'Chiều tan làm · Nghe thụ động',
        minutes: 10,
        goalVi: 'Nghe hội thoại trên đường về',
        steps: [{ id: 's4', skill: 'listening', action: 'passive_listen', minutes: 10, titleVi: 'Nghe hội thoại', detailVi: 'Nghe không nhìn chữ', coachTipVi: 'Bắt từ khóa' }]
      },
      {
        label: 'Tối chuyên sâu · Ngữ pháp & Đọc hiểu',
        minutes: 35,
        goalVi: 'Tổng hợp cấu trúc câu và đọc đoạn văn',
        steps: [
          { id: 's5', skill: 'grammar', action: 'grammar_focus', minutes: 15, titleVi: 'Ngữ pháp sâu', detailVi: 'Phân tích mẫu câu', coachTipVi: 'Đặt 2 câu' },
          { id: 's6', skill: 'reading', action: 'reading_dialogue', minutes: 20, titleVi: 'Đọc hội thoại bài', detailVi: 'Đọc hiểu toàn bài', coachTipVi: 'Tóm tắt lại' }
        ]
      }
    ]
  }, now);

  const aiDrivenPlan = C.buildLessonPlan(aiCustomBlueprintProfile, hsk3Lesson1, {}, { dayKey: '2026-11-20', now });
  assert.equal(aiDrivenPlan.sessions.length, 4);
  assert.deepEqual(aiDrivenPlan.sessions.map(s => s.minutes), [6, 9, 10, 35], 'Exact AI session durations [6, 9, 10, 35] are preserved');
  assert.deepEqual(aiDrivenPlan.sessions[1].steps.map(st => st.minutes), [5, 4], 'Exact AI step durations [5, 4] are preserved');
  assert.match(aiDrivenPlan.sessions[0].label, /Cà phê sáng · Khởi động từ mới · 6 phút/);
  assert.match(aiDrivenPlan.styleLabel, /AI chia 4 phiên \(6p · 9p · 10p · 35p\)/);
  // The two vocab_cards steps across session 1 and session 2 automatically split the 17 words without overlap
  assert.equal(aiDrivenPlan.sessions[0].steps[0].wordOffset, 0);
  assert.equal(aiDrivenPlan.sessions[0].steps[0].wordLimit, 9);
  assert.equal(aiDrivenPlan.sessions[1].steps[0].wordOffset, 9);
  assert.equal(aiDrivenPlan.sessions[1].steps[0].wordLimit, 8);
});


test('explicit micro schedule cannot be overridden by a two-block AI interview blueprint', () => {
  const hsk3Lesson1 = {
    id: 'standard-3-01',
    number: 1,
    vi: 'Cuối tuần bạn có dự định gì?',
    words: Array.from({ length: 17 }, (_, i) => ({ han: `词${i + 1}`, pin: `cí${i + 1}`, mean: `từ ${i + 1}` })),
    content: { grammar: [{ title: '打算', pattern: 'S + 打算 + V', usage: 'Dự định làm gì' }] }
  };
  const profile = C.createProfile({
    hsk: 3,
    minutes: 60,
    days: 5,
    focusChoice: 'vocab_heavy',
    style: 'focused_block',
    goal: 'reading_comprehension',
    aiGenerated: true,
    learnerContextVi: 'Thích học tranh thủ buổi sáng theo nhịp 5-10 phút và buổi tối tập trung khoảng 30 phút.',
    aiBlueprint: [
      {
        label: 'Phiên sáng tập trung',
        minutes: 30,
        goalVi: 'Học từ vựng và ngữ pháp',
        steps: [
          { id: 'a', skill: 'vocab', action: 'vocab_cards', minutes: 15, titleVi: 'Từ vựng', detailVi: 'Học từ', coachTipVi: 'Đọc to' },
          { id: 'b', skill: 'grammar', action: 'grammar_focus', minutes: 15, titleVi: 'Ngữ pháp', detailVi: 'Ôn mẫu câu', coachTipVi: 'Đặt câu' }
        ]
      },
      {
        label: 'Phiên tối tập trung',
        minutes: 30,
        goalVi: 'Đọc hiểu và nghe',
        steps: [
          { id: 'c', skill: 'reading', action: 'reading_dialogue', minutes: 15, titleVi: 'Đọc hiểu', detailVi: 'Đọc bài', coachTipVi: 'Tóm tắt' },
          { id: 'd', skill: 'listening', action: 'passive_listen', minutes: 15, titleVi: 'Nghe', detailVi: 'Nghe hội thoại', coachTipVi: 'Bắt từ khóa' }
        ]
      }
    ]
  }, now);

  const plan = C.buildLessonPlan(profile, hsk3Lesson1, {}, { dayKey: '2026-11-20', now });
  assert.deepEqual(plan.sessions.map(session => session.minutes), [8, 8, 7, 7, 30]);
  assert.equal(plan.sessions.reduce((sum, session) => sum + session.minutes, 0), 60);
  assert.ok(plan.sessions.slice(0, 4).every(session => session.minutes >= 5 && session.minutes <= 10));
  assert.equal(plan.sessions[4].label, 'Phiên tối tập trung · 30 phút');
  assert.ok(!plan.sessions.slice(0, 4).some(session => session.minutes > 10));
});
