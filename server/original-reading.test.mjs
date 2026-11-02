import test from 'node:test';
import assert from 'node:assert/strict';
import {extractOriginalReading,extractOriginalIndex,originalReadingURL,createOriginalReadingService} from './original-reading.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const mbURL='https://mandarinbean.com/fixture-reading/',hrURL='https://hskreading.com/fixture-reading/';
const line='小明：今天我们一起去学校。';
const mb='<html><nav>菜单坏内容</nav><h2><span class="si">今天</span><span class="tr">今天</span></h2><div class="elementor-widget-theme-post-content"><div class="elementor-widget-container"><p>小明：<ruby><span class="si">今天</span><span class="tr">今天繁體</span><rt>jīntiān</rt></ruby>我们一起去学校。</p><p>小红：好，我也去。</p></div></div><script>改写全文</script><footer>页脚</footer></html>';
const hr='<html><article class="type-post"><h1>Test title</h1><div class="post-content"><p>English introduction</p><h2 class="cjk">今天</h2><p>'+line+'</p><p>小红：好，我也去。</p><input type="hidden"><div><p>Translation: fake</p></div><h2>问题</h2><p>假的问题？</p></div></article></html>';
const mbIndex='<div data-elementor-type="loop-item" class="tag-hsk2"><a href="'+mbURL+'">Story</a></div>';
const hrIndex='<article><h4><a href="'+hrURL+'">Story</a></h4><a href="https://hskreading.com/category/hsk-2/">HSK2</a></article>';
const html=s=>new Response(s,{headers:{'Content-Type':'text/html'}});
test('original extraction keeps exact simplified text and excludes translation/questions/navigation',()=>{
 for(const [source,url] of [[mb,mbURL],[hr,hrURL]]){const a=extractOriginalReading(source,url);assert.equal(a.status,'original');assert.equal(a.paragraphs[0].hanzi,line);assert.equal(a.paragraphs.length,2);assert.doesNotMatch(JSON.stringify(a),/菜单|繁體|假的问题|fake|改写全文|页脚/);}
 assert.match(extractOriginalReading(mb,mbURL).paragraphs[0].pinyin,/jīntiān/);
});
test('indexes accept only article links with matching source HSK',()=>{
 assert.equal(extractOriginalIndex(mbIndex,'mandarinbean.com',2)[0].url,mbURL);
 assert.equal(extractOriginalIndex(hrIndex,'hskreading.com',2)[0].url,hrURL);
 assert.equal(extractOriginalIndex(hrIndex,'hskreading.com',3).length,0);
 assert.equal(extractOriginalIndex(mbIndex.replace(mbURL,'https://evil.example/test/'),'mandarinbean.com',2).length,0);
});
test('URL trust boundary rejects arbitrary hosts, redirects, credentials and administration paths',()=>{
 for(const url of ['http://mandarinbean.com/foo/','https://mandarinbean.com.evil.test/foo/','https://user@mandarinbean.com/foo/','https://mandarinbean.com:8443/foo/','https://hskreading.com/wp-admin/','https://hskreading.com/foo/?x=1','https://127.0.0.1/foo/'])assert.equal(originalReadingURL(url),null,url);
 assert.throws(()=>extractOriginalReading('<html>menu only</html>',mbURL));
});
test('service lists both sources, shares bounded cache and never calls AI',async()=>{
 let now=0;const calls=[];
 const service=createOriginalReadingService(async url=>{calls.push(url);if(url.includes('/tag/'))return html(mbIndex);if(url.includes('/category/'))return html(hrIndex);if(url===mbURL)return html(mb);throw Error('Unexpected fetch '+url);},{now:()=>now});
 const list=await service({op:'list',hsk:2});assert.equal(list.status,200);assert.equal(list.data.items.length,2);assert.equal(calls.length,2);
 await service({op:'list',hsk:2});assert.equal(calls.length,2);
 const [a,b]=await Promise.all([service({op:'article',url:mbURL}),service({op:'article',url:mbURL})]);assert.equal(a.status,200);assert.deepEqual(a,b);assert.equal(calls.length,3);
 now=13*3600000;await service({op:'article',url:mbURL});assert.equal(calls.length,4);
 assert(calls.every(u=>/^https:\/\/(mandarinbean|hskreading)\.com\//.test(u)));
});
test('partial source failure is reported, redirects/oversize pages fail without replacement',async()=>{
 const partial=createOriginalReadingService(async url=>url.includes('mandarinbean')?html(mbIndex):new Response('',{status:403}));
 const result=await partial({op:'list',hsk:2});assert.equal(result.status,200);assert.deepEqual(result.data.unavailable,['hskreading.com']);
 for(const response of [new Response('',{status:302,headers:{Location:'https://evil.test'}}),html('x'.repeat(650001))]){
  const service=createOriginalReadingService(async()=>response);const bad=await service({op:'article',url:mbURL});assert.equal(bad.status,502);assert.match(bad.data.error,/Không dùng AI/);
 }
});
test('Worker source endpoint is available without AI credentials or quota reservations; CORS still enforced',async()=>{
 const handler=createHandler(async url=>{assert.equal(url,mbURL);return html(mb);});
 const request=origin=>new Request('https://worker.test/reading-library',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'article',url:mbURL})});
 const good=await handler(request('https://trungxemcode.github.io'),{},{});assert.equal(good.status,200);assert.equal((await good.json()).article.paragraphs[0].hanzi,line);
 assert.equal((await handler(request('https://evil.test'),{},{})).status,403);
});


test('current HSK Reading plain headings preserve the passage and exclude translation/questions',()=>{
 const current=hr.replace('class="cjk"','class="wp-block-heading"').replace('<p>'+line+'</p>','<p><span style="font-size:14pt">'+line+'</span></p>');
 const article=extractOriginalReading(current,hrURL);
 assert.equal(article.title,'今天');assert.deepEqual(article.paragraphs.map(p=>p.hanzi),[line,'小红：好，我也去。']);
 assert.doesNotMatch(JSON.stringify(article),/fake|假的问题|English introduction/);
});
test('question-only HSK Reading pages never masquerade as an original passage',()=>{
 assert.throws(()=>extractOriginalReading('<article class="type-post"><div class="post-content"><h2>问题</h2><p>'+line+'</p></div></article>',hrURL),/Cấu trúc nguồn/);
});
