(()=>{
 'use strict';const C=window.HSKOpenDictionaryCore,$=id=>document.getElementById(id),B=window.HSKDictionaryBridge;
 let items={},serial=0,controller=null,queue=[],revealed=false,config=null,lookupStatus=null,viTimer=null,viPending=null,viUnavailable=false,viCache={};const loaded=new Map(),pending=new Map(),aiCache=new Map(),searchCache=new Map();
 try{const data=JSON.parse(localStorage.getItem('hsk-dictionary-vietnamese-v2')||'{}');for(const [k,v] of Object.entries(data))if(v&&typeof v.meaning==='string'&&v.meaning.length<=240&&Number.isFinite(v.time))viCache[k]=v;}catch(_){}
 try{items=C.clean(JSON.parse(localStorage.getItem(C.KEY)||'{}'));}catch(_){}
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=node('button',text);b.type='button';b.onclick=fn;return b;};
 const vi=w=>w.native||w.meanLanguage==='vi'?w.mean:w.meanVi||viCache[C.translationKey(w)]?.meaning||'';
 const fmtPin=s=>C.formatPinyin?C.formatPinyin(s||''):String(s||'');
 const brief=s=>String(s).split(/[;；\n]/)[0].trim();
 const canAutoTranslate=()=>Boolean(window.HSKAccountDashboard?.user&&config&&!viUnavailable);
 const fallbackRowText=()=>canAutoTranslate()?'Đang tải nghĩa Việt…':'Chưa có nghĩa Việt offline';
 const fallbackBodyText=()=>canAutoTranslate()?'Đang tự động dịch sang tiếng Việt…':'Chưa có nghĩa Việt trong kho offline. Đăng nhập và bật mạng để tự động dịch sang tiếng Việt.';
 const friendlyNetError=err=>{const msg=String(err?.message||'');if(err?.name==='AbortError')return 'Kết nối quá thời gian chờ. Hãy thử lại.';if(/failed to fetch|networkerror|load failed/i.test(msg))return 'Chưa kết nối được máy chủ dịch/AI (kiểm tra mạng hoặc đăng nhập lại).';return msg||'Chưa tải được dữ liệu.';};
 let localViMapCache=null;
 function getLocalViMap(){
  if(localViMapCache)return localViMapCache;
  const map=new Map();
  const add=(han,pin,mean)=>{if(!han||!mean)return;const xs=map.get(han)||[];if(!xs.some(x=>x.pin===(pin||'')&&x.mean===mean))xs.push({pin:pin||'',mean});map.set(han,xs);};
  for(const w of window.HSKVocabularyBridge?.snapshot?.()||[])add(w.han,w.pin,w.mean);
  for(const w of window.HSKSearchRanking?.everydayWords||[])add(w.han,w.pin,w.mean);
  const facts=window.HSKVocabularyBridge?.facts?.()?.words;
  if(facts)for(const [han,entry] of Object.entries(facts))for(const vr of entry?.variants||[]){
   const means=[...new Set((vr.senses||[]).map(s=>s?.mean).filter(Boolean))];
   if(means.length)add(han,vr.pin||'',means.join('; '));
  }
  const relEntries=window.HSKVocabularyBridge?.relations?.()?.entries;
  if(relEntries)for(const rel of Object.values(relEntries)){
   for(const arr of [rel?.synonyms||[],rel?.antonyms||[]]){
    for(const item of arr)if(item?.han&&item?.mean)add(item.han,item.pin||'',item.mean);
   }
  }
  if(map.size)localViMapCache=map;
  return map;
 }
 function resolveLocalVi(han,trad,pin){
  const map=getLocalViMap(),isProper=/^[A-Z]/.test(String(pin||'').trim());
  for(const key of [han,trad]){
   const list=key&&map.get(key);
   if(!list?.length)continue;
   const exact=list.find(x=>x.pin&&pin&&C.sameReading(x.pin,pin)&&(!isProper||/^[A-Z]/.test(String(x.pin).trim())));
   if(exact)return exact.mean;
   if(!isProper&&list.length===1){
    const only=list[0];
    if(!only.pin||!pin||C.fold(only.pin)===C.fold(pin))return only.mean;
   }
  }
  return '';
 }
 const PHONETIC_MEMORY_KEY='hsk-user-phonetic-memory-v1';
 function readPhoneticMemory(){try{const value=JSON.parse(localStorage.getItem(PHONETIC_MEMORY_KEY)||'{}');return {exact:value?.exact&&typeof value.exact==='object'?value.exact:{},syllables:value?.syllables&&typeof value.syllables==='object'?value.syllables:{}};}catch(_){return {exact:{},syllables:{}};}}
 function rememberPhoneticLookup(rawSoundInput,confirmedTerm){if(!rawSoundInput||!confirmedTerm?.han)return;try{const memory=readPhoneticMemory(),key=C.normalizePhoneticKey(rawSoundInput);if(!key)return;memory.exact[key]={han:String(confirmedTerm.han).slice(0,24),pinyin:String(confirmedTerm.pinyin||'').slice(0,100),meaning:String(confirmedTerm.meaning||'').slice(0,160),updatedAt:Date.now()};const inputSyllables=key.split(/\s+/),pinyinSyllables=String(confirmedTerm.pinyin||'').toLowerCase().split(/[\s,]+/).filter(Boolean);if(inputSyllables.length===pinyinSyllables.length&&inputSyllables.length<=4)inputSyllables.forEach((syllable,index)=>{if(syllable.length>=2&&syllable!==C.normalizePhoneticKey(pinyinSyllables[index]))memory.syllables[syllable]=C.normalizePhoneticKey(pinyinSyllables[index]);});const keys=Object.keys(memory.exact).sort((a,b)=>(memory.exact[b].updatedAt||0)-(memory.exact[a].updatedAt||0));for(const old of keys.slice(200))delete memory.exact[old];localStorage.setItem(PHONETIC_MEMORY_KEY,JSON.stringify(memory));}catch(_){} }
 function rememberedLookup(raw){const memory=readPhoneticMemory(),value=memory.exact[C.normalizePhoneticKey(raw)];return value&&value.han?value:null;}
 async function localCandidatesFor(query,meaning){const hints=C.expandVietnamesePhonetic(query),allRows=[...loaded.values()].flat(),unique=new Map();for(const {w} of B.results()){const row=[w.han,w.han,w.pin,[w.mean]];const score=C.phoneticCandidateScore(w.pin,hints)+(meaning&&C.score(row,meaning)?24:0);if(score)unique.set(row.slice(0,3).join('|'),{han:w.han,pinyin:w.pin,meaning:String(w.mean||'').slice(0,240),score});}if(allRows.length<100){const shards=await Promise.all(Array.from({length:32},(_,i)=>shard(i)));allRows.push(...shards.flat());}for(const row of allRows){const key=row.slice(0,3).join('|');if(unique.has(key))continue;const phonetic=C.phoneticCandidateScore(row[2],hints),gloss=String(row[3]?.join(' ')||''),semantic=meaning&&C.score(row,meaning)?20:0;if(phonetic||semantic)unique.set(key,{han:row[0],pinyin:row[2],meaning:gloss.slice(0,240),score:phonetic+semantic});}return [...unique.values()].sort((a,b)=>b.score-a.score||a.han.length-b.han.length).slice(0,12).map(({score,...term})=>term);}
 async function recoveryGrounding(query,meaning,previous){const memory=readPhoneticMemory(),hints=C.expandVietnamesePhonetic(query),key=C.normalizePhoneticKey(query),learned=key.split(/\s+/).map(s=>memory.syllables[s]).filter(Boolean);if(learned.length)hints.push(learned);const candidates=await localCandidatesFor(query,meaning);const remembered=memory.exact[key];if(remembered&&!candidates.some(t=>t.han===remembered.han))candidates.unshift({han:remembered.han,pinyin:remembered.pinyin,meaning:remembered.meaning});return {phoneticHints:hints,localCandidates:candidates,excludedTerms:previous||[]};}
 function rememberVi(w,meaning){viCache[C.translationKey(w)]={meaning,time:Date.now()};const all=Object.keys(viCache).sort((a,b)=>viCache[b].time-viCache[a].time);for(const k of all.slice(1200))delete viCache[k];try{localStorage.setItem('hsk-dictionary-vietnamese-v2',JSON.stringify(viCache));}catch(_){}applyVi();}
 function applyVi(){
  document.querySelectorAll('[data-vi-key]').forEach(el=>{
   const w=el.__dictionaryWord,text=vi(w);
   if(text){
    el.textContent=el.classList.contains('dictionary-row-meaning')&&!el.classList.contains('is-sense-primary')?brief(text):(el.classList.contains('is-sense-primary')?text.split(/[;；\n]/)[0].trim():text);
    el.classList.remove('is-fallback-gloss');
    const slot=el.closest('.search-sense-block')?.querySelector('[data-sense-slot]');
    if(slot)slot.dataset.senseMean=el.textContent;
   }
  });
  document.querySelectorAll('.open-hanzii-active[data-cedict-fallback="true"]').forEach(wrap=>{
   const w=wrap.__dictionaryWord,text=w&&vi(w);
   if(!text)return;
   const parts=text.split(/[;；\n]/).map(x=>x.trim()).filter(Boolean);
   const countEl=wrap.querySelector('.is-pos .search-acc-count');
   if(countEl)countEl.textContent=String(Math.max(1,parts.length));
   const blocksHost=wrap.querySelector('.search-sense-blocks');
   if(blocksHost&&blocksHost.dataset.renderedVi!==text){
    blocksHost.dataset.renderedVi=text;
    const firstBlock=blocksHost.firstElementChild;
    while(blocksHost.children.length>1)blocksHost.lastElementChild.remove();
    const firstSlot=firstBlock?.querySelector('[data-sense-slot]');
    if(firstSlot)firstSlot.dataset.senseMean=parts[0]||text;
    parts.slice(1,5).forEach((senseText,idx)=>{
     const block=node('div','','search-sense-block');
     const head=node('p','','search-sense-heading search-acc-senses-inline');
     const num=node('span',`${idx+2}.`,'search-sense-num');num.setAttribute('aria-hidden','true');
     head.append(num,node('span',senseText,'search-sense-label'));
     const exHost=node('div','','search-example-list search-sense-examples');
     exHost.dataset.senseSlot=`s_0_${idx+1}`;exHost.dataset.sensePos='Nghĩa tiếng Việt';exHost.dataset.senseMean=senseText;exHost.hidden=true;
     block.append(head,exHost);
     blocksHost.append(block);
    });
   }
   wrap.querySelectorAll('.dictionary-meaning.hint').forEach(h=>h.remove());
   B.ensureSenseExamples?.(w,wrap);
  });
  document.querySelectorAll('.dictionary-meaning-retry').forEach(b=>{b.hidden=!!vi(b.__dictionaryWord);});
  document.querySelectorAll('.dictionary-srs-add').forEach(b=>{b.disabled=!vi(b.__dictionaryWord);});
 }
 function scheduleVi(){clearTimeout(viTimer);if(!viPending&&!viUnavailable)viTimer=setTimeout(translateVisible,120);}
 async function translateVisible(){const user=window.HSKAccountDashboard?.user;if(!user||!config||viPending||viUnavailable)return;const seen=new Set(),entries=[];for(const el of document.querySelectorAll('[data-vi-key]')){const w=el.__dictionaryWord,id=C.translationKey(w);if(!vi(w)&&!seen.has(id)){seen.add(id);entries.push({id,han:w.han,pinyin:w.pin,gloss:(w.sourceMean||w.mean).slice(0,1000)});}if(entries.length===10)break;}if(!entries.length)return;
  const owner=user.uid,request=new AbortController();let success=false;viPending=request;const timer=setTimeout(()=>request.abort(),45000);
  try{const token=await user.getIdToken();const response=await fetch(config.endpoint.replace(/\/translate$/,'/dictionary-translate'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({entries}),signal:request.signal});const data=await response.json();if(window.HSKAccountDashboard?.user?.uid!==owner||request.signal.aborted)return;if(!response.ok){if(response.status===404)viUnavailable=true;throw Error(response.status===404?'Cần cập nhật Worker để dịch nghĩa tiếng Việt theo nhóm.':data.error||'Chưa dịch được nghĩa Việt.');}if(data.language!=='vi'||!Array.isArray(data.translations)||data.translations.length!==entries.length||new Set(data.translations.map(t=>t.id)).size!==entries.length||!data.translations.every(t=>seen.has(t.id)&&typeof t.meaning==='string'&&t.meaning.trim()&&t.meaning.length<=240))throw Error('Bản dịch nhóm chưa hợp lệ.');for(const t of data.translations)viCache[t.id]={meaning:t.meaning,time:Date.now()};const all=Object.keys(viCache).sort((a,b)=>viCache[b].time-viCache[a].time);for(const k of all.slice(1200))delete viCache[k];try{localStorage.setItem('hsk-dictionary-vietnamese-v2',JSON.stringify(viCache));}catch(_){}applyVi();
   success=true;
  }catch(e){if(!request.signal.aborted){const errText=friendlyNetError(e);document.querySelectorAll('[data-vi-key]').forEach(el=>{const w=el.__dictionaryWord;if(!vi(w)){el.textContent=el.classList.contains('dictionary-row-meaning')?fallbackRowText(w):fallbackBodyText(w);el.title=errText;}});}}finally{clearTimeout(timer);if(viPending===request){viPending=null;if(success)viTimer=setTimeout(translateVisible,1800);}}}
 const box=node('section','','open-dictionary');box.id='openDictionary';$('searchPanel').append(box);
 const reviewBox=node('section','','open-dictionary');reviewBox.id='openDictionarySrs';$('srsPanel').append(reviewBox);
 function save(){try{localStorage.setItem(C.KEY,JSON.stringify({version:1,items}));}catch(_){$('storageNotice').hidden=false;$('storageNotice').textContent='Không lưu được lịch ôn từ mở rộng trên thiết bị.';}renderSrsHome();}
 async function shard(n){if(loaded.has(n))return loaded.get(n);if(pending.has(n))return pending.get(n);
  const task=(async()=>{const url='./content/open-dictionary/'+String(n).padStart(2,'0')+'.json.gz';let cache,hit;try{cache=await caches.open('hsk-open-dictionary-cedict-v1');hit=await cache.match(url);}catch(_){}
   const r=hit||await fetch(url).catch(()=>fetch(url));if(!r.ok)throw Error('Cần mạng để tải phần từ điển chưa có trên thiết bị.');
   if(typeof DecompressionStream!=='function')throw Error('Trình duyệt chưa hỗ trợ mở từ điển nén. Hãy cập nhật trình duyệt.');
   const copy=r.clone(),data=JSON.parse(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text());
   if(!Array.isArray(data)||!data.every(x=>Array.isArray(x)&&x.length===4&&x.slice(0,3).every(v=>typeof v==='string')&&Array.isArray(x[3])&&x[3].every(v=>typeof v==='string')))throw Error('Dữ liệu từ điển chưa hợp lệ.');
   loaded.set(n,data);if(!hit&&cache)try{await cache.put(url,copy);}catch(_){}return data;
  })();pending.set(n,task);try{return await task;}finally{pending.delete(n);}}
 function membership(w){return B.hsk(w.han,w.trad);}
 const bridgeItem=w=>({han:w.han,trad:w.han,pin:w.pin,pinDisplay:fmtPin(w.pinDisplay||w.pin),mean:w.mean,native:!w.isExtended,hsk:w.hsk||null,hasExamples:Boolean((w.practice?.examples?.length>=2)||(w.examples?.length>=1)),...(w.isExtended?{meanVi:w.mean,meanLanguage:'vi'}:{})});
 function recordHit(q,w){if(q&&w)window.HSKSearchRanking?.record(q,w);}
 const isHanQuery=q=>/[\p{Script=Han}]/u.test(String(q||''));
 function isSingleRoot(q){const t=String(q||'').trim();return Boolean(t)&&!isHanQuery(t)&&t.split(/\s+/).length===1;}
 function shouldFoldOpen(entries,q){
  if(!isSingleRoot(q))return false;
  const heads=entries.filter(e=>e.tier>=2).length;
  return heads>=1&&heads<entries.length;
 }
 function shouldHideUntranslated(base,q){
  if(isHanQuery(q))return false;
  let viN=0,nonViN=0;
  for(const e of base){if(vi(e.w))viN++;else nonViN++;}
  return viN>0&&nonViN>0;
 }
 function rankEntry(entry,q){
  const R=window.HSKSearchRanking,level=membership(entry.w),hasVi=Boolean(vi(entry.w));
  return entry.score+(R?R.commonality(entry.w,{hsk:level,hasVi,hasExamples:entry.w.hasExamples||Boolean(level)})+R.boost(q,entry.w):0);
 }
 function filterOpenEntries(entries,filter,q,foldCompounds){
  const base=foldCompounds?entries.filter(e=>e.tier>=2):entries;
  const hideNonVi=shouldHideUntranslated(base,q);
  if(filter==='all')return hideNonVi?base.filter(e=>Boolean(vi(e.w))):base;
  const R=window.HSKSearchRanking;
  if(filter==='compounds')return entries.filter(e=>e.tier<2);
  if(filter==='untranslated')return base.filter(e=>!vi(e.w));
  if(filter==='hsk')return base.filter(e=>Boolean(membership(e.w)));
  if(filter==='vi')return base.filter(e=>Boolean(vi(e.w)));
  if(filter==='pinyin')return (hideNonVi?base.filter(e=>Boolean(vi(e.w))):base).filter(e=>e.hasPinyin);
  if(filter==='frequent')return entries.filter(e=>(R?.hitCount(q,e.w)?.total||0)>0);
  return base;
 }
 function openRelatedCompounds(entry,allEntries,limit=12){
  const seen=new Set([entry.w.han]),items=[];
  const pushItem=(w)=>{if(!w||!w.han||seen.has(w.han))return;seen.add(w.han);items.push(w);};
  const compounds=(allEntries||[]).filter(e=>e.tier<2&&e.w.han!==entry.w.han&&Boolean(vi(e.w)));
  if(entry.hasPinyin&&!entry.hasViMatch){
   for(const e of compounds)if(e.w.han.includes(entry.w.han))pushItem(e.w);
  }else{
   for(const e of compounds)if(e.w.han.includes(entry.w.han))pushItem(e.w);
   for(const e of compounds)if(!e.w.han.includes(entry.w.han))pushItem(e.w);
  }
  for(const item of B.compounds?.(entry.w.han,limit)||[])pushItem(item.w);
  return items.slice(0,limit);
 }
 function renderOpenFilters(filterBar,entries,activeFilter,q,foldCompounds,onSelect){
  if(!filterBar)return;
  filterBar.replaceChildren();
  if(entries.length<=1){filterBar.hidden=true;return;}
  const R=window.HSKSearchRanking;
  const base=foldCompounds?entries.filter(e=>e.tier>=2):entries;
  const hideNonVi=shouldHideUntranslated(base,q);
  const defaultBase=hideNonVi?base.filter(e=>Boolean(vi(e.w))):base;
  const untranslatedCount=hideNonVi?base.length-defaultBase.length:0;
  const compoundCount=foldCompounds?entries.length-base.length:0;
  const hskCount=base.filter(e=>Boolean(membership(e.w))).length;
  const pinCount=defaultBase.filter(e=>e.hasPinyin).length;
  const freqCount=R?entries.filter(e=>(R.hitCount(q,e.w)?.total||0)>0).length:0;
  const chips=[];
  if(foldCompounds&&compoundCount>0)chips.push(['compounds',`Từ ghép cụ thể (${compoundCount})`]);
  if(hskCount>0&&hskCount<defaultBase.length)chips.push(['hsk',`HSK (${hskCount})`]);
  if(pinCount>0&&pinCount<defaultBase.length)chips.push(['pinyin',`Pinyin (${pinCount})`]);
  if(freqCount>0)chips.push(['frequent',`Hay tra (${freqCount})`]);
  if(untranslatedCount>0)chips.push(['untranslated',`Ngoài kho Việt (${untranslatedCount})`]);
  if(!chips.length){filterBar.hidden=true;return;}
  filterBar.hidden=false;
  const firstLabel=foldCompounds?`Từ gốc (${defaultBase.length})`:`Tất cả (${defaultBase.length})`;
  for(const [id,label] of [['all',firstLabel],...chips]){
   const chip=node('button',label,'search-intent-chip');chip.type='button';chip.dataset.openFilter=id;
   chip.setAttribute('aria-pressed',String(activeFilter===id));
   chip.onclick=()=>onSelect(id);
   filterBar.append(chip);
  }
 }
 function buildOpenHeroView(entry,query='',openCtx=null){
  const w=entry.w,level=membership(w),hskDetails=B.details?.(w.han,w.pin)||null;
  const wrap=node('article','','open-hanzii-active');
  const hero=node('div','','search-hero-summary');
  const head=node('div','','search-hero-head');
  head.append(node('h3',w.han,'dictionary-row-han'));
  if(level||w.verification_status==='verified'||w.verification_status==='pinyin_corrected'){
   const badge=node('span','✓','search-hero-verified');badge.setAttribute('aria-hidden','true');badge.title=level?'Từ chuẩn HSK':'Đã đối chiếu từ điển';head.append(badge);
  }
  const phonetic=node('div','','search-hero-phonetic');
  const pinText=fmtPin(w.pinDisplay||w.pin||'');
  if(pinText)phonetic.append(node('span',`[${pinText}]`,'dictionary-row-pinyin'));
  if(hskDetails?.hv)phonetic.append(node('span',`[${hskDetails.hv.toUpperCase()}]`,'search-detail-hv'));
  hero.append(head,phonetic);

  const body=node('div','','search-detail-body');
  const toolbar=node('div','','search-detail-toolbar search-hero-meta'),leftMeta=node('div','','search-detail-left'),actions=node('div','','search-detail-actions');
  leftMeta.append(node('span','Cấp độ:','search-level-label'),node('span',level?'HSK '+level:'Từ mở rộng','hsk-tag search-row-badge'+(level?'':' is-extended')));
  const speech=window.HSKSpeech?.button(w.han,'Nghe phát âm '+w.han);if(speech)actions.append(speech);
  if(w.native||level){actions.append(button('Mở thẻ HSK',()=>{recordHit(query,w);B.open(w.han,w.pin);}));}
  const notebook=window.HSKNotebook?.button(()=>({...w,mean:vi(w),pin:pinText}));if(notebook)actions.append(notebook);
  if(!level){
   const action=button(items[C.id(w)]?'Đã thêm vào SRS · Gỡ':'Ôn với SRS',()=>{recordHit(query,w);const key=C.id(w);if(items[key]){delete items[key];queue=queue.filter(k=>k!==key);}else items=C.add(items,{...w,meanVi:vi(w)});save();action.textContent=items[key]?'Đã thêm vào SRS · Gỡ':'Ôn với SRS';});
   action.className='dictionary-srs-add';action.__dictionaryWord=w;action.disabled=!vi(w);actions.append(action);
  }
  toolbar.append(leftMeta,actions);body.append(toolbar);

  const accStack=node('div','','search-acc-stack');
  if(hskDetails?.posSenses?.length&&B.renderPosAccordions){
   B.renderPosAccordions(accStack,w,hskDetails,{
    hiddenMeaningMeta:{key:C.translationKey(w),word:w,text:brief(vi(w))||brief(hskDetails.posSenses[0].mean)}
   });
   setTimeout(()=>B.ensureSenseExamples?.(w,wrap),0);
  }else{
   wrap.dataset.cedictFallback='true';wrap.__dictionaryWord=w;
   const acc=node('details','','search-acc-card is-pos');acc.open=true;
   const sum=node('summary','','search-acc-summary');
   const arrow=node('span','','search-acc-arrow');arrow.setAttribute('aria-hidden','true');
   const curVi=vi(w),viParts=curVi?curVi.split(/[;；\n]/).map(x=>x.trim()).filter(Boolean):[];
   sum.append(arrow,node('span','Nghĩa tiếng Việt','search-acc-title'),node('span',String(Math.max(1,viParts.length)),'search-acc-count'));
   acc.append(sum);
   const accBody=node('div','','search-acc-body');
   const blocksHost=node('div','','search-sense-blocks');
   if(curVi)blocksHost.dataset.renderedVi=curVi;
   const corpusEx=B.examplesFor?B.examplesFor(w):[];
   const listToRender=viParts.length?viParts.slice(0,5):[fallbackRowText()];
   listToRender.forEach((senseText,idx)=>{
    const block=node('div','','search-sense-block');
    const head=node('p','','search-sense-heading search-acc-senses-inline');
    const num=node('span',`${idx+1}.`,'search-sense-num');num.setAttribute('aria-hidden','true');
    head.append(num);
    if(idx===0){
     const meaningSpan=node('span',senseText,'dictionary-row-meaning is-sense-primary search-sense-label'+(curVi?'':' is-fallback-gloss'));
     meaningSpan.dataset.viKey=C.translationKey(w);meaningSpan.__dictionaryWord=w;
     head.append(meaningSpan);
    }else{
     head.append(node('span',senseText,'search-sense-label'));
    }
    const exHost=node('div','','search-example-list search-sense-examples');
    exHost.dataset.senseSlot=`s_0_${idx}`;exHost.dataset.sensePos='Nghĩa tiếng Việt';exHost.dataset.senseMean=curVi?senseText:'';
    const slotEx=idx===0?corpusEx.slice(0,2):(corpusEx[idx+1]?[corpusEx[idx+1]]:[]);
    for(const ex of slotEx)if(B.makeExampleCard)exHost.append(B.makeExampleCard(ex,w.han));
    if(!exHost.children.length)exHost.hidden=true;
    block.append(head,exHost);
    blocksHost.append(block);
   });
   accBody.append(blocksHost);
   if(!curVi){
    const hint=node('p',fallbackBodyText(),'dictionary-meaning hint');hint.dataset.viKey=C.translationKey(w);hint.__dictionaryWord=w;accBody.append(hint);
   }
   if(w.verification_status)accBody.append(node('small',w.verification_status==='verified'?'✓ Đã đối chiếu từ điển':w.verification_status==='pinyin_corrected'?'✓ Đã sửa pinyin theo từ điển':'△ Gợi ý AI chưa có trong kho từ điển','dictionary-verification '+w.verification_status));
   if(w.trad&&w.trad!==w.han)accBody.append(node('p','Phồn thể: '+w.trad,'hint'));
   if(!curVi&&!level){
    const retry=button('Thử lấy nghĩa Việt',()=>{viUnavailable=false;translateVisible();});
    retry.className='dictionary-meaning-retry';retry.__dictionaryWord=w;accBody.append(retry);
   }
   acc.append(accBody);accStack.append(acc);
   if(curVi)setTimeout(()=>B.ensureSenseExamples?.(w,wrap),0);
  }

  const relatedList=openRelatedCompounds(entry,openCtx?.allEntries||[],12);
  if(relatedList.length){
   const compAcc=node('details','','search-acc-card is-compounds');
   const sum=node('summary','','search-acc-summary');
   const arrow=node('span','','search-acc-arrow');arrow.setAttribute('aria-hidden','true');
   sum.append(arrow,node('span','Từ ghép','search-acc-title'),node('span',String(relatedList.length),'search-acc-count'));
   compAcc.append(sum);
   const compBody=node('div','','search-acc-body'),compList=node('div','','search-compound-list');
   for(const cw of relatedList){
    const chip=node('button','','search-compound-chip');chip.type='button';
    chip.append(node('strong',cw.han),node('span',brief(vi(cw))||''));
    chip.onclick=()=>{recordHit(query,cw);const inp=$('searchInput'),form=$('searchForm');if(inp){inp.value=cw.han;form?.dispatchEvent(new Event('submit',{cancelable:true}));}};
    compList.append(chip);
   }
   compBody.append(compList);
   if(openCtx?.onShowCompounds){
    const totalComp=(openCtx.allEntries||[]).filter(e=>e.tier<2).length;
    if(totalComp>relatedList.length){
     const more=button(`Xem tất cả (${totalComp})`,openCtx.onShowCompounds);more.className='search-related-all';compBody.append(more);
    }
   }
   compAcc.append(compBody);accStack.append(compAcc);
  }

  const relData=B.relations?.(w.han,w.pin);
  if(relData&&B.relationAccordion){
   const synAcc=B.relationAccordion(relData.word,'Từ cận nghĩa',relData.synonyms,'is-synonyms');
   const antAcc=B.relationAccordion(relData.word,'Từ trái nghĩa',relData.antonyms,'is-antonyms');
   if(synAcc)accStack.append(synAcc);
   if(antAcc)accStack.append(antAcc);
  }

  const ai=node('div','','dictionary-ai');
  if(w.explanation)ai.append(node('p',w.explanation,'dictionary-ai-answer'));
  else ai.append(button('Xem cách dùng và ví dụ',()=>{recordHit(query,w);askAI(w,ai);}));
  accStack.append(ai);

  body.append(accStack);
  wrap.append(hero,body);
  return wrap;
 }
 function renderWordRecord(w,target,query=''){
  const card=node('details','','result-card extended-word dictionary-row');
  const summary=node('summary','','dictionary-row-summary'),meaning=node('span',brief(vi(w))||fallbackRowText(),'dictionary-row-meaning'+(vi(w)?'':' is-fallback-gloss'));
  meaning.dataset.viKey=C.translationKey(w);meaning.__dictionaryWord=w;
  summary.append(node('h3',w.han,'dictionary-row-han'),meaning,node('span',fmtPin(w.pinDisplay||w.pin),'dictionary-row-pinyin'));
  card.append(summary);
  card.ontoggle=()=>{if(card.open){recordHit(query,w);scheduleVi();}};
  target.append(card);
 }
 function renderOpenWorkspace(target,view,query,openCtx=null,shown=40,onMore=null,selectedRef=null){
  target.replaceChildren();
  const visible=view.slice(0,shown);
  if(!visible.length){target.classList.remove('has-master-detail');return;}
  target.classList.add('has-master-detail');
  let activeIdx=0;
  if(selectedRef?.key){
   const foundIdx=visible.findIndex(e=>C.id(e.w)===selectedRef.key);
   if(foundIdx>=0)activeIdx=foundIdx;
  }
  const mainCol=node('div','','search-main-col');
  const strip=node('div','','search-candidate-strip');strip.setAttribute('role','tablist');strip.setAttribute('aria-label','Danh sách từ phù hợp');
  const activeHost=node('div','','open-hanzii-host');
  const records=node('div','','open-dict-records');records.hidden=true;
  const charPanel=node('aside','','search-char-panel');charPanel.setAttribute('aria-label','Phân tích chữ Hán và thứ tự nét');

  const pills=[];
  const selectAt=(idx,fromUser=false)=>{
   const entry=visible[idx];if(!entry)return;
   activeIdx=idx;
   if(selectedRef)selectedRef.key=C.id(entry.w);
   pills.forEach((p,i)=>{const on=i===idx;p.classList.toggle('is-active',on);p.setAttribute('aria-selected',on?'true':'false');});
   activeHost.replaceChildren(buildOpenHeroView(entry,query,openCtx));
   B.renderCharPanel?.(charPanel,entry.w);
   if(fromUser){recordHit(query,entry.w);scheduleVi();}
  };

  visible.forEach((entry,idx)=>{
   const w=entry.w;
   const pill=node('button','','search-master-item');pill.type='button';pill.setAttribute('role','tab');
   pill.append(node('span',w.han,'search-master-han'));
   const pillPin=fmtPin(w.pinDisplay||w.pin);
   if(pillPin)pill.append(node('span',pillPin,'search-master-pin'));
   pill.onclick=()=>selectAt(idx,true);
   pills.push(pill);strip.append(pill);
   renderWordRecord(w,records,query);
  });

  mainCol.append(strip,activeHost,records);
  if(shown<view.length&&onMore){
   const moreBtn=button('Xem thêm kết quả',onMore);moreBtn.className='open-dict-more-btn';mainCol.append(moreBtn);
  }
  target.append(mainCol,charPanel);
  selectAt(activeIdx,false);
  scheduleVi();
 }
 async function lookup(q,target,status,token,general=false,filterBar=null){lookupStatus=status;status.textContent='Đang tra phần dữ liệu liên quan…';target.dataset.complete='false';
  const cacheKey=(general?'general|':'exact|')+q,seen=new Set(),seenHanPin=new Set(),found=searchCache.get(cacheKey)?.slice()||[];let shown=40,activeFilter='all';const selectedRef={key:''};
  const allowPinyinLookup=!(C.vietnamese?.(q))&&!(B.results().some(r=>r.hasVi&&r.exact)&&/[\u0300\u0301]/.test(q.normalize('NFD'))&&!/[\u0304\u030c]/.test(q.normalize('NFD')));
  const isPinyinQ=allowPinyinLookup&&!/^[\p{Script=Han}]+$/u.test(q)&&C.pinyinQuery(q);
  const draw=(done,n=0)=>{if(token!==serial)return;
   for(const entry of found)entry._rank=rankEntry(entry,q);
   found.sort((a,b)=>Number(b.w.han===q||b.w.trad===q)-Number(a.w.han===q||a.w.trad===q)||Number(Boolean(vi(b.w)))-Number(Boolean(vi(a.w)))||b.tier-a.tier||(b.band||0)-(a.band||0)||(Number(a.w.hsk||membership(a.w))||99)-(Number(b.w.hsk||membership(b.w))||99)||b._rank-a._rank||b.score-a.score||a.w.han.length-b.w.han.length||a.w.han.localeCompare(b.w.han));
   const foldCompounds=shouldFoldOpen(found,q);
   let view=filterOpenEntries(found,activeFilter,q,foldCompounds);
   if(activeFilter!=='all'&&!view.length){activeFilter='all';view=filterOpenEntries(found,'all',q,foldCompounds);}
   renderOpenFilters(filterBar,found,activeFilter,q,foldCompounds,next=>{activeFilter=next;shown=40;selectedRef.key='';draw(target.dataset.complete==='true',n);});
   const openCtx=foldCompounds?{allEntries:found,onShowCompounds:()=>{activeFilter='compounds';shown=40;selectedRef.key='';draw(target.dataset.complete==='true',n);}}:null;
   renderOpenWorkspace(target,view,q,openCtx,shown,()=>{shown+=40;draw(target.dataset.complete==='true',n);},selectedRef);
   target.dataset.complete=String(done);
   status.textContent=view.length?`${view.length} ${foldCompounds&&activeFilter==='all'?'từ gốc':'kết quả'} · Hiển thị ${Math.min(shown,view.length)}${done?' · Đã tra xong':' · Đang bổ sung '+n+'/32 phần'}`:done?'Chưa có mục từ khớp. Có thể tra nghĩa tiếng Việt bằng AI.':`Đang tìm thêm · ${n}/32 phần…`;
  };
  if(searchCache.has(cacheKey)){draw(true);return;}
  if(general)for(const r of B.results()){const {w,score}=r,item=bridgeItem(w);seenHanPin.add(w.han+'|'+C.reading(w.pin));found.push({w:item,score,tier:r.tier||(score>=140?2:1),band:r.band||(score>=140?5:score>=110?4:3),hasPinyin:Boolean(r.hasPinyin),hasViMatch:Boolean(r.hasVi)});}
  const ingest=rows=>{for(const r of rows){const key=r.slice(0,3).join('|'),rp=C.reading(r[2]),score=general?C.score(r,q,{allowPinyin:allowPinyinLookup}):C.matches(r,q)?150:0;if(!score||seen.has(key)||seenHanPin.has(r[0]+'|'+rp)||seenHanPin.has(r[1]+'|'+rp))continue;seen.add(key);const meanVi=resolveLocalVi(r[0],r[1],r[2]),pinDisplay=C.formatPinyin?C.formatPinyin(r[2]):r[2];const tier=(r[0]===q||r[1]===q)?3:(score>=140?2:1);const band=(r[0]===q||r[1]===q)?6:(score>=140?5:score>=110?4:score>=80?3:2);found.push({w:{han:r[0],trad:r[1],pin:r[2],pinDisplay,mean:r[3].join('; '),...(meanVi?{meanVi}:{})},score,tier,band,hasPinyin:isPinyinQ,hasViMatch:false});}};
  try{const chinese=/^[\p{Script=Han}]+$/u.test(q),primary=chinese?q.codePointAt(0)%32:null;let n=0;
   if(primary!==null){ingest(await shard(primary));n++;draw(!general,n);if(!general)return;}
   const order=Array.from({length:32},(_,i)=>i).filter(i=>i!==primary).sort((a,b)=>Number(loaded.has(b))-Number(loaded.has(a)));
   for(let start=0;start<order.length;start+=4){if(token!==serial)return;const batch=await Promise.all(order.slice(start,start+4).map(shard));if(token!==serial)return;for(const rows of batch)ingest(rows);n+=batch.length;draw(n===32,n);await new Promise(r=>setTimeout(r,0));}
   if(found.length<=2000){searchCache.set(cacheKey,found.slice());if(searchCache.size>20)searchCache.delete(searchCache.keys().next().value);}
  }catch(e){if(token===serial){draw(true);status.textContent=found.length?'Đã có kết quả từ phần đã tải; chưa mở được các phần còn lại. '+e.message:e.message;target.dataset.complete='partial';}}}
 function prepare(event){++serial;controller?.abort();controller=null;lookupStatus=null;const token=serial,q=B.query().trim(),general=B.scope()==='general';box.replaceChildren();box.hidden=!q||!general&&B.results().length>0;if(box.hidden)return;
  const bar=node('div','','open-dict-bar'),head=node('div','','open-dict-head'),tools=node('div','','open-dict-tools');
  const filterBar=node('div','','search-intent-filters open-dict-filters');filterBar.setAttribute('role','group');filterBar.setAttribute('aria-label','Lọc kết quả tra cứu');filterBar.hidden=true;
  const status=node('p','','hint'),results=node('div','','result-grid'),context=node('input');context.placeholder='Câu chứa từ (không bắt buộc)';context.maxLength=280;context.setAttribute('aria-label','Ngữ cảnh của từ cần tra');context.className='dictionary-context';
  const aiPanel=node('div','','dictionary-ai-panel'),onTerms=(terms,t,answer,chips)=>{filterBar.replaceChildren();filterBar.hidden=true;semanticMatches(terms,results,status,t,answer,chips);},explain=(silentError=false)=>askAI({han:q,trad:q,pin:'',mean:'Chưa có nghĩa từ điển; cần xác định theo ngữ cảnh.'},aiPanel,context.value,onTerms,null,silentError);
  const actions=node('div','','dictionary-actions');if(!general)actions.append(button('Tra từ mở rộng',()=>lookup(q,results,status,serial,false,filterBar)));actions.append(button('Tra nghĩa / Giải thích bằng AI',()=>explain(false)));
  head.append(node('h3',general?'Kết quả tra cứu':'Tham khảo ngoài kho HSK'),status);
  tools.append(context,actions);
  bar.append(head,tools);
  box.append(bar,filterBar,aiPanel,results);
  const semantic=C.semanticQuery(q),autoSemantic=semantic&&(general||Boolean(event?.detail?.submitted));
  if(autoSemantic){
   const baseEntries=B.results().map(r=>({w:bridgeItem(r.w),score:r.score,tier:r.tier||(r.score>=140?2:1),hasPinyin:Boolean(r.hasPinyin),hasViMatch:Boolean(r.hasVi)}));
   const foldCompounds=shouldFoldOpen(baseEntries,q);
   let activeFilter='all';const selectedRef={key:''};
   const drawSemantic=()=>{
    let view=filterOpenEntries(baseEntries,activeFilter,q,foldCompounds);
    if(activeFilter!=='all'&&!view.length){activeFilter='all';view=filterOpenEntries(baseEntries,'all',q,foldCompounds);}
    renderOpenFilters(filterBar,baseEntries,activeFilter,q,foldCompounds,next=>{activeFilter=next;selectedRef.key='';drawSemantic();});
    const ctx=foldCompounds?{allEntries:baseEntries,onShowCompounds:()=>{activeFilter='compounds';selectedRef.key='';drawSemantic();}}:null;
    renderOpenWorkspace(results,view,q,ctx,40,null,selectedRef);
    status.textContent=view.length?`${view.length} ${foldCompounds&&activeFilter==='all'?'từ gốc':'kết quả'} · Tra theo nghĩa`:'Tra theo nghĩa · Cần đăng nhập và mạng.';
   };
   drawSemantic();
   if(event?.detail?.submitted&&(!baseEntries.length||window.HSKAccountDashboard?.user))explain(baseEntries.length>0);
  }
  else if(general){const initial=B.results().slice(0,40).map(r=>({w:bridgeItem(r.w),score:r.score,tier:r.tier||(r.score>=140?2:1),hasPinyin:Boolean(r.hasPinyin),hasViMatch:Boolean(r.hasVi)}));renderOpenWorkspace(results,initial,q,null,40);lookup(q,results,status,token,true,filterBar);}else if(/^[\p{Script=Han}]+$/u.test(q)&&!B.exact(q))lookup(q,results,status,token,false,filterBar);
 }
 async function semanticMatches(terms,target,status,token,answer='',chips=[]){if(!terms.length){status.textContent='Chưa có mục từ đủ chắc chắn; hãy thêm ngữ cảnh.';return;}status.textContent='Đang đối chiếu các từ AI gợi ý với từ điển…';try{const seen=new Set(),matched=[];for(const t of terms){if(token!==serial) return;const rows=await shard(t.han.codePointAt(0)%32),verified=C.reconcileAiTermsWithDictionary([t],rows)[0],entry=rows.find(r=>r[0]===t.han||r[1]===t.han);if(entry&&C.sameReading(t.pinyin,entry[2])){const key=entry.slice(0,3).join('|');if(!seen.has(key)){seen.add(key);const w={han:entry[0],trad:entry[1],pin:entry[2],mean:entry[3].join('; '),meanVi:t.meaning,pinDisplay:C.formatPinyin?C.formatPinyin(entry[2]):entry[2],verification_status:verified.verification_status,explanation:terms.length===1?answer:'',matchType:t.match_type};if(w.meanVi)rememberVi(w,w.meanVi);matched.push({w,score:150,tier:3,hasPinyin:false,hasViMatch:true});}}else if(!entry&&verified?.verification_status==='unverified_ai'){const w={han:verified.han,trad:verified.han,pin:verified.pinyin,mean:verified.meaning,meanVi:verified.meaning,pinDisplay:C.formatPinyin?C.formatPinyin(verified.pinyin):verified.pinyin,verification_status:'unverified_ai',matchType:verified.match_type};if(!seen.has(w.han+'|'+w.pin)){seen.add(w.han+'|'+w.pin);matched.push({w,score:140,tier:2,hasPinyin:false,hasViMatch:true});}}}if(token!==serial)return;if(matched.length)renderOpenWorkspace(target,matched,'',null,40);if(chips?.length){const chipBox=node('div','','dictionary-refinement-chips');chipBox.append(node('small','Thu hẹp ngữ cảnh:','hint'));for(const chip of chips.slice(0,3))chipBox.append(button(chip,()=>{const context=target.parentElement?.querySelector('.dictionary-context');if(context){context.value=chip;context.dispatchEvent(new Event('input'));target.parentElement?.querySelector('.dictionary-actions button:last-child')?.click();}}));target.prepend(chipBox);}status.textContent=matched.length?`${matched.length} mục từ được đối chiếu`:'AI đã gợi ý cách dịch; chưa có mục từ tương ứng trong kho hiện tại. Xem giải thích và bổ sung ngữ cảnh nếu cần.';}catch(e){if(token===serial)status.textContent='Đã có lời giải AI nhưng chưa tải được mục từ đối chiếu. '+e.message;}}
 async function askAI(w,target,context='',onTerms=null,grounding=null,silentError=false){
  ++serial;if(lookupStatus)lookupStatus.textContent='Đã tạm dừng mở rộng để tra AI. Bấm Tìm kiếm để mở lại toàn bộ kết quả.';lookupStatus=null;
  const user=window.HSKAccountDashboard?.user;target.replaceChildren();const status=node('p','','hint');target.append(status);
  const retry=()=>target.append(button('Thử lại',()=>askAI(w,target,context,onTerms,grounding,false)));
  if(!user){if(silentError){target.replaceChildren();return;}status.textContent='Hãy đăng nhập để dùng AI. Tra từ điển không cần tài khoản.';retry();return;}
  if(!config){if(silentError){target.replaceChildren();return;}status.textContent='Chưa kết nối được AI.';retry();return;}
  controller?.abort();controller=new AbortController();const request=controller,token=serial,key=w.han+'|'+w.pin+'|'+context+'|'+JSON.stringify(grounding||{})+'|'+user.uid;
  const show=data=>{for(const t of data.terms||[])if((t.han===w.han||t.han===w.trad)&&C.sameReading(t.pinyin,w.pin))rememberVi(w,t.meaning);target.replaceChildren();if(onTerms){const detail=node('details','','dictionary-query-detail');detail.append(node('summary','Giải thích tổng quát'),node('p',data.answer,'dictionary-ai-answer'));target.append(detail);onTerms(data.terms,token,data.answer,data.refinement_chips||[]);}else target.append(node('small','Cách dùng và ví dụ'),node('p',data.answer,'dictionary-ai-answer'));};
  if(aiCache.has(key)){show(aiCache.get(key));return;}
  status.textContent='AI tra nghĩa từ điển đang load…';const stopLoading=window.HSKLoading?.show('AI tra nghĩa từ điển đang load...','Đang phân tích nghĩa và ví dụ cho: '+w.han);const timer=setTimeout(()=>request.abort(),30000);
  try{const auth=await user.getIdToken();if(token!==serial||request.signal.aborted)return;if(w.han.length>160)throw Error('Hãy nhập từ hoặc cụm tối đa 160 ký tự.');const requestBody={query:w.han,context,...(w.pin?{word:{han:w.han,trad:w.trad||w.han,pin:w.pin,mean:(w.mean||'').slice(0,4000)}}:{}),...(grounding||{})};const response=await fetch(config.endpoint.replace(/\/translate$/,'/dictionary-lookup'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth},signal:request.signal,body:JSON.stringify(requestBody)});const data=await response.json();if(token!==serial||request.signal.aborted)return;if(!response.ok)throw Error(response.status===404?'Worker chưa có tính năng tra cứu mới. Hãy triển khai bản Worker đã gửi.':data.error||'AI chưa trả lời được.');if(typeof data.answer!=='string'||!data.answer.trim()||data.answer.length>5000||!Array.isArray(data.terms)||data.terms.length>6||!data.terms.every(t=>t&&['han','pinyin','meaning'].every(k=>typeof t[k]==='string'&&t[k].trim()&&t[k].length<600)&&/\p{Script=Han}/u.test(t.han)))throw Error('AI chưa trả kết quả tra cứu hợp lệ.');aiCache.set(key,data);if(aiCache.size>40)aiCache.delete(aiCache.keys().next().value);show(data);
  }catch(e){if(token===serial){if(silentError){target.replaceChildren();return;}status.textContent=friendlyNetError(e);retry();}}finally{stopLoading?.();clearTimeout(timer);if(controller===request)controller=null;}}
 function renderSrsHome(){reviewBox.replaceChildren(node('h3','SRS · Từ mở rộng'));const due=Object.keys(items).filter(k=>items[k].due<=Date.now()).sort((a,b)=>items[a].due-items[b].due);reviewBox.append(node('p',`${Object.keys(items).length} từ đã chọn · ${due.length} từ đến hạn`,'hint'));
  reviewBox.append(button('Ôn từ mở rộng',()=>{queue=due.slice();revealed=false;window.HSKLoading?.flash('Phiên ôn SRS mở rộng đang load...','Đang chuẩn bị các từ mở rộng đến hạn...',undefined,reviewBox);renderReview();}));if(!queue.length&&Object.keys(items).length){const list=node('details'),summary=node('summary','Quản lý từ đã thêm');list.append(summary);for(const [key,r] of Object.entries(items)){const row=node('div','','dictionary-actions');row.append(node('span',r.word.han+' · '+fmtPin(r.word.pin)),button('Gỡ khỏi SRS',()=>{delete items[key];save();}));list.append(row);}reviewBox.append(list);}}
 function renderReview(){renderSrsHome();queue=queue.filter(k=>items[k]);if(!queue.length){window.HSKLoading?.flash('Kết quả SRS mở rộng đang load...','Đã hoàn thành phiên ôn từ mở rộng...',undefined,reviewBox);reviewBox.append(node('p','Đã hết từ đến hạn. Lịch này không tính vào tiến độ HSK.','hint'));return;}const key=queue[0],r=items[key],card=node('article','','extended-review');card.append(node('h3',r.word.han));const speech=window.HSKSpeech?.button(r.word.han,'Nghe phát âm '+r.word.han);if(speech)card.append(speech);
  if(!revealed)card.append(button('Xem nghĩa',()=>{revealed=true;renderReview();}));else{const meaning=node('p',vi(r.word)||'Đang tra nghĩa Việt…');meaning.dataset.viKey=C.translationKey(r.word);meaning.__dictionaryWord=r.word;card.append(node('p',fmtPin(r.word.pin)),meaning);const actions=node('div','','dictionary-actions');for(const [rating,label] of [['again','Chưa nhớ'],['hard','Khó'],['good','Nhớ'],['easy','Dễ']])actions.append(button(label,()=>{items[key]=C.rate(items[key],rating);queue.shift();revealed=false;save();renderReview();}));card.append(actions);}reviewBox.append(card);scheduleVi();}
 window.addEventListener('hsk-search-rendered',prepare);window.addEventListener('hsk-account-ready',()=>{++serial;controller?.abort();viPending?.abort();viPending=null;clearTimeout(viTimer);aiCache.clear();queue=[];try{items=C.clean(JSON.parse(localStorage.getItem(C.KEY)||'{}'));}catch(_){items={};}renderSrsHome();prepare();});
 window.HSKAIConfig?.loadTranslationConfig?.().then(c=>{if(c){config=c;scheduleVi();}});

 function recoveryPanel(host,comparison){
  const panel=node('details','','open-dictionary word-recovery');panel.append(node('summary',comparison?'So sánh từ khi quên cách viết':'Tìm từ khi quên cách viết'));
  panel.append(node('p','Nhập pinyin có/không dấu, số thanh (ni3), cách đọc bạn nhớ (nìa), hoặc nghĩa gần đúng. Cách ghi âm tiếng Việt chỉ là gợi nhớ, không phải phát âm chuẩn.','hint'));
  const rows=[],result=node('div');result.setAttribute('aria-live','polite');
  for(let i=0;i<(comparison?2:1);i++){
   const row=node('div','','dictionary-ai-panel'),label=node('label','Từ '+(i+1)),input=node('input'),hint=node('input'),out=node('div');
   input.id='wordRecovery-'+(comparison?'compare':'search')+'-'+i;label.htmlFor=input.id;input.placeholder='Ví dụ: ni, ni3, nìa';input.maxLength=80;
   hint.placeholder='Nghĩa nhớ mang máng / sửa gợi ý sai, ví dụ: bạn, người đang nói chuyện';hint.maxLength=160;hint.setAttribute('aria-label','Nghĩa hoặc ngữ cảnh từ '+(i+1));
   const state={input,hint,selected:null,previous:[]};rows.push(state);input.oninput=hint.oninput=()=>{++serial;controller?.abort();state.selected=null;out.replaceChildren();result.replaceChildren();};
   const resolve=button('AI tìm chữ',async()=>{
    if(!input.value.trim()&&!hint.value.trim()){out.replaceChildren(node('p','Hãy nhập cách đọc hoặc nghĩa bạn nhớ.'));return;}
    state.selected=null;result.replaceChildren();
    const query=input.value.trim()||hint.value.trim(),context=JSON.stringify({mode:'word-recovery',meaningHint:hint.value,previousSuggestions:state.previous}),requestSerial=serial;
    const remembered=rememberedLookup(query);
    if(remembered&&!hint.value.trim()){state.selected={han:remembered.han,pinyin:fmtPin(remembered.pinyin),meaning:remembered.meaning};out.replaceChildren(node('p','Đã nhớ từ bạn từng xác nhận: '+remembered.han+' · '+fmtPin(remembered.pinyin)+' · '+remembered.meaning));if(!comparison)out.append(button('Xem cách dùng với AI',()=>askAI({han:remembered.han,trad:remembered.han,pin:remembered.pinyin,mean:remembered.meaning},result)));return;}
    let grounding;try{grounding=await recoveryGrounding(query,hint.value,state.previous);}catch(_){grounding={phoneticHints:C.expandVietnamesePhonetic(query),localCandidates:[],excludedTerms:state.previous};}
    if(requestSerial!==serial)return;
    askAI({han:query,trad:query,pin:''},out,context,(terms,t,answer,chips)=>{
     if(t!==serial)return;out.replaceChildren(node('p',answer),node('p',terms.length?'Chọn đúng từ bạn muốn tìm; nếu chưa đúng, sửa nghĩa phía trên rồi bấm AI tìm chữ.':'Hãy bổ sung nghĩa hoặc câu ví dụ rồi tìm lại.'));
     state.previous=terms.map(x=>x.han.slice(0,24)).slice(0,6);
     for(const term of terms){const termPin=fmtPin(term.pinyin);out.append(button(term.han+' · '+termPin+' · '+term.meaning+(term.match_type?' · '+term.match_type:''),()=>{state.selected={han:term.han.slice(0,24),pinyin:termPin.slice(0,60),meaning:term.meaning.slice(0,100)};rememberPhoneticLookup(query,state.selected);input.value=term.han;out.replaceChildren(node('p','Đã chọn và lưu thói quen phát âm: '+term.han+' · '+termPin+' · '+term.meaning));if(!comparison)askAI({han:term.han,trad:term.han,pin:termPin,mean:term.meaning},result); }));}
     if(chips?.length){const chipBox=node('div','','dictionary-refinement-chips');chipBox.append(node('small','Chưa đúng? Chọn ngữ cảnh:','hint'));for(const chip of chips.slice(0,3))chipBox.append(button(chip,()=>{hint.value=chip;resolve.click();}));out.append(chipBox);}
    },grounding);
   });row.append(label,input,hint,resolve,out);panel.append(row);
  }
  if(comparison)panel.append(button('So sánh hai từ đã chọn',()=>{if(rows.some(r=>!r.selected)){result.replaceChildren(node('p','Hãy tìm và chọn đúng cả hai từ trước khi so sánh.'));return;}const terms=rows.map(r=>r.selected);askAI({han:'So sánh '+terms[0].han+' và '+terms[1].han,pin:''},result,JSON.stringify({mode:'confirmed-comparison',confirmedTerms:terms}));}));
  window.addEventListener('hsk-account-ready',()=>{for(const r of rows){r.selected=null;r.previous=[];r.input.value='';r.hint.value='';}panel.querySelectorAll('.dictionary-ai-panel>div').forEach(n=>n.replaceChildren());result.replaceChildren();});panel.append(result);host.append(panel);
 }
 recoveryPanel($('searchPanel'),false);recoveryPanel($('comparePanel'),true);
 window.HSKOpenDictionary={recordUserConfirmedLookup:rememberPhoneticLookup,bulkAdd(words){const next=C.clean(JSON.parse(localStorage.getItem(C.KEY)||'{}')),byHan=new Map();for(const r of Object.values(next)){if(!byHan.has(r.word.han))byHan.set(r.word.han,[]);byHan.get(r.word.han).push(r);}let added=0;for(const w of words){if(!w||typeof w.han!=='string'||!w.han.trim()||typeof w.mean!=='string'||!w.mean.trim())continue;const value={han:w.han,trad:w.han,pin:w.pin||'',mean:w.mean,meanVi:w.mean,native:true},key=C.id(value),group=byHan.get(w.han)||[],duplicate=group.some(r=>!r.word.pin||!value.pin||C.sameReading(r.word.pin,value.pin));if(!duplicate&&!next[key]){const record=C.add({},value)[key];next[key]=record;group.push(record);byHan.set(w.han,group);added++;}}localStorage.setItem(C.KEY,JSON.stringify({version:1,items:next}));items=next;renderSrsHome();return {added,existing:words.length-added};},lookup:async q=>{const rows=await shard(q.codePointAt(0)%32);return rows.filter(r=>r[0]===q||r[1]===q);},prepare};renderSrsHome();prepare();
})();
