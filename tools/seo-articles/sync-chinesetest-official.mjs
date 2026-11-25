#!/usr/bin/env node
/**
 * Official ChineseTest (chinesetest.cn) Public Information Sync.
 *
 * Maps the legacy entry URL https://www.chinesetest.cn/goKdInfoOrPlan.do
 * to the current public ChineseTest Nuxt portal pages:
 *  - Test calendars & result releasing dates (auto-discovered from homepage + /test-dates)
 *  - Official Vietnam test centers (/test-centers, paginated across all pages)
 *  - Exam structure & candidate regulations (/HSK, /HSKK, /regulation)
 *  - Official exam announcements & changes (pinned homepage announcement + /news)
 *
 * Uses normal public page navigation in Playwright Chromium (no auth bypass,
 * no CAPTCHA solving, no credentialed endpoints).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
export const SNAPSHOT_PATH = path.join(ROOT, 'content/seo-articles/chinesetest-official.json');
export const SEEN_NEWS_PATH = path.join(ROOT, 'content/seo-articles/seen-news.json');
export const LEGACY_SOURCE_URL = 'https://www.chinesetest.cn/goKdInfoOrPlan.do';
export const CHINESETEST_ORIGIN = 'https://www.chinesetest.cn';

const MONTH_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?$/i;
const DAY_DATE_RE = /^\d{1,2}(?:st|nd|rd|th)\s+[A-Za-z]+/i;

/**
 * Parses extracted table objects `{ heading, rows }` (or plain `rows` arrays)
 * from ChineseTest official Test Calendar announcements into structured HSK 1-6
 * and HSK 7-9 schedules, excluding YCT / BCT / OPIc tables.
 */
export function parseCalendarTables(tables) {
  const result = { hsk1to6: [], hsk7to9: [] };
  for (const item of tables || []) {
    const rows = Array.isArray(item) ? item : item?.rows || [];
    const heading = Array.isArray(item) ? '' : String(item?.heading || '');
    const flatHeader = `${heading} ${rows.slice(0, 3).map((r) => r.join(' ')).join(' ')}`;

    if (/\b(YCT|BCT|OPIc|Youth|Business)\b/i.test(flatHeader)) continue;

    const isHsk79 =
      /7\s*[-–]\s*9|Levels?\s*7/i.test(flatHeader) ||
      (!/1\s*[-–]\s*6|Speaking\s*Test/i.test(flatHeader) &&
        rows.some((r) => (r.length === 5 && MONTH_RE.test(r[0] || '')) || (r.length === 4 && DAY_DATE_RE.test(r[0] || ''))));

    const isHsk16 =
      !isHsk79 &&
      (/HSK/i.test(flatHeader) || rows.some((r) => r.length === 8 && MONTH_RE.test(r[0] || '')));

    let lastMonth = '';
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 4) continue;
      const first = (row[0] || '').trim();
      const hasMonthCol = MONTH_RE.test(first);
      const hasShiftedDate = !hasMonthCol && DAY_DATE_RE.test(first);
      if (!hasMonthCol && !hasShiftedDate) continue;

      if (hasMonthCol) lastMonth = first;

      if (isHsk16) {
        const cols = hasMonthCol ? row : [lastMonth, ...row];
        if (cols.length >= 8 && DAY_DATE_RE.test(cols[1] || '')) {
          result.hsk1to6.push({
            month: cols[0],
            testDate: cols[1],
            format: cols[2],
            regDeadlinePbt: cols[3],
            regDeadlineIbt: cols[4],
            resultDatePbt: cols[5],
            resultDateIbtHsk: cols[6],
            resultDateIbtHskk: cols[7],
          });
        } else if (!hasMonthCol && row.length === 7 && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(first)) {
          // Legacy compact 7-col fixture compatibility
          result.hsk1to6.push({
            month: first.slice(0, 4).replace(/\s+$/, ''),
            testDate: row[0],
            format: row[1],
            regDeadlinePbt: row[2],
            regDeadlineIbt: row[3],
            resultDatePbt: row[4],
            resultDateIbtHsk: row[5],
            resultDateIbtHskk: row[6],
          });
        }
      } else if (isHsk79) {
        const cols = hasMonthCol ? row : [lastMonth, ...row];
        if (cols.length >= 5 && DAY_DATE_RE.test(cols[1] || '')) {
          result.hsk7to9.push({
            month: cols[0],
            testDate: cols[1],
            format: cols[2],
            regDeadline: cols[3],
            resultDate: cols[4],
          });
        } else if (row.length === 4) {
          result.hsk7to9.push({
            month: lastMonth,
            testDate: row[0],
            format: row[1],
            regDeadline: row[2],
            resultDate: row[3],
          });
        }
      }
    }
  }
  return result;
}

