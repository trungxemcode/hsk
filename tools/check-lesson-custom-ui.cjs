/* Exercise Custom HSK Lesson flow on desktop and mobile in light and dark themes. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const root = process.cwd();
  const server = http.createServer((q, r) => {
    const f = path.resolve(root, '.' + new URL(q.url, 'http://local').pathname);
    if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) {
      r.writeHead(404);
      return r.end();
    }
    r.setHeader(
      'Content-Type',
      ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' })[path.extname(f)] || 'application/octet-stream'
    );
    r.end(fs.readFileSync(f));
  });
  await new Promise(r => sListen(server, r));
  function sListen(srv, cb) { srv.listen(0, '127.0.0.1', cb); }

  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {})
  });

  try {
    for (const [width, theme] of [[1440, 'light'], [390, 'dark']]) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        isMobile: width < 721,
        hasTouch: width < 721,
        serviceWorkers: 'block'
      });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));

      await page.route('https://**/*', r => r.abort());
      await page.route('**/account-config.json', r => r.fulfill({ contentType: 'application/json', body: '{"enabled":false}' }));
      await page.route('**/translation-config.json', r => r.fulfill({ json: { enabled: true, endpoint: 'https://custom-test.invalid/translate' } }));
      await page.route('https://custom-test.invalid/custom-lesson-profile', async route => {
        const body = route.request().postDataJSON();
        if (body.mode === 'design') {
          return route.fulfill({
            json: {
              aiSource: { provider: 'deepseek', model: 'deepseek-chat' },
              lessonDesign: {
                lessonId: body.lesson?.id || 'standard-1-01',
                coachIntroVi: 'AI đã đọc từ vựng & ngữ pháp bài này để thiết kế 2 phiên học và bài tập riêng cho bạn.',
                customPrompt: body.customPrompt || '',
                aiProvider: 'deepseek',
                sessions: [
                  {
                    label: 'Phiên 1 · Từ vựng & mẹo nhớ AI',
                    minutes: 15,
                    goalVi: 'Nắm từ khóa và làm bài tập phản xạ do AI soạn.',
                    steps: [
                      {
                        id: 'ai_drill_step',
                        skill: 'vocab',
                        action: 'ai_drill',
                        minutes: 8,
                        titleVi: 'Bài tập phản xạ từ vựng (AI biên soạn)',
                        detailVi: 'Trắc nghiệm tình huống do AI tạo riêng cho bài này.',
                        coachTipVi: 'Đọc kỹ ngữ cảnh trước khi chọn đáp án.',
                        drills: [
                          {
                            promptVi: 'Khi gặp nhau lần đầu tiên, bạn chào thế nào tự nhiên nhất?',
                            questionCn: '___，很高兴认识你！',
                            options: ['你好', '再见', '谢谢', '不客气'],
                            answerIndex: 0,
                            explanationVi: 'Dùng 你好 (Xin chào) khi mới gặp nhau.'
                          }
                        ]
                      },
                      {
                        id: 'ai_vocab_step',
                        skill: 'vocab',
                        action: 'ai_vocab_coach',
                        minutes: 7,
                        titleVi: 'Từ vựng trọng tâm kèm mẹo nhớ AI',
                        detailVi: 'Học từ với mẹo nhớ và câu ví dụ giao tiếp.',
                        coachTipVi: 'Nghe audio và đọc to câu ví dụ.',
                        focusWords: [
                          {
                            han: '你好',
                            pin: 'nǐ hǎo',
                            mean: 'xin chào',
                            mnemonicVi: 'Bạn (你) + Tốt lành (好) = Chúc bạn tốt lành (Xin chào).',
                            exampleCn: '你好，我是新来的同事。',
                            examplePin: 'Nǐ hǎo, wǒ shì xīn lái de tóngshì.',
                            exampleVi: 'Xin chào, tôi là đồng nghiệp mới tới.'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          });
        }
        assert.ok((body.answers && body.answers.length >= 1) || (body.messages && body.messages.length >= 1));
        return route.fulfill({
          json: {
            ready: true,
            aiSource: { provider: 'deepseek', model: 'deepseek-chat' },
            profile: {
              version: 1,
              hsk: body.hsk,
              focusChoice: 'vocab_heavy',
              minutes: 25,
              days: 6,
              style: 'spare_time',
              goal: 'conversation',
              weights: { vocab: 50, grammar: 15, reading: 15, listening: 15, writing: 5 },
              summaryVi: 'AI đã cấu trúc lại bài học ưu tiên 50% từ vựng trong 25 phút/ngày theo giờ trống.',
              followUpVi: 'Chia 3 phiên ngắn mỗi ngày.',
              learnerContextVi: 'Học viên bận rộn, ưu tiên từ vựng giao tiếp thực tế trong các khung giờ nghỉ ngắn.'
            }
          }
        });
      });

      await page.goto('http://127.0.0.1:' + server.address().port + '/index.html');
      await page.waitForFunction(() => window.HSKStudio && window.HSKLessonNav && window.HSKLessonCustom && document.body.dataset.studioHub === 'home', null, { timeout: 60000 });
      await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
      await page.waitForTimeout(200);

      // 1. Verify Home card exists and opens the interview
      const homeCard = page.locator('#homeCustomLesson');
      assert.equal(await homeCard.isVisible(), true, `Home custom card missing on ${width}px`);
      await page.evaluate(() => {
        window.HSKAccountDashboard = { user: { uid: 'ui-custom-tester', getIdToken: async () => 'mock-token' } };
      });
      await page.locator('#homeCustomAction').click();
      await page.locator('#lessonCustomBanner').waitFor({ state: 'visible' });
      await page.locator('#lessonCustomInterview').waitFor({ state: 'visible' });

      // 2. Answer 5 questions in chat UI with quick-reply chips & free-text input
      await page.locator('.custom-chip').first().click(); // focus
      await page.locator('#lessonCustomChatInput').fill('25 phút mỗi ngày');
      await page.locator('#lessonCustomChatSend').click();
      await page.locator('.custom-chip').first().click(); // style: spare_time
      await page.locator('.custom-chip').first().click(); // days
      await page.locator('.custom-chip').first().click(); // goal

      await page.locator('#lessonCustomPreview').waitFor({ state: 'visible' });
      assert.match(await page.locator('#lessonCustomPreview').innerText(), /Từ vựng:\s*50%/);
      await page.locator('#lessonCustomApplyBtn').click();

      // Saved profile updates banner & study store
      await page.locator('#lessonCustomStartSession').waitFor({ state: 'visible' });
      const savedMinutes = await page.evaluate(() => window.HSKStudyStore.customLesson?.minutes);
      assert.equal(savedMinutes, 25);

      // 3. Test offline fixed-form fallback
      await page.locator('#lessonCustomEditBtn').click();
      await page.locator('#lessonCustomToggleForm').click();
      await page.locator('#lessonCustomForm select[name="focus"]').selectOption('grammar_heavy');
      await page.locator('#lessonCustomForm select[name="minutes"]').selectOption('30');
      await page.locator('#lessonCustomForm select[name="style"]').selectOption('focused_block');
      await page.locator('#lessonCustomApplyBtn').click();
      assert.equal(await page.evaluate(() => window.HSKStudyStore.customLesson?.minutes), 30);
      assert.equal(await page.evaluate(() => window.HSKStudyStore.customLesson?.focusChoice), 'grammar_heavy');

      // 4. Open Custom Lesson Runner, trigger AI Lesson Architect design, and complete an AI drill step
      await page.locator('#lessonCustomStartSession').click();
      await page.locator('#lessonCustomRunner').waitFor({ state: 'visible' });
      const topBtnStats = await page.evaluate(() => [...document.querySelectorAll('#lessonCustomRunner > .lesson-custom-actions > button')].map(b => ({
        h: Math.round(b.getBoundingClientRect().height),
        mb: getComputedStyle(b).marginBottom
      })));
      assert.equal(topBtnStats.length, 2);
      assert.ok(Math.abs(topBtnStats[0].h - topBtnStats[1].h) <= 1, 'Top runner buttons height mismatch: ' + JSON.stringify(topBtnStats));
      assert.ok(topBtnStats.every(x => x.mb === '0px'), 'Top runner buttons marginBottom must be 0px: ' + JSON.stringify(topBtnStats));

      // Verify AI Lesson Architect bar exists and designs bespoke lesson + AI drills
      await page.locator('#lessonCustomAiArchitect').waitFor({ state: 'visible' });
      await page.locator('#lessonCustomAiPromptInput').fill('Ưu tiên bài tập giao tiếp lần đầu gặp mặt');
      await page.locator('#lessonCustomAiDesignBtn').click();
      await page.locator('#lessonCustomAiArchitect').filter({ hasText: 'AI · DeepSeek' }).waitFor({ state: 'visible' });

      const firstStep = page.locator('[data-custom-step]').first();
      await firstStep.waitFor({ state: 'visible' });
      assert.match(await firstStep.innerText(), /AI biên soạn/);
      const stepBtnStats = await firstStep.evaluate(card => [...card.querySelectorAll('.lesson-custom-actions > button')].map(b => ({
        h: Math.round(b.getBoundingClientRect().height),
        mb: getComputedStyle(b).marginBottom
      })));
      if (stepBtnStats.length >= 2) {
        assert.ok(Math.abs(stepBtnStats[0].h - stepBtnStats[1].h) <= 1, 'Step action buttons height mismatch: ' + JSON.stringify(stepBtnStats));
        assert.ok(stepBtnStats.every(x => x.mb === '0px'), 'Step action buttons marginBottom must be 0px: ' + JSON.stringify(stepBtnStats));
      }

      // Open the AI drill step and answer the AI-generated multiple-choice question
      await firstStep.getByRole('button', { name: 'Thực hiện bước này', exact: true }).click();
      await page.locator('#customStepStage').waitFor({ state: 'visible' });
      await page.locator('.custom-ai-drill-opt').first().click();
      assert.match(await page.locator('#customStepStage').innerText(), /Chính xác!/);
      await page.locator('#customStepStage').getByRole('button', { name: 'Hoàn thành bài tập AI', exact: true }).click();
      assert.match(await firstStep.innerText(), /Đã hoàn thành/);

      // 5. Check Home card reflects saved profile without horizontal overflow
      await page.evaluate(() => window.HSKStudio.navigate('home'));
      await page.waitForTimeout(200);
      assert.match(await page.locator('#homeCustomLesson').innerText(), /30 phút\/ngày/);
      assert.equal(await page.locator('.workspace').evaluate(n => n.scrollWidth > n.clientWidth + 2), false, `Horizontal overflow on ${width}px`);

      assert.deepEqual(errors, [], `Page errors on ${width}px ${theme}: ` + JSON.stringify(errors));
      await page.close();
    }
    console.log('PASS check-lesson-custom-ui: AI chat + chips, fixed-form fallback, Home card, session runner, step completion & 390/1440 light/dark.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
