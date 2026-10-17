/* Real-world HSK reader: script-first, real source attribution, novelty-safe and opt-in AI calls. */
(()=>{
 'use strict';
 const C=window.HSKRealReadingVariety;
 const $=id=>document.getElementById(id);
 const panel=document.createElement('section');
 panel.id='realReadingPanel';panel.className='panel rr-panel';panel.dataset.studioHubPanel='real-reading';panel.hidden=true;
 const sources=[
  {id:'what-study',source:{id:'what-study',url:'https://mandarinbean.com/what-are-you-studying/'},hskMin:1,hskMax:2,site:'Mandarin Bean',topic:'Trường học'},
  {id:'life-change',source:{id:'life-change',url:'https://mandarinbean.com/change-of-life/'},hskMin:2,hskMax:4,site:'Mandarin Bean',topic:'Đời sống'},
  {id:'ask-leave',source:{id:'ask-leave',url:'https://mandarinbean.com/ask-for-leave/'},hskMin:2,hskMax:4,site:'Mandarin Bean',topic:'Công việc'},
  {id:'internet-phone',source:{id:'internet-phone',url:'https://mandarinbean.com/internet-and-cellphone/'},hskMin:4,hskMax:6,site:'Mandarin Bean',topic:'Gia đình'},
  {id:'tui-qiao',source:{id:'tui-qiao',url:'https://mandarinbean.com/tui-qiao/'},hskMin:5,hskMax:6,site:'Mandarin Bean',topic:'Văn hóa'}
 ];
 panel.innerHTML='<div class="rr-heading"><button class="rr-back" id="rrBack" type="button">← Quay lại</button><span class="rr-badge" id="rrLevel">HSK 3</span></div><h2>Đọc thực tế</h2><p class="rr-subtitle" id="rrContext">Luyện đọc những tình huống khác nhau từ bài báo và truyện có nguồn rõ ràng.</p><div class="rr-settings"><label>Cấp đọc <select id="rrHsk"></select></label><label>Chủ đề <select id="rrTopic"><option value="">Tất cả</option><option>Ăn uống</option><option>Đời sống</option><option>Công việc</option><option>Giao thông</option><option>Du lịch</option><option>Trường học</option><option>Gia đình</option><option>Văn hóa</option></select></label></div><div class="rr-ops"><button id="rrNew" type="button" class="rr-primary">AI chọn bài mới ↻</button><button id="rrOld" type="button" class="rr-secondary">Đọc lại bài gần nhất</button></div><p class="rr-stats" id="rrStats" aria-live="polite"></p><p class="rr-status" id="rrStatus" role="status" aria-live="polite"></p><div class="rr-article" id="rrArticle" hidden></div><details class="rr-sources" id="rrSources"><summary>Nguồn đọc có thể chọn</summary><div id="rrSourceList"></div></details>';
 document.querySelector('main.workspace').append(panel);
 const level=$('rrHsk'),topic=$('rrTopic'),status=$('rrStatus'),article=$('rrArticle'),newButton=$('rrNew'),sourcesList=$('rrSourceList');
 const genre=document.createElement('select');genre.id='rrGenre';const genreLabel=document.createElement('label');genreLabel.className='rr-genre';genreLabel.append('Loại bài đọc',genre);for(const [id,label]of Object.entries(C.GENRES))genre.add(new Option(label,id));panel.querySelector('.rr-settings').append(genreLabel);
 genre.addEventListener('change',()=>{cancel();story=null;article.hidden=true;caption();});
 const cancelButton=document.createElement('button');cancelButton.type='button';cancelButton.id='rrCancel';cancelButton.textContent='Hủy tạo bài';cancelButton.hidden=true;cancelButton.onclick=()=>{cancel();setState('Đã hủy tạo bài.');};document.querySelector('#realReadingPanel .rr-ops').append(cancelButton);
 function untilAbort(promise,signal){return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Đã hủy','AbortError'));if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});}
 for(let n=1;n<=6;n++){const option=new Option('HSK '+n,String(n));level.add(option);}
 let mode='script',showPin=false,showVi=false,story=null,lesson=null,history=[],cached=[],request=null,config=null,openedOwner=null;
 const owner=()=>{try{return JSON.parse(localStorage.getItem('hsk-account-meta-v1')||'{}').uid||'guest';}catch{return 'guest';}};
 const scoped=key=>key+':'+owner();
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(scoped(key))||'null')||fallback;}catch{return fallback;}};
 const persist=(key,data)=>{try{localStorage.setItem(scoped(key),JSON.stringify(data));}catch{status.textContent='Bộ nhớ thiết bị đầy; lịch sử bài đọc có thể chưa được lưu.';}};
 const cacheKey='hsk-real-reading-cache-v1',historyKey=C.HISTORY_KEY;
 function loadHistory(){history=read(historyKey,{version:1,entries:[]});cached=read(cacheKey,[]);openedOwner=owner();}
 function scope(){return {hsk:Number(level.value),genre:genre.value,lessonId:lesson?.id||null,topics:topic.value?[topic.value]:C.TOPICS};}
 function studyGoal(){const id=owner();let value=window.HSKPlanner?.plan?.target;try{if(value==null)value=JSON.parse(localStorage.getItem('hsk-studio-target-v1:'+id)||'null');}catch{}const n=Number(value);return n>=1&&n<=6?n:3;}
 function caption(){const s=C.stats(history,scope());$('rrStats').textContent='Đã mở '+s.opened+' bài · Hoàn thành '+s.completed+' bài'+(lesson?' trong bài học này':'');$('rrLevel').textContent='HSK '+level.value;$('rrContext').textContent=lesson?'Bài đọc bổ trợ cho bài học '+(lesson.number||lesson.id)+'.':'Chọn loại bài bạn muốn đọc.';}
 function setState(text){status.textContent=text;}
 function controlButton(text,fn,cls='rr-secondary'){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.onclick=fn;return b;}
 function make(tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;}
 function speak(sentence){return window.HSKSpeech?.button(sentence,'Nghe câu tiếng Trung')||make('span','🔊');}
 function sourceList(){
  sourcesList.replaceChildren();
  for(const s of sources.filter(x=>Number(level.value)>=x.hskMin&&Number(level.value)<=x.hskMax)){
   const row=make('div',null,'rr-source-item'),name=make('span',s.site+' · '+s.topic),link=make('a','Xem nguồn ↗');
   link.href=s.source.url;link.target='_blank';link.rel='noopener noreferrer';row.append(name,link);sourcesList.append(row);
  }
 }
 function openStory(value,{tracking=true}={}){
  if(!value)return;story=value;mode=(value.genre||'dialogue')==='dialogue'?'script':'text';showPin=false;showVi=false;
  if(tracking){history=C.record(history,value);persist(historyKey,history);}
  caption();renderStory();article.hidden=false;
  $('rrOld').disabled=false;
  article.scrollIntoView?.({block:'start',behavior:'auto'});
 }
 function renderStory(){
  if(!story)return;article.replaceChildren();
  const title=make('h3',story.titleZh),subtitle=make('p',story.titleVi,'rr-subtitle');
  article.append(make('span',C.GENRES[story.genre||'dialogue']||'Bài đọc','rr-badge'),title,subtitle);
  const credit=make('div',null,'rr-credit'),label=make('span',(story.genre==='story'||story.genre==='email'?'Bài hư cấu để học':story.genre==='news'?'Bài báo biên soạn để học, không phải tin mới':'Bản chuyển thể học tập')+' · Nguồn: '+(story.source?.site||'Nguồn bài đọc')),link=make('a','Mở bài gốc ↗');
  if(story.source?.url){link.href=story.source.url;link.target='_blank';link.rel='noopener noreferrer';credit.append(label,link);}else credit.append(label);
  article.append(credit);
  const controls=make('div',null,'rr-reading-switches');
  for(const [title,cb,active] of [['Kịch bản',()=>{mode='script';renderStory()},mode==='script'],['Văn bản',()=>{mode='text';renderStory()},mode==='text'],['Pinyin',()=>{showPin=!showPin;renderStory()},showPin],['Nghĩa',()=>{showVi=!showVi;renderStory()},showVi]]){
   if(title==='Kịch bản'&&!story.scriptMode?.length)continue;const b=controlButton(title,cb,'rr-pill'+(active?' is-active':''));b.setAttribute('aria-pressed',String(active));controls.append(b);
  }
  article.append(controls);
  const lines=mode==='script'?story.scriptMode:story.paragraphMode;
  for(const part of lines||[]){
   const row=make('div',null,'rr-line');
   if(mode==='script')row.append(make('strong',part.speaker+(part.stageNote?' · '+part.stageNote:''),'rr-speaker'));
   const zh=make('p',part.hanzi,'rr-hanzi');row.append(zh,speak(part.hanzi));
   if(showPin)row.append(make('p',part.pinyin,'rr-pinyin'));
   if(showVi)row.append(make('p',part.vi,'rr-vi'));
   article.append(row);
  }
  const quiz=make('section',null,'rr-quiz');quiz.append(make('h4','Kiểm tra đọc hiểu · 3 câu'));
  for(let i=0;i<(story.quiz||[]).length;i++){
   const q=story.quiz[i],field=make('fieldset'),legend=make('legend','Câu '+(i+1)+'. '+q.question);field.append(legend);
   q.options.forEach((answer,j)=>{const label=make('label',null,'rr-answer'),radio=document.createElement('input');radio.type='radio';radio.name='rr-q'+i;radio.value=String(j);label.append(radio,document.createTextNode(answer));field.append(label);});
   quiz.append(field);
  }
  const result=make('p','','rr-quiz-result');result.setAttribute('role','status');
  const check=controlButton('Xác nhận 3 câu',()=>{
   const answer=story.quiz.map((q,i)=>quiz.querySelector('input[name="rr-q'+i+'"]:checked'));
   if(answer.some(a=>!a)){result.textContent='Hãy chọn đủ 3 đáp án.';return;}
   const score=answer.filter((a,i)=>Number(a.value)===story.quiz[i].answerIndex).length;
   result.textContent='Đúng '+score+'/3. '+story.quiz.map((q,i)=>(i+1)+'. '+q.explanationVi).join(' ');
   history=C.record(history,story,{completed:true});persist(historyKey,history);caption();check.disabled=true;
  },'rr-primary');
  quiz.append(check,result);article.append(quiz);
 }
 function acceptServerStory(data){
  if(!data||!C.storyText(data)||!Array.isArray(data.scriptMode)||!Array.isArray(data.paragraphMode))return false;
  if((data.genre||'dialogue')!==genre.value)return false;
  if(genre.value==='dialogue'?data.scriptMode.length<4:data.scriptMode.length!==0||data.paragraphMode.length<2)return false;
  if(!data.source?.url||!sources.some(s=>s.source.url===data.source.url))return false;
  return true;
 }
 async function generate(){
  if(request)return;
  if(owner()!==openedOwner)loadHistory();
  const current=scope(),existing=C.nextCached(topic.value?cached.filter(s=>s.topic===topic.value):cached,history,current);
  if(existing.kind==='cached'){openStory(existing.item);setState('Bài mới từ thư viện đã lưu, không cần gọi AI.');return;}
  const user=window.HSKAccountDashboard?.user;
  if(!user){setState('Đăng nhập tài khoản HSK để AI tạo bài mới. Bạn vẫn có thể xem các nguồn bài gốc ở dưới.');return;}
  if(!config){setState('Dịch vụ AI chưa sẵn sàng. Hãy kiểm tra kết nối hoặc cấu hình Worker.');return;}
  const pick=C.nextGeneration(sources,history,current);
  if(pick.kind!=='generate'){setState(pick.message||'Chưa có bài mới. Hãy đổi cấp hoặc chủ đề.');return;}
  const controller=new AbortController(),requestOwner=owner();request=controller;newButton.disabled=true;cancelButton.hidden=false;panel.setAttribute('aria-busy','true');
  setState('Đang tạo '+C.GENRES[current.genre].toLowerCase()+' HSK '+current.hsk+'…');
  // Keep status/cancel/navigation accessible instead of covering errors with a modal.
  const timeout=setTimeout(()=>controller.abort(),90000);
  try{
   const token=await untilAbort(user.getIdToken(),controller.signal);
   if(request!==controller||owner()!==requestOwner)return;
   const body={hsk:current.hsk,genre:current.genre,lessonId:current.lessonId,lessonWords:C.requestWords(lesson?.words),sourceId:pick.source.id,topic:pick.topic,angle:pick.angle,excludeIds:C.stats(history,current).opened?history.entries.slice(-25).map(x=>x.id):[],excludeSources:history.entries.slice(-8).map(x=>x.sourceKey)};
   const response=await fetch(config.endpoint.replace(/\/translate$/,'/reading-next'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),signal:controller.signal});
   const result=await response.json();if(request!==controller||owner()!==requestOwner||controller.signal.aborted)return;if(!response.ok)throw Error(result.error||'Chưa tải được bài đọc mới.');
   if(!acceptServerStory(result.story))throw Error('Dữ liệu bài đọc chưa hợp lệ.');
   result.story.variantKey=pick.variantKey;result.story.angle=pick.angle;
   if(!C.isNovel(result.story,history).ok)throw Error('AI trả bài giống nội dung đã đọc. Hãy thử lại sau hoặc chọn chủ đề khác.');
   cached.push(result.story);cached=cached.slice(-18);persist(cacheKey,cached);
   if(request!==controller)return;
   openStory(result.story);setState(C.GENRES[current.genre]+' mới · '+result.story.source.site+'.');
  }catch(error){if(request===controller)setState(error.name==='AbortError'?'Tải bài quá lâu. Thử lại khi mạng ổn định.':error.message);}
  finally{clearTimeout(timeout);if(request===controller){request=null;newButton.disabled=false;cancelButton.hidden=true;panel.removeAttribute('aria-busy');}}
 }
 function cancel(){request?.abort();request=null;newButton.disabled=false;cancelButton.hidden=true;panel.removeAttribute('aria-busy');setState('');window.HSKSpeech?.stop?.();}
 function enter(){
  if(owner()!==openedOwner)loadHistory();
  if(!level.value)level.value=String(studyGoal());
  caption();sourceList();
 }
 window.addEventListener('hsk-lesson-context',e=>{if(e.detail?.id)window.HSKRealReading.lastLesson=e.detail;});
 window.addEventListener('hsk-account-ready',()=>{cancel();loadHistory();story=null;article.hidden=true;caption();});
 newButton.addEventListener('click',generate);
 $('rrOld').addEventListener('click',()=>{cancel();const old=[...cached].reverse().find(x=>history.entries.some(e=>e.id===x.id)&&x.hsk===Number(level.value)&&(x.genre||'dialogue')===genre.value&&(!topic.value||x.topic===topic.value)&&(!lesson||x.lessonId===lesson.id));if(old){openStory(old);setState('Đang đọc lại bài cũ.');}else setState('Chưa có bài thuộc loại này được lưu trên thiết bị.');});
 $('rrBack').addEventListener('click',()=>{cancel();window.HSKStudio?.navigate(lesson?'lessons':'practice');});
 level.addEventListener('change',()=>{cancel();lesson=null;story=null;article.replaceChildren();article.hidden=true;setState('');caption();sourceList();});
 topic.addEventListener('change',()=>{cancel();caption();});
 window.addEventListener('hsk-plan-change',()=>{if(!lesson){level.value=String(studyGoal());caption();sourceList();}});
 window.addEventListener('pagehide',cancel);
 document.querySelectorAll('[data-studio-go]').forEach(b=>b.addEventListener('click',()=>{if(!b.closest('#realReadingPanel'))cancel();}));
 fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.enabled&&new URL(c.endpoint).protocol==='https:')config=c;}).catch(()=>{});
 loadHistory();level.value=String(studyGoal());caption();sourceList();
 window.HSKRealReading={lastLesson:null,enter,leaveLesson(){cancel();lesson=null;},openFromLesson(context){cancel();lesson=context||this.lastLesson;level.value=String(lesson?.hsk||studyGoal());window.HSKStudio?.navigate('real-reading')},get story(){return story},get history(){return history},cancel};
})();
