/* Verify the zero-token sentence checker independently from the optional AI path. */
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
    let aiRequests=0;page.on('request',request=>{if(request.url().includes('/lesson-ask'))aiRequests++;});
    await page.route('https://**/*',route=>route.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.waitForFunction(()=>window.HSKStudio&&window.HSKSentenceCheckerCore&&window.HSKVocabularyBridge&&document.querySelector('#appLoadStatus')?.hidden,{timeout:90000});
    await page.evaluate(()=>window.HSKStudio.navigate('sentence-editor'));
    const editor=page.locator('#sentenceEditor');
    await editor.locator('#sentenceDraft').fill('我有一个书。不有二个书。');
    await editor.locator('.sentence-card').first().waitFor({timeout:3000});
    assert.ok(await editor.locator('mark').count()>=3,'grammar rules should be visible while typing');
    assert.match(await editor.locator('.sentence-status').textContent(),/không dùng AI/);
    assert.equal(aiRequests,0,'typing must not call the AI endpoint');
    const metrics=await page.evaluate(()=>window.HSKSentenceCheckerCore.checker.metrics());
    assert.ok(metrics.words>1000,'checker must use the app vocabulary bridge');
    assert.ok(metrics.rules>=30,'grammar catalogue must include HSK 1–6 rules');
    const advanced=await page.evaluate(()=>window.HSKSentenceCheckerCore.checker.checkText('虽然我很累，所以我还是学习。只有努力，就能进步。'));
    assert.ok(advanced.some(item=>item.hskLevel===4),'HSK 4 conjunction rule missing');
    assert.ok(advanced.some(item=>item.hskLevel===5),'HSK 5 conjunction rule missing');
    await page.evaluate(()=>{const text='我有一个书。不有二个书。';window.HSKSentenceCheckerCore.checker.checkText(text);window.HSKSentenceCheckerCore.checker.checkText(text);});
    assert.ok((await page.evaluate(()=>window.HSKSentenceCheckerCore.checker.metrics().cacheHits))>0,'unchanged sentences should use cache');
    // Reported sentence, no false warning for correct text, undo and dismiss.
    const input=editor.locator('#sentenceDraft');
    await input.fill('昨天他帮忙我打扫房间，我很感谢他。');
    await editor.locator('.sentence-del').filter({hasText:'帮忙我'}).waitFor();
    await editor.getByRole('button',{name:'Áp dụng',exact:true}).click();
    assert.equal(await input.inputValue(),'昨天他帮我打扫房间，我很感谢他。');
    await editor.getByRole('button',{name:'Hoàn tác',exact:true}).click();
    assert.equal(await input.inputValue(),'昨天他帮忙我打扫房间，我很感谢他。');
    await editor.getByRole('button',{name:'Bỏ qua',exact:true}).click();
    await page.evaluate(()=>window.dispatchEvent(new Event('hsk-lessons-ready')));
    await page.waitForTimeout(350);
    assert.equal(await editor.locator('.sentence-card').count(),0,'dismiss survives rechecking same text');
    await input.fill('第十二个学生买了二十二本书。');
    await page.waitForTimeout(350);
    assert.equal(await editor.locator('.sentence-card[data-kind="fix"]').count(),0,'correct numbers are not errors');
    assert.equal(aiRequests,0,'typing, applying, undoing and dismissing are local');
    // Simulate a slow provider that ignores abort to verify snapshot isolation.
    await page.evaluate(()=>{
      const originalFetch=window.fetch;
      window.HSKAccountDashboard={user:{uid:'grammar-test',getIdToken:async()=> 'mock-token'}};
      window.fetch=async(input,init)=>{
        if(String(input).includes('translation-config.json'))return new Response(JSON.stringify({enabled:true,endpoint:'https://grammar.invalid/translate'}));
        if(String(input).includes('/lesson-ask'))return new Promise(resolve=>{
          window.__resolveGrammar=(data={answer:JSON.stringify({summary:'STALE_RESPONSE',suggestions:[{kind:'fix',original:'帮忙我',replacement:'帮我',reason:'STALE_SUGGESTION'}]})})=>{
            window.__resolveGrammar=null;
            resolve(new Response(JSON.stringify(data)));
          };
        });
        return originalFetch(input,init);
      };
    });
    await input.fill('他帮忙我打扫房间。');
    await editor.getByRole('button',{name:'Kiểm tra sâu bằng AI',exact:true}).click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await input.fill('今天我去学校。');
    await page.evaluate(()=>window.__resolveGrammar());
    await page.waitForTimeout(350);
    assert.equal(await editor.locator('[data-source="ai"]').count(),0,'stale AI result must not attach to edited draft');
    assert.ok(!(await editor.locator('.sentence-status').innerText()).includes('STALE'));
    assert.equal(await editor.locator('.sentence-deep-check').isDisabled(),false);
    await input.fill('昨天，我讨论了这个话题跟同学们三个小时。');
    await editor.getByRole('button',{name:'Kiểm tra sâu bằng AI',exact:true}).click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await page.evaluate(()=>window.__resolveGrammar({answer:'Đặt cụm 跟同学们 trước động từ 讨论.'}));
    await editor.locator('.sentence-status').filter({hasText:'Đặt cụm 跟同学们 trước động từ 讨论.'}).waitFor();
    assert.equal(await editor.locator('.sentence-card[data-source="ai"]').count(),0);
    await editor.getByRole('button',{name:'Kiểm tra sâu bằng AI',exact:true}).click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await page.evaluate(()=>window.__resolveGrammar({sentenceReview:{summary:'Đã kiểm tra đoạn văn.',suggestions:[
      {kind:'fix',original:'讨论了这个话题跟同学们',replacement:'跟同学们讨论了这个话题',reason:'Đặt đối tượng trao đổi trước động từ.'}
    ]}}));
    await editor.locator('.sentence-card[data-source="ai"]').getByRole('button',{name:'Áp dụng',exact:true}).click();
    assert.equal(await input.inputValue(),'昨天，我跟同学们讨论了这个话题三个小时。');
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:900});
      await input.fill('昨天他帮忙我打扫房间，我很感谢他。');
      await editor.locator('.sentence-del').filter({hasText:'帮忙我'}).waitFor();
      assert.ok(await editor.locator('.sentence-deep-check').isVisible());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'editor must not overflow horizontally');
      if(process.env.HSK_GRAMMAR_EVIDENCE){fs.mkdirSync(process.env.HSK_GRAMMAR_EVIDENCE,{recursive:true});await page.screenshot({path:path.join(process.env.HSK_GRAMMAR_EVIDENCE,`editor-${width}.png`),fullPage:true});}
    }
    const dynamic=await page.evaluate(()=>{
      const c=window.HSKSentenceCheckerCore.checker;c.refresh([{han:'测试词',pin:'cè shì cí',hsk:6}],{report:{checkedWords:1,targetedNotes:1}});return c.checkText('测试祠');
    });
    assert.equal(dynamic[0]?.replacement,'测试词','checker should rebuild from a newer app vocabulary bundle');
    assert.equal(aiRequests,0,'local suggestions must stay zero-token');
    console.log('PASS sentence checker: grammar, undo/dismiss, stale AI rejection, mobile/desktop, cache, data refresh, zero automatic AI requests');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
