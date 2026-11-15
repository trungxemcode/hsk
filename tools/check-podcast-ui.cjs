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

      // 1b. Channel filter bar, sync button & horizontal YouTube-style shelf are visible
      assert.equal(await page.locator('#podcastChannelBar').isVisible(), true, 'Channel filter bar visible');
      assert.equal(await page.locator('#podcastSyncChannelsBtn').isVisible(), true, 'Channel sync button visible');
      assert.equal(await page.locator('#podcastShelfNextBtn').count(), 1, 'Horizontal shelf next arrow exists');
      assert.equal(await page.locator('#podcastShelfPrevBtn').count(), 1, 'Horizontal shelf prev arrow exists');
      const shelfLayout = await page.evaluate(() => {
        const list = document.getElementById('podcastEpisodeList');
        const cards = [...list.querySelectorAll('.podcast-ep-card')];
        return {
          cardCount: cards.length,
          thumbsCount: list.querySelectorAll('.podcast-ep-thumb').length,
          durPillsCount: list.querySelectorAll('.podcast-ep-dur-pill').length,
          sameRow: cards.length >= 2 && Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) <= 2,
          scrollWidth: list.scrollWidth,
          clientWidth: list.clientWidth
        };
      });
      assert.equal(shelfLayout.thumbsCount, shelfLayout.cardCount, 'Every horizontal shelf card has a 16:9 thumbnail');
      assert.equal(shelfLayout.durPillsCount, shelfLayout.cardCount, 'Every horizontal shelf card shows duration pill');
      assert.equal(shelfLayout.sameRow, true, 'Episode cards arrange in a single horizontal sliding row');
      assert.ok(shelfLayout.scrollWidth > shelfLayout.clientWidth, 'Horizontal shelf overflows horizontally to scroll');

      // 1c. Video tap overlay toggles playback cleanly without needing YouTube iframe chrome
      await page.locator('#podcastVideoTap').click({ position: { x: 40, y: 28 } });
      assert.equal((await page.evaluate(() => window.HSKPodcast.getState())).playing, true);
      await page.locator('#podcastVideoTap').click({ position: { x: 40, y: 28 } });
      assert.equal((await page.evaluate(() => window.HSKPodcast.getState())).playing, false);

      // 1d. Subtitles/Mask/Episode-Meta drawer starts collapsed and opens on demand
      assert.equal(await page.locator('#podcastExtrasDrawer').isHidden(), true, 'Extras drawer should be collapsed by default');
      assert.equal(await page.locator('#podcastExtrasToggle').getAttribute('aria-expanded'), 'false');
      await page.locator('#podcastExtrasToggle').click();
      await page.locator('#podcastExtrasDrawer').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#podcastExtrasToggle').getAttribute('aria-expanded'), 'true');

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

      // 4. Seek updates active cue across the full 147-cue episode transcript
      const ep1CueCount = await page.locator('#podcastTranscriptList .podcast-cue-item').count();
      assert.ok(ep1CueCount >= 140, `Episode 1 loads full transcript (>= 140 cues, got ${ep1CueCount})`);
      await page.evaluate(() => window.HSKPodcast.seek(1150, false));
      assert.equal(await page.evaluate(() => window.HSKPodcast.getState().activeCueIdx), ep1CueCount - 1);
      const closingCueText = await page.locator('#podcastTranscriptList .podcast-cue-item.is-active .podcast-cue-vi').textContent();
      assert.match(closingCueText, /Hẹn gặp lại/i);
      await page.evaluate(() => window.HSKPodcast.seek(14, false));
      const activeIdx = await page.evaluate(() => window.HSKPodcast.getState().activeCueIdx);
      assert.equal(activeIdx, 1);
      const activeCueText = await page.locator('#podcastTranscriptList .podcast-cue-item.is-active .podcast-cue-vi').textContent();
      assert.match(activeCueText, /Tiểu Minh/i);

      // 5. Subtitle mask is crisp white card with dark text, hovering token stays legible,
      //    drag-selection highlights without opening word popover, and clicking opens popover.
      const maskVisual = await page.evaluate(() => {
        const mask = document.getElementById('podcastSubMask');
        const zh = mask.querySelector('.podcast-mask-zh');
        const ytHost = document.getElementById('podcastYtHost');
        return {
          maskBg: getComputedStyle(mask).backgroundColor,
          zhColor: getComputedStyle(zh).color,
          ytTop: parseFloat(getComputedStyle(ytHost).top || '0')
        };
      });
      assert.equal(maskVisual.maskBg, 'rgb(255, 255, 255)', `Mask background stays pure white at ${width} (${theme})`);
      assert.equal(maskVisual.zhColor, 'rgb(20, 20, 43)', `Mask text stays crisp dark ink at ${width} (${theme})`);
      assert.ok(maskVisual.ytTop < 0, `YouTube top chrome offset is cropped cleanly (got ${maskVisual.ytTop})`);

      const firstToken = page.locator('#podcastSubMask .podcast-word-token').first();
      await firstToken.hover();
      const hoverTokenColor = await firstToken.evaluate((node) => getComputedStyle(node).color);
      assert.equal(hoverTokenColor, 'rgb(20, 20, 43)', 'Hovering Chinese token never turns black-on-black');

      // Drag selection across mask text must select text cleanly and keep word popover closed
      const maskZhBox = await page.locator('#podcastSubMask .podcast-mask-zh').boundingBox();
      if (maskZhBox && maskZhBox.width > 60) {
        await page.mouse.move(maskZhBox.x + 12, maskZhBox.y + maskZhBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(maskZhBox.x + maskZhBox.width * 0.65, maskZhBox.y + maskZhBox.height / 2, { steps: 6 });
        await page.mouse.up();
        const selCount = await page.evaluate(() => String(window.getSelection?.() || '').trim().length);
        assert.ok(selCount > 0, 'Subtitle mask Chinese text supports Word-style drag selection');
        assert.equal(await page.locator('#podcastWordPopover').isHidden(), true, 'Drag-selecting subtitle does not pop dictionary');
        await page.evaluate(() => window.getSelection?.()?.removeAllRanges?.());
      }
      const shellScrollTop = await page.evaluate(() => document.getElementById('podcastVideoShell').scrollTop);
      assert.equal(shellScrollTop, 0, 'Hover/drag inside video shell never scrolls overflow clip container');

      // Mouse press-drag-swipe on episode shelf scrolls horizontally without switching active episode
      await page.locator('#podcastEpisodeList').scrollIntoViewIfNeeded();
      const shelfDragCheck = await page.evaluate(() => {
        const shelf = document.getElementById('podcastEpisodeList');
        return {
          rect: shelf.getBoundingClientRect().toJSON(),
          canScroll: shelf.scrollWidth > shelf.clientWidth,
          scrollBefore: shelf.scrollLeft,
          epBefore: window.HSKPodcast.getState().currentEpisodeId
        };
      });
      if (shelfDragCheck.canScroll) {
        const dragY = shelfDragCheck.rect.top + shelfDragCheck.rect.height / 2;
        const dragStartX = shelfDragCheck.rect.left + Math.min(shelfDragCheck.rect.width - 24, 300);
        await page.mouse.move(dragStartX, dragY);
        await page.mouse.down();
        await page.mouse.move(dragStartX - 200, dragY, { steps: 8 });
        await page.mouse.up();
        const shelfAfter = await page.evaluate(() => ({
          scrollAfter: document.getElementById('podcastEpisodeList').scrollLeft,
          epAfter: window.HSKPodcast.getState().currentEpisodeId
        }));
        assert.ok(shelfAfter.scrollAfter > shelfDragCheck.scrollBefore + 50, 'Mouse drag swipes Kho bai nghe shelf smoothly');
        assert.equal(shelfAfter.epAfter, shelfDragCheck.epBefore, 'Mouse drag swipe does not accidentally trigger episode card click');
      }

      await firstToken.click();
      await page.locator('#podcastWordPopover').waitFor({ state: 'visible' });
      assert.ok((await page.locator('#podcastSaveWordBtn').isVisible()) === true);
      await page.locator('#podcastClosePopoverBtn').click();
      assert.equal(await page.locator('#podcastWordPopover').isHidden(), true);

      // 5b. Selecting a lazy-loaded cuesUrl episode & @ChineseDailyPodcast filter loads full 4-layer script
      const lctpCard = page.locator('.podcast-ep-card[data-yt-id="CqNO2psWIyU"]').first();
      await lctpCard.scrollIntoViewIfNeeded();
      await lctpCard.click();
      await page.waitForFunction(
        () => document.querySelectorAll('#podcastTranscriptList .podcast-cue-item').length >= 400,
        null,
        { timeout: 10000 }
      );
      const lctpCount = await page.locator('#podcastTranscriptList .podcast-cue-item').count();
      assert.equal(lctpCount, 433, `Expected 433 cues for CqNO2psWIyU, got ${lctpCount}`);

      const lctpGreetingCard = page.locator('.podcast-ep-card[data-yt-id="aYrCe-KTmTg"]').first();
      await lctpGreetingCard.scrollIntoViewIfNeeded();
      await lctpGreetingCard.click();
      await page.waitForFunction(
        () => document.querySelectorAll('#podcastTranscriptList .podcast-cue-item').length >= 500,
        null,
        { timeout: 10000 }
      );
      assert.equal(await page.locator('#podcastTranscriptList .podcast-cue-item').count(), 519, 'Upgraded starter aYrCe-KTmTg loads 519 cues');

      const baobaoCard = page.locator('.podcast-ep-card[data-yt-id="QInUMEyKxdA"]').first();
      await baobaoCard.scrollIntoViewIfNeeded();
      await baobaoCard.click();
      await page.waitForFunction(
        () => document.querySelectorAll('#podcastTranscriptList .podcast-cue-item').length === 311,
        null,
        { timeout: 10000 }
      );
      assert.equal(await page.locator('#podcastTranscriptList .podcast-cue-item').count(), 311, 'New BaoBao episode QInUMEyKxdA loads 311 cues');

      const cdpChip = page.locator('#podcastChannelBar .podcast-channel-chip[data-handle="@ChineseDailyPodcast"]');
      assert.equal(await cdpChip.isVisible(), true, '@ChineseDailyPodcast chip is visible');
      await cdpChip.click();
      const cdpCard = page.locator('.podcast-ep-card[data-yt-id="UKUY_0HSRE8"]').first();
      await cdpCard.scrollIntoViewIfNeeded();
      await cdpCard.click();
      await page.waitForFunction(
        () => document.querySelectorAll('#podcastTranscriptList .podcast-cue-item').length >= 350,
        null,
        { timeout: 10000 }
      );
      assert.equal(await page.locator('#podcastTranscriptList .podcast-cue-item').count(), 353);
      await page.locator('#podcastChannelBar .podcast-channel-chip').first().click();

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
