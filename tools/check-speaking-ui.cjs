const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.gz': 'application/gzip'
};

(async () => {
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const reqPath = '.' + new URL(req.url, 'http://127.0.0.1').pathname;
    const f = path.resolve(root, reqPath === './' ? 'index.html' : reqPath);
    if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
    res.end(fs.readFileSync(f));
  });

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });

  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://**/*', r => r.abort());
      await page.route('**/account-config.json', r => r.fulfill({ body: '{"enabled":false}', contentType: 'application/json' }));

      await page.addInitScript(() => {
        window.__spoken = [];
        window.SpeechSynthesisUtterance = class {
          constructor(text) { this.text = text; }
        };
        Object.defineProperty(window, 'speechSynthesis', {
          configurable: true,
          value: {
            getVoices: () => [{ lang: 'zh-CN', name: 'Mandarin', localService: true }],
            cancel() {},
            speak(u) {
              window.__spoken.push(u.text);
              setTimeout(() => u.onend?.(), 30);
            }
          }
        });
      });

      await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.HSKLessonNav && window.HSKLessons && window.HSKSpeaking && window.HSKRecorder);

      await page.evaluate(async () => {
        window.HSKStudio?.navigate?.('lessons');
        history.replaceState(null, '', '#lesson/standard-1-01');
        await window.HSKLessonNav.open();
      });

      const selectSection = async (id, label) => {
        const picker = page.locator('.lesson-section-picker select');
        if (await picker.isVisible()) {
          await picker.selectOption(id);
        } else {
          await page.locator('.lesson-section-nav').getByRole('button', { name: label, exact: true }).click();
        }
      };

      await selectSection('overview', 'Từ vựng');
      const cardSpeakBtn = page.locator('.lesson-card .speaking-practice-btn').first();
      await cardSpeakBtn.waitFor();
      await cardSpeakBtn.click();

      const modal = page.locator('.speaking-modal');
      await modal.waitFor();

      // Configure deterministic harmonic audio matching expected syllable tones of the open word.
      await page.evaluate(() => {
        const text = document.querySelector('.speaking-target-han').textContent.trim();
        window.HSKRecorder.setMockProvider(() => {
          const sr = 16000;
          const syllables = window.HSKPitchCore.parseSyllables(text, document.querySelector('.lesson-card .lesson-pinyin')?.textContent || '');
          const chunks = [];
          const pushContour = (f0, fMid, f1, sec) => {
            const n = Math.round(sec * sr);
            const buf = new Float32Array(n);
            let phase = 0;
            for (let i = 0; i < n; i++) {
              const t = i / (n - 1);
              let hz;
              if (fMid !== null) {
                hz = t <= 0.48
                  ? f0 + (fMid - f0) * Math.sin(((t / 0.48) * Math.PI) / 2)
                  : fMid + (f1 - fMid) * Math.pow((t - 0.48) / 0.52, 1.15);
              } else {
                hz = f0 + (f1 - f0) * t;
              }
              phase += (2 * Math.PI * hz) / sr;
              const env = Math.sin((Math.PI / 2) * Math.min(1, i / (0.02 * sr))) * Math.sin((Math.PI / 2) * Math.min(1, (n - 1 - i) / (0.02 * sr)));
              buf[i] = env * 0.6 * Math.sin(phase);
            }
            chunks.push(buf);
          };
          syllables.forEach((s, idx) => {
            if (idx > 0) chunks.push(new Float32Array(Math.round(0.08 * sr)));
            if (s.spokenTone === 1) pushContour(220, null, 220, 0.36);
            else if (s.spokenTone === 2) pushContour(150, null, 238, 0.36);
            else if (s.spokenTone === 3) pushContour(175, 115, 168, 0.42);
            else if (s.spokenTone === 4) pushContour(250, null, 125, 0.34);
            else pushContour(180, null, 165, 0.25);
          });
          const total = chunks.reduce((n, c) => n + c.length, 0) + Math.round(0.1 * sr);
          const out = new Float32Array(total);
          let off = Math.round(0.05 * sr);
          for (const c of chunks) { out.set(c, off); off += c.length; }
          return { pcm: out, sampleRate: sr, transcript: text, recognitionSupported: true };
        });
      });

      const recBtn = modal.locator('.speaking-record-btn');
      await recBtn.click();
      await page.waitForTimeout(120);
      await recBtn.click();

      const resultBox = modal.locator('.speaking-result-box');
      await resultBox.waitFor();
      const scoreText = await modal.locator('.speaking-score-pill').innerText();
      assert.match(scoreText, /Độ khớp:\s*(7[5-9]|[89]\d|100)%/, 'Expected matched tone score >= 75%, got ' + scoreText);
      assert.match(await modal.locator('.speaking-transcript').innerText(), /Nhận diện giọng nói:/);
      assert.equal(await modal.locator('.speaking-controls button').nth(2).isDisabled(), false, 'Replay own voice should be enabled');
      assert.equal(await modal.locator('.speaking-controls button').nth(3).isDisabled(), false, 'Compare A/B should be enabled');

      for (const theme of ['light', 'dark']) {
        await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
        const overflow = await modal.evaluate(el => el.scrollWidth > el.clientWidth + 1);
        assert.equal(overflow, false, `Speaking modal overflow at ${viewport.width}px (${theme})`);
        const mBox = await modal.boundingBox();
        assert.ok(mBox && Math.abs((mBox.x + mBox.width / 2) - viewport.width / 2) <= 4, `Speaking modal must be centered horizontally: ${JSON.stringify(mBox)}`);
        if (viewport.width === 1440 && theme === 'light') {
          assert.ok(mBox.width >= 760 && mBox.width <= 880, `Desktop speaking modal width should be 760–880px for comfortable reading, got ${mBox.width}`);
          const vScroll = await modal.evaluate(el => el.scrollHeight > el.clientHeight + 4);
          assert.equal(vScroll, false, 'Desktop speaking modal should fit in 1 screen without vertical scrollbar');
        }
        if (viewport.width === 390 && theme === 'light') {
          assert.ok(mBox.height <= 620, `Mobile speaking modal should stay compact (<= 620px), got ${mBox.height}`);
          const chipHeights = await modal.locator('.speaking-syl-chip').evaluateAll(ns => ns.map(n => n.getBoundingClientRect().height));
          assert.ok(chipHeights.length > 0 && chipHeights.every(h => h <= 36), `Mobile syllable chips must stay snug (<= 36px), got ${JSON.stringify(chipHeights)}`);
        }
      }

      // Sequential prev/next navigation without closing the modal
      const navCount = modal.locator('.speaking-nav-count');
      if (await navCount.isVisible()) {
        const firstText = await modal.locator('.speaking-target-han').innerText();
        const firstCounter = await navCount.innerText();
        assert.match(firstCounter, /^1\s*\/\s*\d+/);
        await modal.getByRole('button', { name: 'Từ hoặc câu tiếp theo', exact: true }).click();
        const nextText = await modal.locator('.speaking-target-han').innerText();
        assert.notEqual(nextText, firstText, 'Clicking › advances directly to next word');
        assert.match(await navCount.innerText(), /^2\s*\/\s*\d+/);
      }

      await modal.getByRole('button', { name: 'Đóng', exact: true }).click();
      await modal.waitFor({ state: 'detached' });

      await page.evaluate(() => window.HSKSpeaking.open({ text: '妈妈妈', pinyin: 'mā mā mā' }));
      for (const [transcript, syllableCount] of [['妈', 1], ['妈妈妈', 3], ['', 1]]) {
        await page.evaluate(transcript => {
          const sampleRate = 16000;
          const count = transcript.length || 1;
          const pcm = new Float32Array(6400 + count * 9600);
          const syllable = Float32Array.from({ length: 7200 }, (_, i) => 0.5 * Math.sin(2 * Math.PI * 220 * i / sampleRate));
          for (let i = 0; i < count; i++) pcm.set(syllable, 3200 + i * 9600);
          window.HSKRecorder.setMockProvider(() => ({ pcm, sampleRate, transcript }));
        }, transcript);
        await recBtn.click();
        await page.waitForFunction(() => document.querySelector('.speaking-record-btn')?.classList.contains('is-recording'));
        await recBtn.click();
        await modal.getByRole('button', { name: /Thu lại/ }).waitFor();
        await resultBox.waitFor();
        assert.equal(await modal.locator('.speaking-syl-chip.is-ok').count(), transcript ? syllableCount : 0);
        assert.equal(await modal.locator('.speaking-syl-chip.is-warn').count(), transcript ? 3 - syllableCount : 3);
        if (transcript) assert.match(await modal.locator('.speaking-transcript').innerText(), new RegExp(`${syllableCount}/3`));
        else assert.match(await modal.locator('.speaking-score-head').innerText(), /Chỉ chấm thanh điệu/);
      }
      await modal.getByRole('button', { name: 'Đóng', exact: true }).click();

      if (viewport.width === 390) {
        const assetPayload = Buffer.from('mock-sherpa-asr-runtime-v1');
        const assetSha = crypto.createHash('sha256').update(assetPayload).digest('hex');
        const mockAssetUrl = 'https://cdn.jsdelivr.net/npm/hsk-mock-asr.js';
        await page.route('**/speaking-asr-config.json', r => r.fulfill({
          json: {
            schema: 2,
            cacheName: 'hsk-speaking-asr-offline-v1',
            assets: { runtime: { url: mockAssetUrl, sha256: assetSha, bytes: assetPayload.length, type: 'text/javascript' } }
          }
        }));
        await page.route(mockAssetUrl, r => r.fulfill({
          status: 200,
          headers: { 'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*' },
          body: assetPayload
        }));

        await cardSpeakBtn.click();
        await modal.waitFor();
        const packBtn = modal.locator('.speaking-pack-btn');
        await packBtn.waitFor();
        await packBtn.click();
        await page.waitForFunction(() => document.querySelector('.speaking-pack-btn')?.classList.contains('is-installed'));
        assert.match(await packBtn.innerText(), /Xóa gói Offline/);

        // Direct deletion in speaking modal
        await packBtn.click();
        await page.waitForFunction(() => !document.querySelector('.speaking-pack-btn')?.classList.contains('is-installed'));
        assert.match(await packBtn.innerText(), /Tải gói nhận diện Offline/);

        // Re-install and verify it also appears inside Settings -> Dọn dẹp dung lượng and deletes cleanly
        await packBtn.click();
        await page.waitForFunction(() => document.querySelector('.speaking-pack-btn')?.classList.contains('is-installed'));
        await modal.getByRole('button', { name: 'Đóng', exact: true }).click();
        await modal.waitFor({ state: 'detached' });

        await page.evaluate(() => window.HSKStudio.navigate('account'));
        await page.locator('#storageCleanupOpen').click();
        await page.waitForFunction(() => !document.querySelector('#storageCleanupStatus')?.textContent?.includes('Đang tính'));
        const cleanupCheck = page.getByRole('checkbox', { name: 'Gói nhận diện giọng nói tiếng Trung offline', exact: true });
        await cleanupCheck.check();
        await page.locator('#storageCleanupDelete').click();
        await page.waitForFunction(() => document.querySelector('#storageCleanupStatus')?.textContent?.includes('Đã xóa 1 / 1'));
        assert.equal(await page.evaluate(async () => (await window.HSKSpeakingOfflinePack.downloaded()).installed), false);
        await page.locator('#storageCleanupClose').click();

        // Navigate back to lessons for dialogue checks
        await page.evaluate(async () => {
          window.HSKStudio.navigate('lessons');
          history.replaceState(null, '', '#lesson/standard-1-01');
          await window.HSKLessonNav.open();
        });
      }

      // Dialogue heading compact button check
      await selectSection('reading', 'Đọc & hội thoại');
      const lineBtn = page.locator('.lesson-reading-body .lesson-language-heading .speaking-practice-btn').first();
      await lineBtn.waitFor();
      const box = await lineBtn.boundingBox();
      assert.ok(box && box.height >= 44 && box.width >= 44, 'Compact dialogue speaking button >= 44x44');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, 'No horizontal overflow on lesson page');

      assert.deepEqual(errors, [], 'Runtime errors: ' + errors.join('; '));
      await page.close();
    }

    console.log('PASS check-speaking-ui: vocabulary + dialogue triggers, tone pitch contour scoring, ASR transcript display, replay/compare controls, 390/1440 light/dark.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
