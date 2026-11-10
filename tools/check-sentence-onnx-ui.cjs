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
      await toggle.click();
      await page.waitForFunction(() => /Đã kiểm tra tại máy|Không mở được model/.test(document.querySelector('.sentence-onnx-status').textContent), null, {timeout: 50000});
      assert.match(await status.textContent(), /Đã kiểm tra tại máy/, errors.join('\n'));
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
      assert.deepEqual(errors, []);
      console.log('PASS sentence ONNX runtime, correction, undo and cached restart at width', width);
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
