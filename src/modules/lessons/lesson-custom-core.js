/* Pure deterministic rules for Custom HSK Lesson profiles, restructuring and weekly rebalancing. */
(function (root) {
  'use strict';

  const SKILLS = ['vocab', 'grammar', 'reading', 'listening', 'writing'];
  const SKILL_LABELS = {
    vocab: 'Từ vựng',
    grammar: 'Ngữ pháp',
    reading: 'Đọc hiểu',
    listening: 'Nghe & hội thoại',
    writing: 'Viết chữ'
  };

  const STYLES = ['spare_time', 'focused_block', 'hands_free', 'bedtime_review', 'weekend_sprint'];
  const STYLE_LABELS = {
    spare_time: 'Tranh thủ giờ trống (5–10p/phiên)',
    focused_block: 'Một buổi tập trung liền mạch',
    hands_free: 'Rảnh tay · ưu tiên nghe',
    bedtime_review: 'Ôn nhẹ trước khi ngủ',
    weekend_sprint: 'Ngày thường ngắn · cuối tuần dồn'
  };

  const GOALS = ['exam', 'conversation', 'reading_comprehension', 'work_travel'];
  const GOAL_LABELS = {
    exam: 'Thi đỗ HSK',
    conversation: 'Giao tiếp phản xạ',
    reading_comprehension: 'Đọc hiểu văn bản',
    work_travel: 'Công việc & đời sống'
  };

  const FOCUS_PRESETS = {
    vocab_heavy: { vocab: 50, grammar: 15, reading: 15, listening: 15, writing: 5 },
    grammar_heavy: { vocab: 20, grammar: 45, reading: 20, listening: 10, writing: 5 },
    listening_speaking: { vocab: 25, grammar: 15, reading: 15, listening: 40, writing: 5 },
    reading_heavy: { vocab: 25, grammar: 15, reading: 40, listening: 15, writing: 5 },
    balanced: { vocab: 30, grammar: 25, reading: 20, listening: 15, writing: 10 }
  };

  const INTERVIEW_STEPS = [
    {
      id: 'focus',
      questionVi: 'Bạn muốn bài học HSK tập trung nhiều nhất vào phần nào?',
      hintVi: 'App sẽ điều chỉnh tỉ trọng từ vựng, ngữ pháp, đọc hiểu và nghe trong từng bài.',
      options: [
        { value: 'vocab_heavy', label: 'Nhiều từ vựng hơn (50% từ vựng)' },
        { value: 'grammar_heavy', label: 'Chắc ngữ pháp & mẫu câu (45% ngữ pháp)' },
        { value: 'listening_speaking', label: 'Ưu tiên nghe & phản xạ (40% nghe)' },
        { value: 'reading_heavy', label: 'Đọc hiểu & hội thoại (40% đọc)' },
        { value: 'balanced', label: 'Cân bằng mọi kỹ năng' }
      ]
    },
    {
      id: 'minutes',
      questionVi: 'Mỗi ngày bạn có khoảng bao nhiêu phút để học tiếng Trung?',
      hintVi: 'Chọn 10–180 phút để app chia các bước vừa vặn với quỹ thời gian của bạn.',
      options: [
        { value: '15', label: '15 phút / ngày' },
        { value: '20', label: '20 phút / ngày' },
        { value: '30', label: '30 phút / ngày' },
        { value: '45', label: '45 phút / ngày' },
        { value: '60', label: '60 phút / ngày' }
      ]
    },
    {
      id: 'style',
      questionVi: 'Bạn muốn học theo kiểu nào phù hợp nhịp sinh hoạt nhất?',
      hintVi: 'App sẽ chia bài thành từng phiên theo đúng thói quen học của bạn.',
      options: [
        { value: 'spare_time', label: 'Tranh thủ giờ trống · phiên ngắn 5–10 phút' },
        { value: 'focused_block', label: 'Ngồi học 1 mạch tập trung' },
        { value: 'hands_free', label: 'Rảnh tay · nghe nhiều khi di chuyển' },
        { value: 'bedtime_review', label: 'Ôn nhẹ trước khi ngủ' },
        { value: 'weekend_sprint', label: 'Ngày thường ngắn · cuối tuần học sâu' }
      ]
    },
    {
      id: 'days',
      questionVi: 'Mỗi tuần bạn dự định học mấy ngày?',
      hintVi: 'Chọn từ 3 đến 7 ngày/tuần để sắp xếp nhịp ôn đều.',
      options: [
        { value: '5', label: '5 ngày / tuần' },
        { value: '6', label: '6 ngày / tuần' },
        { value: '7', label: '7 ngày / tuần' },
        { value: '3', label: '3 ngày / tuần' }
      ]
    },
    {
      id: 'goal',
      questionVi: 'Mục tiêu ưu tiên nhất hiện tại của bạn là gì?',
      hintVi: 'Giúp ưu tiên dạng bài kiểm tra và ôn tập phù hợp.',
      options: [
        { value: 'exam', label: 'Thi đỗ chứng chỉ HSK' },
        { value: 'conversation', label: 'Giao tiếp phản xạ tự nhiên' },
        { value: 'reading_comprehension', label: 'Đọc hiểu văn bản, truyện, bài báo' },
        { value: 'work_travel', label: 'Dùng trong công việc & đời sống' }
      ]
    }
  ];

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function normalizeWeights(rawWeights, focusChoice = 'balanced') {
    const fallback = FOCUS_PRESETS[focusChoice] || FOCUS_PRESETS.balanced;
    const base = {};
    for (const skill of SKILLS) {
      const n = Number(rawWeights && rawWeights[skill]);
      base[skill] = Number.isFinite(n) && n > 0 ? clamp(n, 5, 70) : fallback[skill];
    }
    const sum = SKILLS.reduce((acc, s) => acc + base[s], 0) || 100;
    const result = {};
    for (const skill of SKILLS) {
      result[skill] = clamp(Math.round((base[skill] * 100) / sum), 5, 70);
    }
    let diff = 100 - SKILLS.reduce((acc, s) => acc + result[s], 0);
    let safety = 0;
    while (diff !== 0 && safety++ < 25) {
      const step = diff > 0 ? 1 : -1;
      const candidates = SKILLS.slice().sort((a, b) => (diff > 0 ? result[a] - result[b] : result[b] - result[a]));
      let adjusted = false;
      for (const s of candidates) {
        if (result[s] + step >= 5 && result[s] + step <= 70) {
          result[s] += step;
          diff -= step;
          adjusted = true;
          break;
        }
      }
      if (!adjusted) break;
    }
    return result;
  }

  function parseNaturalReply(stepId, text) {
    const raw = String(text || '').trim();
    const low = raw.toLowerCase();
    if (stepId === 'focus') {
      if (FOCUS_PRESETS[raw]) return raw;
      if (/từ vựng|tu vung|vocab|nhớ từ|nho tu|thẻ từ|the tu/i.test(low)) return 'vocab_heavy';
      if (/ngữ pháp|ngu phap|grammar|cấu trúc|cau truc|đặt câu|dat cau/i.test(low)) return 'grammar_heavy';
      if (/nghe|nói|noi|giao tiếp|giao tiep|phản xạ|phan xa|hội thoại|hoi thoai|listen|speak/i.test(low)) return 'listening_speaking';
      if (/đọc|doc|reading|truyện|truyen/i.test(low)) return 'reading_heavy';
      return 'balanced';
    }
    if (stepId === 'minutes') {
      if (/nửa tiếng|nua tieng|half an hour/i.test(low)) return 30;
      const hourMatch = low.match(/(\d+(?:[.,]\d+)?)\s*(?:tiếng|tieng|giờ|gio|h\b|hour)/);
      if (hourMatch) {
        const hrs = Number(hourMatch[1].replace(',', '.'));
        if (Number.isFinite(hrs) && hrs > 0) return clamp(Math.round(hrs * 60), 10, 180);
      }
      const numMatch = low.match(/(\d{1,3})/);
      if (numMatch) {
        const mins = Number(numMatch[1]);
        if (Number.isFinite(mins)) return clamp(Math.round(mins), 10, 180);
      }
      return 20;
    }
    if (stepId === 'style') {
      if (STYLES.includes(raw)) return raw;
      if (/rảnh tay|ranh tay|đi đường|di duong|xe buýt|xe buyt|thụ động|thu dong|hands|nghe nhiều/i.test(low)) return 'hands_free';
      if (/trước khi ngủ|truoc khi ngu|buổi tối|buoi toi|ôn nhẹ|on nhe|bedtime|ngủ/i.test(low)) return 'bedtime_review';
      if (/cuối tuần|cuoi tuan|dồn|don|weekend/i.test(low)) return 'weekend_sprint';
      if (/giờ trống|gio trong|giờ nghỉ|gio nghi|tranh thủ|tranh thu|ngắn|ngan|chia nhỏ|chia nho|micro|rảnh/i.test(low)) return 'spare_time';
      return 'focused_block';
    }
    if (stepId === 'days') {
      const m = low.match(/([1-7])/);
      if (m) return clamp(Number(m[1]), 3, 7);
      return 6;
    }
    if (stepId === 'goal') {
      if (GOALS.includes(raw)) return raw;
      if (/thi|đề|chứng chỉ|chung chi|hsk|exam/i.test(low)) return 'exam';
      if (/đọc|doc|sách|sach|báo|bao|reading/i.test(low)) return 'reading_comprehension';
      if (/công việc|cong viec|đi làm|di lam|du lịch|du lich|work|travel/i.test(low)) return 'work_travel';
      return 'conversation';
    }
    return raw;
  }

  function defaultSummaryVi({ focusChoice, minutes, style, goal }) {
    const focusName = focusChoice === 'vocab_heavy'
      ? 'ưu tiên từ vựng'
      : focusChoice === 'grammar_heavy'
        ? 'ưu tiên ngữ pháp'
        : focusChoice === 'listening_speaking'
          ? 'ưu tiên nghe & phản xạ'
          : focusChoice === 'reading_heavy'
            ? 'ưu tiên đọc hiểu'
            : 'cân bằng các kỹ năng';
    const styleName = STYLE_LABELS[style] || STYLE_LABELS.spare_time;
    const goalName = GOAL_LABELS[goal] || GOAL_LABELS.conversation;
    return `Cấu trúc bài học ${focusName}, ${minutes} phút/ngày theo kiểu "${styleName}" hướng tới mục tiêu ${goalName}.`;
  }

  function defaultFollowUpVi({ style, weights }) {
    const topSkill = SKILLS.slice().sort((a, b) => weights[b] - weights[a])[0];
    if (style === 'spare_time') {
      return `Mỗi khi rảnh 5–10 phút, mở nhanh 1 phiên để giữ nhịp (${SKILL_LABELS[topSkill]} chiếm ${weights[topSkill]}%).`;
    }
    if (style === 'hands_free') {
      return `Ưu tiên bật audio câu mẫu và nghe hội thoại trước, cuối ngày làm nhanh 1 bài kiểm tra từ.`;
    }
    if (style === 'bedtime_review') {
      return `Duy trì nhịp ôn nhẹ buổi tối tập trung ${SKILL_LABELS[topSkill]} để ghi nhớ sâu qua đêm.`;
    }
    return `Hoàn thành trọn vẹn các bước trong ngày để giữ tiến độ ${SKILL_LABELS[topSkill]} (${weights[topSkill]}%) ổn định.`;
  }

  function sanitizeSessionsDone(raw) {
    const clean = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
    const days = Object.keys(raw).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-14);
    for (const d of days) {
      const arr = Array.isArray(raw[d]) ? raw[d].filter(v => typeof v === 'string' && v.length <= 80).slice(0, 60) : [];
      if (arr.length) clean[d] = [...new Set(arr)];
    }
    return clean;
  }

  const ALLOWED_STEP_ACTIONS = [
    'vocab_cards',
    'vocab_quiz',
    'vocab_srs',
    'grammar_focus',
    'reading_dialogue',
    'passive_listen',
    'guided_auto',
    'practice_mini',
    'practice_check',
    'real_reading',
    'ai_vocab_coach',
    'ai_drill',
    'ai_scenario'
  ];

  function sanitizeFocusWords(rawWords) {
    if (!Array.isArray(rawWords)) return [];
    const list = [];
    for (const item of rawWords.slice(0, 12)) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const word = {
        han: String(item.han || '').trim().slice(0, 32),
        pin: String(item.pin || '').trim().slice(0, 64),
        mean: String(item.mean || '').trim().slice(0, 140),
        mnemonicVi: String(item.mnemonicVi || '').trim().slice(0, 260),
        exampleCn: String(item.exampleCn || '').trim().slice(0, 120),
        examplePin: String(item.examplePin || '').trim().slice(0, 160),
        exampleVi: String(item.exampleVi || '').trim().slice(0, 180)
      };
      if (!/\p{Script=Han}/u.test(word.han) || !word.pin || !word.mean || !word.mnemonicVi ||
          !/\p{Script=Han}/u.test(word.exampleCn) || !word.examplePin || !word.exampleVi) continue;
      list.push(word);
    }
    return list;
  }

  function sanitizeDrills(rawDrills) {
    if (!Array.isArray(rawDrills)) return [];
    const list = [];
    for (const drill of rawDrills.slice(0, 4)) {
      if (!drill || typeof drill !== 'object' || Array.isArray(drill)) continue;
      const promptVi = String(drill.promptVi || '').trim().slice(0, 260);
      const questionCn = String(drill.questionCn || '').trim().slice(0, 140);
      const options = Array.isArray(drill.options)
        ? drill.options.map(option => String(option ?? '').trim().slice(0, 120)).filter(Boolean).slice(0, 4)
        : [];
      const answerIndex = Number(drill.answerIndex);
      const explanationVi = String(drill.explanationVi || '').trim().slice(0, 300);
      if (!promptVi || options.length !== 4 || new Set(options).size !== 4 ||
          !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length || !explanationVi) continue;
      list.push({ promptVi, questionCn, options, answerIndex, explanationVi });
    }
    return list;
  }

  function sanitizeScenario(rawScenario) {
    if (!rawScenario || typeof rawScenario !== 'object' || Array.isArray(rawScenario)) return null;
    const scenario = {
      contextVi: String(rawScenario.contextVi || '').trim().slice(0, 240),
      promptVi: String(rawScenario.promptVi || '').trim().slice(0, 260),
      sampleCn: String(rawScenario.sampleCn || '').trim().slice(0, 160),
      samplePin: String(rawScenario.samplePin || '').trim().slice(0, 200),
      sampleVi: String(rawScenario.sampleVi || '').trim().slice(0, 220)
    };
    if (!scenario.contextVi || !scenario.promptVi || !/\p{Script=Han}/u.test(scenario.sampleCn) || !scenario.samplePin || !scenario.sampleVi) return null;
    return scenario;
  }

  function sanitizeAiStep(raw, idx = 0, allowedWords = null) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const titleVi = String(raw.titleVi || '').trim().slice(0, 140);
    if (!titleVi) return null;
    const skill = SKILLS.includes(raw.skill) ? raw.skill : 'vocab';
    const focusWords = sanitizeFocusWords(raw.focusWords).filter(word => !allowedWords || allowedWords.has(word.han));
    const drills = sanitizeDrills(raw.drills);
    const scenario = sanitizeScenario(raw.scenario);
    let action = ALLOWED_STEP_ACTIONS.includes(raw.action) ? raw.action : '';
    // Never leave an AI action selected when its required interactive payload is missing.
    if (action === 'ai_drill' && drills.length < 2) action = '';
    if (action === 'ai_scenario' && !scenario) action = '';
    if (action === 'ai_vocab_coach' && !focusWords.length) action = 'vocab_cards';
    if (!action) {
      if (drills.length >= 2) action = 'ai_drill';
      else if (focusWords.length) action = 'ai_vocab_coach';
      else if (scenario) action = 'ai_scenario';
      else if (skill === 'grammar') action = 'grammar_focus';
      else if (skill === 'reading') action = 'reading_dialogue';
      else if (skill === 'listening') action = 'guided_auto';
      else action = 'vocab_cards';
    }
    const id = String(raw.id || `${action}_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || `step_${idx + 1}`;
    const detailVi = String(raw.detailVi || '').trim().slice(0, 260) || titleVi;
    const step = {
      id,
      skill,
      action,
      minutes: clamp(Math.round(Number(raw.minutes) || 5), 1, 90),
      titleVi,
      detailVi,
      coachTipVi: String(raw.coachTipVi || '').trim().slice(0, 280) || detailVi
    };
    if (Number.isFinite(Number(raw.wordLimit)) && Number(raw.wordLimit) > 0) {
      step.wordLimit = clamp(Math.round(Number(raw.wordLimit)), 1, 50);
    }
    if (Number.isFinite(Number(raw.grammarLimit)) && Number(raw.grammarLimit) > 0) {
      step.grammarLimit = clamp(Math.round(Number(raw.grammarLimit)), 1, 10);
    }
    if (focusWords.length) step.focusWords = focusWords;
    if (drills.length) step.drills = drills;
    if (scenario) step.scenario = scenario;
    return step;
  }

  function sanitizeAiSessions(rawSessions, totalMinutes = 20, allowedWords = null) {
    if (!Array.isArray(rawSessions) || !rawSessions.length) return [];
    const targetTotal = clamp(Math.round(Number(totalMinutes) || 20), 10, 180);
    const cleaned = [];
    for (let i = 0; i < Math.min(rawSessions.length, 4); i++) {
      const session = rawSessions[i];
      if (!session || typeof session !== 'object' || Array.isArray(session)) continue;
      const steps = Array.isArray(session.steps)
        ? session.steps.map((step, idx) => sanitizeAiStep(step, idx, allowedWords)).filter(Boolean).slice(0, 4)
        : [];
      if (steps.length < 2) continue;
      cleaned.push({
        label: String(session.label || `Phiên ${cleaned.length + 1}`).trim().slice(0, 100),
        goalVi: String(session.goalVi || '').trim().slice(0, 220),
        minutes: clamp(Math.round(Number(session.minutes) || steps.reduce((sum, step) => sum + step.minutes, 0) || 10), 2, 180),
        steps
      });
    }
    if (!cleaned.length) return [];

    // Every step needs at least one minute. Keep the AI's 2–4-step session shape
    // while ensuring the total step count can fit inside the learner's daily budget.
    cleaned.length = Math.min(cleaned.length, Math.floor(targetTotal / 2));
    let totalSteps = cleaned.reduce((sum, session) => sum + session.steps.length, 0);
    while (totalSteps > targetTotal) {
      const candidate = cleaned.reduce((best, session) =>
        session.steps.length > 2 && (!best || session.steps.length > best.steps.length) ? session : best, null);
      if (!candidate) break;
      candidate.steps.pop();
      totalSteps--;
    }
    if (!cleaned.length || totalSteps > targetTotal) return [];

    // Allocate session minutes by required step count; the total budget is always conserved.
    const sessionMins = distributeMinutesWithMinimum(targetTotal, cleaned.map(session => ({ weight: session.minutes })), cleaned.map(session => session.steps.length));
    return cleaned.map((session, index) => {
      const minutes = sessionMins[index];
      const stepMins = distributeMinutes(minutes, session.steps.map(step => ({ weight: step.minutes })));
      const cleanLabel = String(session.label || `Phiên ${index + 1}`)
        .replace(/\s*(?:[·•-]\s*)?\d+\s*phút\s*$/i, '').trim() || `Phiên ${index + 1}`;
      return {
        ...session,
        label: `${cleanLabel} · ${minutes} phút`,
        minutes,
        steps: session.steps.map((step, stepIndex) => ({ ...step, minutes: stepMins[stepIndex] }))
      };
    });
  }

  function sanitizeAiLessonDesign(rawDesign, lessonId, totalMinutes = 20, allowedWords = null) {
    if (!rawDesign || typeof rawDesign !== 'object' || Array.isArray(rawDesign)) return null;
    const coachIntroVi = String(rawDesign.coachIntroVi || '').trim().slice(0, 500);
    const sessions = sanitizeAiSessions(rawDesign.sessions, totalMinutes, allowedWords);
    if (!coachIntroVi || !sessions.length) return null;
    return {
      lessonId: String(lessonId || rawDesign.lessonId || '').trim().slice(0, 64),
      coachIntroVi,
      customPrompt: String(rawDesign.customPrompt || '').trim().slice(0, 300),
      aiProvider: String(rawDesign.aiProvider || '').trim().slice(0, 40),
      aiModel: String(rawDesign.aiModel || '').trim().slice(0, 80),
      updatedAt: Number.isFinite(rawDesign.updatedAt) ? rawDesign.updatedAt : Date.now(),
      sessions
    };
  }

  function sanitizeAiLessonDesignsMap(rawMap, totalMinutes = 20) {
    const out = {};
    if (!rawMap || typeof rawMap !== 'object' || Array.isArray(rawMap)) return out;
    const entries = Object.entries(rawMap)
      .filter(([k, v]) => typeof k === 'string' && k.length <= 64 && v && typeof v === 'object')
      .sort((a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0))
      .slice(0, 12);
    for (const [k, v] of entries) {
      const clean = sanitizeAiLessonDesign(v, k, totalMinutes);
      if (clean && JSON.stringify(clean).length <= 45000) out[k] = clean;
      if (JSON.stringify(out).length > 140000) {
        while (Object.keys(out).length && JSON.stringify(out).length > 140000) {
          delete out[Object.keys(out).pop()];
        }
      }
    }
    return out;
  }

  function createProfile(input = {}, now = Date.now()) {
    const focusChoice = FOCUS_PRESETS[input.focusChoice] ? input.focusChoice : 'balanced';
    const minutes = clamp(Math.round(Number(input.minutes) || 20), 10, 180);
    const days = clamp(Math.round(Number(input.days) || 6), 3, 7);
    const hsk = clamp(Math.round(Number(input.hsk) || 1), 1, 6);
    const style = STYLES.includes(input.style) ? input.style : 'spare_time';
    const goal = GOALS.includes(input.goal) ? input.goal : 'conversation';
    const weights = normalizeWeights(input.weights, focusChoice);
    const id = typeof input.id === 'string' && input.id.trim()
      ? input.id.trim().slice(0, 64)
      : 'custom-' + now;
    const summaryVi = typeof input.summaryVi === 'string' && input.summaryVi.trim()
      ? input.summaryVi.trim().slice(0, 500)
      : defaultSummaryVi({ focusChoice, minutes, style, goal });
    const followUpVi = typeof input.followUpVi === 'string' && input.followUpVi.trim()
      ? input.followUpVi.trim().slice(0, 400)
      : defaultFollowUpVi({ style, weights });

    const profile = {
      version: 1,
      id,
      hsk,
      focusChoice,
      minutes,
      days,
      style,
      goal,
      weights,
      summaryVi,
      followUpVi,
      sessionsDone: sanitizeSessionsDone(input.sessionsDone),
      updatedAt: Number.isFinite(input.updatedAt) ? input.updatedAt : now
    };

    if (input.aiGenerated === true) profile.aiGenerated = true;
    if (typeof input.aiProvider === 'string' && input.aiProvider.trim()) {
      profile.aiProvider = input.aiProvider.trim().slice(0, 40);
    }
    if (typeof input.aiModel === 'string' && input.aiModel.trim()) {
      profile.aiModel = input.aiModel.trim().slice(0, 80);
    }
    if (typeof input.learnerContextVi === 'string' && input.learnerContextVi.trim()) {
      profile.learnerContextVi = input.learnerContextVi.trim().slice(0, 500);
    }
    const cleanBlueprint = sanitizeAiSessions(input.aiBlueprint, minutes);
    if (cleanBlueprint.length) {
      profile.aiBlueprint = cleanBlueprint;
    }
    const cleanDesigns = sanitizeAiLessonDesignsMap(input.aiLessonDesigns, minutes);
    if (Object.keys(cleanDesigns).length) {
      profile.aiLessonDesigns = cleanDesigns;
    }

    return profile;
  }

  function validProfile(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p) || p.version !== 1) return false;
    if (typeof p.id !== 'string' || !p.id.trim() || p.id.length > 80) return false;
    if (!Number.isInteger(p.hsk) || p.hsk < 1 || p.hsk > 6) return false;
    if (!Number.isInteger(p.minutes) || p.minutes < 10 || p.minutes > 180) return false;
    if (!Number.isInteger(p.days) || p.days < 3 || p.days > 7) return false;
    if (!STYLES.includes(p.style) || !GOALS.includes(p.goal) || !FOCUS_PRESETS[p.focusChoice]) return false;
    if (!p.weights || typeof p.weights !== 'object' || Array.isArray(p.weights)) return false;
    let sum = 0;
    for (const s of SKILLS) {
      const w = p.weights[s];
      if (!Number.isInteger(w) || w < 5 || w > 70) return false;
      sum += w;
    }
    if (sum !== 100) return false;
    if (typeof p.summaryVi !== 'string' || !p.summaryVi.trim() || p.summaryVi.length > 600) return false;
    if (!Number.isFinite(p.updatedAt)) return false;
    return true;
  }

  function distributeMinutes(totalMinutes, buckets) {
    if (!buckets.length) return [];
    const totalWeight = buckets.reduce((acc, b) => acc + Math.max(1, b.weight), 0);
    const allocated = buckets.map(b => Math.max(1, Math.floor((totalMinutes * Math.max(1, b.weight)) / totalWeight)));
    let diff = totalMinutes - allocated.reduce((acc, m) => acc + m, 0);
    let idx = 0;
    while (diff !== 0 && idx < 100) {
      const pos = idx % allocated.length;
      if (diff > 0) {
        allocated[pos]++;
        diff--;
      } else if (allocated[pos] > 1) {
        allocated[pos]--;
        diff++;
      }
      idx++;
    }
    return allocated;
  }

  function distributeMinutesWithMinimum(totalMinutes, buckets, minimums = []) {
    if (!buckets.length) return [];
    const base = buckets.map((_, index) => Math.max(1, Math.round(Number(minimums[index]) || 1)));
    const baseTotal = base.reduce((sum, minutes) => sum + minutes, 0);
    const total = Math.max(baseTotal, Math.round(Number(totalMinutes) || baseTotal));
    const remaining = total - baseTotal;
    const weights = buckets.map(bucket => Math.max(1, Number(bucket.weight) || 1));
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
    const shares = weights.map(weight => remaining * weight / weightTotal);
    const extras = shares.map(Math.floor);
    let leftover = remaining - extras.reduce((sum, value) => sum + value, 0);
    const order = shares.map((share, index) => ({ index, fraction: share - extras[index] }))
      .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
    for (let index = 0; index < leftover; index++) extras[order[index % order.length].index]++;
    return base.map((minutes, index) => minutes + extras[index]);
  }

  function vnDayKey(now = Date.now()) {
    return new Date(now + 7 * 3600000).toISOString().slice(0, 10);
  }

  function pickSessionCount(profile, options = {}) {
    if (profile.style === 'spare_time') return clamp(Math.round(profile.minutes / 8), 2, 5);
    if (profile.style === 'focused_block') return profile.minutes <= 45 ? 1 : 2;
    if (profile.style === 'hands_free') return clamp(Math.round(profile.minutes / 12), 1, 3);
    if (profile.style === 'bedtime_review') return profile.minutes <= 25 ? 1 : 2;
    if (profile.style === 'weekend_sprint') return options.isWeekend ? (profile.minutes <= 45 ? 1 : 2) : (profile.minutes >= 20 ? 2 : 1);
    return 1;
  }

  function buildSkillBlueprints(profile, lesson, progressRecord = {}) {
    const w = profile.weights;
    const words = Array.isArray(lesson?.words) ? lesson.words : [];
    const totalWords = words.length;
    const grammarCount = Array.isArray(lesson?.content?.grammar) ? lesson.content.grammar.length : 0;
    const hasContent = Boolean(lesson?.content);
    const hasMini = Boolean(lesson?.miniReviewKeys?.length);
    const style = profile.style;
    const list = [];

    if (style === 'hands_free') {
      list.push({
        id: 'guided_auto',
        skill: 'listening',
        action: 'guided_auto',
        titleVi: 'Nghe & nhắc lại tự động',
        detailVi: 'Phát liên tiếp từ vựng, ví dụ và hội thoại theo nhịp rảnh tay.',
        weight: Math.max(20, w.listening + Math.floor(w.reading / 2))
      });
      list.push({
        id: 'passive_listen',
        skill: 'listening',
        action: 'passive_listen',
        titleVi: 'Nghe thụ động hội thoại bài',
        detailVi: hasContent ? 'Nghe trọn đoạn hội thoại không cần nhìn chữ nhiều.' : 'Nghe phát âm cụm từ khóa của bài.',
        weight: Math.max(15, w.listening)
      });
      list.push({
        id: 'vocab_srs',
        skill: 'vocab',
        action: 'vocab_srs',
        titleVi: 'Ôn nhanh từ trọng tâm (SRS)',
        detailVi: totalWords ? `Chốt lại ${Math.min(totalWords, 10)} từ khóa của bài.` : 'Ôn từ đến hạn trong sổ.',
        weight: Math.max(10, w.vocab)
      });
      if (grammarCount > 0 || w.grammar >= 20) {
        list.push({
          id: 'grammar_focus',
          skill: 'grammar',
          action: 'grammar_focus',
          titleVi: 'Nghe & lướt nhanh mẫu ngữ pháp',
          detailVi: grammarCount ? `Đi qua ${Math.min(grammarCount, 2)} mẫu câu chính kèm audio ví dụ.` : 'Xem lại mẫu câu trọng tâm.',
          weight: Math.max(8, w.grammar)
        });
      }
      return list;
    }

    // Standard priority-ordered building blocks driven by weights + style
    const vocabQuota = totalWords
      ? clamp(Math.round((totalWords * w.vocab) / 45), 3, totalWords)
      : 6;

    const blocks = [
      {
        priority: w.vocab + (style === 'bedtime_review' ? 15 : 0),
        item: {
          id: 'vocab_cards',
          skill: 'vocab',
          action: 'vocab_cards',
          wordLimit: vocabQuota,
          titleVi: `Thẻ từ trọng tâm (${vocabQuota} từ)`,
          detailVi: 'Lật thẻ, nghe phát âm và ghi nhớ nghĩa + phiên âm theo ngữ cảnh.',
          weight: Math.max(12, Math.round(w.vocab * 0.6))
        }
      },
      {
        priority: w.vocab - 5 + (profile.goal === 'exam' ? 8 : 0),
        item: {
          id: 'vocab_quiz',
          skill: 'vocab',
          action: 'vocab_quiz',
          wordLimit: vocabQuota,
          titleVi: 'Kiểm tra phản xạ từ vựng',
          detailVi: 'Trắc nghiệm chọn nghĩa / chữ Hán chính xác từ nhóm từ vừa học.',
          weight: Math.max(8, Math.round(w.vocab * 0.4))
        }
      },
      {
        priority: w.grammar + (style === 'focused_block' ? 5 : 0),
        item: {
          id: 'grammar_focus',
          skill: 'grammar',
          action: 'grammar_focus',
          grammarLimit: w.grammar >= 30 ? Math.max(2, grammarCount) : Math.max(1, Math.min(2, grammarCount || 1)),
          titleVi: w.grammar >= 30 ? 'Ngữ pháp chuyên sâu & phân biệt lỗi' : 'Ngữ pháp cốt lõi của bài',
          detailVi: grammarCount
            ? `Tập trung ${w.grammar >= 30 ? grammarCount : Math.min(2, grammarCount)} mẫu cấu trúc, ví dụ và bẫy hay nhầm.`
            : 'Ôn nhanh cấu trúc câu từ ví dụ trong bài.',
          weight: Math.max(10, w.grammar)
        }
      },
      {
        priority: w.reading + (profile.goal === 'reading_comprehension' ? 12 : 0),
        item: {
          id: 'reading_dialogue',
          skill: 'reading',
          action: w.reading >= 30 && profile.goal === 'reading_comprehension' ? 'real_reading' : 'reading_dialogue',
          titleVi: w.reading >= 30 && profile.goal === 'reading_comprehension' ? 'Đọc hiểu & mở rộng tình huống' : 'Đọc đoạn khóa & hội thoại',
          detailVi: hasContent ? 'Đọc theo đoạn, bật phiên âm/nghĩa khi cần và bấm chạm từ.' : 'Đọc câu ví dụ kèm từ vựng bài.',
          weight: Math.max(10, w.reading)
        }
      },
      {
        priority: w.listening,
        item: {
          id: 'guided_auto',
          skill: 'listening',
          action: 'guided_auto',
          titleVi: 'Học tự động (nghe + karaoke)',
          detailVi: 'Chạy luồng nghe tự động theo nhịp để luyện tai và đọc theo.',
          weight: Math.max(10, w.listening)
        }
      }
    ];

    if (style === 'bedtime_review' || progressRecord?.startedAt || w.writing >= 10) {
      blocks.push({
        priority: style === 'bedtime_review' ? 55 : 22,
        item: {
          id: hasMini ? 'practice_mini' : 'vocab_srs',
          skill: hasMini ? 'reading' : 'vocab',
          action: hasMini ? 'practice_mini' : 'vocab_srs',
          titleVi: hasMini ? 'Ôn nhanh 5 tác vụ hiểu bài' : 'Ôn tập ngắt quãng SRS',
          detailVi: hasMini ? 'Bài tập ngắn gọn củng cố nghe, điền từ và cấu trúc.' : 'Củng cố từ đến hạn để nhớ chắc qua đêm.',
          weight: Math.max(8, Math.round((w.vocab + w.writing) * 0.35))
        }
      });
    } else if (profile.goal === 'exam' && hasContent) {
      blocks.push({
        priority: 30,
        item: {
          id: 'practice_check',
          skill: 'grammar',
          action: 'practice_check',
          titleVi: 'Kiểm tra hiểu bài chuẩn HSK',
          detailVi: 'Làm câu hỏi trắc nghiệm hiểu bài & cấu trúc câu.',
          weight: Math.max(8, w.writing + 5)
        }
      });
    }

    blocks.sort((a, b) => b.priority - a.priority);
    for (const b of blocks) list.push(b.item);
    return list;
  }

  function buildLessonPlan(profileInput, lesson, progressRecord = {}, options = {}) {
    const profile = validProfile(profileInput) ? profileInput : createProfile(profileInput);
    const targetLesson = lesson || { id: `standard-${profile.hsk}-01`, number: 1, vi: `Bài 1 · HSK ${profile.hsk}`, words: [] };
    const now = Number.isFinite(options.now) ? options.now : Date.now();
    const isWeekend = typeof options.isWeekend === 'boolean'
      ? options.isWeekend
      : [0, 6].includes(new Date(now + 7 * 3600000).getUTCDay());
    const planOptions = { ...options, now, isWeekend };
    const dayKey = options.dayKey || vnDayKey(now);
    const doneSet = new Set(profile.sessionsDone?.[dayKey] || []);

    // A lesson-specific design must never leak its vocabulary or drills into another lesson.
    const lessonAiDesign = profile.aiLessonDesigns?.[targetLesson.id] || null;
    const aiSessionsSource = lessonAiDesign?.sessions?.length
      ? sanitizeAiSessions(lessonAiDesign.sessions, profile.minutes)
      : null;

    const sessions = [];
    let completedSteps = 0;
    let totalSteps = 0;

    if (aiSessionsSource?.length) {
      for (let i = 0; i < aiSessionsSource.length; i++) {
        const aiSess = aiSessionsSource[i];
        const steps = aiSess.steps.map(step => {
          const stepId = `${targetLesson.id}:${step.id}:s${i + 1}`;
          const completed = doneSet.has(stepId);
          totalSteps++;
          if (completed) completedSteps++;
          return {
            ...step,
            stepId,
            skillLabel: SKILL_LABELS[step.skill] || step.skill,
            completed,
            aiAuthored: true
          };
        });
        const cleanLabel = String(aiSess.label || `Phiên ${i + 1}`)
          .replace(/\s*(?:[·•-]\s*)?\d+\s*phút\s*$/i, '').trim() || `Phiên ${i + 1}`;
        sessions.push({
          index: i + 1,
          id: `session-${i + 1}`,
          label: `${cleanLabel} · ${aiSess.minutes} phút`,
          goalVi: aiSess.goalVi || '',
          minutes: aiSess.minutes,
          steps,
          completed: steps.every(step => step.completed),
          aiAuthored: true
        });
      }
    } else {
      const blueprints = buildSkillBlueprints(profile, targetLesson, progressRecord);
      const sessionCount = Math.min(pickSessionCount(profile, planOptions), Math.max(1, blueprints.length));
      const sessionMinuteBudgets = distributeMinutes(
        profile.minutes,
        Array.from({ length: sessionCount }, (_, idx) => ({
          weight: profile.style === 'spare_time' ? 1 : (sessionCount - idx + 1)
        }))
      );
      const grouped = Array.from({ length: sessionCount }, () => []);
      blueprints.forEach((blueprint, index) => {
        if (index < sessionCount) grouped[index].push(blueprint);
        else grouped[index % sessionCount].push(blueprint);
      });

      for (let i = 0; i < sessionCount; i++) {
        const stepsRaw = grouped[i];
        const sessionMinutes = sessionMinuteBudgets[i];
        const stepMins = distributeMinutes(sessionMinutes, stepsRaw.map(step => ({ weight: step.weight })));
        const steps = stepsRaw.map((step, j) => {
          const stepId = `${targetLesson.id}:${step.id}:s${i + 1}`;
          // A general lesson-read flag does not prove that this custom step was completed.
          const completed = doneSet.has(stepId);
          totalSteps++;
          if (completed) completedSteps++;
          return {
            ...step,
            stepId,
            minutes: stepMins[j],
            skillLabel: SKILL_LABELS[step.skill] || step.skill,
            completed
          };
        });
        const labelPrefix = profile.style === 'spare_time'
          ? `Phiên trống ${i + 1}`
          : profile.style === 'bedtime_review'
            ? `Nhịp tối ${i + 1}`
            : `Phiên ${i + 1}`;
        sessions.push({
          index: i + 1,
          id: `session-${i + 1}`,
          label: `${labelPrefix} · ${sessionMinutes} phút`,
          minutes: sessionMinutes,
          steps,
          completed: steps.every(step => step.completed)
        });
      }
    }

    const subtitleNote = profile.style === 'weekend_sprint' && !planOptions.isWeekend
      ? 'Ngày thường học gọn nhẹ; cuối tuần tăng cường tổng hợp.'
      : profile.followUpVi;

    return {
      lessonId: targetLesson.id,
      lessonNumber: targetLesson.number || 1,
      lessonTitleVi: targetLesson.vi || targetLesson.title || '',
      hsk: profile.hsk,
      totalMinutes: profile.minutes,
      days: profile.days,
      style: profile.style,
      styleLabel: STYLE_LABELS[profile.style],
      goal: profile.goal,
      goalLabel: GOAL_LABELS[profile.goal],
      weights: { ...profile.weights },
      summaryVi: profile.summaryVi,
      noteVi: subtitleNote,
      coachIntroVi: lessonAiDesign?.coachIntroVi || profile.learnerContextVi || profile.summaryVi,
      aiDesigned: Boolean(lessonAiDesign || profile.aiGenerated),
      hasLessonAiDesign: Boolean(lessonAiDesign?.sessions?.length),
      aiProvider: lessonAiDesign?.aiProvider || profile.aiProvider || '',
      aiModel: lessonAiDesign?.aiModel || profile.aiModel || '',
      customPrompt: lessonAiDesign?.customPrompt || '',
      dayKey,
      sessions,
      completedSteps,
      totalSteps
    };
  }

  function saveLessonDesign(profileInput, lessonId, rawDesign, now = Date.now(), allowedWords = null) {
    const profile = createProfile(profileInput, now);
    const key = String(lessonId || '').trim().slice(0, 64);
    if (!key) return profile;
    const clean = sanitizeAiLessonDesign({ ...rawDesign, updatedAt: now }, key, profile.minutes, allowedWords);
    if (!clean) return profile;
    const nextMap = { ...(profile.aiLessonDesigns || {}), [key]: clean };
    return createProfile({
      ...profile,
      aiGenerated: true,
      aiProvider: clean.aiProvider || profile.aiProvider || 'ai',
      aiModel: clean.aiModel || profile.aiModel || '',
      aiLessonDesigns: nextMap,
      updatedAt: now
    }, now);
  }

  function markStepCompleted(profileInput, dayKey, stepId, now = Date.now()) {
    const profile = createProfile(profileInput, now);
    const key = /^\d{4}-\d{2}-\d{2}$/.test(String(dayKey || '')) ? dayKey : vnDayKey(now);
    const prev = Array.isArray(profile.sessionsDone?.[key]) ? profile.sessionsDone[key] : [];
    const nextList = [...new Set([...prev, String(stepId || '').slice(0, 80)])].filter(Boolean);
    const nextDone = sanitizeSessionsDone({ ...profile.sessionsDone, [key]: nextList });
    return createProfile({ ...profile, sessionsDone: nextDone, updatedAt: now }, now);
  }

  function adaptProfileWeekly(profileInput, stats = {}, now = Date.now()) {
    const profile = createProfile(profileInput, now);
    const attempts = Number(stats.attempts || 0);
    if (attempts < 10) {
      return {
        action: 'keep',
        profile,
        reasonVi: 'Cần thêm ít nhất 10 lượt luyện tập tuần này trước khi điều chỉnh tỉ trọng.'
      };
    }

    const bySkill = stats.bySkill && typeof stats.bySkill === 'object' ? stats.bySkill : {};
    let weakest = null;
    let lowestAcc = 1;
    for (const s of SKILLS) {
      const rec = bySkill[s];
      if (!rec || Number(rec.attempts || 0) < 4) continue;
      const acc = Number(rec.correct || 0) / Number(rec.attempts);
      if (acc < 0.65 && acc < lowestAcc) {
        lowestAcc = acc;
        weakest = s;
      }
    }

    if (!weakest) {
      return {
        action: 'keep',
        profile,
        reasonVi: 'Tỉ lệ đúng các kỹ năng đang ổn định, giữ nguyên cấu trúc bài học hiện tại.'
      };
    }

    const boosted = { ...profile.weights, [weakest]: profile.weights[weakest] + 10 };
    const nextWeights = normalizeWeights(boosted, profile.focusChoice);
    const updated = createProfile({
      ...profile,
      weights: nextWeights,
      summaryVi: `Tuần này tăng nhẹ ${SKILL_LABELS[weakest]} lên ${nextWeights[weakest]}% để củng cố phần còn yếu.`,
      updatedAt: now
    }, now);

    return {
      action: 'rebalance',
      weakSkill: weakest,
      profile: updated,
      reasonVi: `Độ chính xác ${SKILL_LABELS[weakest]} đạt ${Math.round(lowestAcc * 100)}%, đã tự tăng thêm tỉ trọng luyện phần này.`
    };
  }

  const api = {
    SKILLS,
    SKILL_LABELS,
    STYLES,
    STYLE_LABELS,
    GOALS,
    GOAL_LABELS,
    FOCUS_PRESETS,
    INTERVIEW_STEPS,
    ALLOWED_STEP_ACTIONS,
    normalizeWeights,
    parseNaturalReply,
    sanitizeAiSessions,
    sanitizeAiLessonDesign,
    saveLessonDesign,
    createProfile,
    validProfile,
    buildLessonPlan,
    markStepCompleted,
    adaptProfileWeekly,
    vnDayKey
  };

  root.HSKLessonCustomCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