export function dedupeRepeatedLead(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const half = Math.floor(clean.length / 2);
  for (let len = half; len >= 6; len--) {
    const prefix = clean.slice(0, len).trim();
    const rest = clean.slice(len).trim();
    if (prefix.length >= 6 && (rest === prefix || rest.startsWith(prefix + ' '))) {
      return `${prefix} ${rest.slice(prefix.length).trim()}`.trim();
    }
  }
  return clean;
}

export function extractNewsId(hrefOrUrl) {
  const m = /\/news\/([A-Za-z0-9_-]+)/i.exec(String(hrefOrUrl || ''));
  return m ? m[1] : '';
}

export function cleanNewsHeadline(rawText) {
  let s = String(rawText || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*(?:View Details|查看详情)(?:\s+\d{1,2}\s+\d{4}年\d{1,2}月)?.*$/i, '');
  s = s.replace(/\s*\d{4}-\d{2}-\d{2}\s*(?:More|更多)?\s*$/i, '');
  s = s.replace(/\s+(?:More|View Details|Announcement|查看详情|更多)\s*$/i, '');
  return dedupeRepeatedLead(s).trim();
}

export function loadSeenNews(seenPath = SEEN_NEWS_PATH) {
  const empty = { schema: 1, updatedAt: new Date().toISOString().slice(0, 10), seenIds: [], history: [] };
  if (!fs.existsSync(seenPath)) return empty;
  try {
    const parsed = JSON.parse(fs.readFileSync(seenPath, 'utf8'));
    return {
      schema: 1,
      updatedAt: String(parsed?.updatedAt || empty.updatedAt),
      seenIds: Array.isArray(parsed?.seenIds) ? parsed.seenIds.map((id) => String(id).trim()).filter(Boolean) : [],
      history: Array.isArray(parsed?.history) ? parsed.history : [],
    };
  } catch (_) {
    return empty;
  }
}

export function saveSeenNews(ledger, seenPath = SEEN_NEWS_PATH) {
  const uniqueIds = Array.from(new Set((ledger?.seenIds || []).map((id) => String(id).trim()).filter(Boolean)));
  const clean = {
    schema: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    seenIds: uniqueIds,
    history: Array.isArray(ledger?.history) ? ledger.history.slice(0, 200) : [],
  };
  fs.mkdirSync(path.dirname(seenPath), { recursive: true });
  fs.writeFileSync(seenPath, JSON.stringify(clean, null, 2) + '\n', 'utf8');
  return clean;
}

export function markNewsSeen(item, seenPath = SEEN_NEWS_PATH) {
  const id = String(item?.id || extractNewsId(item?.url) || '').trim();
  if (!id) return loadSeenNews(seenPath);
  const ledger = loadSeenNews(seenPath);
  if (!ledger.seenIds.includes(id)) ledger.seenIds.unshift(id);
  const filteredHistory = ledger.history.filter((h) => String(h?.id || '') !== id);
  filteredHistory.unshift({
    id,
    url: item?.url || `${CHINESETEST_ORIGIN}/news/${id}`,
    title: cleanNewsHeadline(item?.title || '') || `ChineseTest News ${id}`,
    ...(item?.articleSlug ? { articleSlug: item.articleSlug } : {}),
    recordedAt: new Date().toISOString().slice(0, 10),
  });
  ledger.history = filteredHistory;
  return saveSeenNews(ledger, seenPath);
}

