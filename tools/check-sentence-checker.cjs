/* Verify the manual AI editor in Chromium without calling a real provider. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');

const root=process.cwd();
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
    const localRequests = [];
    let aiRequests = 0;
    page.on('request', request => {
      if (/sentence-(?:checker|onnx|electra)|hsk-grammar-rules|vendor\/sentence-onnx/u.test(request.url())) localRequests.push(request.url());
      if (request.url().includes('/lesson-ask')) aiRequests++;
    });
    await page.route('https://**/*',route=>route.abort());
    await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.waitForFunction(()=>window.HSKStudio&&window.HSKSentenceReview&&document.querySelector('#appLoadStatus')?.hidden,null,{timeout:90000});
    await page.evaluate(()=>window.HSKStudio.navigate('sentence-editor'));
    const editor=page.locator('#sentenceEditor');
    const input = editor.locator('#sentenceDraft');
    const check = editor.getByRole('button',{name:'Kiểm tra bằng AI',exact:true});
    const status = editor.locator('.sentence-status');
    const provider = editor.getByLabel('Nhà cung cấp AI');
    assert.equal(await provider.inputValue(), 'auto');
    await input.fill('我有一个书。不有二个书。');
    assert.equal(await editor.locator('.sentence-card').count(),0,'typing alone must not produce suggestions');
    assert.equal(await editor.locator('.sentence-onnx-toggle, .sentence-electra-trial').count(),0);
    assert.deepEqual(localRequests,[],'the app must not load on-device checker code or weights');
    await check.click();
    await status.filter({hasText:'Đăng nhập để kiểm tra văn bản bằng AI.'}).waitFor();
    assert.equal(aiRequests,0,'signed-out checks must not call the provider');
    await page.context().setOffline(true);
    await check.click();
    await status.filter({hasText:'Kiểm tra bằng AI cần kết nối mạng.'}).waitFor();
    assert.equal(await input.inputValue(),'我有一个书。不有二个书。');
    await page.context().setOffline(false);
    // Simulate a slow provider that ignores abort to verify snapshot isolation.
    await page.evaluate(()=>{
      const originalFetch=window.fetch;
      window.HSKAccountDashboard={user:{uid:'grammar-test',getIdToken:async()=> 'mock-token'}};
      window.fetch=async(input,init)=>{
        if(String(input).includes('translation-config.json'))return new Response(JSON.stringify({enabled:true,endpoint:'https://grammar.invalid/translate'}));
        if(String(input).includes('/lesson-ask'))return new Promise(resolve=>{
          window.__lastGrammarRequest=JSON.parse(init.body);
          window.__grammarRequestCount=(window.__grammarRequestCount||0)+1;
          window.__resolveGrammar=(data={answer:JSON.stringify({summary:'STALE_RESPONSE',suggestions:[{kind:'fix',original:'帮忙我',replacement:'帮我',reason:'STALE_SUGGESTION'}]})})=>{
            window.__resolveGrammar=null;
            resolve(new Response(JSON.stringify(data),{headers:{'X-HSK-AI-Provider':'gemini'}}));
          };
        });
        return originalFetch(input,init);
      };
    });
    await provider.selectOption('personal:fosta');
    await page.evaluate(() => window.dispatchEvent(new Event('hsk-account-ready')));
    assert.equal(await provider.inputValue(), 'personal:fosta');
    await input.fill('他帮忙我打扫房间。');
    await check.click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    assert.equal(await page.evaluate(() => window.__lastGrammarRequest.aiProvider), 'personal:fosta');
    const waitTimer = editor.locator('.sentence-wait');
    await waitTimer.filter({hasText: /Đang chờ AI trả lời · [1-9]\d* giây/}).waitFor();
    assert.equal(await check.isDisabled(), true);
    await input.fill('今天我去学校。');
    await waitTimer.waitFor({state: 'hidden'});
    await page.evaluate(()=>window.__resolveGrammar());
    await page.waitForTimeout(350);
    assert.equal(await editor.locator('[data-source="ai"]').count(),0,'stale AI result must not attach to edited draft');
    assert.ok(!(await editor.locator('.sentence-status').innerText()).includes('STALE'));
    assert.equal(await check.isDisabled(),false);
    await input.fill('昨天，我讨论了这个话题跟同学们三个小时。');
    await check.click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await page.evaluate(()=>window.__resolveGrammar({answer:'Đặt cụm 跟同学们 trước động từ 讨论.'}));
    await editor.locator('.sentence-status').filter({hasText:'AI chưa trả được gợi ý có vị trí sửa.'}).waitFor();
    assert.equal(await editor.locator('.sentence-card[data-source="ai"]').count(),0);
    await check.click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await page.evaluate(()=>window.__resolveGrammar({aiSource:{provider:'gemini',model:'gemini-test-version'},sentenceReview:{summary:'Đã kiểm tra đoạn văn.',suggestions:[
      {kind:'fix',original:'讨论了这个话题跟同学们',replacement:'跟同学们讨论了这个话题',reason:'Đặt đối tượng trao đổi trước động từ.'}
    ]}}));
    await editor.locator('.sentence-status').filter({hasText:'Nguồn: Gemini · gemini-test-version.'}).waitFor();
    await editor.locator('.sentence-card[data-source="ai"] h4').filter({hasText:'AI · Gemini'}).waitFor();
    await editor.locator('.sentence-card[data-source="ai"]').getByRole('button',{name:'Áp dụng',exact:true}).click();
    assert.equal(await input.inputValue(),'昨天，我跟同学们讨论了这个话题三个小时。');
    await input.fill('🙂这件衣服。');
    await check.click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await page.evaluate(()=>window.__resolveGrammar({answer:'### Bản sửa đề xuất\n🙂这件漂亮的衣服。\n\n### Giải thích lỗi chính\nBổ sung mô tả.'}));
    const insertion=editor.locator('.sentence-card[data-source="ai"]');
    await insertion.getByRole('button',{name:'Áp dụng',exact:true}).click();
    assert.equal(await input.inputValue(),'🙂这件漂亮的衣服。');
    assert.equal(await insertion.count(),0,'applied insertion must not remain as an AI suggestion');
    assert.ok(!(await editor.locator('.sentence-status').innerText()).includes('###'));
    await editor.getByRole('button',{name:'Hoàn tác',exact:true}).click();
    assert.equal(await input.inputValue(),'🙂这件衣服。');
    const requestCount = await page.evaluate(() => window.__grammarRequestCount);
    for (const width of [390,1440]) {
      await page.setViewportSize({width,height:900});
      await input.fill('昨天他帮忙我打扫房间，我很感谢他。');
      assert.equal(await editor.locator('.sentence-card').count(),0);
      assert.ok(await check.isVisible());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'editor must not overflow horizontally');
      if (process.env.HSK_GRAMMAR_EVIDENCE) {
        fs.mkdirSync(process.env.HSK_GRAMMAR_EVIDENCE,{recursive:true});
        await page.screenshot({path:path.join(process.env.HSK_GRAMMAR_EVIDENCE,`editor-${width}.png`),fullPage:true});
      }
    }
    assert.equal(await page.evaluate(() => window.__grammarRequestCount),requestCount,'edits and layout changes must not call AI');
    assert.deepEqual(localRequests,[]);
    console.log('PASS AI sentence editor: login/offline states, manual requests, stale result rejection, provider, apply/undo and responsive layout');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
