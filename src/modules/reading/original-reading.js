/* Source-only reading. Persist URL metadata, never article bodies; no AI requests here. */
(()=>{
 'use strict';
 const panel=document.getElementById('realReadingPanel');if(!panel)return;
 const $=id=>document.getElementById(id),settings=panel.querySelector('.rr-settings'),newButton=$('rrNew'),oldButton=$('rrOld');
 const mode=document.createElement('select');mode.id='rrContentMode';mode.add(new Option('Bài gốc từ hai nguồn','original'));mode.add(new Option('Bài luyện AI (tùy chọn)','ai'));
 const label=document.createElement('label');label.append('Nội dung',mode);settings.prepend(label);
 const host=document.createElement('section');host.id='rrOriginalReading';host.setAttribute('aria-label','Bài đọc nguyên văn');$('rrArticle').before(host);
 let controller=null,revision=0,configPromise=null,items=[];
 const owner=()=>{try{return JSON.parse(localStorage.getItem('hsk-account-meta-v1')||'{}').uid||'guest';}catch{return 'guest';}};
 const historyKey=()=> 'hsk-original-reading-urls-v1:'+owner();
 function saved(){try{const rows=JSON.parse(localStorage.getItem(historyKey())||'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.url==='string').slice(-40):[];}catch{return [];}}
 function remember(item){const rows=saved().filter(r=>r.url!==item.url);rows.push({url:item.url,title:item.title,site:item.site,hsk:Number($('rrHsk').value),openedAt:Date.now()});try{localStorage.setItem(historyKey(),JSON.stringify(rows.slice(-40)));}catch{}}
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const active=()=>mode.value==='original';
 function stop(){revision++;controller?.abort();controller=null;newButton.disabled=false;oldButton.disabled=false;panel.removeAttribute('aria-busy');$('rrCancel').hidden=true;}
 async function endpoint(){
  configPromise||=fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{const u=new URL(c.endpoint);if(!c.enabled||u.protocol!=='https:')throw Error('Dịch vụ đọc nguồn chưa được cấu hình.');return u.href.replace(/\/translate$/,'/reading-library');}).catch(e=>{configPromise=null;throw e;});return configPromise;
 }
 async function request(body){
  stop();const id=revision,uid=owner(),c=new AbortController();controller=c;newButton.disabled=true;oldButton.disabled=true;panel.setAttribute('aria-busy','true');$('rrCancel').hidden=false;$('rrCancel').textContent='Hủy tải bài';$('rrStatus').textContent=body.op==='list'?'Đang lấy danh sách bài gốc…':'Đang trích nguyên văn từ nguồn…';
  const timer=setTimeout(()=>c.abort(),22000);
  try{const url=await endpoint();if(c.signal.aborted)throw new DOMException('Canceled','AbortError');
   const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:c.signal}),data=await r.json();
   if(id!==revision||owner()!==uid||!active())return null;if(!r.ok)throw Error(data.error||'Không tải được bài nguồn.');return data;
  }catch(e){if(id===revision&&active())$('rrStatus').textContent=e.name==='AbortError'?'Đã dừng tải bài nguồn.':e.message;return null;}
  finally{clearTimeout(timer);if(id===revision){controller=null;newButton.disabled=false;oldButton.disabled=false;panel.removeAttribute('aria-busy');$('rrCancel').hidden=true;}}
 }
 function listing(){
  const box=make('details');box.className='rr-original-list';box.open=true;box.append(make('summary','Chọn bài gốc · '+items.length+' bài'));
  for(const item of items){const b=make('button',item.title+' · '+item.site);b.type='button';b.addEventListener('click',()=>open(item));box.append(b);}
  return box;
 }
 async function open(item){
  const data=await request({op:'article',url:item.url});if(!data)return;
  const a=data.article;
  if(!a||a.url!==item.url||a.status!=='original'||!Array.isArray(a.paragraphs)||!a.paragraphs.length){$('rrStatus').textContent='Nguồn chưa trả nguyên văn hợp lệ.';return;}
  host.replaceChildren(make('h3',a.title));
  const credit=make('p',a.site+' · Nguyên văn từ nguồn'),link=make('a','Mở bài gốc ↗');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';credit.append(' · ',link);host.append(credit);
  const hasPin=a.paragraphs.some(p=>p.pinyin),pin=make('button','Pinyin nguồn');pin.type='button';pin.className='rr-secondary';pin.setAttribute('aria-pressed','false');pin.hidden=!hasPin;
  pin.onclick=()=>{const show=pin.getAttribute('aria-pressed')!=='true';pin.setAttribute('aria-pressed',String(show));host.querySelectorAll('.rr-original-pin').forEach(n=>n.hidden=!show);};host.append(pin);
  for(const paragraph of a.paragraphs){const row=make('div');row.className='rr-line';const han=make('p',paragraph.hanzi);han.className='rr-hanzi';row.append(han);
   const speech=window.HSKSpeech?.button(paragraph.hanzi,'Nghe câu tiếng Trung');if(speech)row.append(speech);
   if(paragraph.pinyin){const p=make('p',paragraph.pinyin);p.className='rr-pinyin rr-original-pin';p.hidden=true;row.append(p);}host.append(row);
  }
  remember(item);host.append(listing());$('rrStatus').textContent='Đã tải nguyên văn · không viết lại bằng AI.';host.scrollIntoView({block:'start',behavior:'auto'});
 }
 async function load(){
  const data=await request({op:'list',hsk:Number($('rrHsk').value)});if(!data)return;
  if(!Array.isArray(data.items)){ $('rrStatus').textContent='Danh sách nguồn chưa hợp lệ.';return; }
  items=data.items;host.replaceChildren(listing());$('rrStatus').textContent=items.length+' bài từ nguồn · danh sách làm mới tối đa mỗi 6 giờ.'+(data.unavailable?.length?' Một nguồn đang tạm không tải được.':'');
 }
 function sync(){
  stop();window.HSKRealReading?.cancel();const original=active();host.hidden=!original;
  for(const id of ['rrGenre','rrTopic'])$(id).closest('label').hidden=original;
  $('rrSources').hidden=original;$('rrArticle').hidden=original||!window.HSKRealReading?.story;
  newButton.textContent=original?'Tải danh sách bài gốc':'AI chọn bài mới ↻';
  oldButton.textContent=original?'Đọc lại bài gốc gần nhất':'Đọc lại bài gần nhất';
  $('rrStats').hidden=original;
  $('rrCancel').textContent=original?'Hủy tải bài':'Hủy tạo bài';
  if(!original)window.HSKRealReading?.enter();
  if(original)$('rrContext').textContent='Đọc nguyên văn từ Mandarin Bean và HSK Reading. App chỉ lưu URL và tiến độ; nội dung tải khi mở bài.';
 }
 mode.addEventListener('change',sync);
 newButton.addEventListener('click',e=>{if(active()){e.preventDefault();e.stopImmediatePropagation();load();}},true);
 oldButton.addEventListener('click',e=>{if(!active())return;e.preventDefault();e.stopImmediatePropagation();const item=saved().slice().reverse().find(x=>x.hsk===Number($('rrHsk').value));if(item)open(item);else $('rrStatus').textContent='Chưa có URL bài gốc đã đọc ở cấp này.';},true);
 $('rrHsk').addEventListener('change',()=>{if(active()){stop();items=[];host.replaceChildren();sync();}});
 $('rrCancel').addEventListener('click',()=>{if(active())stop();},true);
 $('rrBack').addEventListener('click',stop,true);
 new MutationObserver(()=>{if(panel.hidden)stop();else if(active())sync();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hsk-account-ready',()=>{stop();items=[];host.replaceChildren();if(active())sync();});
 window.addEventListener('pagehide',stop);sync();
})();

