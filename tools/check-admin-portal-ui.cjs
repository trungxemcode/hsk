const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');

const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

(async () => {
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const cleanUrl = new URL(req.url, 'http://local').pathname;
    const filePath = path.resolve(root, '.' + cleanUrl);
    if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE });
  const origin = `http://127.0.0.1:${server.address().port}`;

  try {
    for (const { width, height, theme } of [
      { width: 1440, height: 900, theme: 'light' },
      { width: 390, height: 844, theme: 'dark' }
    ]) {
      const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (err) => errors.push(String(err)));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('ERR_FAILED')) errors.push(msg.text());
      });

      await page.route('https://**/*', (r) => r.abort());
      await page.route('**/account-config.json', (r) => r.fulfill({ contentType: 'application/json', body: '{"enabled":false}' }));
      await page.route('**/translation-config.json', (r) => r.fulfill({ contentType: 'application/json', body: '{"enabled":false,"endpoint":""}' }));

      // 1. Open standalone admin.html
      await page.goto(`${origin}/admin.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.HSKAdminPortalCore && window.HSKAdminPortal && document.getElementById('apKpiExams'));

      if (theme === 'dark') {
        await page.locator('#apThemeBtn').click();
        assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
      }

      // Verify zero horizontal overflow
      const adminOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(adminOverflow <= 2, `admin.html horizontal overflow ${adminOverflow} at ${width}x${height}`);

      // Verify all 5 tabs switch cleanly
      for (const tabId of ['exams', 'media', 'docs', 'access', 'overview']) {
        await page.locator(`[data-ap-tab="${tabId}"]`).click();
        assert.equal(await page.locator(`#panel-${tabId}`).isVisible(), true, `Tab ${tabId} should be visible`);
      }

      // Update System Endpoints
      await page.locator('#apEpExamManifest').fill('https://cdn.example.com/custom-manifest.json');
      await page.locator('#apEndpointsForm button[type="submit"]').click();

      // Add a VIP external exam in Exams tab
      await page.locator('[data-ap-tab="exams"]').click();
      await page.locator('#apExamId').fill('hsk4-vip-extra');
      await page.locator('#apExamLevel').selectOption('4');
      await page.locator('#apExamTitle').fill('Đề HSK 4 VIP Drive');
      await page.locator('#apExamProvider').selectOption('drive');
      await page.locator('#apExamAccess').selectOption('vip');
      await page.locator('#apExamUrl').fill('https://drive.google.com/file/d/hsk4vip');
      await page.locator('#apExamSubmitBtn').click();
      assert.equal(await page.locator('#apExamList [data-exam-id="hsk4-vip-extra"]').count(), 1);

      // Add a public music track + VIP podcast in Media tab
      await page.locator('[data-ap-tab="media"]').click();
      await page.locator('#apMusicTitle').fill('Nhạc HSK Đề Xuất');
      await page.locator('#apMusicArtist').fill('Ca sĩ HSK');
      await page.locator('#apMusicLevel').selectOption('2');
      await page.locator('#apMusicAccess').selectOption('public');
      await page.locator('#apMusicUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.locator('#apMusicSubmitBtn').click();
      assert.equal(await page.locator('#apMusicList .ap-item-row').count(), 1);

      assert.equal(await page.locator('#apSyncYoutubeChannelsBtn').isVisible(), true, 'Channel sync button should be visible');
      await page.locator('#apPodcastTitle').fill('Podcast Admin Test');
      await page.locator('#apPodcastLevel').selectOption('3');
      await page.locator('#apPodcastAccess').selectOption('vip');
      await page.locator('#apPodcastUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.locator('#apPodcastSubtitle').fill('0:00 Hello friends\n0:04 Let us learn Chinese');
      await page.locator('#apPodcastSubmitBtn').click();
      assert.equal(await page.locator('#apPodcastList .ap-item-row').count(), 9);

      // Add a public study document in Docs tab
      await page.locator('[data-ap-tab="docs"]').click();
      await page.locator('#apDocTitle').fill('Ngữ pháp HSK 3 PDF');
      await page.locator('#apDocLevel').selectOption('3');
      await page.locator('#apDocKind').selectOption('pdf');
      await page.locator('#apDocAccess').selectOption('public');
      await page.locator('#apDocUrl').fill('https://example.com/hsk3.pdf');
      await page.locator('#apDocSubmitBtn').click();
      assert.equal(await page.locator('#apDocList .ap-item-row').count(), 1);

      // Set feature access: podcast -> vip, translator -> hidden
      await page.locator('[data-ap-tab="access"]').click();
      await page.locator('[data-feature-select="podcast"]').selectOption('vip');
      await page.locator('[data-feature-select="translator"]').selectOption('hidden');
      await page.locator('#apSaveLocalBtn').click();

      const savedManifest = await page.evaluate(() => JSON.parse(localStorage.getItem('hsk_admin_manifest_v1')));
      assert.equal(savedManifest.endpoints.examManifestUrl, 'https://cdn.example.com/custom-manifest.json');
      assert.equal(savedManifest.features.podcast, 'vip');
      assert.equal(savedManifest.features.translator, 'hidden');
      assert.equal(savedManifest.documents.length, 1);

      // 2. Navigate to learner app /index.html in same context and verify enforcement
      await page.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.HSKStudio && window.HSKLessons && window.HSKResourceSync && !document.getElementById('studioHome')?.hidden);

      // Hidden feature: translator buttons hidden
      const translatorHiddenCount = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('[data-studio-go="translator"]')];
        return nodes.length > 0 && nodes.every((n) => n.hidden === true);
      });
      assert.equal(translatorHiddenCount, true, 'Hidden feature buttons must be hidden for learner');

      // Regular user clicking VIP-restricted Podcast stays blocked & shows notice
      await page.evaluate(() => window.HSKStudio.navigate('podcast'));
      assert.equal(await page.locator('#podcastPanel').isVisible(), false, 'Podcast should remain closed for regular user when VIP-only');
      assert.ok((await page.locator('#adminResourceNotice').textContent()).includes('VIP'));

      // Lessons panel shows Admin document box
      await page.evaluate(() => window.HSKStudio.navigate('lessons'));
      await page.locator('#adminDocumentsBox').waitFor({ state: 'visible' });
      assert.ok((await page.locator('#adminDocumentsBox').textContent()).includes('Ngữ pháp HSK 3 PDF'));

      // Promote role to VIP -> Podcast opens and shows Admin Podcast episode; Study4 HSK 4 shows Admin extra exam
      await page.evaluate(() => window.HSKResourceSync.setRole('vip'));
      await page.evaluate(() => window.HSKStudio.navigate('podcast'));
      await page.locator('#podcastPanel').waitFor({ state: 'visible' });
      assert.ok((await page.locator('#podcastEpisodeList').textContent()).includes('Podcast Admin Test'));

      await page.evaluate(() => window.HSKStudio.navigate('study4'));
      await page.locator('#study4PracticePanel').waitFor({ state: 'visible' });
      await page.locator('#study4Level').selectOption('4');
      assert.ok((await page.locator('#adminExtraExamsBox').textContent()).includes('Đề HSK 4 VIP Drive'));

      // Reset to default manifest -> admin boxes become hidden again
      await page.evaluate(() => window.HSKResourceSync.setManifest(window.HSKAdminPortalCore.createDefaultManifest()));
      assert.equal(await page.evaluate(() => document.getElementById('adminDocumentsBox')?.hidden), true);

      assert.deepEqual(errors, [], `Zero runtime errors expected at ${width}x${height}, got: ${errors.join('; ')}`);
      await context.close();
    }

    console.log('PASS: admin.html & learner enforcement verified at 1440x900 (light) and 390x844 (dark).');
  } finally {
    await browser.close();
    server.close();
  }
})();