export function findUnseenNewsItems(discoveredItems, seenIds = [], existingArticles = []) {
  const seen = new Set((seenIds || []).map((id) => String(id).trim()).filter(Boolean));
  for (const art of existingArticles || []) {
    if (art?.sourceNewsId) seen.add(String(art.sourceNewsId).trim());
    for (const src of art?.sources || []) {
      const id = extractNewsId(src?.url);
      if (id) seen.add(id);
    }
  }
  const byId = new Map();
  for (const item of discoveredItems || []) {
    const id = String(item?.id || extractNewsId(item?.url || item?.href) || '').trim();
    if (!id || seen.has(id) || byId.has(id)) continue;
    byId.set(id, {
      id,
      url: item?.url || `${CHINESETEST_ORIGIN}/news/${id}`,
      title: cleanNewsHeadline(item?.title || item?.text || ''),
      foundAt: item?.foundAt || 'chinesetest.cn',
    });
  }
  return Array.from(byId.values()).sort((a, b) => {
    const na = Number(a.id);
    const nb = Number(b.id);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return nb - na;
    return String(b.id).localeCompare(String(a.id));
  });
}

export function computeSnapshotDigest(snapshot) {
  const payload = {
    calendars: snapshot.calendars,
    vietnamTestCenters: snapshot.vietnamTestCenters,
    pinnedAnnouncement: snapshot.pinnedAnnouncement,
    recentNews: snapshot.recentNews,
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

export function formatChineseTestGroundingSummary(snapshot) {
  if (!snapshot) return '';
  const lines = [
    `Nguồn đối chiếu chính thức ChineseTest (cổng gốc yêu cầu: ${snapshot.requestedSourceUrl} -> hệ thống mới ${CHINESETEST_ORIGIN}, đồng bộ ngày ${snapshot.fetchedDate}):`,
  ];

  if (snapshot.pinnedAnnouncement?.title) {
    lines.push(
      `- THÔNG BÁO THAY ĐỔI KỲ THI NỔI BẬT (${snapshot.pinnedAnnouncement.url}, đăng ngày ${snapshot.pinnedAnnouncement.publishedTime || 'mới nhất'}): ${snapshot.pinnedAnnouncement.title} — ${snapshot.pinnedAnnouncement.summary}`
    );
  }

  if (Array.isArray(snapshot.syllabusPdfs) && snapshot.syllabusPdfs.length) {
    lines.push(
      `- TÀI LIỆU ĐỀ CƯƠNG CHÍNH THỨC: ` + snapshot.syllabusPdfs.map((p) => `${p.label} (${p.url})`).join('; ')
    );
  }

  for (const [year, cal] of Object.entries(snapshot.calendars || {})) {
    if (cal?.hsk1to6?.length) {
      lines.push(`- LỊCH THI & LỊCH TRẢ KẾT QUẢ HSK 1–6 / HSKK NĂM ${year} (${cal.url}):`);
      for (const r of cal.hsk1to6) {
        lines.push(
          `  • Ngày thi: ${r.testDate} | Hình thức: ${r.format} | Hạn ĐK giấy (PBT): ${r.regDeadlinePbt}, máy (iBT): ${r.regDeadlineIbt} | Trả điểm giấy: ${r.resultDatePbt}, máy HSK: ${r.resultDateIbtHsk}, máy HSKK: ${r.resultDateIbtHskk}`
        );
      }
    }
    if (cal?.hsk7to9?.length) {
      lines.push(
        `- LỊCH THI HSK 7–9 NĂM ${year} (${cal.url}): ` +
          cal.hsk7to9.map((r) => `${r.testDate} (${r.format}, hạn ĐK ${r.regDeadline}, trả điểm ${r.resultDate})`).join('; ')
      );
    }
  }

  if (snapshot.vietnamTestCenters?.length) {
    lines.push(
      `- ĐỊA ĐIỂM THI HSK CHÍNH THỨC TẠI VIỆT NAM (${CHINESETEST_ORIGIN}/test-centers — ${snapshot.vietnamTestCenters.length} điểm đăng ký trên hệ thống):`
    );
    for (const c of snapshot.vietnamTestCenters) {
      lines.push(`  • [${c.city}] ${c.name} — Bài thi tổ chức: ${c.types}`);
    }
  }

  if (snapshot.examStructure?.summary) {
    lines.push(
      `- CẤU TRÚC BÀI THI & QUY CHẾ (${CHINESETEST_ORIGIN}/HSK, ${CHINESETEST_ORIGIN}/HSKK, ${CHINESETEST_ORIGIN}/regulation): ${snapshot.examStructure.summary}`
    );
  }

  return lines.join('\n');
}

async function gotoWithRetry(page, url, attempts = 2) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 25000 });
      return true;
    } catch (err) {
      lastErr = err;
      if (i + 1 < attempts) await page.waitForTimeout(1500);
    }
  }
  throw lastErr;
}

