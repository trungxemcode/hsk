const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const root = process.cwd();
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json'};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + pathname.replace(/^\/hsk\//, '/'));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined});
    for (const width of [390, 1440]) {
      const page = await browser.newPage({viewport: {width, height: 844}, serviceWorkers: 'block'});
      const modelRequests = [];
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('request', request => {
        if (request.url().includes('/vendor/sentence-onnx/')) modelRequests.push(request.url());
      });
      await page.route('https://**/*', route => route.abort());
      await page.goto('http://127.0.0.1:' + server.address().port + '/hsk/index.html');
      await page.waitForFunction(() => window.HSKStudio && window.HSKSentenceOnnx && document.querySelector('#appLoadStatus')?.hidden);
      assert.equal(modelRequests.length, 0, 'No model fetch on Trang chủ');
      await page.evaluate(() => HSKStudio.navigate('sentence-editor'));
      const editor = page.locator('#sentenceEditor');
      const draft = editor.locator('#sentenceDraft');
      const toggle = editor.locator('.sentence-onnx-toggle');
      const status = editor.locator('.sentence-onnx-status');
      const suggestions = editor.locator('.sentence-card[data-source=onnx]');
      await draft.fill('我借了四只书。');
      assert.equal(modelRequests.length, 0, 'No model fetch before opt-in');
      const reviewDraft = '这份指南对于居民了解新政策提供了实用的参考。申请能否通过，关键在于要交齐材料。';
      await draft.fill(reviewDraft);
      const review = editor.locator('.sentence-card').filter({hasText: 'Cần xem lại · Cục bộ'});
      await review.waitFor();
      assert.equal(await review.getByRole('button', {name: 'Áp dụng'}).count(), 0);
      await review.getByRole('button', {name: 'Tìm trong bài'}).click();
      assert.equal(await draft.evaluate(el => el.value.slice(el.selectionStart, el.selectionEnd)), '关键在于要');
      await draft.fill('经过多轮调研，使这项服务不但加快了处理效率和审批速度，而且能否实现数据共享，是保障持续运营的根本要求，相关部门必须合作，防止越权访问的违规现象不再重演。');
      const localCards = editor.locator('.sentence-card[data-source=local]');
      await page.waitForFunction(() => document.querySelectorAll('#sentenceEditor .sentence-card[data-source=local]').length >= 5);
      const anchors = await localCards.locator('.sentence-diff').allTextContents();
      for (const text of ['使', '效率', '而且', '能否', '不再']) {
        assert.ok(anchors.some(anchor => anchor.startsWith(text)), 'A distinct card highlights ' + text);
      }

      await draft.fill('我借了四只书。');

      const trial = editor.locator('.sentence-electra-trial');
      const trialFile = trial.locator('.sentence-electra-file');
      const trialStatus = trial.locator('.sentence-electra-status');
      const trialResults = editor.locator('.sentence-card[data-source=electra]');
      assert.equal(await trial.locator('summary').isVisible(), true);
      assert.equal(await trial.locator('.sentence-electra-pick').isVisible(), false);
      await trial.locator('summary').click();
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        trial.getByRole('button', {name: 'Chọn gói model'}).click()
      ]);
      await chooser.setFiles({name: 'wrong.hskmodel', mimeType: 'application/octet-stream', buffer: Buffer.from('not a model')});
      assert.match(await trialStatus.textContent(), /Hãy chọn gói/);
      assert.equal(modelRequests.length, 0, 'An invalid trial file does not start the Worker');
      await trial.locator('summary').click();

      await toggle.click();
      await page.waitForFunction(() => /Đã xét các mẫu lỗi|Không mở được model/.test(document.querySelector('.sentence-onnx-status').textContent), null, {timeout: 50000});
      assert.match(await status.textContent(), /Đã xét các mẫu lỗi/, errors.join('\n'));
      assert.match(await suggestions.first().textContent(), /本书/);
      await suggestions.first().getByRole('button', {name: 'Áp dụng', exact: true}).click();
      assert.equal(await draft.inputValue(), '我借了四本书。');
      await editor.getByRole('button', {name: 'Hoàn tác', exact: true}).click();
      assert.equal(await draft.inputValue(), '我借了四只书。');
      await suggestions.first().waitFor();
      await draft.fill('他喝了中药。我今天不去了。这个答案应为正数。这种感觉的来源不清楚。她说的非常重要的话我记住了。');
      await page.waitForTimeout(1450);
      assert.equal(await suggestions.count(), 0, 'Valid counterexamples are not changed by the model');

      await toggle.click();
      await page.route('**/vendor/sentence-onnx/**', route => route.abort());
      await draft.fill('🙂我以经写完作业了。');
      await toggle.click();
      await suggestions.first().waitFor({timeout: 12000});
      assert.match(await suggestions.first().textContent(), /已经/);
      await suggestions.first().getByRole('button', {name: 'Áp dụng', exact: true}).click();
      assert.equal(await draft.inputValue(), '🙂我已经写完作业了。');
      assert.equal(modelRequests.length, 4, 'Restart uses the complete cached model package');
      if (process.env.HSK_ELECTRA_PACKAGE) {
        await toggle.click();
        await page.unroute("**/vendor/sentence-onnx/**");
        await draft.fill('我昨天去超市买了三只书。');
        await trial.locator('summary').click();
        await trialFile.setInputFiles(process.env.HSK_ELECTRA_PACKAGE);
        const result = trialResults.filter({hasText: '只'});
        await result.waitFor({timeout: 90000});
        assert.match(await trialStatus.textContent(), /1 vị trí nghi vấn/);
        await page.evaluate(() => HSKStudio.navigate('home'));
        await editor.waitFor({state: 'hidden'});
        await page.evaluate(() => HSKStudio.navigate('sentence-editor'));
        await editor.waitFor({state: 'visible'});
        await trial.getByRole('button', {name: 'Kiểm tra bài này'}).click();
        await page.waitForFunction(() => /1 vị trí nghi vấn/.test(document.querySelector('.sentence-electra-status').textContent));

        assert.equal(await result.getByRole('button', {name: 'Áp dụng'}).count(), 0);
        await result.getByRole('button', {name: 'Tìm trong bài'}).click();
        assert.equal(await draft.evaluate(el => el.value.slice(el.selectionStart, el.selectionEnd)), '只');
        await draft.fill('我昨天去超市买了三本书。');
        assert.equal(await trialResults.count(), 0);
        await trial.getByRole('button', {name: 'Kiểm tra bài này'}).click();
        await page.waitForFunction(() => /Chưa thấy vị trí nghi vấn/.test(document.querySelector('.sentence-electra-status').textContent));
        await trial.getByRole('button', {name: 'Dừng model'}).click();
        assert.match(await trialStatus.textContent(), /Đã dừng/);
      }
      assert.deepEqual(errors, []);
      console.log('PASS sentence ONNX runtime, correction, undo and cached restart at width', width);
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
