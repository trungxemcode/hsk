const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');

const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

(async () => {
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const filePath = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
    if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE });
  const baseUrl = `http://127.0.0.1:${server.address().port}/index.html`;

  try {
    for (const { width, height, theme } of [
      { width: 1440, height: 900, theme: 'light' },
      { width: 390, height: 844, theme: 'dark' }
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, serviceWorkers: 'block' });
      await page.route('https://**/*', (r) => r.abort());
      await page.route('**/account-config.json', (r) => r.fulfill({ contentType: 'application/json', body: '{"enabled":false}' }));
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.HSKStudio && window.HSKLessons && window.HSKPodcast && window.HSKPodcastCore && !document.getElementById('studioHome')?.hidden);
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      }

      // 1. Home shortcut card exists and navigates to #podcastPanel
      const homeCard = page.locator('#studioHome .home-podcast-chill[data-studio-go="podcast"]');
      assert.equal(await homeCard.isVisible(), true, `Home podcast shortcut visible at ${width}`);
      await homeCard.click();
      await page.locator('#podcastPanel').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#podcastSubMask').isVisible(), true, 'English subtitle mask visible');

      // 1b. Channel filter bar & sync button are visible
      assert.equal(await page.locator('#podcastChannelBar').isVisible(), true, 'Channel filter bar visible');
      assert.equal(await page.locator('#podcastSyncChannelsBtn').isVisible(), true, 'Channel sync button visible');

      // 2. Mask bottom & height sliders update overlay styles & CSS vars
      await page.locator('#podcastMaskBottomRange').fill('10');
      await page.locator('#podcastMaskBottomRange').dispatchEvent('input');
      await page.locator('#podcastMaskHeightRange').fill('32');
      await page.locator('#podcastMaskHeightRange').dispatchEvent('input');
      const maskVars = await page.evaluate(() => {
        const el = document.getElementById('podcastSubMask');
        return {
          bottom: el.style.getPropertyValue('--podcast-mask-bottom'),
          height: el.style.getPropertyValue('--podcast-mask-height'),
          solid: el.classList.contains('is-solid')
        };
      });
      assert.equal(maskVars.bottom, '10%');
      assert.equal(maskVars.height, '32%');
      assert.equal(maskVars.solid, true);

      // Toggle mask style between solid & blur
      await page.locator('#podcastMaskStyleBtn').click();
      assert.equal(await page.locator('#podcastSubMask.is-blur').count(), 1);
      await page.locator('#podcastMaskStyleBtn').click();

      // 3. Layer toggles (Zh, Pinyin, Vi, En)
      assert.ok((await page.locator('#podcastSubMask .podcast-mask-zh').count()) === 1);
      assert.ok((await page.locator('#podcastSubMask .podcast-mask-vi').count()) === 1);
      assert.equal(await page.locator('#podcastSubMask .podcast-mask-en').count(), 0);
      await page.locator('#podcastToggleEnBtn').click();
      assert.equal(await page.locator('#podcastSubMask .podcast-mask-en').count(), 1);
      await page.locator('#podcastToggleZhBtn').click();
      assert.equal(await page.locator('#podcastSubMask .podcast-mask-zh').count(), 0);
      await page.locator('#podcastToggleZhBtn').click();

      // 4. Seek updates active cue in both mask & transcript list
      await page.evaluate(() => window.HSKPodcast.seek(14, false));
      const activeIdx = await page.evaluate(() => window.HSKPodcast.getState().activeCueIdx);
      assert.equal(activeIdx, 1);
      const activeCueText = await page.locator('#podcastTranscriptList .podcast-cue-item.is-active .podcast-cue-vi').textContent();
      assert.match(activeCueText, /Tiểu Minh/i);

      // 5. Clicking a Chinese word token opens lookup/save popover
      const firstToken = page.locator('#podcastSubMask .podcast-word-token').first();
      await firstToken.click();
      await page.locator('#podcastWordPopover').waitFor({ state: 'visible' });
      assert.ok((await page.locator('#podcastSaveWordBtn').isVisible()) === true);
      await page.locator('#podcastClosePopoverBtn').click();
      assert.equal(await page.locator('#podcastWordPopover').isHidden(), true);

      // 6. Import English SRT subtitles via drawer & Quick Load
      await page.locator('#podcastToggleImportBtn').click();
      await page.locator('#podcastImportBox').waitFor({ state: 'visible' });
      await page.locator('#podcastUrlInput').fill('https://youtu.be/dQw4w9WgXcQ');
      await page.locator('#podcastTitleInput').fill('English Test Episode');
      await page.locator('#podcastSubInput').fill(
        '1\n00:00:00,000 --> 00:00:05,000\nWelcome back to the daily English show.\n\n2\n00:00:05,500 --> 00:00:11,000\nLet us learn new vocabulary together.'
      );
      await page.locator('#podcastQuickLoadBtn').click();
      await page.locator('#podcastImportBox').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('#podcastTranscriptList .podcast-cue-item').count(), 2);
      assert.match(await page.locator('#podcastEpMeta .podcast-meta-title').textContent(), /English Test Episode/);

      // 7. No horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `Horizontal overflow at ${width}px: ${overflow}`);

      console.log(`PASS podcast UI ${width}x${height} (${theme})`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
