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
      ? 'Hãy thiết kế giáo án AI cá nhân hóa cho bài học này theo lesson.content.aiCustomSpec. Chỉ trả về chuỗi JSON thuần {"coachIntroVi":"...","sessions":[{"label":"...","minutes":10,"goalVi":"...","steps":[{"id":"s1","skill":"vocab","action":"ai_vocab_coach","minutes":5,"titleVi":"...","detailVi":"...","coachTipVi":"...","focusWords":[{"han":"...","pin":"...","mean":"...","mnemonicVi":"...","exampleCn":"...","examplePin":"...","exampleVi":"..."}],"drills":[{"promptVi":"...","questionCn":"...","options":["A","B","C","D"],"answerIndex":0,"explanationVi":"..."}]}]}]}.'
      : mode === 'interview'
        ? 'Đọc lesson.content.aiCustomSpec. Nếu học viên chưa nêu đủ trọng tâm + thời gian/kiểu học (và dưới 3 lượt), trả JSON {"ready":false,"replyVi":"câu hỏi tiếp theo bằng tiếng Việt","suggestedReplies":["gợi ý 1","gợi ý 2","gợi ý 3"]}. Nếu đã đủ, trả JSON {"ready":true,"replyVi":"tổng kết","profile":{"focusChoice":"vocab_heavy","minutes":25,"days":6,"style":"spare_time","goal":"conversation","weights":{"vocab":50,"grammar":15,"reading":15,"listening":15,"writing":5},"summaryVi":"...","followUpVi":"...","learnerContextVi":"..."}}.'
        : 'Đọc lesson.content.aiCustomSpec và thiết kế hồ sơ học HSK cá nhân hóa. Chỉ trả về JSON thuần {"focusChoice":"vocab_heavy|grammar_heavy|listening_speaking|reading_heavy|balanced","minutes":25,"days":6,"style":"spare_time|focused_block|hands_free|bedtime_review|weekend_sprint","goal":"exam|conversation|reading_comprehension|work_travel","weights":{"vocab":50,"grammar":15,"reading":15,"listening":15,"writing":5},"summaryVi":"...","followUpVi":"...","learnerContextVi":"..."}.';

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
    const timer = setTimeout(() => controller.abort(), 40000);
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
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const token = await account.getIdToken();
      const reqBody = {
        hsk,
        mode: 'design',
        customPrompt: String(customPrompt || '').trim().slice(0, 400),
        profile: {
          focusChoice: profile.focusChoice,
          minutes: profile.minutes,
          days: profile.days,
          style: profile.style,
          goal: profile.goal,
          weights: profile.weights,
          summaryVi: profile.summaryVi,
          learnerContextVi: profile.learnerContextVi || ''
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
      const updatedProfile = C.saveLessonDesign(profile, lesson.id, {
        ...rawDesign,
        customPrompt: reqBody.customPrompt,
        aiProvider: provider,
        aiModel: data?.aiSource?.model || rawDesign.aiModel || ''
      });
      saveProfile(updatedProfile);
      return { ok: true, profile: updatedProfile, provider };
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
    draftProfile = null;
    const first = C.INTERVIEW_STEPS[0];
    chatHistory = [
      {
        role: 'ai',
        text: `Chào bạn! Mình là Gia sư AI HSK ${hsk}. Bạn có thể mô tả tự do cách bạn muốn học (ví dụ: "mình rảnh 25 phút giờ nghỉ trưa, muốn học nhiều từ vựng giao tiếp hơn ngữ pháp") hoặc chọn gợi ý bên dưới để mình thiết kế lại bài học cho bạn nhé!`,
        hint: first.hintVi
      },
      { role: 'ai', text: first.questionVi }
    ];
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

    const head = el('div', undefined, 'lesson-custom-interview-head');
    head.append(el('strong', 'Thiết kế cấu trúc bài học với Gia sư AI'));
    const toggleBtn = btn(
      formMode ? 'Chuyển sang hỏi đáp AI' : 'Chọn nhanh bằng bảng',
      () => {
        formMode = !formMode;
        if (formMode && !draftProfile) {
          const base = getSavedProfile();
          draftProfile = base
            ? C.createProfile({ ...base, hsk })
            : C.createProfile({
                hsk,
                minutes: window.HSKPlanner?.plan?.minutes || 20,
                days: window.HSKPlanner?.plan?.days || 6
              });
        }
        rerender();
      },
      'lesson-custom-secondary'
    );
    toggleBtn.id = 'lessonCustomToggleForm';
    head.append(toggleBtn);
    panel.append(head);

    if (interviewStatus) {
      const statusEl = el('p', interviewStatus, 'hint');
      statusEl.setAttribute('role', 'status');
      panel.append(statusEl);
    }

    const rerender = () => {
      const live = document.getElementById('lessonCustomInterview') || panel;
      const fresh = renderInterviewPanel(container, { hsk, lesson, onApplied, onCancel });
      live.replaceWith(fresh);
    };

    if (formMode) {
      const form = el('form', undefined, 'custom-fallback-form');
      form.id = 'lessonCustomForm';
      const base = draftProfile || C.createProfile({ hsk });
      const selects = {};

      const addSelect = (key, label, options, selectedVal) => {
        const lbl = el('label', label);
        const sel = document.createElement('select');
        sel.name = key;
        for (const [val, txt] of options) {
          const opt = document.createElement('option');
          opt.value = String(val);
          opt.textContent = txt;
          if (String(val) === String(selectedVal)) opt.selected = true;
          sel.append(opt);
        }
        sel.onchange = () => {
          draftProfile = C.createProfile({
            hsk,
            focusChoice: selects.focus.value,
            minutes: Number(selects.minutes.value),
            style: selects.style.value,
            days: Number(selects.days.value),
            goal: selects.goal.value
          });
          rerender();
        };
        selects[key] = sel;
        lbl.append(sel);
        form.append(lbl);
      };

      addSelect('focus', 'Trọng tâm ưu tiên', C.INTERVIEW_STEPS[0].options.map(o => [o.value, o.label]), base.focusChoice);
      addSelect('minutes', 'Thời gian mỗi ngày', [[15, '15 phút'], [20, '20 phút'], [30, '30 phút'], [45, '45 phút'], [60, '60 phút'], [90, '90 phút']], base.minutes);
      addSelect('style', 'Kiểu học', C.STYLES.map(s => [s, C.STYLE_LABELS[s]]), base.style);
      addSelect('days', 'Số ngày / tuần', [[3, '3 ngày'], [4, '4 ngày'], [5, '5 ngày'], [6, '6 ngày'], [7, '7 ngày']], base.days);
      addSelect('goal', 'Mục tiêu chính', C.GOALS.map(g => [g, C.GOAL_LABELS[g]]), base.goal);
      panel.append(form);

      draftProfile = C.createProfile({
        hsk,
        focusChoice: selects.focus.value,
        minutes: Number(selects.minutes.value),
        style: selects.style.value,
        days: Number(selects.days.value),
        goal: selects.goal.value
      });
      panel.append(renderPreviewBox(draftProfile, lesson, { onApply: onApplied, onCancel }));
      return panel;
    }

    // Conversational AI interview mode
    const aiReady = isAiOnlineReady();
    panel.append(
      el(
        'p',
        aiReady
          ? '✨ Gia sư AI trực tuyến đã sẵn sàng — bạn có thể gõ tự do toàn bộ mong muốn hoặc trả lời từng gợi ý.'
          : '⚠️ Bạn đang ở chế độ ngoại tuyến / chưa đăng nhập — hãy đăng nhập để AI thật thiết kế bài học.',
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

    const currentStep = C.INTERVIEW_STEPS[interviewStep];
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
        : (result.warning ? `⚠️ ${result.warning}` : 'Đã tạo cấu trúc bài học từ câu trả lời của bạn.');
      chatHistory.push({ role: 'ai', text: result.replyVi || draftProfile.summaryVi });
      rerender();
    };

    const submitAnswer = async (displayLabel, rawVal) => {
      if (interviewBusy) return;
      const stepObj = C.INTERVIEW_STEPS[interviewStep];
      const text = String(displayLabel || rawVal || '').trim();
      if (!text) return;

      chatHistory.push({ role: 'user', text });
      if (stepObj) {
        collectedAnswers.push({
          id: stepObj.id,
          answer: text,
          parsedValue: rawVal !== undefined ? rawVal : C.parseNaturalReply(stepObj.id, text)
        });
        interviewStep++;
      } else {
        collectedAnswers.push({ id: 'freeform', answer: text });
      }

      // If user typed a rich free-text answer or AI is online, let AI drive or finalize when all steps are answered
      if (interviewStep >= C.INTERVIEW_STEPS.length) {
        await finalizeWithAi();
        return;
      }

      // When user typed custom free text (no rawVal chip) and AI is online, ask real AI for the next dynamic interview turn!
      if (rawVal === undefined && aiReady && text.length >= 25) {
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
        if (turnRes.ready === true && turnRes.profile) {
          draftProfile = turnRes.profile;
          interviewStatus = `✨ AI (${formatProviderName(turnRes.provider)}) đã thiết kế xong lộ trình bài học từ mô tả của bạn.`;
          chatHistory.push({ role: 'ai', text: turnRes.replyVi || draftProfile.summaryVi });
          rerender();
          return;
        }
      }

      aiDynamicChips = null;
      const nextQ = C.INTERVIEW_STEPS[interviewStep];
      if (nextQ) {
        chatHistory.push({ role: 'ai', text: nextQ.questionVi });
      }
      rerender();
    };

    if (!draftProfile) {
      const chips = el('div', undefined, 'custom-chip-list');
      if (Array.isArray(aiDynamicChips) && aiDynamicChips.length) {
        for (const label of aiDynamicChips) {
          chips.append(btn(label, () => submitAnswer(label), 'custom-chip'));
        }
        panel.append(chips);
      } else if (currentStep) {
        for (const opt of currentStep.options) {
          chips.append(btn(opt.label, () => submitAnswer(opt.label, opt.value), 'custom-chip'));
        }
        panel.append(chips);
      }
    }

    if (!draftProfile) {
      const compose = el('form', undefined, 'custom-chat-compose');
      const input = document.createElement('input');
      input.id = 'lessonCustomChatInput';
      input.type = 'text';
      input.maxLength = 400;
      input.placeholder = 'Mô tả tự do cách bạn muốn học để AI thiết kế (VD: rảnh 25p nghỉ trưa, ưu tiên từ vựng giao tiếp)…';
      input.disabled = interviewBusy;
      const sendBtn = el('button', interviewBusy ? 'AI đang xử lý…' : 'Gửi cho AI', 'lesson-custom-primary');
      sendBtn.id = 'lessonCustomChatSend';
      sendBtn.type = 'submit';
      sendBtn.disabled = interviewBusy;
      compose.onsubmit = e => {
        e.preventDefault();
        const val = input.value.trim();
        if (val) submitAnswer(val);
      };
      compose.append(input, sendBtn);
      panel.append(compose);

      const quickActions = el('div', undefined, 'lesson-custom-actions');
      if (collectedAnswers.length > 0) {
        const earlyBtn = btn('✨ Nhờ AI thiết kế ngay từ thông tin đã nhập', async () => {
          interviewStep = C.INTERVIEW_STEPS.length;
          await finalizeWithAi();
        }, 'lesson-custom-secondary');
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
          onRetryAi: () => finalizeWithAi()
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

    const head = el('div', undefined, 'lesson-custom-head');
    const copy = el('div');
    copy.append(
      el(
        'p',
        effectiveProfile?.aiGenerated
          ? `Bài học tùy chỉnh · ✨ AI thiết kế (${formatProviderName(effectiveProfile.aiProvider)})`
          : 'Bài học tùy chỉnh (AI cá nhân hóa)',
        'lesson-eyebrow'
      ),
      el('h3', effectiveProfile ? `Cách học riêng của bạn · HSK ${hsk}` : 'Học HSK theo thời gian và kiểu bạn muốn'),
      el(
        'p',
        effectiveProfile
          ? effectiveProfile.summaryVi
          : 'Trò chuyện với Gia sư AI về kỹ năng bạn muốn ưu tiên, số phút rảnh mỗi ngày và kiểu học (giờ trống, rảnh tay, một mạch…) để AI tự thiết kế lại giáo án & bài tập cho bạn.',
        'hint'
      )
    );
    head.append(copy);
    box.append(head);

    if (plan) {
      const badges = el('div', undefined, 'lesson-custom-badges');
      if (plan.aiDesigned) {
        badges.append(el('span', `✨ AI thiết kế (${formatProviderName(plan.aiProvider)})`, 'custom-ai-badge'));
      }
      badges.append(
        el('span', `${plan.totalMinutes} phút / ngày`, 'lesson-custom-badge'),
        el('span', plan.styleLabel, 'lesson-custom-badge'),
        el('span', plan.goalLabel, 'lesson-custom-badge'),
        el('span', `${plan.completedSteps}/${plan.totalSteps} bước hôm nay`, 'lesson-custom-badge')
      );
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
      box.append(badges, weightsRow, sessionsPreview);
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
    const copy = el('div');
    copy.append(
      el('h3', plan ? `Bài học của tôi hôm nay · HSK ${targetHsk}` : 'Bài học của tôi hôm nay'),
      el(
        'p',
        plan
          ? `${plan.totalMinutes} phút/ngày · ${plan.styleLabel}${plan.aiDesigned ? ' · ✨ AI thiết kế' : ''}`
          : 'Để AI hỏi nhanh vài câu rồi tự thiết kế lại giáo án & bài tập HSK đúng kiểu của bạn.',
        'hint'
      )
    );
    head.append(copy);
    container.append(head);

    if (plan) {
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
          explainEl.textContent = `${isRight ? '✓ Chính xác!' : '✗ Chưa đúng.'} ${d.explanationVi || ''}`;
          explainEl.hidden = false;
          scoreEl.textContent = `Tiến độ: ${answeredCount}/${drills.length} câu · Đúng ${correctCount}/${answeredCount}`;
        }, 'custom-ai-drill-opt');
        optsGrid.append(optBtn);
      });

      card.append(optsGrid, explainEl);
      wrap.append(card);
    });

    if (onDone) {
      wrap.append(btn('Hoàn thành bài tập AI', onDone, 'lesson-custom-primary'));
    }
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
      actions.append(btn('Hoàn thành tình huống này', onDone, 'lesson-custom-primary'));
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
      const slice = aiFocus || words.slice(0, step.wordLimit || 8);
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
    promptInput.placeholder = 'Yêu cầu riêng cho AI ở bài này (VD: tạo thêm bài tập từ dễ nhầm, rút gọn 15p, hội thoại công việc)…';
    const designBtn = el(
      'button',
      lessonDesignBusy
        ? '✨ AI đang thiết kế bài này…'
        : (plan.hasLessonAiDesign ? '✨ Nhờ AI thiết kế lại bài này' : '✨ Nhờ AI thiết kế giáo án & bài tập bài này'),
      'lesson-custom-primary'
    );
    designBtn.id = 'lessonCustomAiDesignBtn';
    designBtn.type = 'submit';
    designBtn.disabled = lessonDesignBusy;
    aiForm.onsubmit = async e => {
      e.preventDefault();
      if (lessonDesignBusy) return;
      lessonDesignBusy = true;
      lessonDesignStatus = '✨ AI đang đọc từ vựng, ngữ pháp của bài và thiết kế các bước + bài tập riêng cho bạn...';
      mountLessonRunner(rootEl, lesson, words, hooks);
      const res = await requestAiLessonDesign(profile, lesson, words, promptInput.value.trim());
      lessonDesignBusy = false;
      if (res.ok) {
        lessonDesignStatus = `✨ AI (${formatProviderName(res.provider)}) đã thiết kế xong giáo án & bài tập riêng cho Bài ${lesson.number}!`;
        activeSessionIndex = 0;
        activeStepStage = null;
      } else {
        lessonDesignStatus = `⚠️ ${res.error}`;
      }
      mountLessonRunner(rootEl, lesson, words, hooks);
    };
    aiForm.append(promptInput, designBtn);
    aiBox.append(aiForm);
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
            completeStep(step.stepId);
            hooks.startQuiz?.(words.slice(0, step.wordLimit || words.length));
            return;
          }
          if (step.action === 'vocab_srs') {
            completeStep(step.stepId);
            hooks.startSrs?.(words.slice(0, step.wordLimit || words.length));
            return;
          }
          if (step.action === 'guided_auto') {
            completeStep(step.stepId);
            hooks.openSection?.('guided');
            return;
          }
          if (step.action === 'practice_mini') {
            completeStep(step.stepId);
            hooks.openSection?.('practice', 'mini');
            return;
          }
          if (step.action === 'practice_check') {
            completeStep(step.stepId);
            hooks.openSection?.('practice', 'check');
            return;
          }
          if (step.action === 'real_reading' && window.HSKRealReading?.openFromLesson) {
            completeStep(step.stepId);
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
      if (!step.completed) {
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
