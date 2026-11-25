const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const production = 'https://hskfreelearningai.pages.dev/';
const supportingPages = [
  ...Array.from({ length: 6 }, (_, level) => 'luyen-thi-hsk-' + (level + 1) + '-mien-phi'),
  'sua-cau-tieng-trung-ai',
  'phan-biet-tu-de-nham-hsk',
  'tap-viet-chu-han-online',
  'tra-diem-hsk',
];
const home = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app-hoc-hsk.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const redirects = fs.readFileSync('_redirects', 'utf8');

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
for (const url of [production, ...supportingPages.map(slug => production + slug), production + 'tin-tuc-hsk']) assert.ok(sitemapUrls.includes(url), url);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length);
assert.ok(!sitemapUrls.includes(production + 'hoc-hsk-cung-ai'));
const articles = JSON.parse(fs.readFileSync('content/seo-articles/articles.json', 'utf8')).articles;
for (const article of articles) assert.ok(sitemapUrls.includes(production + 'bai-viet/' + article.slug), article.slug);
assert.match(redirects, /^\/hoc-hsk-cung-ai \/ 301$/m);
assert.match(app, /id="studioHome"/);
assert.equal(manifest.id, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.start_url, './app-hoc-hsk.html');

for (const base of [production, 'https://trungxemcode.github.io/hsk/']) {
  const appURL = new URL(manifest.start_url, base).href;
  for (const slug of ['', ...supportingPages]) {
    const html = slug ? fs.readFileSync(slug + '.html', 'utf8') : home;
    const { window } = new JSDOM(html, { url: new URL(slug, base).href });
    const { document } = window;
    assert.equal(document.querySelector('link[rel="canonical"]').href, production + slug);
    assert.equal(document.querySelector('.brand').href, base);
    assert.equal(document.querySelector('a.btn-hero-main').href, appURL);
    assert.equal(document.querySelector('#studioHome'), null);
    if (!slug) {
      const links = new Set([...document.querySelectorAll('a')].map(link => link.href));
      for (const page of supportingPages) assert.ok(links.has(new URL(page + '.html', base).href), page);

      const opener = document.querySelector('script').textContent;
      const open = ({ ios = false, standalone = false, hash = '', search = '' } = {}) => {
        const destinations = [];
        const location = { hash, search, replace: path => destinations.push(new URL(path, base).href) };
        vm.runInNewContext(opener, { navigator: { standalone: ios }, matchMedia: () => ({ matches: standalone }), location });
        return destinations;
      };
      assert.deepEqual(open({ hash: '#luyen-thi-hsk' }), []);
      assert.deepEqual(open({ ios: true }), [appURL]);
      assert.deepEqual(open({ standalone: true }), [appURL]);
      assert.deepEqual(open({ hash: '#lesson/hsk-1-01', search: '?ref=shared' }), [appURL + '?ref=shared#lesson/hsk-1-01']);
    }
    window.close();
  }
}
console.log('PASS: SEO homepage and supporting links on both hosts, separate app, legacy URL, and existing PWA launches.');