async function launchChromium() {
  const { chromium } = require('playwright');
  const launchOpts = {
    headless: true,
    ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
  };
  return chromium.launch(launchOpts);
}

async function fetchNewsDetailPage(ctx, url, fallbackTitle = '') {
  const detailPage = await ctx.newPage();
  try {
    await gotoWithRetry(detailPage, url);
    await detailPage
      .waitForFunction(
        () => {
          const root = document.querySelector('#__layout') || document.body;
          const text = root ? (root.innerText || '').trim() : '';
          return /Published Time|发布时间|Source[：:]|来源[：:]/i.test(text) || text.length > 750;
        },
        null,
        { timeout: 22000 }
      )
      .catch(() => {});
    await detailPage.waitForTimeout(900);

    const raw = await detailPage.evaluate((targetUrl) => {
      const root = document.querySelector('#__layout') || document.body;
      const fullText = (root.innerText || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      const idx = Math.max(fullText.indexOf('Home > News >'), fullText.indexOf('首页 > 新闻'));
      const slice = idx !== -1 ? fullText.slice(idx + 13) : fullText.slice(200);
      const clean = slice.split(/<\s*Previous Article|上一篇|Next Article|下一篇/i)[0].trim();
      const flat = clean.replace(/\s+/g, ' ').trim();
      const pubMatch = flat.match(/(?:Published Time|发布时间)[：:]\s*(\d{4}-\d{2}-\d{2})/i);
      const beforePub = flat.split(/(?:Published Time|发布时间)[：:]/i)[0] || '';
      const afterSource = clean.split(/(?:Source|来源)[：:][^\n]*/i)[1] || clean;
      const tables = Array.from(document.querySelectorAll('table')).map((tbl) => {
        let prev = tbl.previousElementSibling;
        const headings = [];
        for (let k = 0; k < 3 && prev; k++) {
          const t = (prev.innerText || '').replace(/\s+/g, ' ').trim();
          if (t) headings.unshift(t);
          prev = prev.previousElementSibling;
        }
        const rows = Array.from(tbl.querySelectorAll('tr'))
          .map((tr) => Array.from(tr.querySelectorAll('th,td')).map((c) => (c.innerText || '').replace(/\s+/g, ' ').trim()))
          .filter((r) => r.length > 0);
        return { heading: headings.join(' — '), rows: rows.slice(0, 25) };
      });
      return {
        url: targetUrl,
        rawTitle: beforePub.trim(),
        publishedTime: pubMatch ? pubMatch[1] : '',
        bodyText: afterSource.trim().slice(0, 4500),
        tables,
      };
    }, url);

    const id = extractNewsId(url);
    return {
      id,
      url,
      title: cleanNewsHeadline(raw.rawTitle) || cleanNewsHeadline(fallbackTitle) || `Thông báo ChineseTest #${id}`,
      publishedTime: raw.publishedTime || '',
      bodyText: dedupeRepeatedLead(raw.bodyText),
      tables: raw.tables || [],
    };
  } finally {
    await detailPage.close();
  }
}

export async function scanChineseTestNews({
  fetchDetailLimit = 1,
  forceLatest = false,
  forceNewsId = '',
  seenIds,
  existingArticles = [],
} = {}) {
  const browser = await launchChromium();
  const ctx = await browser.newContext();
  await ctx.route('**hm.baidu.com**', (r) => r.abort());
  await ctx.route('**soboten.com**', (r) => r.abort());

  try {
    const discoveredMap = new Map();
    const collectFromPage = async (targetPage, sourceLabel) => {
      const anchors = await targetPage.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href^="/news/"]')).map((a) => ({
          href: a.getAttribute('href') || '',
          text: (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim(),
        }));
      });
      for (const a of anchors) {
        const id = extractNewsId(a.href);
        if (!id || discoveredMap.has(id)) continue;
        discoveredMap.set(id, {
          id,
          url: `${CHINESETEST_ORIGIN}/news/${id}`,
          title: cleanNewsHeadline(a.text),
          foundAt: sourceLabel,
        });
      }
    };

    const scanUrlInFreshTab = async (url, sourceLabel, readyFn, timeoutMs = 20000) => {
      const tab = await ctx.newPage();
      try {
        await gotoWithRetry(tab, url);
        await tab.waitForFunction(readyFn, null, { timeout: timeoutMs }).catch(() => {});
        await tab.waitForTimeout(800);
        await collectFromPage(tab, sourceLabel);
      } catch (_) {
      } finally {
        await tab.close();
      }
    };

    await Promise.all([
      scanUrlInFreshTab(
        `${CHINESETEST_ORIGIN}/`,
        '/',
        () => document.querySelectorAll('a[href^="/news/"]').length > 0,
        18000
      ),
      scanUrlInFreshTab(
        `${CHINESETEST_ORIGIN}/news`,
        '/news',
        () => document.querySelectorAll('a[href^="/news/"]').length > 5,
        24000
      ),
    ]);

    if (discoveredMap.size <= 3) {
      await scanUrlInFreshTab(
        `${CHINESETEST_ORIGIN}/news`,
        '/news',
        () => document.querySelectorAll('a[href^="/news/"]').length > 5,
        25000
      );
    }

    const discovered = Array.from(discoveredMap.values()).sort((a, b) => Number(b.id) - Number(a.id));
    const effectiveSeenIds = Array.isArray(seenIds) ? seenIds : loadSeenNews().seenIds;
    const unseen = findUnseenNewsItems(discovered, effectiveSeenIds, existingArticles);

    let targets = [];
    if (forceNewsId && String(forceNewsId).trim()) {
      const id = extractNewsId(forceNewsId) || String(forceNewsId).trim();
      const matched = discovered.find((d) => d.id === id);
      targets = [{ id, url: `${CHINESETEST_ORIGIN}/news/${id}`, title: matched?.title || '' }];
    } else if (forceLatest) {
      targets = discovered.slice(0, fetchDetailLimit);
    } else {
      targets = unseen.slice(0, fetchDetailLimit);
    }

    const fetchedDetails = [];
    for (const target of targets) {
      try {
        const detail = await fetchNewsDetailPage(ctx, target.url, target.title);
        if (detail.bodyText && detail.bodyText.length >= 40) {
          fetchedDetails.push(detail);
        }
      } catch (err) {
        console.warn(`Warning: Failed fetching detail for ${target.url}: ${err.message || err}`);
      }
    }

    return { discovered, unseen, fetchedDetails };
  } finally {
    await browser.close();
  }
}

