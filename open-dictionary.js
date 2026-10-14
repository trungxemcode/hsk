(()=>{
 'use strict';const C=window.HSKOpenDictionaryCore,$=id=>document.getElementById(id),B=window.HSKDictionaryBridge;
 let items={},serial=0,controller=null,queue=[],revealed=false,config=null;const loaded=new Map(),pending=new Map(),aiCache=new Map();
 try{items=C.clean(JSON.parse(localStorage.getItem(C.KEY)||'{}'));}catch(_){}
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=node('button',text);b.type='button';b.onclick=fn;return b;};
 const box=node('section','','open-dictionary');box.id='openDictionary';$('searchPanel').append(box);
 const reviewBox=node('section','','open-dictionary');reviewBox.id='openDictionarySrs';$('srsPanel').append(reviewBox);
 function save(){try{localStorage.setItem(C.KEY,JSON.stringify({version:1,items}));}catch(_){$('storageNotice').hidden=false;$('storageNotice').textContent='Không lưu được lịch ôn từ mở rộng trên thiết bị.';}renderSrsHome();}
 async function shard(n){if(loaded.has(n))return loaded.get(n);if(pending.has(n))return pending.get(n);
  const task=(async()=>{const url='./content/open-dictionary/'+String(n).padStart(2,'0')+'.json.gz';let cache,hit;try{cache=await caches.open('hsk-open-dictionary-cedict-v1');hit=await cache.match(url);}catch(_){}
   const r=hit||await fetch(url);if(!r.ok)throw Error('Cần mạng để tải phần từ điển chưa có trên thiết bị.');
   if(typeof DecompressionStream!=='function')throw Error('Trình duyệt chưa hỗ trợ mở từ điển nén. Hãy cập nhật trình duyệt.');
   const copy=r.clone(),data=JSON.parse(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text());
   if(!Array.isArray(data)||!data.every(x=>Array.isArray(x)&&x.length===4&&x.slice(0,3).every(v=>typeof v==='string')&&Array.isArray(x[3])&&x[3].every(v=>typeof v==='string')))throw Error('Dữ liệu từ điển chưa hợp lệ.');
   loaded.set(n,data);if(!hit&&cache)try{await cache.put(url,copy);}catch(_){}return data;
  })();pending.set(n,task);try{return await task;}finally{pending.delete(n);}}
 function membership(w){return B.hsk(w.han,w.trad);}
 async function lookup(q,target,status,token,general=false){status.textContent='Đang tra từ điển…';
  try{const chinese=/^[\p{Script=Han}]+$/u.test(q),rows=[];
   if(chinese&&!general)rows.push(...await shard(q.codePointAt(0)%32));
   else for(let start=0;start<32;start+=4){if(token!==serial)return;const batch=await Promise.all(Array.from({length:4},(_,i)=>shard(start+i)));for(const part of batch)rows.push(...part);status.textContent=`Đang mở từ điển · ${start+4}/32 phần…`;}
   if(token!==serial)return;const seen=new Set(),found=[];
   if(general)for(const {w,score} of B.results()){const word={han:w.han,trad:w.han,pin:w.pin,mean:w.mean,native:true};seen.add('hsk|'+w.han+'|'+w.pin);found.push({w:word,score});}
   for(const r of rows){const key=r.slice(0,3).join('|'),score=general?C.score(r,q):C.matches(r,q)?150:0;if(!score||seen.has(key))continue;seen.add(key);found.push({w:{han:r[0],trad:r[1],pin:r[2],mean:r[3].join('; ')},score});}
   found.sort((a,b)=>b.score-a.score||a.w.han.length-b.w.han.length||a.w.han.localeCompare(b.w.han));let shown=40;
   const draw=()=>{target.replaceChildren();for(const {w} of found.slice(0,shown))renderWord(w,target);status.textContent=found.length?`${found.length} kết quả · Hiển thị ${Math.min(shown,found.length)} · ${general?'Xếp theo độ khớp':'Tham khảo ngoài kho HSK'}`:'Chưa có kết quả phù hợp. Có thể nhập câu chứa từ và nhờ AI giải thích.';if(shown<found.length)target.append(button('Xem thêm kết quả',()=>{shown+=40;draw();}));};draw();
  }catch(e){if(token===serial)status.textContent=e.message;}}
 function renderWord(w,target){const card=node('article','','result-card extended-word');const level=membership(w);card.append(node('span',level?'HSK '+level:'Từ mở rộng','hsk-tag'),node('h3',w.han),node('p',w.pin),node('p',w.mean));if(w.trad!==w.han)card.append(node('p','Phồn thể: '+w.trad,'hint'));if(w.native)card.append(button('Mở thẻ HSK',()=>B.open(w.han,w.pin)));
  const speech=window.HSKSpeech?.button(w.han,'Nghe phát âm '+w.han);if(speech)card.append(speech);
  const ai=node('div','','dictionary-ai');ai.append(button('Giải thích tiếng Việt với AI',()=>askAI(w,ai)));card.append(ai);
  if(!level){const action=button(items[C.id(w)]?'Đã thêm vào SRS · Gỡ':'Ôn với SRS',()=>{const key=C.id(w);if(items[key]){delete items[key];queue=queue.filter(k=>k!==key);}else items=C.add(items,w);save();action.textContent=items[key]?'Đã thêm vào SRS · Gỡ':'Ôn với SRS';});action.className='dictionary-srs-add';card.append(action);}
  card.append(node('small',w.native?'Kho HSK · Nghĩa tiếng Việt':'CC-CEDICT · Nghĩa tiếng Anh'));target.append(card);}
 function prepare(){++serial;controller?.abort();controller=null;const token=serial,q=B.query().trim(),general=B.scope()==='general';box.replaceChildren();box.hidden=!q||!general&&B.results().length>0;if(box.hidden)return;
  box.append(node('h3',general?'Kết quả tra cứu':'Tham khảo ngoài kho HSK'));const status=node('p','','hint'),results=node('div','','result-grid'),context=node('input');context.placeholder='Câu chứa từ (không bắt buộc)';context.maxLength=280;context.setAttribute('aria-label','Ngữ cảnh của từ cần tra');context.className='dictionary-context';
  const actions=node('div','','dictionary-actions');if(!general)actions.append(button('Tra từ mở rộng',()=>lookup(q,results,status,token)));actions.append(button('Giải thích bằng AI',()=>askAI({han:q,pin:'',mean:'Chưa có nghĩa từ điển; cần xác định theo ngữ cảnh.'},results,context.value)));
  box.append(actions,context,status,results);const credit=node('a','Nguồn từ điển và giấy phép');credit.href='./open-dictionary-notice.html';credit.target='_blank';credit.rel='noopener';box.append(credit);
  if(general){for(const {w} of B.results().slice(0,40))renderWord({han:w.han,trad:w.han,pin:w.pin,mean:w.mean,native:true},results);lookup(q,results,status,token,true);}else if(/^[\p{Script=Han}]+$/u.test(q)&&!B.exact(q))lookup(q,results,status,token);
 }
 async function askAI(w,target,context=''){
  const user=window.HSKAccountDashboard?.user;target.replaceChildren();const status=node('p','','hint');target.append(status);
  const retry=()=>target.append(button('Thử lại',()=>askAI(w,target,context)));
  if(!user){status.textContent='Hãy đăng nhập để dùng AI. Tra từ điển không cần tài khoản.';retry();return;}
  if(!config){status.textContent='Chưa kết nối được AI.';retry();return;}
  controller?.abort();controller=new AbortController();const request=controller,token=serial,key=w.han+'|'+w.pin+'|'+context+'|'+user.uid;
  if(aiCache.has(key)){target.append(node('p',aiCache.get(key),'dictionary-ai-answer'));return;}
  status.textContent='AI đang giải thích…';const timer=setTimeout(()=>request.abort(),30000);
  try{const auth=await user.getIdToken();if(token!==serial||request.signal.aborted)return;const response=await fetch(config.endpoint.replace(/\/translate$/,'/lesson-ask'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth},signal:request.signal,body:JSON.stringify({hsk:1,question:('Giải thích tiếng Việt tối đa 100 từ: '+w.han+'. Nêu pinyin, nghĩa, cách dùng, 1 ví dụ kèm dịch. Dựa vào nghĩa nguồn; nếu chưa chắc hoặc là tên riêng hãy nói rõ, không tự gán HSK. '+(context?'Ngữ cảnh: '+context:'')).slice(0,500),lesson:{id:'open-dictionary',title:'Tra từ mở rộng',words:[w],content:{source:'CC-CEDICT (nghĩa tiếng Anh); không phải bài học HSK',word:w,context}},history:[]})});const data=await response.json();if(token!==serial||request.signal.aborted)return;if(!response.ok)throw Error(data.error||'AI chưa trả lời được.');if(typeof data.answer!=='string'||!data.answer.trim()||data.answer.length>5000)throw Error('AI chưa trả nhận xét hợp lệ.');aiCache.set(key,data.answer);if(aiCache.size>40)aiCache.delete(aiCache.keys().next().value);target.replaceChildren(node('small','Giải thích bằng AI'),node('p',data.answer,'dictionary-ai-answer'));
  }catch(e){if(token===serial){status.textContent=e.name==='AbortError'?'Đã hủy hoặc AI trả lời quá lâu.':e.message;retry();}}finally{clearTimeout(timer);if(controller===request)controller=null;}}
 function renderSrsHome(){reviewBox.replaceChildren(node('h3','SRS · Từ mở rộng'));const due=Object.keys(items).filter(k=>items[k].due<=Date.now()).sort((a,b)=>items[a].due-items[b].due);reviewBox.append(node('p',`${Object.keys(items).length} từ đã chọn · ${due.length} từ đến hạn`,'hint'));
  reviewBox.append(button('Ôn từ mở rộng',()=>{queue=due.slice();revealed=false;renderReview();}));if(!queue.length&&Object.keys(items).length){const list=node('details'),summary=node('summary','Quản lý từ đã thêm');list.append(summary);for(const [key,r] of Object.entries(items)){const row=node('div','','dictionary-actions');row.append(node('span',r.word.han+' · '+r.word.pin),button('Gỡ khỏi SRS',()=>{delete items[key];save();}));list.append(row);}reviewBox.append(list);}}
 function renderReview(){renderSrsHome();queue=queue.filter(k=>items[k]);if(!queue.length){reviewBox.append(node('p','Đã hết từ đến hạn. Lịch này không tính vào tiến độ HSK.','hint'));return;}const key=queue[0],r=items[key],card=node('article','','extended-review');card.append(node('h3',r.word.han));const speech=window.HSKSpeech?.button(r.word.han,'Nghe phát âm '+r.word.han);if(speech)card.append(speech);
  if(!revealed)card.append(button('Xem nghĩa',()=>{revealed=true;renderReview();}));else{card.append(node('p',r.word.pin),node('p',r.word.mean),node('small','Nghĩa gốc tiếng Anh · CC-CEDICT'));const actions=node('div','','dictionary-actions');for(const [rating,label] of [['again','Chưa nhớ'],['hard','Khó'],['good','Nhớ'],['easy','Dễ']])actions.append(button(label,()=>{items[key]=C.rate(items[key],rating);queue.shift();revealed=false;save();renderReview();}));card.append(actions);}reviewBox.append(card);}
 window.addEventListener('hsk-search-rendered',prepare);window.addEventListener('hsk-account-ready',()=>{++serial;controller?.abort();aiCache.clear();queue=[];try{items=C.clean(JSON.parse(localStorage.getItem(C.KEY)||'{}'));}catch(_){items={};}renderSrsHome();prepare();});
 fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.enabled&&new URL(c.endpoint).protocol==='https:')config=c;}).catch(()=>{});
 window.HSKOpenDictionary={lookup:async q=>{const rows=await shard(q.codePointAt(0)%32);return rows.filter(r=>r[0]===q||r[1]===q);},prepare};renderSrsHome();prepare();
})();
