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
            const prov=data?.aiSource?.provider||'gemini';
            resolve(new Response(JSON.stringify(data),{headers:{'X-HSK-AI-Provider':prov}}));
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
    await insertion.locator('.sentence-diff').click();
    assert.equal(await input.inputValue(),'🙂这件漂亮的衣服。');
    assert.equal(await insertion.count(),0,'clicking suggestion card must apply and remove suggestion');
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

    assert.equal(await input.getAttribute('maxlength'),'5000');
    const longDraft='每天我都会复习昨天学过的生词和语法，然后试着用它们写几句完整的话。'.repeat(30);
    assert.ok(longDraft.length>900&&longDraft.length<=5000);
    await input.fill(longDraft);
    await editor.locator('.sentence-count').filter({hasText:`${longDraft.length} / 5000 ký tự`}).waitFor();

    const pickerBtn=editor.locator('.sentence-ai-actions .qa-provider-btn');
    const effortBtn=editor.locator('.sentence-ai-actions .qa-effort-btn');
    assert.ok(await pickerBtn.isVisible(),'sentence editor must show custom AI provider picker button');
    assert.ok(await effortBtn.isVisible(),'sentence editor must show thinking/model effort button');
    await pickerBtn.click();
    const pickerMenu=editor.locator('.sentence-ai-actions .qa-provider-menu');
    await pickerMenu.waitFor({state:'visible'});
    await pickerMenu.locator('.qa-provider-item[data-provider="auto"]').click();
    assert.equal(await provider.inputValue(),'auto');

    const aiSample='综上所述，随着科技的发展，这项技术在日常生活中发挥着重要作用。';
    await input.fill(aiSample);
    const detectBtn=editor.locator('#sentenceAiDetectBtn');
    await detectBtn.click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    assert.equal(await page.evaluate(()=>window.__lastGrammarRequest?.lesson?.content?.mode),'sentence-ai-detect');
    await page.evaluate(()=>window.__resolveGrammar({aiSource:{provider:'gemini',model:'gemini-test-version'},aiDetection:{aiProbability:81,humanProbability:19,verdict:'ai',verdictLabel:'Khả năng cao do AI tạo',confidence:'Cao',summary:'Phát hiện nhiều cụm khuôn mẫu kiểu AI.',metrics:{naturalness:25,templateDensity:84,burstiness:32},signals:['Có cụm 综上所述 và 发挥着重要作用.'],flaggedSpans:[{start:0,end:4,text:'综上所述',reason:'Cụm chuyển đoạn kiểu bài luận AI.',humanizeTip:'Dùng cách nối tự nhiên hơn.'}]}}));
    const detector=editor.locator('#sentenceAiDetector');
    await detector.waitFor({state:'visible'});
    assert.equal(await detector.locator('.sentence-detector-score').count(),0,'không lặp dòng % AI/Người cạnh nhãn kết luận');
    await detector.locator('.sentence-detector-legend-item.is-human').filter({hasText:'Người: 19%'}).waitFor();
    await detector.locator('.sentence-detector-legend-item.is-ai').filter({hasText:'AI: 81%'}).waitFor();
    await detector.locator('.sentence-detector-why-title').filter({hasText:'Vì sao văn bản này giống AI?'}).waitFor();
    const barWidths=await detector.evaluate(el=>({
      human:el.querySelector('.sentence-detector-meter-human')?.style.width||'',
      ai:el.querySelector('.sentence-detector-meter-ai')?.style.width||''
    }));
    assert.deepEqual(barWidths,{human:'19%',ai:'81%'});
    assert.equal(await editor.evaluate(el=>el.classList.contains('is-ai-highlight')),true,'mở rộng AI Detector phải bật tô đỏ đoạn nghi ngờ AI');
    const expandedMarkColors=await editor.evaluate(el=>{
      const ta=getComputedStyle(el.querySelector('#sentenceDraft')).color;
      const flag=el.querySelector('.sentence-mirror mark[data-ai-flag="true"]');
      return {textareaColor:ta,flagColor:flag?getComputedStyle(flag).color:'',mirrorColor:getComputedStyle(el.querySelector('.sentence-mirror')).color};
    });
    assert.notEqual(expandedMarkColors.flagColor,'','đoạn nghi ngờ AI phải được đánh dấu trong mirror');
    assert.notEqual(expandedMarkColors.flagColor,expandedMarkColors.mirrorColor,'chữ đoạn nghi ngờ AI phải đổi sang màu đỏ khác màu chữ thường');
    await detector.locator('.sentence-detector-why-summary').click();
    assert.equal(await detector.locator('.sentence-detector-why').evaluate(el=>el.open),false,'bấm tiêu đề Vì sao phải thu gọn được');
    await detector.locator('.sentence-detector-why-summary').click();
    assert.equal(await detector.locator('.sentence-detector-why').evaluate(el=>el.open),true,'bấm tiêu đề Vì sao phải mở lại được');
    await detector.locator('.sentence-detector-close').click();
    assert.equal(await detector.evaluate(el=>el.classList.contains('is-collapsed')),true,'nút thu gọn phải thu siêu gọn thẻ AI Detector thay vì xóa');
    assert.equal(await editor.evaluate(el=>el.classList.contains('is-ai-highlight')),false,'khi đóng thu gọn AI Detector chữ phải trở về màu đen bình thường');
    const collapsedBounds=await detector.evaluate(el=>{
      const box=el.getBoundingClientRect();
      const btn=el.querySelector('.sentence-detector-close').getBoundingClientRect();
      return {boxLeft:box.left,boxRight:box.right,btnLeft:btn.left,btnRight:btn.right};
    });
    assert.ok(collapsedBounds.btnRight<=collapsedBounds.boxRight+0.5&&collapsedBounds.btnLeft>=collapsedBounds.boxLeft-0.5,'nút Mở rộng không được tràn ra ngoài khung AI Detector');
    await detector.locator('.sentence-detector-close').click();
    assert.equal(await detector.evaluate(el=>el.classList.contains('is-collapsed')),false,'bấm mở rộng phải khôi phục đầy đủ thẻ AI Detector');
    assert.equal(await editor.evaluate(el=>el.classList.contains('is-ai-highlight')),true,'bấm mở rộng lại phải tự động tô đỏ lại đoạn nghi ngờ AI');
    await detector.getByRole('button',{name:'Tìm trong bài'}).click();
    const selectedText=await page.evaluate(()=>{const el=document.getElementById('sentenceDraft');return el.value.slice(el.selectionStart,el.selectionEnd);});
    assert.equal(selectedText,'综上所述');

    await page.evaluate(()=>{
      window.HSKAiProviderPicker.applyAvailability('test-user',{
        system:{gemini:{available:true},chatgpt:{available:false}},
        personal:{configured:true,enabled:true,provider:'fosta',model:'gpt-6-luna',providers:{fosta:{configured:true,enabled:true,provider:'fosta',model:'gpt-6-luna'}}}
      });
      window.HSKAiProviderPicker.setSelectionFromSelect('personal:fosta');
    });
    await effortBtn.waitFor({state:'visible'});
    assert.ok(!(await effortBtn.isDisabled()));
    assert.match(await effortBtn.innerText(),/^Luna · /);
    await effortBtn.click();
    const sePopover=editor.locator('.sentence-ai-actions .qa-effort-popover');
    await sePopover.waitFor({state:'visible'});
    const seSlider=sePopover.locator('.qa-effort-slider-wrap');
    await seSlider.focus();
    await page.keyboard.press('End');
    assert.match(await sePopover.locator('.qa-effort-header-btn').innerText(),/Luna \(gpt-6-luna\)/,'trượt thanh mạnh không được tự đổi sang model khác');
    assert.equal(await sePopover.locator('.qa-effort-strength-value').innerText(),'Chuyên sâu');
    await sePopover.locator('.qa-effort-header-btn').click();
    const modelItems=sePopover.locator('.qa-effort-model-item');
    assert.equal(await modelItems.count(),3,'danh sách chọn model của Fosta chỉ liệt kê 3 model, không trộn mức mạnh');
    await modelItems.nth(2).click();
    assert.equal(await sePopover.isVisible(),false);
    assert.match(await effortBtn.innerText(),/^Astra · /);

    await detector.locator('.sentence-detector-close').click();
    await page.setViewportSize({width:1440,height:900});
    const desktopCollapsedBounds=await detector.evaluate(el=>{
      const box=el.getBoundingClientRect();
      const btn=el.querySelector('.sentence-detector-close').getBoundingClientRect();
      return {boxLeft:box.left,boxRight:box.right,btnLeft:btn.left,btnRight:btn.right};
    });
    assert.ok(desktopCollapsedBounds.btnRight<=desktopCollapsedBounds.boxRight+0.5&&desktopCollapsedBounds.btnLeft>=desktopCollapsedBounds.boxLeft-0.5,'trên desktop nút Mở rộng cũng không được tràn khỏi ô');
    await check.click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    const fostaSent=await page.evaluate(()=>({
      aiProvider:window.__lastGrammarRequest?.aiProvider,
      personalProvider:window.__lastGrammarRequest?.personalProvider,
      aiModel:window.__lastGrammarRequest?.aiModel
    }));
    assert.equal(fostaSent.aiProvider,'personal:fosta');
    assert.equal(fostaSent.personalProvider,'fosta');
    assert.match(String(fostaSent.aiModel||''),/^gpt-6-astra/);
    await page.evaluate(()=>window.__resolveGrammar({aiSource:{provider:'fosta',model:'gpt-6-astra:xhigh'},sentenceReview:{summary:'Đã kiểm tra.',suggestions:[]}}));
    await status.filter({hasText:'Nguồn: Fosta · gpt-6-astra:xhigh.'}).waitFor();

    // Verify Grammarly-style right rail switches across sub-tools without losing pasted draft text or results
    const persistentText='我每天早上都去图书馆学习汉语，因为我非常喜欢中国文化。';
    await input.fill(persistentText);
    await editor.locator('[data-sentence-tool="stats"]').click();
    await editor.locator('#sentenceStatsBody .sentence-stat-card').first().waitFor({state:'visible'});
    assert.equal(await input.inputValue(),persistentText,'chuyển sang tab Thống kê không được làm mất văn bản đang dán');

    await editor.locator('[data-sentence-tool="rewrite"]').click();
    assert.equal(await input.inputValue(),persistentText,'chuyển sang tab Viết lại không được làm mất văn bản đang dán');
    await editor.locator('#sentenceRewriteRunBtn').click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    assert.equal(await page.evaluate(()=>window.__lastGrammarRequest?.lesson?.content?.mode),'ai-qa');
    await page.evaluate(()=>window.__resolveGrammar({aiSource:{provider:'fosta',model:'gpt-6-astra:xhigh'},answer:'[[REWRITE]]我每天一早就去图书馆学汉语，因为我特别喜欢中国文化。[[/REWRITE]]\nĐã điều chỉnh từ ngữ tự nhiên hơn.'}));
    await editor.locator('.sentence-rewrite-text').filter({hasText:'我每天一早就去图书馆学汉语'}).waitFor();

    await editor.locator('[data-sentence-tool="ask"]').click();
    assert.equal(await input.inputValue(),persistentText,'chuyển sang tab Hỏi nhanh AI không được làm mất văn bản đang dán');
    await editor.locator('#sentenceQaInput').fill('Đoạn này có tự nhiên không?');
    await editor.locator('#sentenceQaSendBtn').click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    await page.evaluate(()=>window.__resolveGrammar({aiSource:{provider:'fosta',model:'gpt-6-astra:xhigh'},answer:'Đoạn văn viết khá tự nhiên ở trình độ HSK 3.'}));
    await editor.locator('.sentence-qa-msg[data-role="assistant"]').filter({hasText:'Đoạn văn viết khá tự nhiên'}).waitFor();

    // AI Grader tab: rubric, grading score card, 4 criteria & persistence across tab switches
    await editor.locator('[data-sentence-tool="grader"]').click();
    assert.equal(await input.inputValue(),persistentText,'chuyển sang tab AI Grader không được làm mất văn bản đang dán');
    await editor.locator('[data-grader-rubric="strict"]').click();
    await editor.locator('#sentenceGraderPrompt').fill('Giới thiệu thói quen học tập hằng ngày');
    await editor.locator('#sentenceGraderRunBtn').click();
    await page.waitForFunction(()=>!!window.__resolveGrammar);
    assert.equal(await page.evaluate(()=>window.__lastGrammarRequest?.lesson?.content?.learning_snapshot?.task),'chinese_writing_grader');
    await page.evaluate(()=>window.__resolveGrammar({aiSource:{provider:'fosta',model:'gpt-6-astra:xhigh'},answer:'[[GRADER]]{"overallScore":86,"gradeLabel":"Giỏi (A)","estimatedHsk":"HSK 4","summary":"Câu văn rõ ràng, đúng trọng tâm và tự nhiên.","criteria":{"grammar":{"score":90,"note":"Trật tự từ chính xác."},"vocabulary":{"score":82,"note":"Từ vựng phù hợp HSK 3-4."},"coherence":{"score":88,"note":"Mối quan hệ nhân quả mạch lạc."},"naturalness":{"score":84,"note":"Khá tự nhiên."}},"strengths":["Dùng liên từ 因为 mạch lạc"],"improvements":["Có thể thay 非常 bằng 特别 để tự nhiên hơn"]}[[/GRADER]]'}));
    await editor.locator('.sentence-grader-score-badge strong').filter({hasText:'86'}).waitFor();
    await editor.locator('[data-tool-badge="grader"]').filter({hasText:'86'}).waitFor();
    await editor.locator('.sentence-grader-criterion').first().waitFor({state:'visible'});

    // Switch back to Rewrite, Grader, Detector, Stats, Grammar -> draft and stored results must still be intact
    await editor.locator('[data-sentence-tool="rewrite"]').click();
    await editor.locator('.sentence-rewrite-text').filter({hasText:'我每天一早就去图书馆学汉语'}).waitFor();
    await editor.locator('[data-sentence-tool="grader"]').click();
    await editor.locator('.sentence-grader-score-badge strong').filter({hasText:'86'}).waitFor();
    await editor.locator('[data-sentence-tool="grammar"]').click();
    assert.equal(await input.inputValue(),persistentText,'quay lại tab Sửa ngữ pháp vẫn giữ nguyên văn bản đang dán');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'editor with right rail must not overflow horizontally on desktop');
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'editor with right rail must not overflow horizontally on mobile');

    console.log('PASS AI sentence editor: login/offline states, manual requests, stale result rejection, provider, apply/undo and responsive layout');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
