/* UI controller for Custom HSK Lesson: conversational AI interview, fixed-form fallback, Home card & session runner. */
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
  let draftProfile = null;
  let interviewBusy = false;
  let interviewStatus = '';
  let activeSessionIndex = 0;
  let activeStepStage = null;

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

  function getSavedProfile() {
    return window.HSKStudyStore?.customLesson || null;
  }

  function saveProfile(profile) {
    if (!window.HSKStudyStore?.saveCustomLesson) return null;
    const saved = window.HSKStudyStore.saveCustomLesson(C.createProfile(profile));
    return saved;
  }

  function seedFromAnswers(hsk, answers) {
    const map = {};
    for (const row of answers) {
      if (row.id !== 'freeform') map[row.id] = row.parsedValue ?? C.parseNaturalReply(row.id, row.answer);
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

  async function requestAiProfile(hsk, answers) {
    const account = window.HSKAccountDashboard?.user;
    if (!navigator.onLine || !account || !translationConfig?.endpoint) {
      return { profile: seedFromAnswers(hsk, answers), source: 'local' };
    }
    const endpoint = translationConfig.endpoint.replace(/\/translate$/, '/custom-lesson-profile');
    const controller = new AbortController();
    const stopLoading = window.HSKLoading?.showAI?.('AI đang thiết kế bài học tùy chỉnh...', {
      kind: 'study',
      detail: 'Đang phân tích ưu tiên và quỹ thời gian của bạn...',
      signal: controller.signal
    });
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const token = await account.getIdToken();
      const payloadAnswers = answers.map(a => ({ id: a.id, answer: String(a.answer || '').slice(0, 400) }));
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ hsk, answers: payloadAnswers }),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.error || 'Chưa kết nối được dịch vụ AI.');
      }
      const data = await res.json();
      if (!data?.profile) throw Error('AI chưa trả hồ sơ hợp lệ.');
      return {
        profile: C.createProfile({ ...data.profile, hsk }),
        source: 'ai'
      };
    } catch (e) {
      return {
        profile: seedFromAnswers(hsk, answers),
        source: 'fallback',
        warning: e?.name === 'AbortError' ? 'AI phản hồi chậm; đã áp dụng cấu trúc chuẩn.' : (e?.message || '')
      };
    } finally {
      clearTimeout(timer);
      stopLoading?.();
    }
  }

  function resetInterview(hsk) {
    const existing = getSavedProfile();
    interviewStep = 0;
    collectedAnswers = [];
    interviewBusy = false;
    interviewStatus = '';
    draftProfile = existing ? C.createProfile({ ...existing, hsk }) : null;
    const first = C.INTERVIEW_STEPS[0];
    chatHistory = [
      { role: 'ai', text: 'Chào bạn! Mình sẽ hỏi nhanh 5 câu để xếp lại bài học HSK ' + hsk + ' đúng theo cách bạn thích.', hint: first.hintVi },
      { role: 'ai', text: first.questionVi }
    ];
  }

  function renderPreviewBox(profile, lesson, { onApply, onCancel } = {}) {
    const plan = C.buildLessonPlan(profile, lesson || { id: `standard-${profile.hsk}-01`, number: 1, vi: `Bài 1 · HSK ${profile.hsk}`, words: [] });
    const box = el('div', undefined, 'custom-preview-box');
    box.id = 'lessonCustomPreview';
    box.append(
      el('strong', `Lộ trình đề xuất · HSK ${profile.hsk}`),
      el('p', profile.summaryVi)
    );
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
      sessionsRow.append(el('span', `${s.label} (${s.steps.map(st => st.skillLabel).join(' + ')})`));
    }
    box.append(sessionsRow, el('p', profile.followUpVi, 'hint'));

    const actions = el('div', undefined, 'lesson-custom-actions');
    const applyBtn = btn('Áp dụng bài học tùy chỉnh', () => onApply?.(profile), 'lesson-custom-primary');
    applyBtn.id = 'lessonCustomApplyBtn';
    actions.append(applyBtn);
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
    head.append(el('strong', 'Thiết kế cấu trúc bài học của bạn'));
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
    const aiReady = Boolean(navigator.onLine && window.HSKAccountDashboard?.user && translationConfig?.endpoint);
    panel.append(
      el(
        'p',
        aiReady
          ? 'Trợ lý AI đã sẵn sàng — trả lời ngắn hoặc chọn gợi ý bên dưới.'
          : 'Chế độ thiết kế thông minh ngoại tuyến — chọn gợi ý hoặc gõ nhu cầu của bạn.',
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

      if (interviewStep < C.INTERVIEW_STEPS.length) {
        const nextQ = C.INTERVIEW_STEPS[interviewStep];
        chatHistory.push({ role: 'ai', text: nextQ.questionVi });
        rerender();
        return;
      }

      // Finished all 5 interview questions -> generate profile (AI or local fallback)
      interviewBusy = true;
      interviewStatus = 'Đang tạo cấu trúc bài học phù hợp...';
      rerender();
      const result = await requestAiProfile(hsk, collectedAnswers);
      interviewBusy = false;
      draftProfile = result.profile;
      interviewStatus = result.source === 'ai'
        ? 'AI đã thiết kế xong lộ trình bài học cho bạn.'
        : (result.warning ? result.warning : 'Đã thiết kế cấu trúc bài học từ câu trả lời của bạn.');
      chatHistory.push({ role: 'ai', text: draftProfile.summaryVi });
      rerender();
    };

    if (currentStep && !draftProfile) {
      const chips = el('div', undefined, 'custom-chip-list');
      for (const opt of currentStep.options) {
        chips.append(btn(opt.label, () => submitAnswer(opt.label, opt.value), 'custom-chip'));
      }
      panel.append(chips);
    }

    if (!draftProfile) {
      const compose = el('form', undefined, 'custom-chat-compose');
      const input = document.createElement('input');
      input.id = 'lessonCustomChatInput';
      input.type = 'text';
      input.maxLength = 300;
      input.placeholder = currentStep ? 'Hoặc tự nhập câu trả lời của bạn…' : 'Nhập yêu cầu chỉnh thêm…';
      input.disabled = interviewBusy;
      const sendBtn = el('button', interviewBusy ? 'Đang xử lý…' : 'Gửi', 'lesson-custom-primary');
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
        const earlyBtn = btn('Tạo ngay từ thông tin đã nhập', async () => {
          interviewStep = C.INTERVIEW_STEPS.length;
          interviewBusy = true;
          rerender();
          const res = await requestAiProfile(hsk, collectedAnswers);
          interviewBusy = false;
          draftProfile = res.profile;
          interviewStatus = res.source === 'ai' ? 'AI đã thiết kế xong lộ trình.' : 'Đã thiết kế cấu trúc bài học.';
          chatHistory.push({ role: 'ai', text: draftProfile.summaryVi });
          rerender();
        }, 'lesson-custom-secondary');
        quickActions.append(earlyBtn);
      }
      if (onCancel) quickActions.append(btn('Đóng', onCancel, 'lesson-custom-secondary'));
      panel.append(quickActions);
    } else {
      panel.append(renderPreviewBox(draftProfile, lesson, { onApply: onApplied, onCancel }));
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
      el('p', 'Bài học tùy chỉnh (AI cá nhân hóa)', 'lesson-eyebrow'),
      el('h3', effectiveProfile ? `Cách học riêng của bạn · HSK ${hsk}` : 'Học HSK theo thời gian và kiểu bạn muốn'),
      el(
        'p',
        effectiveProfile
          ? effectiveProfile.summaryVi
          : 'Trả lời AI vài câu ngắn (muốn ưu tiên từ vựng hay ngữ pháp, mỗi ngày học bao nhiêu phút, học vào giờ trống hay một mạch…) để app tự chia lại bài học.',
        'hint'
      )
    );
    head.append(copy);
    box.append(head);

    if (plan) {
      const badges = el('div', undefined, 'lesson-custom-badges');
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
          ? `${plan.totalMinutes} phút/ngày · ${plan.styleLabel}`
          : 'Để AI hỏi nhanh vài câu rồi tự sắp xếp lại bài học HSK đúng kiểu của bạn.',
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

  function renderInlineStepStage(stageEl, step, lesson, words, hooks, onDone) {
    stageEl.replaceChildren();
    if (step.action === 'vocab_cards') {
      const slice = words.slice(0, step.wordLimit || 8);
      if (!slice.length) {
        stageEl.append(el('p', 'Chưa có từ vựng trong bài này.'), btn('Đánh dấu xong', onDone, 'lesson-custom-primary'));
        return;
      }
      let idx = 0;
      let revealed = false;
      const drawCard = () => {
        stageEl.replaceChildren();
        const w = slice[idx];
        const card = el('div');
        card.append(
          el('p', `Thẻ ${idx + 1} / ${slice.length} · ${step.titleVi}`, 'hint'),
          el('h4', w.han, 'lesson-han')
        );
        if (window.HSKSpeech) card.append(window.HSKSpeech.button(w.han, 'Nghe ' + w.han));
        if (revealed) {
          card.append(el('p', w.pin || '', 'lesson-pinyin'), el('p', w.mean || '', 'lesson-meaning'));
        }
        const row = el('div', undefined, 'lesson-custom-actions');
        row.append(
          btn(revealed ? 'Ẩn pinyin & nghĩa' : 'Hiện pinyin & nghĩa', () => { revealed = !revealed; drawCard(); }, 'lesson-custom-secondary'),
          btn('Từ tiếp theo →', () => { idx = (idx + 1) % slice.length; revealed = false; drawCard(); }, 'lesson-custom-secondary'),
          btn('Hoàn thành bước từ vựng', () => { hooks.markRead?.(); onDone(); }, 'lesson-custom-primary')
        );
        card.append(row);
        stageEl.append(card);
      };
      drawCard();
      return;
    }

    if (step.action === 'grammar_focus') {
      const list = (lesson.content?.grammar || []).slice(0, step.grammarLimit || 2);
      stageEl.append(el('h4', step.titleVi));
      if (!list.length) {
        stageEl.append(el('p', 'Bài này chưa có mục ngữ pháp chi tiết. Hãy ôn từ và đặt câu với từ trọng tâm.'), btn('Hoàn thành bước ngữ pháp', onDone, 'lesson-custom-primary'));
        return;
      }
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
      stageEl.append(btn('Hoàn thành bước ngữ pháp', onDone, 'lesson-custom-primary'));
      return;
    }

    if (step.action === 'reading_dialogue' || step.action === 'passive_listen') {
      const d = lesson.content?.dialogues?.[0];
      const rLines = lesson.content?.reading?.lines || [];
      const lines = (d?.lines?.length ? d.lines : rLines).slice(0, 8);
      stageEl.append(el('h4', step.titleVi));
      if (!lines.length) {
        stageEl.append(el('p', 'Chưa có bài đọc cho bài này.'), btn('Hoàn thành bước này', onDone, 'lesson-custom-primary'));
        return;
      }
      if (window.HSKSpeech) {
        stageEl.append(window.HSKSpeech.button(lines.map(x => x.cn), 'Nghe toàn đoạn', true));
      }
      for (const x of lines) {
        const p = el('p', (x.speaker ? x.speaker + ': ' : '') + x.cn);
        stageEl.append(p, el('small', `${x.pin} · ${x.vi}`, 'hint'));
      }
      stageEl.append(btn('Hoàn thành bước nghe & đọc', () => { hooks.markRead?.(); onDone(); }, 'lesson-custom-primary'));
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
      top.append(
        el('span', `${step.skillLabel} · ${step.minutes} phút`, 'lesson-custom-badge'),
        el('span', step.completed ? '✓ Đã hoàn thành' : 'Chưa xong', 'hint')
      );
      card.append(top, el('strong', step.titleVi), el('p', step.detailVi, 'hint'));

      const row = el('div', undefined, 'lesson-custom-actions');
      const runBtn = btn(step.completed ? 'Luyện lại bước này' : 'Thực hiện bước này', () => {
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
