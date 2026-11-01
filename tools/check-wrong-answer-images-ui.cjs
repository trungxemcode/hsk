/* End-to-end browser check: Drive data and rendered SVG reach the client AI payload. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKWrongAnswerImages&&window.HSKWrongAnswerAI&&window.HSKDriveExam);
   const result=await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=12;canvas.height=12;const d=canvas.getContext('2d');d.fillStyle='#cc00bb';d.fillRect(0,0,12,12);const png=canvas.toDataURL('image/png');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 160 120');const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx','80');circle.setAttribute('cy','60');circle.setAttribute('r','35');svg.append(circle);
    const converted=await HSKWrongAnswerImages.prepare([{label:'Trang đề gốc',load:()=>Promise.resolve(png)},{label:'Lựa chọn A',svg},{label:'Ảnh từ nguồn câu hỏi',src:'https://s4-media1.study4.com/media/hsk_tests/images/test.png'}]);
    return converted.map(x=>({label:x.label,mimeType:x.mimeType||'',isPng:x.data?x.data.startsWith('iVBOR'):false,remote:x.src||'',bytes:x.data?.length||0}));
   });
   assert.equal(result.length,3);
   assert.deepEqual(result.map(x=>x.label),['Trang đề gốc','Lựa chọn A','Ảnh từ nguồn câu hỏi']);
   assert.ok(result.slice(0,2).every(x=>x.mimeType==='image/png'&&x.isPng&&x.bytes>50));
   assert.match(result[2].remote,/^https:\/\/s4-media1\.study4\.com/);
   await page.waitForFunction(()=>window.HSKDriveExam?.ready,{timeout:25000});
   const drive=await page.evaluate(async()=>{const q=window.HSKExamBank.items.find(q=>q.materialImages?.length);if(!q)return null;const pictures=await window.HSKWrongAnswerImages.prepare([{label:'Trang đề '+q.sourceRef.code,load:()=>window.HSKDriveExam.image(q.materialImages[0])}]);return {mimeType:pictures[0].mimeType,bytes:pictures[0].data.length,isWebp:pictures[0].data.startsWith('UklG')};});
   assert.ok(drive?.isWebp&&drive?.mimeType==='image/webp'&&drive.bytes>100,'Actual Drive exam page must reach the image encoder');
   await assert.rejects(page.evaluate(()=>HSKWrongAnswerImages.prepare([{label:'error',load:()=>Promise.resolve('data:application/javascript;base64,AA==')}])));
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS browser image preparation: real data PNG, vector SVG converted to PNG, trusted Study4 URI preserved, invalid media rejected (390/1440).');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
