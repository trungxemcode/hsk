/* Source-only reading. Cloud-only URL metadata, online-only reading; no device persistence or automatic AI requests. */
(()=>{
 'use strict';
 const panel=document.getElementById('realReadingPanel');if(!panel)return;
 const $=id=>document.getElementById(id),settings=panel.querySelector('.rr-settings'),newButton=$('rrNew'),oldButton=$('rrOld');
 const mode=document.createElement('select');mode.id='rrContentMode';mode.add(new Option('Bài gốc từ hai nguồn','original'));mode.add(new Option('Bài luyện AI (tùy chọn)','ai'));
 const label=document.createElement('label');label.append('Nội dung',mode);settings.prepend(label);
 const host=document.createElement('section');host.id='rrOriginalReading';host.setAttribute('aria-label','Bài đọc nguyên văn');$('rrArticle').before(host);
 const randomButton=document.createElement('button');randomButton.id='rrRandom';randomButton.type='button';randomButton.className='rr-secondary';randomButton.textContent='Đọc ngẫu nhiên';newButton.after(randomButton);
 const lookup=document.createElement('button');lookup.id='rrSelectionAsk';lookup.type='button';lookup.className='rr-secondary';lookup.textContent='Tra cứu AI';lookup.hidden=true;document.body.append(lookup);
 let controller=null,revision=0,configPromise=null,items=[],currentURL='',pinPromise=null,openedArticle=null,selected=null;
 function clearLookup(){selected=null;lookup.hidden=true;window.dispatchEvent(new Event('hsk-reading-context-end'));}
 function selection(){
  if(panel.hidden||!active()||!navigator.onLine||!openedArticle)return null;
  const value=window.getSelection();if(!value?.rangeCount||value.isCollapsed)return null;
  const paragraphOf=node=>(node?.nodeType===1?node:node?.parentElement)?.closest('.rr-hanzi'),anchor=paragraphOf(value.anchorNode),focus=paragraphOf(value.focusNode);if(!anchor||!focus||!host.contains(anchor)||!host.contains(focus))return null;
  const fragment=value.getRangeAt(0).cloneContents();fragment.querySelectorAll('rt,button').forEach(n=>n.remove());const text=fragment.textContent.replace(/\s+/g,' ').trim().slice(0,160);if(!/[\u3400-\u9fff]/u.test(text))return null;
  const index=[...host.querySelectorAll('.rr-hanzi')].indexOf(anchor),paragraph=openedArticle.paragraphs[index]?.hanzi||'',at=Math.max(0,paragraph.indexOf(text));
  return {text,url:openedArticle.url,context:paragraph.slice(Math.max(0,at-140),at+text.length+200)};
 }
 let lookupFrame=0;
 function positionLookup(){
  lookupFrame=0;if(lookup.hidden)return;
  const desktop=matchMedia('(min-width:721px) and (pointer:fine)').matches;lookup.classList.toggle('rr-selection-near',desktop);if(!desktop)return;
  const range=window.getSelection();if(!range?.rangeCount||range.isCollapsed)return;
  const rect=range.getRangeAt(0).getBoundingClientRect(),size=lookup.getBoundingClientRect(),width=size.width,height=size.height;
  const left=Math.max(12,Math.min(innerWidth-width-12,rect.left+(rect.width-width)/2));
  const preferred=rect.bottom+height+20<=innerHeight?rect.bottom+8:rect.top-height-8,top=Math.max(12,Math.min(innerHeight-height-12,preferred));
  lookup.style.setProperty('--rr-selection-x',left+'px');lookup.style.setProperty('--rr-selection-y',top+'px');
 }
 function inspectReadingSelection(){const value=selection();if(value){selected=value;lookup.hidden=false;if(!lookupFrame)lookupFrame=requestAnimationFrame(positionLookup);}else if(document.activeElement!==lookup){selected=null;lookup.hidden=true;}}
 document.addEventListener('selectionchange',inspectReadingSelection);
 document.addEventListener('pointerup',inspectReadingSelection);
 document.addEventListener('keyup',inspectReadingSelection);
 window.addEventListener('resize',()=>{if(!lookup.hidden)positionLookup();});
 window.addEventListener('scroll',()=>{if(!lookup.hidden&&!lookupFrame)lookupFrame=requestAnimationFrame(positionLookup);},{capture:true,passive:true});
 lookup.addEventListener('pointerdown',event=>event.preventDefault());
 lookup.addEventListener('click',()=>{const value=selection()||selected;if(!value||!openedArticle||value.url!==openedArticle.url||panel.hidden||!active()||!navigator.onLine)return;
  window.dispatchEvent(new CustomEvent('hsk-reading-ask',{detail:{lesson:{id:'reading-'+openedArticle.url,title:openedArticle.title,vi:openedArticle.titleVi||openedArticle.title,number:'Bài đọc',hsk:Number($('rrHsk').value),words:[{han:value.text,pin:window.pinyinPro?.pinyin(value.text)||'',mean:''}],content:{selectedText:value.text,context:value.context,sourceURL:openedArticle.url}},question:('Giải thích nghĩa, pinyin và cách dùng trong ngữ cảnh bài đọc của đoạn: “'+value.text+'”.').slice(0,500)}}));window.getSelection()?.removeAllRanges();selected=null;lookup.hidden=true;
 });
 const owner=()=>window.HSKAccountDashboard?.user?.uid||'guest';
 let cloudRequest=null,cloudConfig=null;
 async function cloudHistory(item=null){
  if(!navigator.onLine)throw Error('Cần có mạng để dùng chế độ bài gốc.');
  const user=window.HSKAccountDashboard?.user;if(!user)throw Error('Đăng nhập để lưu hoặc đọc lại lịch sử trên cloud.');
  const id=revision,uid=user.uid,hsk=Number($('rrHsk').value),c=new AbortController();cloudRequest?.abort();cloudRequest=c;
  const timer=setTimeout(()=>c.abort(),15000),current=()=>id===revision&&owner()===uid&&navigator.onLine&&!c.signal.aborted;
  try{
   cloudConfig||=await fetch('./account-config.json',{cache:'no-store',signal:c.signal}).then(r=>r.json());
   const project=cloudConfig?.firebase?.projectId;if(!/^[a-z0-9-]+$/.test(project||''))throw Error('Chưa cấu hình lưu lịch sử cloud.');
   const token=await user.getIdToken();if(!current())return null;
   const name='projects/'+project+'/databases/(default)/documents/users/'+encodeURIComponent(uid)+'/items/original-reading-last-'+hsk;
   const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
   if(!item){
    const r=await fetch('https://firestore.googleapis.com/v1/'+name,{headers,cache:'no-store',signal:c.signal});
    if(!current())return null;if(r.status===404)return null;if(!r.ok)throw Error('Chưa đọc được lịch sử trên cloud.');
    const data=await r.json();return data.fields?.payload?.stringValue?JSON.parse(data.fields.payload.stringValue):null;
   }
   const metadata={url:item.url,title:item.title,titleZh:item.titleZh||'',titleVi:item.titleVi||'',site:item.site,hsk,openedAt:Date.now()};
   const fields={id:{stringValue:'original-reading-last-'+hsk},time:{integerValue:String(metadata.openedAt)},writer:{stringValue:'original-reading-url'},deleted:{booleanValue:false},payload:{stringValue:JSON.stringify(metadata)}};
   const r=await fetch('https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents:commit',{method:'POST',headers,cache:'no-store',signal:c.signal,body:JSON.stringify({writes:[{update:{name,fields},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]})});
   if(!current())return null;if(!r.ok)throw Error('Chưa lưu được lịch sử trên cloud. Không lưu dự phòng trên máy.');return metadata;
  }finally{clearTimeout(timer);if(cloudRequest===c)cloudRequest=null;}
 }
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const active=()=>mode.value==='original';
 function stop(){clearLookup();revision++;controller?.abort();cloudRequest?.abort();cloudRequest=null;controller=null;newButton.disabled=false;oldButton.disabled=false;randomButton.disabled=false;panel.removeAttribute('aria-busy');$('rrCancel').hidden=true;}
 async function endpoint(){
  configPromise||=fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{const u=new URL(c.endpoint);if(!c.enabled||u.protocol!=='https:')throw Error('Dịch vụ đọc nguồn chưa được cấu hình.');return u.href.replace(/\/translate$/,'/reading-library');}).catch(e=>{configPromise=null;throw e;});return configPromise;
 }
 async function request(body){
  if(!navigator.onLine){offline();return null;}
  stop();const id=revision,uid=owner(),c=new AbortController();controller=c;newButton.disabled=true;oldButton.disabled=true;randomButton.disabled=true;panel.setAttribute('aria-busy','true');$('rrCancel').hidden=false;$('rrCancel').textContent='Hủy tải bài';$('rrStatus').textContent=body.op==='list'?'Đang lấy danh sách bài gốc…':'Đang trích nguyên văn từ nguồn…';
  const timer=setTimeout(()=>c.abort(),22000);
  try{const url=await endpoint();if(c.signal.aborted)throw new DOMException('Canceled','AbortError');
   const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:c.signal}),data=await r.json();
   if(id!==revision||owner()!==uid||!active())return null;if(!r.ok)throw Error(data.error||'Không tải được bài nguồn.');return data;
  }catch(e){if(id===revision&&active())$('rrStatus').textContent=e.name==='AbortError'?'Đã dừng tải bài nguồn.':e.message;return null;}
  finally{clearTimeout(timer);if(id===revision){controller=null;newButton.disabled=false;oldButton.disabled=false;randomButton.disabled=false;panel.removeAttribute('aria-busy');$('rrCancel').hidden=true;}}
 }
 function listing(){
  const box=make('details');box.className='rr-original-list';box.open=true;box.append(make('summary','Chọn bài gốc · '+items.length+' bài'));
  for(const item of items){const b=make('button',titleOf(item));b.type='button';b.dataset.url=item.url;b.addEventListener('click',()=>open(item));box.append(b);}
  return box;
 }
 function titleOf(item){return (item.titleZh||item.title)+' - '+(item.titleVi||'Chưa có bản dịch tên');}
 function showList(focus=true){openedArticle=null;clearLookup();window.HSKSpeech?.stop?.();host.replaceChildren(listing());if(focus){const b=[...host.querySelectorAll('button')].find(n=>n.dataset.url===currentURL)||host.querySelector('button');b?.focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'auto'});} $('rrStatus').textContent=items.length?'Chọn một bài để đọc.':'Hãy tải danh sách hoặc chọn Đọc ngẫu nhiên.';}
 function pinyinReady(){if(window.pinyinPro)return Promise.resolve();if(!pinPromise)pinPromise=new Promise((resolve,reject)=>{const script=make('script');script.src='./vendor/pinyin-pro/pinyin-pro.js';script.onload=()=>{script.remove();resolve();};script.onerror=()=>{script.remove();pinPromise=null;reject(Error('Chưa tải được pinyin.'));};document.head.append(script);});return pinPromise;}
 function annotate(paragraph){
  const han=make('p');han.className='rr-hanzi';han.lang='zh';
  const characters=Array.from(paragraph.hanzi),generated=window.pinyinPro?.pinyin(paragraph.hanzi,{type:'array',toneType:'symbol',nonZh:'removed'})||[];
  // Generate per-character context readings; source ruby overrides them where alignment is verified.
  const readings=new Map();let offset=0;
  for(const char of characters){if(/[\u3400-\u9fff]/u.test(char)){readings.set(offset,generated[readings.size]||'');}offset++;}
  for(const mark of paragraph.annotations||[]){const chars=Array.from(mark.text),pins=sourceSyllables(mark.pinyin,chars.map((_,i)=>readings.get(mark.start+i)||''));if(pins)chars.forEach((_,i)=>readings.set(mark.start+i,pins[i]));}
  characters.forEach((char,i)=>{if(!/[\u3400-\u9fff]/u.test(char)){han.append(document.createTextNode(char));return;}const ruby=make('ruby'),base=make('span',char),rt=make('rt',readings.get(i)||'');base.className='rr-character';rt.className='rr-original-pin';rt.hidden=true;ruby.append(base,rt);han.append(ruby);});return han;
 }
 function sourceSyllables(text,expected){
  if(!expected.length||expected.length>30)return null;
  const raw=String(text).toLowerCase().replace(/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜêńňǹḿ]/gu,''),plain=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');const memo=new Map();
  function split(pos,index){if(index===expected.length)return pos===raw.length?{score:0,parts:[]}:null;const key=pos+':'+index;if(memo.has(key))return memo.get(key);let best=null;for(let end=pos+1;end<=Math.min(raw.length,pos+7);end++){const part=raw.slice(pos,end),base=plain(part);if(!/^(?:(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(?:a|o|e|ai|ei|ao|ou|an|en|ang|eng|ong|i|ia|ie|iao|iu|ian|in|iang|ing|iong|u|ua|uo|uai|ui|uan|un|uang|ueng|ue)|er|m|n|ng)$/u.test(base))continue;const tail=split(end,index+1);if(!tail)continue;const score=tail.score+(plain(expected[index])===base?3:0)+(expected[index]===part?1:0);if(!best||score>best.score)best={score,parts:[part,...tail.parts]};}memo.set(key,best);return best;}return split(0,0)?.parts||null;
 }
 async function open(item){
  const data=await request({op:'article',url:item.url});if(!data)return;
  const a=data.article,stamp=revision;try{await pinyinReady();}catch{}if(stamp!==revision||!active()||panel.hidden)return;
  if(!a||a.url!==item.url||a.status!=='original'||!Array.isArray(a.paragraphs)||!a.paragraphs.length){$('rrStatus').textContent='Nguồn chưa trả nguyên văn hợp lệ.';return;}
  item={...item,titleZh:a.titleZh||a.title,titleVi:a.titleVi||item.titleVi};
  openedArticle=a;currentURL=a.url;window.HSKSpeech?.stop?.();const back=make('button','← Danh sách bài đọc');back.id='rrOriginalBack';back.type='button';back.className='rr-back';back.onclick=()=>{stop();if(items.length)showList();else load();};const heading=make('h3',titleOf(item));heading.tabIndex=-1;host.replaceChildren(back,heading);
  const credit=make('p',a.site+' · Nguyên văn từ nguồn'),link=make('a','Mở bài gốc ↗');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';credit.append(' · ',link);host.append(credit);
  const hasPin=!!window.pinyinPro,pin=make('button','Pinyin');pin.id='rrOriginalPinyin';pin.title='Pinyin tham khảo, ưu tiên cách đọc từ nguồn.';pin.type='button';pin.className='rr-secondary';pin.setAttribute('aria-pressed','false');pin.hidden=!hasPin;
  pin.onclick=()=>{const show=pin.getAttribute('aria-pressed')!=='true';pin.setAttribute('aria-pressed',String(show));host.querySelectorAll('.rr-original-pin').forEach(n=>n.hidden=!show);};host.append(pin);
  for(const paragraph of a.paragraphs){const row=make('div');row.className='rr-line';const han=annotate(paragraph);row.append(han);
   const speech=window.HSKSpeech?.button(paragraph.hanzi,'Nghe câu tiếng Trung');if(speech)row.append(speech);
   host.append(row);
  }
  heading.focus({preventScroll:true});$('rrStatus').textContent='Đã tải nguyên văn · '+(owner()==='guest'?'Đăng nhập để lưu lịch sử trên cloud.':'Đang lưu lịch sử lên cloud…');host.scrollIntoView({block:'start',behavior:'auto'});
  if(owner()!=='guest'){const stamp=revision;cloudHistory(item).then(saved=>{if(saved&&stamp===revision&&active())$('rrStatus').textContent='Đã tải nguyên văn · lịch sử lưu trên cloud.';}).catch(error=>{if(stamp===revision&&active())$('rrStatus').textContent=error.message;});}
 }
 async function load(random=false){
  const data=await request({op:'list',hsk:Number($('rrHsk').value)});if(!data)return;
  if(!Array.isArray(data.items)){ $('rrStatus').textContent='Danh sách nguồn chưa hợp lệ.';return; }
  items=data.items;if(random){if(!items.length){$('rrStatus').textContent='Chưa có bài ở cấp này.';return;}const pool=items.filter(i=>i.url!==currentURL);await open((pool.length?pool:items)[Math.floor(Math.random()*(pool.length||items.length))]);return;}host.replaceChildren(listing());$('rrStatus').textContent=items.length+' bài từ nguồn · danh sách làm mới tối đa mỗi 6 giờ.'+(data.unavailable?.length?' Một nguồn đang tạm không tải được.':'');
 }
 function sync(){
  stop();window.HSKRealReading?.cancel();const original=active();host.hidden=!original;randomButton.hidden=!original;
  for(const id of ['rrGenre','rrTopic'])$(id).closest('label').hidden=original;
  $('rrSources').hidden=original;$('rrArticle').hidden=original||!window.HSKRealReading?.story;
  newButton.textContent=original?'Tải danh sách bài gốc':'AI chọn bài mới ↻';
  oldButton.textContent=original?'Đọc lại bài gốc gần nhất':'Đọc lại bài gần nhất';
  $('rrStats').hidden=original;
  $('rrCancel').textContent=original?'Hủy tải bài':'Hủy tạo bài';
  if(!original)window.HSKRealReading?.enter();
  if(original&&!navigator.onLine)offline();
  if(original)$('rrContext').textContent='Đọc nguyên văn từ Mandarin Bean và HSK Reading. Chỉ hoạt động khi có mạng. URL bài gần nhất lưu trên cloud khi đăng nhập; không lưu bài trên thiết bị.';
 }
 randomButton.addEventListener('click',()=>{if(active()){if(items.length){const pool=items.filter(i=>i.url!==currentURL);open((pool.length?pool:items)[Math.floor(Math.random()*(pool.length||items.length))]);}else load(true);}});
 mode.addEventListener('change',sync);
 newButton.addEventListener('click',e=>{if(active()){e.preventDefault();e.stopImmediatePropagation();load();}},true);
 oldButton.addEventListener('click',e=>{if(!active())return;e.preventDefault();e.stopImmediatePropagation();if(!navigator.onLine){offline();return;}const stamp=revision;cloudHistory().then(item=>{if(stamp!==revision||!active())return;if(item)open(item);else $('rrStatus').textContent='Chưa có URL bài gốc trên cloud ở cấp này.';}).catch(error=>{if(stamp===revision&&active())$('rrStatus').textContent=error.message;});},true);
 $('rrHsk').addEventListener('change',()=>{if(active()){stop();items=[];openedArticle=null;host.replaceChildren();sync();}});
 $('rrCancel').addEventListener('click',()=>{if(active())stop();},true);
 $('rrBack').addEventListener('click',stop,true);
 new MutationObserver(()=>{if(panel.hidden)stop();else if(active())sync();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hsk-account-ready',()=>{stop();items=[];openedArticle=null;host.replaceChildren();if(active())sync();});
 function offline(){if(!active())return;stop();window.HSKSpeech?.stop?.();items=[];openedArticle=null;host.replaceChildren();newButton.disabled=true;oldButton.disabled=true;randomButton.disabled=true;$('rrStatus').textContent='Chế độ bài gốc chỉ hoạt động khi có mạng.';}
 window.addEventListener('offline',offline);
 window.addEventListener('online',()=>{if(active()){stop();$('rrStatus').textContent='Đã có mạng. Hãy tải lại danh sách bài gốc.';}});
 window.addEventListener('pagehide',()=>{stop();openedArticle=null;host.replaceChildren();items=[];});
 sync();if(!navigator.onLine)offline();
})();

