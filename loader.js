(async function(){
 const status=document.getElementById('appLoadStatus');
 const names=['words','dictionarySupplement','checkedPracticeExamples','exampleMetadata','wordRelationsData','usageFactsData','confusableGroups','contextQuizBank'];
 function scriptFile(url){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;el.onload=resolve;el.onerror=()=>reject(Error('Không tải được '+url));document.body.append(el);});}
 async function dataText(name){
  if(typeof DecompressionStream!=='function'||location.protocol==='file:')return null;
  try{const r=await fetch('./'+name+'.js.gz');if(!r.ok)throw Error('HTTP '+r.status);const code=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();if(!code.trim().startsWith('const '+name+(name==='words'?' ':'='))&&name!=='words')throw Error('Dữ liệu không hợp lệ');return code;}catch(e){return null;}
 }
 try{
  const texts=await Promise.all(names.map(dataText));
  for(let i=0;i<names.length;i++){status.textContent='Đang mở dữ liệu '+(i+1)+' / '+names.length+'…';if(texts[i]!==null){const el=document.createElement('script');el.textContent=texts[i];document.body.append(el);}else await scriptFile('./'+names[i]+'.js');}
  await scriptFile('./app.js');status.hidden=true;
 }catch(e){status.textContent='Chưa tải được dữ liệu. Kiểm tra mạng và việc đã tải đủ các file dữ liệu lên GitHub. ';const retry=document.createElement('button');retry.textContent='Tải lại';retry.onclick=()=>location.reload();status.append(retry);}
})();