export async function syncChineseTestOfficial() {
  let prevSnapshot = null;
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try {
      prevSnapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    } catch (_) {}
  }

  const browser = await launchChromium();
  const ctx = await browser.newContext();
  await ctx.route('**hm.baidu.com**', (r) => r.abort());
  await ctx.route('**soboten.com**', (r) => r.abort());
  const page = await ctx.newPage();

  try {
    // 1. Discover official calendar & announcement links from homepage
    await gotoWithRetry(page, `${CHINESETEST_ORIGIN}/`);
    await page.waitForFunction(() => document.querySelectorAll('a[href^="/news/"]').length > 0, null, { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const homeLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map((a) => ({
        href: a.getAttribute('href') || '',
        text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      }));
    });

    const calendarLinks = [];
    let announcementPath = '/news/51336883';
    const syllabusPdfs = [];

    for (const l of homeLinks) {
      const m = /(\d{4})\s*Test Calendar/i.exec(l.text);
      if (m && l.href.startsWith('/news/') && !calendarLinks.some((c) => c.year === m[1])) {
        calendarLinks.push({ year: m[1], path: l.href });
      }
      if (/Announcement/i.test(l.text) && l.href.startsWith('/news/')) {
        announcementPath = l.href;
      }
      if (/\.pdf$/i.test(l.href) && !syllabusPdfs.some((p) => p.url === l.href)) {
        syllabusPdfs.push({ label: l.text || 'HSK Official Document', url: l.href });
      }
    }

    // 2. Extract pinned official announcement (e.g. HSK 3.0 launch)
    const announcementUrl = `${CHINESETEST_ORIGIN}${announcementPath}`;
    let pinnedAnnouncement = prevSnapshot?.pinnedAnnouncement || {
      url: announcementUrl,
      title: 'Official HSK Exam Update Announcement',
      publishedTime: '',
      summary: '',
    };
    try {
      await gotoWithRetry(page, announcementUrl);
      await page
        .waitForFunction(
          () => {
            const root = document.querySelector('#__layout') || document.body;
            return Boolean(root && /Published Time[：:]\s*\d{4}-\d{2}-\d{2}/i.test(root.innerText || ''));
          },
          null,
          { timeout: 25000 }
        )
        .catch(() => {});
      await page.waitForTimeout(800);

      const rawAnnouncement = await page.evaluate((url) => {
        const root = document.querySelector('#__layout') || document.body;
        const text = root.innerText.replace(/\s+/g, ' ').trim();
        const idx = text.indexOf('Home > News >');
        const bodySlice = idx !== -1 ? text.slice(idx + 13, idx + 2400) : text.slice(300, 2400);
        const clean = bodySlice.split('< Previous Article')[0].trim();
        const pubMatch = clean.match(/Published Time[：:]\s*(\d{4}-\d{2}-\d{2})/i);
        const beforePub = clean.split(/Published Time[：:]/i)[0] || '';
        const afterSource = clean.split(/Source[：:]/i)[1] || clean;
        return {
          url,
          rawTitle: beforePub.trim(),
          publishedTime: pubMatch ? pubMatch[1] : '',
          rawBody: afterSource.trim().slice(0, 1400),
        };
      }, announcementUrl);

      if (rawAnnouncement.publishedTime || rawAnnouncement.rawBody.length > 60) {
        pinnedAnnouncement = {
          url: rawAnnouncement.url,
          title: dedupeRepeatedLead(rawAnnouncement.rawTitle) || pinnedAnnouncement.title,
          publishedTime: rawAnnouncement.publishedTime || pinnedAnnouncement.publishedTime,
          summary: dedupeRepeatedLead(rawAnnouncement.rawBody) || pinnedAnnouncement.summary,
        };
      }
    } catch (_) {}

    // 3. Extract official Test Calendars & Result Release Dates (fresh tab per year to avoid SPA stale DOM)
    const calendars = { ...(prevSnapshot?.calendars || {}) };
    for (const cal of calendarLinks.sort((a, b) => a.year.localeCompare(b.year))) {
      const url = `${CHINESETEST_ORIGIN}${cal.path}`;
      const fallbackCal = prevSnapshot?.calendars?.[cal.year];
      const calPage = await ctx.newPage();
      try {
        await gotoWithRetry(calPage, url);
        await calPage.waitForFunction(() => document.querySelectorAll('table tr').length > 8, null, { timeout: 28000 }).catch(() => {});
        await calPage.waitForTimeout(1000);
        const rawTables = await calPage.evaluate(() => {
          return Array.from(document.querySelectorAll('table')).map((tbl) => {
            let prev = tbl.previousElementSibling;
            const headings = [];
            for (let k = 0; k < 4 && prev; k++) {
              const t = prev.innerText.replace(/\s+/g, ' ').trim();
              if (t) headings.unshift(t);
              prev = prev.previousElementSibling;
            }
            const rows = Array.from(tbl.querySelectorAll('tr'))
              .map((tr) => Array.from(tr.querySelectorAll('th,td')).map((c) => c.innerText.replace(/\s+/g, ' ').trim()))
              .filter((r) => r.length > 0);
            return { heading: headings.slice(-2).join(' — '), rows };
          });
        });
        const parsed = parseCalendarTables(rawTables);
        calendars[cal.year] = {
          url,
          hsk1to6: parsed.hsk1to6.length ? parsed.hsk1to6 : fallbackCal?.hsk1to6 || [],
          hsk7to9: parsed.hsk7to9.length ? parsed.hsk7to9 : fallbackCal?.hsk7to9 || [],
        };
      } catch (_) {
        if (fallbackCal) calendars[cal.year] = fallbackCal;
      } finally {
        await calPage.close();
      }
    }

    // 4. Extract ALL pages of official Vietnam HSK Test Centers from /test-centers
    const centerPage = await ctx.newPage();
    const vietnamTestCenters = [];
    try {
      await gotoWithRetry(centerPage, `${CHINESETEST_ORIGIN}/test-centers`);
      await centerPage
        .waitForFunction(() => document.querySelectorAll('input[placeholder="Select Continent"]').length > 0, null, { timeout: 25000 })
        .catch(() => {});
      await centerPage.waitForTimeout(1800);
      await centerPage.locator('input[placeholder="Select Continent"]').click({ timeout: 5000 }).catch(() => {});
      await centerPage.waitForTimeout(700);
      await centerPage.evaluate(() => {
        const item = Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(
          (e) => e.offsetParent !== null && /Asia|亚洲/i.test(e.textContent || '')
        );
        if (item) item.click();
      });
      await centerPage.waitForTimeout(1500);
      await centerPage.locator('input[placeholder="Select Country/Area"]').click({ timeout: 5000 }).catch(() => {});
      await centerPage.waitForTimeout(800);
      await centerPage.evaluate(() => {
        const item = Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(
          (e) => e.offsetParent !== null && /Viet|越南/i.test(e.textContent || '')
        );
        if (item) item.click();
      });
      await centerPage.waitForTimeout(700);
      await centerPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => /Search|查询/i.test(b.textContent || ''));
        if (btn) btn.click();
      });
      await centerPage
        .waitForFunction(
          () => Array.from(document.querySelectorAll('table td')).some((td) => /VIET\s*NAM|越南/i.test(td.innerText || '')),
          null,
          { timeout: 20000 }
        )
        .catch(() => {});
      await centerPage.waitForTimeout(1000);

      const seenCenters = new Set();
      for (let pageNum = 1; pageNum <= 10; pageNum++) {
        const rows = await centerPage.evaluate(() => {
          return Array.from(document.querySelectorAll('table tr'))
            .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.replace(/\s+/g, ' ').trim()))
            .filter((r) => r.length >= 4 && /VIET\s*NAM|越南/i.test(r[0]));
        });
        for (const r of rows) {
          const key = `${r[1]}|${r[2]}|${r[3]}`;
          if (!seenCenters.has(key)) {
            seenCenters.add(key);
            vietnamTestCenters.push({
              country: r[0],
              city: r[1],
              name: r[2],
              types: r[3],
            });
          }
        }
        const prevFirst = rows[0] ? `${rows[0][1]}|${rows[0][2]}` : '';
        const hasNext = await centerPage.evaluate(() => {
          const nextBtn = document.querySelector('button.btn-next:not([disabled])');
          if (!nextBtn) return false;
          nextBtn.click();
          return true;
        });
        if (!hasNext) break;
        await centerPage
          .waitForFunction(
            (prev) => {
              const firstTr = Array.from(document.querySelectorAll('table tr'))
                .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.replace(/\s+/g, ' ').trim()))
                .find((r) => r.length >= 4 && /VIET\s*NAM|越南/i.test(r[0]));
              return firstTr && `${firstTr[1]}|${firstTr[2]}` !== prev;
            },
            prevFirst,
            { timeout: 15000 }
          )
          .catch(() => {});
        await centerPage.waitForTimeout(600);
      }
    } catch (_) {
    } finally {
      await centerPage.close();
    }
    const finalVietnamCenters =
      vietnamTestCenters.length >= (prevSnapshot?.vietnamTestCenters?.length || 0)
        ? vietnamTestCenters
        : prevSnapshot?.vietnamTestCenters || [];

    // 5. Extract HSK Exam Structure & Candidate Regulations summary (/HSK)
    let hskStructureText = '';
    try {
      await gotoWithRetry(page, `${CHINESETEST_ORIGIN}/HSK`);
      await page.waitForTimeout(1500);
      hskStructureText = await page.evaluate(() => {
        const text = (document.querySelector('#__layout') || document.body).innerText.replace(/\s+/g, ' ').trim();
        const idx = text.indexOf('What is HSK?');
        return idx !== -1 ? text.slice(idx, idx + 900) : text.slice(300, 1100);
      });
    } catch (_) {}

    // 6. Recent official news headlines (/news)
    let recentNews = calendarLinks.map((c) => ({
      url: `${CHINESETEST_ORIGIN}${c.path}`,
      title: `${c.year} Test Calendar`,
    }));
    try {
      await gotoWithRetry(page, `${CHINESETEST_ORIGIN}/news`);
      await page.waitForTimeout(2200);
      const fetchedNews = await page.evaluate(() => {
        const items = [];
        const seen = new Set();
        for (const a of document.querySelectorAll('a[href^="/news/"]')) {
          const href = a.getAttribute('href');
          const text = a.innerText.replace(/\s+/g, ' ').trim();
          if (href && text && text !== 'View Details' && text !== 'Announcement' && !seen.has(href)) {
            seen.add(href);
            items.push({ url: 'https://www.chinesetest.cn' + href, title: text });
          }
        }
        return items.slice(0, 8);
      });
      if (fetchedNews.length) recentNews = fetchedNews;
    } catch (_) {}

    const snapshot = {
      schema: 1,
      requestedSourceUrl: LEGACY_SOURCE_URL,
      migrationNote:
        'ChineseTest đã nâng cấp lên nền tảng Nuxt; đường dẫn cũ /goKdInfoOrPlan.do được tách thành /test-centers (địa điểm thi), /test-dates & /news/<id> (lịch thi & lịch trả điểm), /HSK & /regulation (cấu trúc & quy chế) và /news (thông báo mới).',
      resolvedUrls: {
        testCenters: `${CHINESETEST_ORIGIN}/test-centers`,
        testDates: `${CHINESETEST_ORIGIN}/test-dates`,
        examStructure: `${CHINESETEST_ORIGIN}/HSK`,
        speakingStructure: `${CHINESETEST_ORIGIN}/HSKK`,
        regulations: `${CHINESETEST_ORIGIN}/regulation`,
        news: `${CHINESETEST_ORIGIN}/news`,
        scoreInquiry: `${CHINESETEST_ORIGIN}/query-score`,
      },
      fetchedDate: new Date().toISOString().slice(0, 10),
      pinnedAnnouncement,
      syllabusPdfs,
      calendars,
      vietnamTestCenters: finalVietnamCenters,
      examStructure: {
        levelsSupported: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7-9'],
        summary: hskStructureText || prevSnapshot?.examStructure?.summary || '',
      },
      recentNews,
    };
    snapshot.digest = computeSnapshotDigest(snapshot);

    fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
    return snapshot;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--scan-news')) {
    const articlesFile = path.join(ROOT, 'content/seo-articles/articles.json');
    const existingArticles = fs.existsSync(articlesFile)
      ? JSON.parse(fs.readFileSync(articlesFile, 'utf8')).articles || []
      : [];
    const fetchLimit = process.argv.includes('--fetch-details') ? 1 : 0;
    scanChineseTestNews({ fetchDetailLimit: fetchLimit, existingArticles })
      .then((res) => {
        console.log(`Scanned ChineseTest news: ${res.discovered.length} items discovered, ${res.unseen.length} unseen.`);
        for (const item of res.unseen) {
          console.log(`- [NEW ${item.id}] ${item.title || '(no title)'} (${item.url})`);
        }
      })
      .catch((err) => {
        console.error('Failed scanning ChineseTest news:', err.message || err);
        process.exit(1);
      });
  } else {
    syncChineseTestOfficial()
      .then((snap) => {
        const years = Object.entries(snap.calendars)
          .map(([y, c]) => `${y} (HSK1-6: ${c.hsk1to6.length}, HSK7-9: ${c.hsk7to9.length})`)
          .join(', ');
        console.log(`Synced ChineseTest official snapshot -> ${SNAPSHOT_PATH}`);
        console.log(`- Calendars: ${years}`);
        console.log(`- Vietnam test centers: ${snap.vietnamTestCenters.length}`);
        console.log(`- Pinned announcement: ${snap.pinnedAnnouncement.url}`);
        console.log(`- Digest: ${snap.digest}`);
      })
      .catch((err) => {
        console.error('Failed to sync ChineseTest official data:', err.message || err);
        process.exit(1);
      });
  }
}
