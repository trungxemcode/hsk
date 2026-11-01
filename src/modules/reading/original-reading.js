/* Source-only reading. Cloud-only URL metadata, online-only reading; no device persistence or AI requests. */
(()=>{
 'use strict';
 const panel=document.getElementById('realReadingPanel');if(!panel)return;
 const $=id=>document.getElementById(id),settings=panel.querySelector('.rr-settings'),newButton=$('rrNew'),oldButton=$('rrOld');
 const mode=document.createElement('select');mode.id='rrContentMode';mode.add(new Option('Bài gốc từ hai nguồn','original'));mode.add(new Option('Bài luyện AI (tùy chọn)','ai'));
 const label=document.createElement('label');label.append('Nội dung',mode);settings.prepend(label);
 const host=document.createElement('section');host.id='rrOriginalReading';host.setAttribute('aria-label','Bài đọc nguyên văn');$('rrArticle').before(host);
 let controller=null,revision=0,configPromise=null,items=[];
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
   const metadata={url:item.url,title:item.title,site:item.site,hsk,openedAt:Date.now()};
   const fields={id:{stringValue:'original-reading-last-'+hsk},time:{integerValue:String(metadata.openedAt)},writer:{stringValue:'original-reading-url'},deleted:{booleanValue:false},payload:{stringValue:JSON.stringify(metadata)}};
   const r=await fetch('https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents:commit',{method:'POST',headers,cache:'no-store',signal:c.signal,body:JSON.stringify({writes:[{update:{name,fields},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]})});
   if(!current())return null;if(!r.ok)throw Error('Chưa lưu được lịch sử trên cloud. Không lưu dự phòng trên máy.');return metadata;
  }finally{clearTimeout(timer);if(cloudRequest===c)cloudRequest=null;}
 }
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const active=()=>mode.value==='original';
 function stop(){revision++;controller?.abort();cloudRequest?.abort();cloudRequest=null;controller=null;newButton.disabled=false;oldButton.disabled=false;panel.removeAttribute('aria-busy');$('rrCancel').hidden=true;}
 async function endpoint(){
  configPromise||=fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{const u=new URL(c.endpoint);if(!c.enabled||u.protocol!=='https:')throw Error('Dịch vụ đọc nguồn chưa được cấu hình.');return u.href.replace(/\/translate$/,'/reading-library');}).catch(e=>{configPromise=null;throw e;});return configPromise;
 }
 async function request(body){
  if(!navigator.onLine){offline();return null;}
  stop();const id=revision,uid=owner(),c=new AbortController();controller=c;newButton.disabled=true;oldButton.disabled=true;panel.setAttribute('aria-busy','true');$('rrCancel').hidden=false;$('rrCancel').textContent='Hủy tải bài';$('rrStatus').textContent=body.op==='list'?'Đang lấy danh sách bài gốc…':'Đang trích nguyên văn từ nguồn…';
  const timer=setTimeout(()=>c.abort(),22000);
  try{const url=await endpoint();if(c.signal.aborted)throw new DOMException('Canceled','AbortError');
   const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:c.signal}),data=await r.json();
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
  host.append(listing());$('rrStatus').textContent='Đã tải nguyên văn · '+(owner()==='guest'?'Đăng nhập để lưu lịch sử trên cloud.':'Đang lưu lịch sử lên cloud…');host.scrollIntoView({block:'start',behavior:'auto'});
  if(owner()!=='guest'){const stamp=revision;cloudHistory(item).then(saved=>{if(saved&&stamp===revision&&active())$('rrStatus').textContent='Đã tải nguyên văn · lịch sử lưu trên cloud.';}).catch(error=>{if(stamp===revision&&active())$('rrStatus').textContent=error.message;});}
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
  if(original&&!navigator.onLine)offline();
  if(original)$('rrContext').textContent='Đọc nguyên văn từ Mandarin Bean và HSK Reading. Chỉ hoạt động khi có mạng. URL bài gần nhất lưu trên cloud khi đăng nhập; không lưu bài trên thiết bị.';
 }
 mode.addEventListener('change',sync);
 newButton.addEventListener('click',e=>{if(active()){e.preventDefault();e.stopImmediatePropagation();load();}},true);
 oldButton.addEventListener('click',e=>{if(!active())return;e.preventDefault();e.stopImmediatePropagation();if(!navigator.onLine){offline();return;}const stamp=revision;cloudHistory().then(item=>{if(stamp!==revision||!active())return;if(item)open(item);else $('rrStatus').textContent='Chưa có URL bài gốc trên cloud ở cấp này.';}).catch(error=>{if(stamp===revision&&active())$('rrStatus').textContent=error.message;});},true);
 $('rrHsk').addEventListener('change',()=>{if(active()){stop();items=[];host.replaceChildren();sync();}});
 $('rrCancel').addEventListener('click',()=>{if(active())stop();},true);
 $('rrBack').addEventListener('click',stop,true);
 new MutationObserver(()=>{if(panel.hidden)stop();else if(active())sync();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hsk-account-ready',()=>{stop();items=[];host.replaceChildren();if(active())sync();});
 function offline(){if(!active())return;stop();window.HSKSpeech?.stop?.();items=[];host.replaceChildren();newButton.disabled=true;oldButton.disabled=true;$('rrStatus').textContent='Chế độ bài gốc chỉ hoạt động khi có mạng.';}
 window.addEventListener('offline',offline);
 window.addEventListener('online',()=>{if(active()){stop();$('rrStatus').textContent='Đã có mạng. Hãy tải lại danh sách bài gốc.';}});
 window.addEventListener('pagehide',()=>{stop();host.replaceChildren();items=[];});
 sync();if(!navigator.onLine)offline();
})();

