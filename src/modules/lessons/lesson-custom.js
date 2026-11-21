/* UI controller for Custom HSK Lesson: real conversational AI interview, AI lesson architect, fixed-form fallback, Home card & session runner. */
(function () {
  'use strict';

  const C = window.HSKLessonCustomCore;
  if (!C) return;

  let translationConfig = null;
  let interviewOpen = false;
  let formMode = false;
  let interviewStep = 0;
  let collectedAnswers = [];
  let chatHistory = [];
  let aiDynamicChips = null;
  let draftProfile = null;
  let interviewBusy = false;
  let interviewStatus = '';
  let activeSessionIndex = 0;
  let activeStepStage = null;
  let bannerDetailsOpen = false;
  let homeSessionsOpen = false;
  let interviewMode = 'template'; // 'template' (slider & segmented controls) | 'ai' (real AI chat)
  let sliderWeights = { ...C.FOCUS_PRESETS.balanced };
  let sliderMinutes = 30;
  let sliderDays = 6;
  let sliderStyle = 'spare_time';
  let sliderGoal = 'conversation';
  let lessonDesignBusy = false;
  let lessonDesignStatus = '';
  const autoDesignedLessons = new Set();

  fetch('./translation-config.json', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(cfg => {
      if (cfg?.enabled && cfg.endpoint && new URL(cfg.endpoint).protocol === 'https:') {
        translationConfig = cfg;
      }
    })
    .catch(() => {});

  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined && text !== null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }

  function btn(text, fn, cls) {
    const b = el('button', text, cls);
    b.type = 'button';
    b.onclick = fn;
    return b;
  }

  function isAiOnlineReady() {
    return Boolean(navigator.onLine && window.HSKAccountDashboard?.user && translationConfig?.endpoint);
  }

  function formatProviderName(prov) {
    const p = String(prov || '').toLowerCase();
    if (!p) return 'AI';
    if (p.includes('deepseek')) return 'DeepSeek';
    if (p.includes('literouter')) return 'LiteRouter';
    if (p.includes('openrouter')) return 'OpenRouter';
    if (p.includes('openai') || p.includes('chatgpt')) return 'OpenAI';
    if (p.includes('gemini')) return 'Gemini';
    return prov;
  }

  function getSavedProfile() {
    return window.HSKStudyStore?.customLesson || null;
  }

  function saveProfile(profile) {
    if (!window.HSKStudyStore?.saveCustomLesson) return null;
    const saved = window.HSKStudyStore.saveCustomLesson(C.createProfile(profile));
    return saved;
  }

  function compactLessonPayload(lesson, wordsInput) {
    if (!lesson || typeof lesson !== 'object') return undefined;
    const rawWords = Array.isArray(wordsInput) && wordsInput.length
      ? wordsInput
      : (Array.isArray(lesson.words) ? lesson.words : []);
    const words = rawWords.slice(0, 30).map(w => {
      if (typeof w === 'string') return { han: w.slice(0, 32), pin: '', mean: '' };
      return {
        han: String(w?.han || w?.word || '').slice(0, 32),
        pin: String(w?.pin || w?.pinyin || '').slice(0, 64),
        mean: String(w?.mean || w?.vi || '').slice(0, 120)
      };
    }).filter(w => w.han);

    const grammar = Array.isArray(lesson.content?.grammar)
      ? lesson.content.grammar.slice(0, 5).map(g => ({
          title: String(g?.title || '').slice(0, 100),
          pattern: String(g?.pattern || '').slice(0, 120),
          usage: String(g?.usage || '').slice(0, 200),
          error: String(g?.error || '').slice(0, 160)
        }))
      : [];

    const dlgLines = lesson.content?.dialogues?.[0]?.lines || lesson.content?.reading?.lines || [];
    const dialogues = Array.isArray(dlgLines)
      ? dlgLines.slice(0, 6).map(l => ({
          cn: String(l?.cn || '').slice(0, 140),
          pin: String(l?.pin || '').slice(0, 160),
          vi: String(l?.vi || '').slice(0, 180)
        }))
      : [];

    return {
      id: String(lesson.id || 'standard-1-01').slice(0, 64),
      number: Number(lesson.number || 1),
      title: String(lesson.title || lesson.vi || 'Bài học HSK').slice(0, 120),
      vi: String(lesson.vi || lesson.title || '').slice(0, 120),
      words,
      grammar,
      dialogues
    };
  }

  function seedFromAnswers(hsk, answers) {
    const map = {};
    for (const row of answers) {
      if (row.weights) map.weights = row.weights;
      if (row.id !== 'freeform' && row.id !== 'turn') {
        map[row.id] = row.parsedValue ?? C.parseNaturalReply(row.id, row.answer);
      } else if (row.answer) {
        if (!map.focus) map.focus = C.parseNaturalReply('focus', row.answer);
        if (!map.minutes && /\d|tiếng|giờ|phút/i.test(row.answer)) map.minutes = C.parseNaturalReply('minutes', row.answer);
        if (!map.style && /giờ trống|rảnh tay|ngủ|cuối tuần|một mạch/i.test(row.answer)) map.style = C.parseNaturalReply('style', row.answer);
        if (!map.goal && /thi|hsk|giao tiếp|đọc|công việc/i.test(row.answer)) map.goal = C.parseNaturalReply('goal', row.answer);
      }
    }
    const plannerMinutes = window.HSKPlanner?.plan?.minutes;
    return C.createProfile({
      hsk,
      focusChoice: map.focus || 'balanced',
      weights: map.weights,
      minutes: Number(map.minutes || plannerMinutes || 20),
      style: map.style || 'spare_time',
      days: Number(map.days || window.HSKPlanner?.plan?.days || 6),
      goal: map.goal || 'conversation'
    });
  }

  function extractJsonObject(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;
    let s = rawText.trim().replace(/<(?:think|thought|reasoning)>[\s\S]*?<\/(?:think|thought|reasoning)>/gi, '').trim();
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) s = fenced[1].trim();
    try {
      return JSON.parse(s);
    } catch {
      const first = s.indexOf('{');
      const last = s.lastIndexOf('}');
      if (first >= 0 && last > first) {
        try { return JSON.parse(s.slice(first, last + 1)); } catch {}
      }
      return null;
    }
  }

  // Fallback bridge via /lesson-ask when the remote Cloudflare Worker has not yet been redeployed with /custom-lesson-profile
  async function bridgeViaLessonAsk(endpointBase, token, body, signal) {
    const askUrl = endpointBase.replace(/\/translate$/, '/lesson-ask');
    const mode = body.mode || 'profile';
    const lessonInfo = body.lesson || { id: `standard-${body.hsk}-01`, title: `HSK ${body.hsk}`, words: [] };
    const wordsList = Array.isArray(lessonInfo.words)
      ? lessonInfo.words.slice(0, 25).map(w => (typeof w === 'string' ? w : `${w.han} (${w.pin}): ${w.mean}`))
      : [];

    const question = mode === 'design'
      ? 'Hãy thiết kế giáo án AI cá nhân hóa cho bài học này theo lesson.content.aiCustomSpec. Bạn có toàn quyền can thiệp, tách/gộp/đặt tên và chỉnh sửa số phiên (sessions: 1..10 phiên, mỗi phiên 1..4 bước, tổng số phút khớp quỹ thời gian hoặc yêu cầu trong customPrompt/learnerContextVi; nếu học viên muốn học ngắt quãng 5-10p/lần thì bắt buộc chia thành các phiên 5-10 phút). Chỉ trả về chuỗi JSON thuần {"coachIntroVi":"...","sessions":[{"label":"...","minutes":8,"goalVi":"...","steps":[{"id":"s1","skill":"vocab","action":"ai_vocab_coach","minutes":8,"titleVi":"...","detailVi":"...","coachTipVi":"...","focusWords":[{"han":"...","pin":"...","mean":"...","mnemonicVi":"...","exampleCn":"...","examplePin":"...","exampleVi":"..."}],"drills":[{"promptVi":"...","questionCn":"...","options":["A","B","C","D"],"answerIndex":0,"explanationVi":"..."}]}]}]}.'
      : mode === 'interview'
        ? 'Đọc lesson.content.aiCustomSpec. Nếu học viên chưa nêu đủ trọng tâm + thời gian/kiểu học (và dưới 3 lượt), trả JSON {"ready":false,"replyVi":"câu hỏi tiếp theo bằng tiếng Việt","suggestedReplies":["gợi ý 1","gợi ý 2","gợi ý 3"]}. Nếu đã đủ, bạn toàn quyền tự thiết kế cách chia phiên trong aiBlueprint (1..10 phiên tùy mục đích & nhịp sinh hoạt của học viên, VD: chia nhiều phiên ngắn 5-10p ban ngày + phiên tối 30p, hoặc các phiên chuyên biệt), trả JSON {"ready":true,"replyVi":"tổng kết","profile":{"focusChoice":"vocab_heavy","minutes":25,"days":6,"style":"spare_time","goal":"conversation","weights":{"vocab":50,"grammar":15,"reading":15,"listening":15,"writing":5},"summaryVi":"...","followUpVi":"...","learnerContextVi":"...","aiBlueprint":[{"label":"Phiên 1","minutes":8,"goalVi":"...","steps":[{"id":"s1","skill":"vocab","action":"vocab_cards","minutes":8,"titleVi":"...","detailVi":"...","coachTipVi":"..."}]}]}}.'
        : 'Đọc lesson.content.aiCustomSpec và thiết kế hồ sơ học HSK cá nhân hóa kèm cấu trúc chia phiên aiBlueprint (1..10 phiên do bạn tự chia linh hoạt theo mục đích học viên). Chỉ trả về JSON thuần {"focusChoice":"vocab_heavy|grammar_heavy|listening_speaking|reading_heavy|balanced","minutes":25,"days":6,"style":"spare_time|focused_block|hands_free|bedtime_review|weekend_sprint","goal":"exam|conversation|reading_comprehension|work_travel","weights":{"vocab":50,"grammar":15,"reading":15,"listening":15,"writing":5},"summaryVi":"...","followUpVi":"...","learnerContextVi":"...","aiBlueprint":[{"label":"Phiên 1","minutes":8,"goalVi":"...","steps":[{"id":"s1","skill":"vocab","action":"vocab_cards","minutes":8,"titleVi":"...","detailVi":"...","coachTipVi":"..."}]}]}.';

    const askRes = await fetch(askUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        hsk: body.hsk,
        question,
        history: [],
        lesson: {
          id: String(lessonInfo.id || `standard-${body.hsk}-01`),
          title: String(lessonInfo.title || lessonInfo.vi || `HSK ${body.hsk}`),
          words: wordsList,
          content: {
            aiCustomSpec: {
              mode,
              hsk: body.hsk,
              answers: body.answers || [],
              messages: body.messages || [],
              profile: body.profile || null,
              customPrompt: body.customPrompt || '',
              grammar: lessonInfo.grammar || [],
              dialogues: lessonInfo.dialogues || []
            }
          }
        }
      }),
      signal
    });
    if (!askRes.ok) {
      const err = await askRes.json().catch(() => ({}));
      throw Error(err.error || 'Chưa kết nối được dịch vụ AI.');
    }
    const providerHeader = askRes.headers.get('X-HSK-AI-Provider') || 'ai';
    const askData = await askRes.json();
    const parsed = extractJsonObject(askData?.answer);
    if (!parsed) throw Error('AI chưa trả định dạng JSON hợp lệ.');
    return { parsed, provider: providerHeader };
  }

  async function requestAiProfile(hsk, answers, { mode = 'profile', messages = [], lesson = null } = {}) {
    if (!isAiOnlineReady()) {
      return { profile: seedFromAnswers(hsk, answers), source: 'local' };
    }
    const account = window.HSKAccountDashboard.user;
    const endpoint = translationConfig.endpoint.replace(/\/translate$/, '/custom-lesson-profile');
    const controller = new AbortController();
    const stopLoading = window.HSKLoading?.showAI?.(
      mode === 'interview' ? 'Gia sư AI đang phân tích câu trả lời...' : 'AI đang thiết kế cấu trúc bài học...',
      {
        kind: 'study',
        detail: mode === 'interview'
          ? 'Đang cá nhân hóa câu hỏi và lộ trình theo nhu cầu của bạn...'
          : 'Đang xây dựng giáo án, tỉ trọng kỹ năng và các phiên học...',
        signal: controller.signal
      }
    );
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const token = await account.getIdToken();
      const payloadAnswers = answers.map(a => ({ id: a.id || 'turn', answer: String(a.answer || '').slice(0, 500) }));
      const payloadMessages = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        text: String(m.text || '').slice(0, 500)
      }));
      const reqBody = { hsk, answers: payloadAnswers };
      if (mode !== 'profile') reqBody.mode = mode;
      if (payloadMessages.length) reqBody.messages = payloadMessages;
      const compactLes = compactLessonPayload(lesson);
      if (compactLes) reqBody.lesson = compactLes;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(reqBody),
        signal: controller.signal
      });

      let data;
      let providerHeader = res.headers.get('X-HSK-AI-Provider') || '';
      if (res.status === 404) {
        const bridged = await bridgeViaLessonAsk(translationConfig.endpoint, token, reqBody, controller.signal);
        data = bridged.parsed;
        providerHeader = bridged.provider;
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.error || 'Chưa kết nối được dịch vụ AI.');
      } else {
        data = await res.json();
      }

      const provider = data?.aiSource?.provider || providerHeader || 'ai';
      const model = data?.aiSource?.model || '';

      if (mode === 'interview' && data?.ready === false && typeof data.replyVi === 'string') {
        return {
          ready: false,
          replyVi: data.replyVi,
          suggestedReplies: Array.isArray(data.suggestedReplies) ? data.suggestedReplies : [],
          source: 'ai',
          provider
        };
      }

      const rawProf = data?.profile || (data?.focusChoice ? data : null);
      if (!rawProf) throw Error('AI chưa trả hồ sơ hợp lệ.');
      return {
        ready: typeof data?.ready === 'boolean' ? data.ready : undefined,
        replyVi: data?.replyVi || rawProf.summaryVi,
        profile: C.createProfile({
          ...rawProf,
          hsk,
          aiGenerated: true,
          aiProvider: rawProf.aiProvider || provider,
          aiModel: rawProf.aiModel || model
        }),
        source: 'ai',
        provider
      };
    } catch (e) {
      return {
        profile: seedFromAnswers(hsk, answers),
        source: 'fallback',
        warning: e?.name === 'AbortError' ? 'AI phản hồi quá thời gian; bạn có thể bấm Thử gọi lại AI.' : (e?.message || '')
      };
    } finally {
      clearTimeout(timer);
      stopLoading?.();
    }
  }

  async function requestAiLessonDesign(profile, lesson, words, customPrompt = '') {
    if (!isAiOnlineReady() || !lesson) {
      return { ok: false, error: 'Hãy đăng nhập tài khoản và bật mạng để AI thật thiết kế giáo án bài học này.' };
    }
    const account = window.HSKAccountDashboard.user;
    const hsk = Number(profile?.hsk || lesson.id?.split('-')[1] || 1);
    const endpoint = translationConfig.endpoint.replace(/\/translate$/, '/custom-lesson-profile');
    const controller = new AbortController();
    const stopLoading = window.HSKLoading?.showAI?.(`AI đang thiết kế giáo án Bài ${lesson.number || 1}...`, {
      kind: 'study',
      detail: 'Đang đọc từ vựng, ngữ pháp bài học và biên soạn bài tập riêng cho bạn...',
      signal: controller.signal
    });
    const timer = setTimeout(() => controller.abort(), 95000);
    try {
      const token = await account.getIdToken();
      const scheduleSpec = C.extractCustomSchedule?.(profile, { customPrompt }) || null;
      const reqBody = {
        hsk,
        mode: 'design',
        customPrompt: String(customPrompt || '').trim().slice(0, 400),
        profile: {
          focusChoice: profile.focusChoice,
          minutes: profile.minutes,
          days: profile.days,
          style: scheduleSpec?.isMicro ? 'spare_time' : profile.style,
          goal: profile.goal,
          weights: profile.weights,
          summaryVi: profile.summaryVi,
          learnerContextVi: profile.learnerContextVi || '',
          scheduleTargets: scheduleSpec?.sessions?.map(s => `${s.labelPrefix} (${s.minutes} phút)`) || undefined
        },
        lesson: compactLessonPayload(lesson, words)
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(reqBody),
        signal: controller.signal
      });

      let data;
      let providerHeader = res.headers.get('X-HSK-AI-Provider') || '';
      if (res.status === 404) {
        const bridged = await bridgeViaLessonAsk(translationConfig.endpoint, token, reqBody, controller.signal);
        data = { lessonDesign: bridged.parsed, aiSource: { provider: bridged.provider } };
        providerHeader = bridged.provider;
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.error || 'AI chưa thiết kế được bài học này.');
      } else {
        data = await res.json();
      }

      const rawDesign = data?.lessonDesign || (Array.isArray(data?.sessions) ? data : null);
      if (!rawDesign || !Array.isArray(rawDesign.sessions) || !rawDesign.sessions.length) {
        throw Error('AI chưa trả giáo án hợp lệ cho bài học này.');
      }
      const provider = data?.aiSource?.provider || rawDesign.aiProvider || providerHeader || 'ai';
      const allowedWords = new Set((Array.isArray(words) ? words : []).map(word => typeof word === 'string' ? word : word?.han).filter(Boolean));
      const updatedProfile = C.saveLessonDesign(profile, lesson.id, {
        ...rawDesign,
        customPrompt: reqBody.customPrompt,
        aiProvider: provider,
        aiModel: data?.aiSource?.model || rawDesign.aiModel || ''
      }, Date.now(), allowedWords);
      if (!updatedProfile.aiLessonDesigns?.[lesson.id]?.sessions?.length) {
        throw Error('Giáo án AI thiếu nội dung hợp lệ; chưa lưu thay đổi. Hãy thử thiết kế lại.');
      }
      const savedProfile = saveProfile(updatedProfile);
      if (!savedProfile?.aiLessonDesigns?.[lesson.id]?.sessions?.length) {
        throw Error('Không lưu được giáo án AI vào hồ sơ học tập. Hãy thử lại sau.');
      }
      return { ok: true, profile: savedProfile, provider };
    } catch (e) {
      return {
        ok: false,
        error: e?.name === 'AbortError' ? 'AI thiết kế quá lâu. Hãy thử lại.' : (e?.message || 'Chưa kết nối được AI.')
      };
    } finally {
      clearTimeout(timer);
      stopLoading?.();
    }
  }

  function resetInterview(hsk) {
    interviewStep = 0;
    collectedAnswers = [];
    aiDynamicChips = null;
    interviewBusy = false;
    interviewStatus = '';
    formMode = false;
    draftProfile = null;
    const saved = getSavedProfile();
    sliderWeights = { ...(saved?.weights || C.FOCUS_PRESETS.balanced) };
    sliderMinutes = Number(saved?.minutes || window.HSKPlanner?.plan?.minutes || 30);
    sliderDays = Number(saved?.days || window.HSKPlanner?.plan?.days || 6);
    sliderStyle = C.STYLES.includes(saved?.style) ? saved.style : 'spare_time';
    sliderGoal = C.GOALS.includes(saved?.goal) ? saved.goal : 'conversation';
    interviewMode = saved?.aiGenerated && isAiOnlineReady() ? 'ai' : 'template';
    chatHistory = [
      {
        role: 'ai',
        text: `Chào bạn! Mình là Gia sư AI HSK ${hsk}. Hãy mô tả tự do cách bạn muốn học (ví dụ: "mình có 60p/ngày, sáng học ngắt quãng 5-10p, tối tập trung 30p, ưu tiên từ vựng") để mình tự thiết kế cấu trúc phiên & giáo án riêng cho bạn nhé!`
      }
    ];
  }

  function buildTemplateProfile(hsk) {
    return C.createProfile({
      hsk,
      focusChoice: C.inferFocusChoice(sliderWeights),
      weights: { ...sliderWeights },
      minutes: sliderMinutes,
      days: sliderDays,
      style: sliderStyle,
      goal: sliderGoal
    });
  }

  function renderPreviewBox(profile, lesson, { onApply, onCancel, onRetryAi } = {}) {
    const plan = C.buildLessonPlan(profile, lesson || { id: `standard-${profile.hsk}-01`, number: 1, vi: `Bài 1 · HSK ${profile.hsk}`, words: [] });
    const box = el('div', undefined, 'custom-preview-box');
    box.id = 'lessonCustomPreview';

    const topRow = el('div', undefined, 'custom-ai-architect-top');
    topRow.append(
      el('strong', `Lộ trình đề xuất · HSK ${profile.hsk}`),
      el(
        'span',
        profile.aiGenerated
          ? `✨ Thiết kế bởi AI thật (${formatProviderName(profile.aiProvider)})`
          : 'Thiết kế theo bộ lọc nhanh',
        'custom-ai-badge'
      )
    );
    box.append(topRow, el('p', profile.summaryVi));
    if (profile.learnerContextVi) {
      box.append(el('p', `💡 Ghi nhận từ AI: ${profile.learnerContextVi}`, 'custom-ai-coach-tip'));
    }

    const weightsRow = el('div', undefined, 'lesson-custom-weights');
    for (const skill of C.SKILLS) {
      const pill = el('span', undefined, 'lesson-custom-weight-pill');
      const strong = el('strong', `${profile.weights[skill]}%`);
      pill.append(document.createTextNode(`${C.SKILL_LABELS[skill]}: `), strong);
      weightsRow.append(pill);
    }
    box.append(weightsRow);

    const sessionsRow = el('div', undefined, 'overview-custom-sessions');
    for (const s of plan.sessions) {
      sessionsRow.append(el('span', `${s.label} (${s.steps.map(st => st.titleVi || st.skillLabel).join(' + ')})`));
    }
    box.append(sessionsRow, el('p', profile.followUpVi, 'hint'));

    const actions = el('div', undefined, 'lesson-custom-actions');
    const applyBtn = btn('Áp dụng bài học tùy chỉnh', () => onApply?.(profile), 'lesson-custom-primary');
    applyBtn.id = 'lessonCustomApplyBtn';
    actions.append(applyBtn);
    if (!profile.aiGenerated && onRetryAi && isAiOnlineReady()) {
      actions.append(btn('✨ Thử gọi lại AI thật', onRetryAi, 'lesson-custom-secondary'));
    }
    if (onCancel) {
      const cancelBtn = btn('Đóng', onCancel, 'lesson-custom-secondary');
      cancelBtn.id = 'lessonCustomCancelBtn';
      actions.append(cancelBtn);
    }
    box.append(actions);
    return box;
  }

  function renderInterviewPanel(container, { hsk, lesson, onApplied, onCancel }) {
    const panel = el('section', undefined, 'lesson-custom-interview');
    panel.id = 'lessonCustomInterview';
    panel.setAttribute('aria-label', 'Thiết kế bài học HSK tùy chỉnh');

    const rerender = () => {
      const live = document.getElementById('lessonCustomInterview') || panel;
      const fresh = renderInterviewPanel(container, { hsk, lesson, onApplied, onCancel });
      live.replaceWith(fresh);
    };

    const head = el('div', undefined, 'lesson-custom-interview-head');
    head.append(el('strong', 'Thiết kế cấu trúc bài học'));

    const modeTabs = el('div', undefined, 'custom-mode-switch');
    modeTabs.setAttribute('role', 'tablist');
    const templateTab = btn('Chỉnh theo mẫu', () => {
      interviewMode = 'template';
      draftProfile = null;
      rerender();
    }, 'custom-mode-btn');
    templateTab.id = 'lessonCustomModeTemplate';
    templateTab.setAttribute('role', 'tab');
    templateTab.setAttribute('aria-selected', interviewMode === 'template' ? 'true' : 'false');
    if (interviewMode === 'template') templateTab.setAttribute('aria-pressed', 'true');

    const aiTab = btn('✨ Chat với Gia sư AI', () => {
      interviewMode = 'ai';
      draftProfile = null;
      rerender();
    }, 'custom-mode-btn');
    aiTab.id = 'lessonCustomModeAi';
    aiTab.setAttribute('role', 'tab');
    aiTab.setAttribute('aria-selected', interviewMode === 'ai' ? 'true' : 'false');
    if (interviewMode === 'ai') aiTab.setAttribute('aria-pressed', 'true');

    modeTabs.append(templateTab, aiTab);
    head.append(modeTabs);
    panel.append(head);

    if (interviewStatus) {
      const statusEl = el('p', interviewStatus, 'hint');
      statusEl.setAttribute('role', 'status');
      panel.append(statusEl);
    }

    if (interviewMode === 'template') {
      if (draftProfile) {
        panel.append(
          renderPreviewBox(draftProfile, lesson, {
            onApply: onApplied,
            onCancel: () => {
              draftProfile = null;
              rerender();
            }
          })
        );
        return panel;
      }

      // 1. Live 5-skill weight card (100% locked sum)
      const weightCard = el('div', undefined, 'custom-slider-card');
      weightCard.id = 'lessonCustomWeightCard';
      const wTop = el('div', undefined, 'custom-single-slider-head');
      const totalBadge = el('span', 'Tổng: 100%', 'custom-slider-total');
      wTop.append(el('strong', 'Tỉ trọng 5 kỹ năng'), totalBadge);

      const bar = el('div', undefined, 'custom-weights-bar');
      const barSegs = {};
      const rangeInputs = {};
      const valLabels = {};
      for (const skill of C.SKILLS) {
        const seg = el('span', undefined, `custom-weight-seg is-${skill}`);
        seg.style.width = `${sliderWeights[skill]}%`;
        seg.title = `${C.SKILL_LABELS[skill]}: ${sliderWeights[skill]}%`;
        barSegs[skill] = seg;
        bar.append(seg);
      }

      const liveNoteEl = el('p', '', 'custom-live-summary');
      liveNoteEl.id = 'lessonCustomLiveSummary';
      const updateLiveNote = () => {
        const previewPlan = C.buildLessonPlan(buildTemplateProfile(hsk), lesson || { id: `standard-${hsk}-01`, number: 1, vi: `Bài 1`, words: [] });
        liveNoteEl.textContent = `Dự kiến ${previewPlan.sessions.length} phiên: ${previewPlan.sessions.map(s => `${s.minutes}p`).join(' · ')} · ${sliderDays} ngày/tuần (${previewPlan.styleLabel})`;
      };

      const syncWeightsDom = () => {
        let total = 0;
        for (const s of C.SKILLS) {
          const v = sliderWeights[s];
          total += v;
          rangeInputs[s].value = String(v);
          valLabels[s].textContent = `${v}%`;
          barSegs[s].style.width = `${v}%`;
          barSegs[s].title = `${C.SKILL_LABELS[s]}: ${v}%`;
        }
        totalBadge.textContent = `Tổng: ${total}%`;
        updateLiveNote();
      };

      const rows = el('div', undefined, 'custom-weight-sliders');
      for (const skill of C.SKILLS) {
        const row = el('label', undefined, 'custom-weight-slider-row');
        const name = el('span', C.SKILL_LABELS[skill], 'custom-weight-name');
        const range = document.createElement('input');
        range.type = 'range';
        range.min = '5';
        range.max = '70';
        range.step = '1';
        range.value = String(sliderWeights[skill]);
        range.dataset.skill = skill;
        range.setAttribute('aria-label', `${C.SKILL_LABELS[skill]} (%)`);
        const pct = el('strong', `${sliderWeights[skill]}%`, 'custom-weight-pct');
        range.oninput = () => {
          sliderWeights = C.rebalanceWeights(sliderWeights, skill, Number(range.value));
          syncWeightsDom();
        };
        rangeInputs[skill] = range;
        valLabels[skill] = pct;
        row.append(name, range, pct);
        rows.append(row);
      }
      const resetEqRow = el('div', undefined, 'custom-slider-foot');
      resetEqRow.append(btn('Đưa về cân bằng', () => {
        sliderWeights = { ...C.FOCUS_PRESETS.balanced };
        syncWeightsDom();
      }, 'lesson-custom-secondary custom-slider-reset'));
      weightCard.append(wTop, bar, rows, resetEqRow);

      // 2. Minutes & Days sliders in matching cards
      const timeGrid = el('div', undefined, 'custom-slider-grid');

      const minCard = el('div', undefined, 'custom-slider-card');
      minCard.id = 'lessonCustomMinutesCard';
      const minTop = el('div', undefined, 'custom-single-slider-head');
      const minValEl = el('strong', `${sliderMinutes} phút / ngày`, 'custom-slider-value');
      minValEl.id = 'lessonCustomMinutesValue';
      minTop.append(el('span', 'Thời gian mỗi ngày'), minValEl);
      const minRange = document.createElement('input');
      minRange.id = 'lessonCustomMinutesRange';
      minRange.type = 'range';
      minRange.min = '10';
      minRange.max = '180';
      minRange.step = '5';
      minRange.value = String(sliderMinutes);
      minRange.setAttribute('aria-label', 'Số phút học mỗi ngày');
      const minTicks = el('div', undefined, 'custom-slider-ticks');
      for (const m of [10, 50, 95, 140, 180]) minTicks.append(el('span', `${m}p`));
      minRange.oninput = () => {
        sliderMinutes = Number(minRange.value);
        minValEl.textContent = `${sliderMinutes} phút / ngày`;
        updateLiveNote();
      };
      minCard.append(minTop, minRange, minTicks);

      const daysCard = el('div', undefined, 'custom-slider-card');
      daysCard.id = 'lessonCustomDaysCard';
      const daysTop = el('div', undefined, 'custom-single-slider-head');
      const daysValEl = el('strong', `${sliderDays} ngày / tuần`, 'custom-slider-value');
      daysValEl.id = 'lessonCustomDaysValue';
      daysTop.append(el('span', 'Tần suất hàng tuần'), daysValEl);
      const daysRange = document.createElement('input');
      daysRange.id = 'lessonCustomDaysRange';
      daysRange.type = 'range';
      daysRange.min = '3';
      daysRange.max = '7';
      daysRange.step = '1';
      daysRange.value = String(sliderDays);
      daysRange.setAttribute('aria-label', 'Số ngày học mỗi tuần');
      const daysTicks = el('div', undefined, 'custom-slider-ticks');
      for (const d of [3, 4, 5, 6, 7]) daysTicks.append(el('span', `${d} ngày`));
      daysRange.oninput = () => {
        sliderDays = Number(daysRange.value);
        daysValEl.textContent = `${sliderDays} ngày / tuần`;
        updateLiveNote();
      };
      daysCard.append(daysTop, daysRange, daysTicks);
      timeGrid.append(minCard, daysCard);

      // 3. Style & Goal discrete slider cards (100% matching the slider card aesthetic)
      const styleOptions = C.INTERVIEW_STEPS.find(s => s.id === 'style')?.options || [];
      const styleCard = el('div', undefined, 'custom-slider-card');
      styleCard.id = 'lessonCustomStyleCard';
      const styleTop = el('div', undefined, 'custom-single-slider-head');
      const curStyleOpt = styleOptions.find(o => o.value === sliderStyle) || styleOptions[0];
      const styleValEl = el('strong', curStyleOpt?.shortLabel || curStyleOpt?.label || '', 'custom-slider-value');
      styleValEl.id = 'lessonCustomStyleValue';
      styleTop.append(el('span', 'Nhịp học phù hợp'), styleValEl);
      const styleRange = document.createElement('input');
      styleRange.id = 'lessonCustomStyleRange';
      styleRange.type = 'range';
      styleRange.min = '0';
      styleRange.max = String(Math.max(0, styleOptions.length - 1));
      styleRange.step = '1';
      styleRange.value = String(Math.max(0, styleOptions.findIndex(o => o.value === sliderStyle)));
      styleRange.setAttribute('aria-label', 'Nhịp học phù hợp');
      const styleStopLabels = ['5–10p', '1 mạch', 'Rảnh tay', 'Trước ngủ', 'Cuối tuần'];
      const styleStops = el('div', undefined, 'custom-slider-stops is-5');
      const styleStopBtns = [];
      const syncStyle = idx => {
        const opt = styleOptions[idx] || styleOptions[0];
        if (!opt) return;
        sliderStyle = opt.value;
        styleRange.value = String(idx);
        styleValEl.textContent = opt.shortLabel || opt.label;
        styleStopBtns.forEach((b, bIdx) => b.classList.toggle('is-active', bIdx === idx));
        updateLiveNote();
      };
      styleOptions.forEach((opt, idx) => {
        const stopBtn = el('button', styleStopLabels[idx] || opt.shortLabel || opt.label, 'custom-slider-stop-btn');
        stopBtn.type = 'button';
        stopBtn.title = opt.label;
        stopBtn.dataset.value = opt.value;
        if (opt.value === sliderStyle) stopBtn.classList.add('is-active');
        stopBtn.onclick = () => syncStyle(idx);
        styleStopBtns.push(stopBtn);
        styleStops.append(stopBtn);
      });
      styleRange.oninput = () => syncStyle(Number(styleRange.value));
      styleCard.append(styleTop, styleRange, styleStops);

      const goalOptions = C.INTERVIEW_STEPS.find(s => s.id === 'goal')?.options || [];
      const goalCard = el('div', undefined, 'custom-slider-card');
      goalCard.id = 'lessonCustomGoalCard';
      const goalTop = el('div', undefined, 'custom-single-slider-head');
      const curGoalOpt = goalOptions.find(o => o.value === sliderGoal) || goalOptions[0];
      const goalValEl = el('strong', curGoalOpt?.shortLabel || curGoalOpt?.label || '', 'custom-slider-value');
      goalValEl.id = 'lessonCustomGoalValue';
      goalTop.append(el('span', 'Mục tiêu ưu tiên'), goalValEl);
      const goalRange = document.createElement('input');
      goalRange.id = 'lessonCustomGoalRange';
      goalRange.type = 'range';
      goalRange.min = '0';
      goalRange.max = String(Math.max(0, goalOptions.length - 1));
      goalRange.step = '1';
      goalRange.value = String(Math.max(0, goalOptions.findIndex(o => o.value === sliderGoal)));
      goalRange.setAttribute('aria-label', 'Mục tiêu ưu tiên');
      const goalStopLabels = ['Thi HSK', 'Giao tiếp', 'Đọc hiểu', 'Công việc'];
      const goalStops = el('div', undefined, 'custom-slider-stops is-4');
      const goalStopBtns = [];
      const syncGoal = idx => {
        const opt = goalOptions[idx] || goalOptions[0];
        if (!opt) return;
        sliderGoal = opt.value;
        goalRange.value = String(idx);
        goalValEl.textContent = opt.shortLabel || opt.label;
        goalStopBtns.forEach((b, bIdx) => b.classList.toggle('is-active', bIdx === idx));
      };
      goalOptions.forEach((opt, idx) => {
        const stopBtn = el('button', goalStopLabels[idx] || opt.shortLabel || opt.label, 'custom-slider-stop-btn');
        stopBtn.type = 'button';
        stopBtn.title = opt.label;
        stopBtn.dataset.value = opt.value;
        if (opt.value === sliderGoal) stopBtn.classList.add('is-active');
        stopBtn.onclick = () => syncGoal(idx);
        goalStopBtns.push(stopBtn);
        goalStops.append(stopBtn);
      });
      goalRange.oninput = () => syncGoal(Number(goalRange.value));
      goalCard.append(goalTop, goalRange, goalStops);

      const styleGoalGrid = el('div', undefined, 'custom-slider-grid');
      styleGoalGrid.append(styleCard, goalCard);

      updateLiveNote();
      const footActions = el('div', undefined, 'lesson-custom-actions');
      const applyTemplateBtn = btn('Áp dụng bài học tùy chỉnh', () => {
        onApplied?.(buildTemplateProfile(hsk));
      }, 'lesson-custom-primary');
      applyTemplateBtn.id = 'lessonCustomApplyBtn';
      const previewTemplateBtn = btn('Xem chi tiết lộ trình', () => {
        draftProfile = buildTemplateProfile(hsk);
        rerender();
      }, 'lesson-custom-secondary');
      previewTemplateBtn.id = 'lessonCustomPreviewBtn';
      footActions.append(applyTemplateBtn, previewTemplateBtn);
      if (onCancel) {
        const cancelBtn = btn('Đóng', onCancel, 'lesson-custom-secondary');
        cancelBtn.id = 'lessonCustomCancelBtn';
        footActions.append(cancelBtn);
      }

      panel.append(weightCard, timeGrid, styleGoalGrid, liveNoteEl, footActions);
      return panel;
    }

    // Real AI conversational design mode (no fake chat for template controls)
    const aiReady = isAiOnlineReady();
    panel.append(
      el(
        'p',
        aiReady
          ? '✨ Gia sư AI trực tuyến đã sẵn sàng — hãy mô tả tự do cách bạn muốn học (thời gian, nhịp chia phiên, trọng tâm…) để AI thiết kế riêng.'
          : '⚠️ Bạn đang ở chế độ ngoại tuyến / chưa đăng nhập — hãy đăng nhập để chat với AI, hoặc chuyển sang tab Chỉnh theo mẫu.',
        'hint'
      )
    );

    const log = el('div', undefined, 'custom-chat-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    for (const msg of chatHistory) {
      const b = el('div', msg.text, 'custom-chat-bubble ' + (msg.role === 'user' ? 'is-user' : 'is-ai'));
      log.append(b);
    }
    panel.append(log);

    const finalizeWithAi = async () => {
      interviewBusy = true;
      interviewStatus = '✨ AI đang phân tích và thiết kế cấu trúc bài học riêng cho bạn...';
      rerender();
      const result = await requestAiProfile(hsk, collectedAnswers, {
        mode: 'profile',
        messages: chatHistory,
        lesson
      });
      interviewBusy = false;
      draftProfile = result.profile;
      interviewStatus = result.source === 'ai'
        ? `✨ AI (${formatProviderName(result.provider)}) đã thiết kế xong lộ trình bài học cho bạn.`
        : (result.warning ? `⚠️ ${result.warning}` : 'Đã tạo cấu trúc bài học từ mô tả của bạn.');
      chatHistory.push({ role: 'ai', text: result.replyVi || draftProfile.summaryVi });
      rerender();
    };

    const submitAiChat = async displayLabel => {
      if (interviewBusy) return;
      const text = String(displayLabel || '').trim();
      if (!text) return;
      chatHistory.push({ role: 'user', text });
      collectedAnswers.push({ id: 'freeform', answer: text });

      if (!aiReady) {
        await finalizeWithAi();
        return;
      }

      interviewBusy = true;
      interviewStatus = '✨ Gia sư AI đang đọc yêu cầu của bạn...';
      rerender();
      const turnRes = await requestAiProfile(hsk, collectedAnswers, {
        mode: 'interview',
        messages: chatHistory,
        lesson
      });
      interviewBusy = false;
      if (turnRes.ready === false && turnRes.replyVi) {
        interviewStatus = `✨ Gia sư AI (${formatProviderName(turnRes.provider)}) đang hỏi thêm thông tin...`;
        chatHistory.push({ role: 'ai', text: turnRes.replyVi });
        aiDynamicChips = turnRes.suggestedReplies?.length ? turnRes.suggestedReplies : null;
        rerender();
        return;
      }
      if (turnRes.profile) {
        draftProfile = turnRes.profile;
        interviewStatus = turnRes.source === 'ai'
          ? `✨ AI (${formatProviderName(turnRes.provider)}) đã thiết kế xong lộ trình bài học từ mô tả của bạn.`
          : `⚠️ ${turnRes.warning || 'AI chưa phản hồi; đã tạo bản nháp để bạn không mất nội dung.'}`;
        chatHistory.push({ role: 'ai', text: turnRes.replyVi || draftProfile.summaryVi });
        rerender();
        return;
      }
      await finalizeWithAi();
    };

    if (!draftProfile) {
      if (Array.isArray(aiDynamicChips) && aiDynamicChips.length) {
        const chips = el('div', undefined, 'custom-chip-list custom-chip-row-compact');
        for (const label of aiDynamicChips) {
          chips.append(btn(label, () => submitAiChat(label), 'custom-chip'));
        }
        panel.append(chips);
      }

      const compose = el('form', undefined, 'custom-chat-compose');
      const input = document.createElement('input');
      input.id = 'lessonCustomChatInput';
      input.type = 'text';
      input.maxLength = 400;
      input.placeholder = aiReady
        ? 'Mô tả tự do cho AI (VD: 60p/ngày, sáng tranh thủ 5-10p, tối 30p, 60% từ vựng)…'
        : 'Đăng nhập và bật mạng để sử dụng chat AI…';
      input.disabled = interviewBusy || !aiReady;
      const sendBtn = el('button', interviewBusy ? 'AI đang xử lý…' : 'Gửi cho AI', 'lesson-custom-primary');
      sendBtn.id = 'lessonCustomChatSend';
      sendBtn.type = 'submit';
      sendBtn.disabled = interviewBusy || !aiReady;
      compose.onsubmit = e => {
        e.preventDefault();
        const val = input.value.trim();
        if (val) submitAiChat(val);
      };
      compose.append(input, sendBtn);
      panel.append(compose);

      const quickActions = el('div', undefined, 'lesson-custom-actions');
      if (collectedAnswers.length > 0 && aiReady) {
        const earlyBtn = btn('✨ Tạo lộ trình ngay từ mô tả trên', finalizeWithAi, 'lesson-custom-secondary');
        earlyBtn.id = 'lessonCustomEarlyAiBtn';
        quickActions.append(earlyBtn);
      }
      if (onCancel) quickActions.append(btn('Đóng', onCancel, 'lesson-custom-secondary'));
      panel.append(quickActions);
    } else {
      panel.append(
        renderPreviewBox(draftProfile, lesson, {
          onApply: onApplied,
          onCancel,
          onRetryAi: finalizeWithAi
        })
      );
    }

    return panel;
  }

  function renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner }) {
    if (!container) return;
    container.replaceChildren();
    const profile = getSavedProfile();
    const box = el('section', undefined, 'lesson-custom-banner');
    box.id = 'lessonCustomBanner';
    box.setAttribute('aria-label', 'Bài học HSK tùy chỉnh');

    const effectiveProfile = profile ? C.createProfile({ ...profile, hsk }) : null;
    const plan = effectiveProfile ? C.buildLessonPlan(effectiveProfile, lesson, progressRecord) : null;

    const eyebrowRow = el('div', undefined, 'lesson-custom-eyebrow-row');
    const eyebrowText = effectiveProfile?.aiGenerated
      ? `Tùy chỉnh · ✨ ${effectiveProfile.aiProvider && effectiveProfile.aiProvider !== 'custom' ? formatProviderName(effectiveProfile.aiProvider) : 'AI'}`
      : 'Bài học tùy chỉnh (AI)';
    eyebrowRow.append(el('p', eyebrowText, 'lesson-eyebrow'));

    if (plan) {
      const toggleBtn = btn(
        bannerDetailsOpen ? 'Thu gọn ▴' : `Chi tiết (${plan.sessions.length} phiên) ▾`,
        () => {
          bannerDetailsOpen = !bannerDetailsOpen;
          renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner });
        },
        'lesson-custom-secondary lesson-custom-toggle-btn'
      );
      toggleBtn.id = 'lessonCustomDetailsToggle';
      toggleBtn.setAttribute('aria-expanded', bannerDetailsOpen ? 'true' : 'false');
      toggleBtn.setAttribute('aria-controls', 'lessonCustomDetailsBody');
      eyebrowRow.append(toggleBtn);
    }

    const head = el('div', undefined, 'lesson-custom-head');
    const copy = el('div', undefined, 'lesson-custom-head-copy');
    copy.append(
      eyebrowRow,
      el('h3', effectiveProfile ? `Cách học riêng · HSK ${hsk}` : 'Học HSK theo thời gian và kiểu bạn muốn')
    );

    if (plan) {
      copy.append(
        el(
          'p',
          `${plan.totalMinutes} phút/ngày · ${plan.styleLabel} · ${plan.goalLabel} · ${plan.completedSteps}/${plan.totalSteps} bước`,
          'lesson-custom-meta'
        )
      );
      head.append(copy);
      box.append(head);

      const details = el('div', undefined, 'lesson-custom-details');
      details.id = 'lessonCustomDetailsBody';
      details.hidden = !bannerDetailsOpen;

      if (effectiveProfile?.summaryVi) {
        details.append(el('p', effectiveProfile.summaryVi, 'hint'));
      }
      const weightsRow = el('div', undefined, 'lesson-custom-weights');
      for (const s of C.SKILLS) {
        const pill = el('span', undefined, 'lesson-custom-weight-pill');
        pill.append(document.createTextNode(`${C.SKILL_LABELS[s]} `), el('strong', `${plan.weights[s]}%`));
        weightsRow.append(pill);
      }
      const sessionsPreview = el('div', undefined, 'overview-custom-sessions');
      for (const sess of plan.sessions) {
        sessionsPreview.append(el('span', `${sess.completed ? '✓ ' : ''}${sess.label}`));
      }
      details.append(weightsRow, sessionsPreview);
      box.append(details);
    } else {
      copy.append(
        el(
          'p',
          'Trò chuyện ngắn với Gia sư AI về kỹ năng ưu tiên, số phút mỗi ngày và nhịp học để AI thiết kế giáo án riêng.',
          'hint'
        )
      );
      head.append(copy);
      box.append(head);
    }

    const actions = el('div', undefined, 'lesson-custom-actions');
    if (plan) {
      const startBtn = btn('Vào bài học tùy chỉnh', () => onOpenRunner?.(lesson), 'lesson-custom-primary');
      startBtn.id = 'lessonCustomStartSession';
      const editBtn = btn('Thiết kế lại với AI', () => {
        interviewOpen = true;
        formMode = false;
        resetInterview(hsk);
        renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner });
      }, 'lesson-custom-secondary');
      editBtn.id = 'lessonCustomEditBtn';
      const resetBtn = btn('Đặt lại', () => {
        window.HSKStudyStore?.saveCustomLesson?.(null);
        interviewOpen = false;
        draftProfile = null;
        renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner });
      }, 'lesson-custom-secondary');
      resetBtn.id = 'lessonCustomResetBtn';
      actions.append(startBtn, editBtn, resetBtn);
    } else {
      const openBtn = btn('Thiết kế bài học theo cách của tôi', () => {
        interviewOpen = !interviewOpen;
        if (interviewOpen) {
          formMode = false;
          resetInterview(hsk);
        }
        renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner });
      }, 'lesson-custom-primary');
      openBtn.id = 'lessonCustomOpenInterview';
      actions.append(openBtn);
    }
    box.append(actions);

    if (interviewOpen) {
      box.append(
        renderInterviewPanel(box, {
          hsk,
          lesson,
          onApplied: nextProfile => {
            saveProfile(nextProfile);
            interviewOpen = false;
            draftProfile = null;
            renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner });
          },
          onCancel: () => {
            interviewOpen = false;
            draftProfile = null;
            renderCatalogBanner(container, { hsk, lesson, progressRecord, onOpenRunner });
          }
        })
      );
    }

    container.append(box);
  }

  function renderHomeCard(container) {
    if (!container) return;
    container.replaceChildren();
    const profile = getSavedProfile();
    const targetHsk = Number(profile?.hsk || window.HSKPlanner?.plan?.target || 1);
    const plan = profile ? C.buildLessonPlan(profile, { id: `standard-${targetHsk}-01`, number: 1, vi: `HSK ${targetHsk}`, words: [] }) : null;

    const head = el('div', undefined, 'lesson-custom-head');
    const copy = el('div', undefined, 'lesson-custom-head-copy');
    copy.append(
      el('h3', plan ? `Bài học của tôi hôm nay · HSK ${targetHsk}` : 'Bài học của tôi hôm nay'),
      el(
        'p',
        plan
          ? `${plan.totalMinutes} phút/ngày · ${plan.styleLabel}${plan.aiDesigned ? ' · ✨ AI' : ''}`
          : 'Để AI hỏi nhanh vài câu rồi tự thiết kế lại giáo án & bài tập HSK đúng kiểu của bạn.',
        'hint'
      )
    );
    head.append(copy);
    if (plan && plan.sessions.length > 2) {
      const homeToggle = btn(
        homeSessionsOpen ? 'Thu gọn ▴' : `${plan.sessions.length} phiên ▾`,
        () => {
          homeSessionsOpen = !homeSessionsOpen;
          renderHomeCard(container);
        },
        'lesson-custom-secondary lesson-custom-toggle-btn'
      );
      homeToggle.id = 'homeCustomSessionsToggle';
      homeToggle.setAttribute('aria-expanded', homeSessionsOpen ? 'true' : 'false');
      head.append(homeToggle);
    }
    container.append(head);

    if (plan && (plan.sessions.length <= 2 || homeSessionsOpen)) {
      const row = el('div', undefined, 'overview-custom-sessions');
      for (const s of plan.sessions) {
        row.append(el('span', `${s.completed ? '✓ ' : ''}${s.label}`));
      }
      container.append(row);
    }

    const actions = el('div', undefined, 'overview-custom-actions');
    const mainBtn = btn(
      plan ? 'Học phiên tiếp theo →' : 'Thiết kế lộ trình riêng →',
      () => {
        if (!plan) {
          interviewOpen = true;
          formMode = false;
          resetInterview(targetHsk);
          window.HSKLessonNav?.openCustomInterview?.(targetHsk);
        } else {
          window.HSKLessonNav?.openCustom?.(targetHsk);
        }
      },
      'lesson-custom-primary'
    );
    mainBtn.id = 'homeCustomAction';
    actions.append(mainBtn);
    if (plan) {
      const editBtn = btn('Thiết kế lại', () => {
        interviewOpen = true;
        formMode = false;
        resetInterview(targetHsk);
        window.HSKLessonNav?.openCustomInterview?.(targetHsk);
      }, 'lesson-custom-secondary');
      editBtn.id = 'homeCustomEdit';
      actions.append(editBtn);
    }
    container.append(actions);
  }

  function renderAiDrillsBlock(stageEl, drills, onDone) {
    const wrap = el('div', undefined, 'custom-ai-drill-list');
    wrap.append(el('h4', `✨ Bài tập thực hành do AI thiết kế riêng (${drills.length} câu)`));
    let answeredCount = 0;
    let correctCount = 0;
    const doneBtn = onDone ? btn('Hoàn thành bài tập AI', onDone, 'lesson-custom-primary') : null;
    if (doneBtn) doneBtn.disabled = true;
    const scoreEl = el('p', `Tiến độ: 0/${drills.length} câu`, 'hint');
    wrap.append(scoreEl);

    drills.forEach((d, qIdx) => {
      const card = el('article', undefined, 'custom-ai-drill-card');
      card.append(el('strong', `Câu ${qIdx + 1}: ${d.promptVi}`));
      if (d.questionCn) {
        const cnRow = el('p', d.questionCn, 'lesson-han');
        card.append(cnRow);
        if (window.HSKSpeech) card.append(window.HSKSpeech.button(d.questionCn, 'Nghe câu'));
      }
      const optsGrid = el('div', undefined, 'custom-ai-drill-options');
      const explainEl = el('p', '', 'custom-ai-coach-tip');
      explainEl.hidden = true;
      let locked = false;

      d.options.forEach((optText, oIdx) => {
        const optBtn = btn(optText, () => {
          if (locked) return;
          locked = true;
          answeredCount++;
          const isRight = oIdx === d.answerIndex;
          if (isRight) correctCount++;
          optBtn.classList.add(isRight ? 'is-correct' : 'is-wrong');
          const allBtns = optsGrid.querySelectorAll('button');
          if (allBtns[d.answerIndex]) allBtns[d.answerIndex].classList.add('is-correct');
          allBtns.forEach(button => { button.disabled = true; });
          if (doneBtn) doneBtn.disabled = answeredCount < drills.length;
          explainEl.textContent = `${isRight ? '✓ Chính xác!' : '✗ Chưa đúng.'} ${d.explanationVi || ''}`;
          explainEl.hidden = false;
          scoreEl.textContent = `Tiến độ: ${answeredCount}/${drills.length} câu · Đúng ${correctCount}/${answeredCount}`;
        }, 'custom-ai-drill-opt');
        optsGrid.append(optBtn);
      });

      card.append(optsGrid, explainEl);
      wrap.append(card);
    });

    if (doneBtn) wrap.append(doneBtn);
    stageEl.append(wrap);
  }

  function renderAiScenarioBlock(stageEl, scenario, onDone) {
    const box = el('div', undefined, 'custom-ai-scenario-box');
    box.append(
      el('h4', '✨ Tình huống ứng dụng thực tế do AI thiết kế'),
      el('p', `Ngữ cảnh: ${scenario.contextVi}`),
      el('strong', `Thử thách của bạn: ${scenario.promptVi}`)
    );
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-ai-scenario-input';
    input.placeholder = 'Gõ câu tiếng Trung của bạn vào đây để tự luyện trước khi xem đáp án mẫu…';
    box.append(input);

    const sampleWrap = el('div', undefined, 'custom-ai-coach-tip');
    sampleWrap.hidden = true;
    sampleWrap.append(
      el('strong', `Câu mẫu AI gợi ý: ${scenario.sampleCn || ''}`),
      el('p', `${scenario.samplePin || ''} — ${scenario.sampleVi || ''}`)
    );
    if (scenario.sampleCn && window.HSKSpeech) {
      sampleWrap.append(window.HSKSpeech.button(scenario.sampleCn, 'Nghe câu mẫu'));
    }

    const actions = el('div', undefined, 'lesson-custom-actions');
    actions.append(
      btn('Xem câu trả lời mẫu của AI', () => { sampleWrap.hidden = !sampleWrap.hidden; }, 'lesson-custom-secondary')
    );
    if (onDone) {
      const doneBtn = btn('Hoàn thành tình huống này', onDone, 'lesson-custom-primary');
      const spokenBtn = btn('Tôi đã tự trả lời bằng lời nói', () => {
        doneBtn.disabled = false;
        spokenBtn.disabled = true;
        spokenBtn.textContent = 'Đã xác nhận luyện nói';
      }, 'lesson-custom-secondary');
      doneBtn.disabled = true;
      input.addEventListener('input', () => { doneBtn.disabled = !input.value.trim(); });
      actions.append(spokenBtn, doneBtn);
    }
    box.append(sampleWrap, actions);
    stageEl.append(box);
  }

  function renderInlineStepStage(stageEl, step, lesson, words, hooks, onDone) {
    stageEl.replaceChildren();
    if (step.coachTipVi) {
      stageEl.append(el('div', `💡 Gia sư AI hướng dẫn: ${step.coachTipVi}`, 'custom-ai-coach-tip'));
    }

    // 1. AI-authored interactive drills step
    if (step.action === 'ai_drill' && Array.isArray(step.drills) && step.drills.length) {
      renderAiDrillsBlock(stageEl, step.drills, () => { hooks.markRead?.(); onDone(); });
      return;
    }

    // 2. AI-authored scenario step
    if (step.action === 'ai_scenario' && step.scenario) {
      renderAiScenarioBlock(stageEl, step.scenario, () => { hooks.markRead?.(); onDone(); });
      return;
    }

    // 3. AI-curated vocabulary coach OR standard vocab cards
    if (step.action === 'ai_vocab_coach' || step.action === 'vocab_cards') {
      const aiFocus = Array.isArray(step.focusWords) && step.focusWords.length ? step.focusWords : null;
      const offset = Number(step.wordOffset) > 0 ? Number(step.wordOffset) : 0;
      const slice = aiFocus || words.slice(offset, offset + (step.wordLimit || 8));
      if (!slice.length) {
        stageEl.append(el('p', 'Chưa có từ vựng trong bài này.'), btn('Đánh dấu xong', onDone, 'lesson-custom-primary'));
        return;
      }
      let idx = 0;
      let revealed = Boolean(aiFocus);
      const drawCard = () => {
        stageEl.replaceChildren();
        if (step.coachTipVi) {
          stageEl.append(el('div', `💡 Gia sư AI hướng dẫn: ${step.coachTipVi}`, 'custom-ai-coach-tip'));
        }
        const w = slice[idx];
        const card = el('div', undefined, 'custom-ai-vocab-card');
        card.append(
          el('p', `Từ ${idx + 1} / ${slice.length} · ${step.titleVi}${aiFocus ? ' (✨ AI chọn lọc & viết mẹo nhớ)' : ''}`, 'hint'),
          el('h4', w.han, 'lesson-han')
        );
        if (window.HSKSpeech) card.append(window.HSKSpeech.button(w.han, 'Nghe ' + w.han));
        if (revealed) {
          card.append(el('p', w.pin || '', 'lesson-pinyin'), el('p', w.mean || '', 'lesson-meaning'));
          if (w.mnemonicVi) {
            card.append(el('p', `🧠 Mẹo nhớ AI: ${w.mnemonicVi}`, 'custom-ai-coach-tip'));
          }
          if (w.exampleCn) {
            const exBox = el('div', undefined, 'custom-ai-coach-tip');
            exBox.append(
              el('strong', `💬 Ví dụ ứng dụng: ${w.exampleCn}`),
              el('p', `${w.examplePin || ''} — ${w.exampleVi || ''}`)
            );
            if (window.HSKSpeech) exBox.append(window.HSKSpeech.button(w.exampleCn, 'Nghe ví dụ'));
            card.append(exBox);
          }
        }
        const row = el('div', undefined, 'lesson-custom-actions');
        row.append(
          btn(revealed ? 'Ẩn chi tiết' : 'Hiện pinyin, nghĩa & mẹo nhớ AI', () => { revealed = !revealed; drawCard(); }, 'lesson-custom-secondary'),
          btn('Từ tiếp theo →', () => { idx = (idx + 1) % slice.length; revealed = Boolean(aiFocus); drawCard(); }, 'lesson-custom-secondary'),
          btn('Hoàn thành bước từ vựng', () => { hooks.markRead?.(); onDone(); }, 'lesson-custom-primary')
        );
        card.append(row);
        stageEl.append(card);

        if (Array.isArray(step.drills) && step.drills.length) {
          renderAiDrillsBlock(stageEl, step.drills, null);
        }
      };
      drawCard();
      return;
    }

    if (step.action === 'grammar_focus') {
      const list = (lesson.content?.grammar || []).slice(0, step.grammarLimit || 2);
      stageEl.append(el('h4', step.titleVi));
      for (const g of list) {
        const box = el('article', undefined, 'lesson-grammar-point');
        box.append(el('strong', g.title), el('p', g.pattern, 'lesson-pattern'), el('p', g.usage));
        for (const ex of (g.examples || []).slice(0, 2)) {
          const line = el('p', `${ex.cn} — ${ex.pin} — ${ex.vi}`);
          box.append(line);
          if (window.HSKSpeech) box.append(window.HSKSpeech.button(ex.cn, 'Nghe ví dụ'));
        }
        if (g.error) box.append(el('p', 'Lưu ý: ' + g.error, 'lesson-error-note'));
        stageEl.append(box);
      }
      if (step.scenario) {
        renderAiScenarioBlock(stageEl, step.scenario, null);
      }
      if (Array.isArray(step.drills) && step.drills.length) {
        renderAiDrillsBlock(stageEl, step.drills, null);
      }
      if (!list.length && !step.scenario && (!step.drills || !step.drills.length)) {
        stageEl.append(el('p', 'Bài này chưa có mục ngữ pháp chi tiết. Hãy bấm "Nhờ AI thiết kế giáo án bài này" ở trên để AI tạo bài tập ngữ pháp riêng cho bạn.'));
      }
      stageEl.append(btn('Hoàn thành bước ngữ pháp', onDone, 'lesson-custom-primary'));
      return;
    }

    if (step.action === 'reading_dialogue' || step.action === 'passive_listen') {
      const d = lesson.content?.dialogues?.[0];
      const rLines = lesson.content?.reading?.lines || [];
      const lines = (d?.lines?.length ? d.lines : rLines).slice(0, 8);
      stageEl.append(el('h4', step.titleVi));
      if (lines.length) {
        if (window.HSKSpeech) {
          stageEl.append(window.HSKSpeech.button(lines.map(x => x.cn), 'Nghe toàn đoạn', true));
        }
        for (const x of lines) {
          const p = el('p', (x.speaker ? x.speaker + ': ' : '') + x.cn);
          stageEl.append(p, el('small', `${x.pin} · ${x.vi}`, 'hint'));
        }
      }
      if (step.scenario) {
        renderAiScenarioBlock(stageEl, step.scenario, null);
      }
      if (Array.isArray(step.drills) && step.drills.length) {
        renderAiDrillsBlock(stageEl, step.drills, null);
      }
      stageEl.append(btn('Hoàn thành bước nghe & đọc', () => { hooks.markRead?.(); onDone(); }, 'lesson-custom-primary'));
      return;
    }

    if (Array.isArray(step.drills) && step.drills.length) {
      renderAiDrillsBlock(stageEl, step.drills, onDone);
      return;
    }
    if (step.scenario) {
      renderAiScenarioBlock(stageEl, step.scenario, onDone);
      return;
    }

    stageEl.append(btn('Hoàn thành bước này', onDone, 'lesson-custom-primary'));
  }

  function mountLessonRunner(rootEl, lesson, words, hooks) {
    if (!rootEl || !lesson) return;
    const hsk = Number(lesson.id?.split('-')[1] || 1);
    let profile = getSavedProfile();
    if (!profile) {
      interviewOpen = true;
      resetInterview(hsk);
      const wrap = el('section', undefined, 'lesson-custom-runner');
      wrap.append(
        btn('← Quay về bài học', () => hooks.exit?.(), 'lesson-back'),
        el('h3', 'Thiết kế cách học riêng cho bạn'),
        renderInterviewPanel(wrap, {
          hsk,
          lesson,
          onApplied: next => {
            saveProfile(next);
            interviewOpen = false;
            draftProfile = null;
            mountLessonRunner(rootEl, lesson, words, hooks);
          },
          onCancel: () => hooks.exit?.()
        })
      );
      rootEl.replaceChildren(wrap);
      return;
    }

    profile = C.createProfile({ ...profile, hsk });
    const progressRecord = hooks.progress?.() || {};
    const plan = C.buildLessonPlan(profile, lesson, progressRecord);
    if (activeSessionIndex >= plan.sessions.length) activeSessionIndex = 0;

    const wrap = el('section', undefined, 'lesson-custom-runner');
    wrap.id = 'lessonCustomRunner';

    const topNav = el('div', undefined, 'lesson-custom-actions');
    topNav.append(
      btn('← Quay về bài học', () => hooks.exit?.(), 'lesson-back'),
      btn('Đổi cấu trúc bài học', () => {
        interviewOpen = !interviewOpen;
        if (interviewOpen) resetInterview(hsk);
        mountLessonRunner(rootEl, lesson, words, hooks);
      }, 'lesson-custom-secondary')
    );
    wrap.append(topNav);

    const head = el('div', undefined, 'lesson-custom-head');
    const headCopy = el('div');
    headCopy.append(
      el('p', `Học theo cách của tôi · Bài ${lesson.number}`, 'lesson-eyebrow'),
      el('h3', lesson.vi || lesson.title),
      el('p', `${plan.totalMinutes} phút/ngày · ${plan.styleLabel} · Đã xong ${plan.completedSteps}/${plan.totalSteps} bước`, 'hint')
    );
    head.append(headCopy);
    wrap.append(head);

    // Real AI Lesson Architect Box
    const aiBox = el('section', undefined, 'custom-ai-architect');
    aiBox.id = 'lessonCustomAiArchitect';
    const aiTop = el('div', undefined, 'custom-ai-architect-top');
    aiTop.append(
      el(
        'strong',
        plan.hasLessonAiDesign
          ? `✨ Giáo án Bài ${lesson.number} do AI thật thiết kế riêng`
          : '✨ Kiến trúc sư AI cho bài học này'
      ),
      el(
        'span',
        plan.hasLessonAiDesign
          ? `AI · ${formatProviderName(plan.aiProvider)}`
          : (plan.aiDesigned ? `Lộ trình AI · ${formatProviderName(plan.aiProvider)}` : 'Chưa chạy AI riêng cho bài này'),
        'custom-ai-badge'
      )
    );
    aiBox.append(aiTop, el('p', plan.coachIntroVi));
    if (lessonDesignStatus) {
      aiBox.append(el('p', lessonDesignStatus, 'hint'));
    }

    const aiForm = el('form', undefined, 'custom-ai-architect-form');
    const promptInput = document.createElement('input');
    promptInput.id = 'lessonCustomAiPromptInput';
    promptInput.type = 'text';
    promptInput.maxLength = 300;
    promptInput.value = plan.customPrompt || '';
    promptInput.disabled = lessonDesignBusy;
    promptInput.placeholder = 'Yêu cầu AI can thiệp chia lại phiên hoặc thiết kế bài tập (VD: chia sáng 4 phiên 7-8p + tối 30p, tách 6 phiên 10p)…';
    const designBtn = el(
      'button',
      lessonDesignBusy
        ? '✨ AI đang thiết kế bài này…'
        : (plan.hasLessonAiDesign ? '✨ Nhờ AI chia lại phiên & thiết kế bài này' : '✨ Nhờ AI thiết kế giáo án & chia phiên bài này'),
      'lesson-custom-primary'
    );
    designBtn.id = 'lessonCustomAiDesignBtn';
    designBtn.type = 'submit';
    designBtn.disabled = lessonDesignBusy;
    const runAiArchitect = async customText => {
      if (lessonDesignBusy) return;
      if (customText && C.hasExplicitMicroText?.(customText)) {
        const prevCtx = String(profile.learnerContextVi || '').trim();
        const nextCtx = prevCtx.includes(customText)
          ? prevCtx
          : [prevCtx, `Yêu cầu nhịp học: ${customText}`].filter(Boolean).join(' · ').slice(0, 500);
        profile = saveProfile({
          ...profile,
          style: 'spare_time',
          learnerContextVi: nextCtx
        });
        activeSessionIndex = 0;
        activeStepStage = null;
      }
      lessonDesignBusy = true;
      lessonDesignStatus = '✨ AI đang can thiệp chia lại cấu trúc phiên học và biên soạn bài tập riêng cho bạn...';
      mountLessonRunner(rootEl, lesson, words, hooks);
      const res = await requestAiLessonDesign(profile, lesson, words, customText);
      lessonDesignBusy = false;
      if (res.ok) {
        lessonDesignStatus = `✨ AI (${formatProviderName(res.provider)}) đã tùy chỉnh cấu trúc phiên & bài tập riêng cho Bài ${lesson.number}!`;
        activeSessionIndex = 0;
        activeStepStage = null;
      } else {
        lessonDesignStatus = `⚠️ ${res.error}`;
      }
      mountLessonRunner(rootEl, lesson, words, hooks);
    };
    aiForm.onsubmit = async e => {
      e.preventDefault();
      await runAiArchitect(promptInput.value.trim());
    };
    aiForm.append(promptInput, designBtn);
    const sessionPresets = el('div', undefined, 'custom-chip-list');
    const presetItems = [
      ['⚡ Chia nhỏ 5–10p/phiên', 'Hãy chia lại toàn bộ bài này thành các phiên ngắn 5-10 phút mỗi lần, mỗi phiên 1 nhiệm vụ gọn vừa sức'],
      ['🌅 Sáng 5–10p · Tối 30p', 'Hãy chia ban ngày thành các phiên tranh thủ 5-10 phút học từ vựng và buổi tối 1 phiên tập trung 30 phút ôn ngữ pháp, đọc, nghe'],
      ['🎯 Gộp 2 phiên chuyên sâu', 'Hãy cấu trúc lại bài này thành 2 phiên chuyên sâu: phiên 1 nắm từ vựng + ngữ pháp, phiên 2 luyện đọc + phản xạ tình huống']
    ];
    for (const [chipLabel, chipPrompt] of presetItems) {
      const chipBtn = btn(chipLabel, () => {
        promptInput.value = chipPrompt;
        runAiArchitect(chipPrompt);
      }, 'custom-chip');
      chipBtn.disabled = lessonDesignBusy;
      sessionPresets.append(chipBtn);
    }
    aiBox.append(aiForm, sessionPresets);
    wrap.append(aiBox);

    if (interviewOpen) {
      wrap.append(
        renderInterviewPanel(wrap, {
          hsk,
          lesson,
          onApplied: next => {
            saveProfile(next);
            interviewOpen = false;
            draftProfile = null;
            activeSessionIndex = 0;
            activeStepStage = null;
            mountLessonRunner(rootEl, lesson, words, hooks);
          },
          onCancel: () => {
            interviewOpen = false;
            draftProfile = null;
            mountLessonRunner(rootEl, lesson, words, hooks);
          }
        })
      );
    }

    const tabs = el('div', undefined, 'custom-session-tabs');
    tabs.setAttribute('role', 'group');
    tabs.setAttribute('aria-label', 'Các phiên học hôm nay');
    for (let i = 0; i < plan.sessions.length; i++) {
      const s = plan.sessions[i];
      const t = btn(`${s.completed ? '✓ ' : ''}${s.label}`, () => {
        activeSessionIndex = i;
        activeStepStage = null;
        mountLessonRunner(rootEl, lesson, words, hooks);
      }, 'lesson-custom-secondary');
      t.dataset.customSession = String(s.index);
      t.setAttribute('aria-pressed', String(i === activeSessionIndex));
      tabs.append(t);
    }
    wrap.append(tabs);

    const activeSession = plan.sessions[activeSessionIndex];
    if (activeSession.goalVi) {
      wrap.append(el('p', `🎯 Mục tiêu phiên này: ${activeSession.goalVi}`, 'hint'));
    }
    const stepList = el('div', undefined, 'custom-step-list');
    const stageHost = el('div', undefined, 'custom-step-stage');
    stageHost.id = 'customStepStage';
    stageHost.hidden = !activeStepStage;

    const completeStep = stepId => {
      const nextProf = C.markStepCompleted(profile, plan.dayKey, stepId);
      saveProfile(nextProf);
      activeStepStage = null;
      mountLessonRunner(rootEl, lesson, words, hooks);
    };

    for (const step of activeSession.steps) {
      const card = el('article', undefined, 'custom-step-card' + (step.completed ? ' is-done' : ''));
      card.dataset.customStep = step.stepId;
      const top = el('div', undefined, 'custom-step-top');
      const hasRichAiContent = Boolean(
        (step.focusWords && step.focusWords.length) ||
        (step.drills && step.drills.length) ||
        step.scenario ||
        step.action === 'ai_drill' ||
        step.action === 'ai_vocab_coach' ||
        step.action === 'ai_scenario'
      );
      top.append(
        el('span', `${step.skillLabel} · ${step.minutes} phút${hasRichAiContent ? ' · ✨ AI biên soạn' : ''}`, 'lesson-custom-badge'),
        el('span', step.completed ? '✓ Đã hoàn thành' : 'Chưa xong', 'hint')
      );
      card.append(top, el('strong', step.titleVi), el('p', step.detailVi, 'hint'));
      if (step.coachTipVi) {
        card.append(el('p', `💡 ${step.coachTipVi}`, 'custom-ai-coach-tip'));
      }

      const row = el('div', undefined, 'lesson-custom-actions');
      const runBtn = btn(step.completed ? 'Luyện lại bước này' : 'Thực hiện bước này', () => {
        if (!hasRichAiContent) {
          if (step.action === 'vocab_quiz') {
            hooks.startQuiz?.(words.slice(0, step.wordLimit || words.length));
            return;
          }
          if (step.action === 'vocab_srs') {
            hooks.startSrs?.(words.slice(0, step.wordLimit || words.length));
            return;
          }
          if (step.action === 'guided_auto') {
            hooks.openSection?.('guided');
            return;
          }
          if (step.action === 'practice_mini') {
            hooks.openSection?.('practice', 'mini');
            return;
          }
          if (step.action === 'practice_check') {
            hooks.openSection?.('practice', 'check');
            return;
          }
          if (step.action === 'real_reading' && window.HSKRealReading?.openFromLesson) {
            window.HSKRealReading.openFromLesson({
              id: lesson.id,
              hsk,
              number: lesson.number,
              words: words.map(w => ({ han: w.han, mean: w.mean, pin: w.pin }))
            });
            return;
          }
        }
        activeStepStage = step;
        stageHost.hidden = false;
        renderInlineStepStage(stageHost, step, lesson, words, hooks, () => completeStep(step.stepId));
        stageHost.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      }, 'lesson-custom-primary');

      row.append(runBtn);
      const requiresAiPractice = (step.action === 'ai_drill' && Boolean(step.drills?.length)) ||
        (step.action === 'ai_scenario' && Boolean(step.scenario)) ||
        (['ai_vocab_coach', 'vocab_cards'].includes(step.action) && Boolean(step.focusWords?.length));
      if (!step.completed && !requiresAiPractice) {
        row.append(btn('Đánh dấu xong', () => completeStep(step.stepId), 'lesson-custom-secondary'));
      }
      card.append(row);
      stepList.append(card);
    }

    wrap.append(stepList, stageHost);
    if (activeStepStage) {
      renderInlineStepStage(stageHost, activeStepStage, lesson, words, hooks, () => completeStep(activeStepStage.stepId));
    }

    rootEl.replaceChildren(wrap);

    // Auto-design the specific lesson once when an AI-generated profile opens an undesigned lesson
    if (profile.aiGenerated && !plan.hasLessonAiDesign && !lessonDesignBusy && isAiOnlineReady() && !autoDesignedLessons.has(lesson.id)) {
      autoDesignedLessons.add(lesson.id);
      lessonDesignBusy = true;
      lessonDesignStatus = `✨ AI đang tự động thiết kế giáo án & bài tập riêng cho Bài ${lesson.number}...`;
      requestAiLessonDesign(profile, lesson, words, '').then(res => {
        lessonDesignBusy = false;
        if (res.ok) {
          lessonDesignStatus = `✨ AI (${formatProviderName(res.provider)}) đã thiết kế giáo án & bài tập riêng cho Bài ${lesson.number}.`;
        } else {
          lessonDesignStatus = '';
        }
        if (document.getElementById('lessonCustomRunner')) {
          mountLessonRunner(rootEl, lesson, words, hooks);
        }
      });
    }
  }

  function triggerOpenInterview(hsk) {
    interviewOpen = true;
    formMode = false;
    resetInterview(Number(hsk || 1));
  }

  window.HSKLessonCustom = {
    renderCatalogBanner,
    renderHomeCard,
    mountLessonRunner,
    triggerOpenInterview
  };
})();
