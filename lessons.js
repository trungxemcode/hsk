(()=>{
'use strict';
const $=id=>document.getElementById(id),panel=$('lessonsPanel'),root=$('lessonsContent'),status=$('lessonsStatus'),KEY='hsk-course-lessons-v1';
let data=null,loading=null,hsk=1,volume='',selected=null,cardIndex=0,revealed=false;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn,cls){const n=el('button',text,cls);n.type='button';n.onclick=fn;return n;}
function progress(){try{return JSON.parse(localStorage.getItem(KEY)||'{}').lessons||{};}catch{return {};}}
function save(id,value){const lessons=progress();lessons[id]={...lessons[id],...value,updatedAt:Date.now()};try{localStorage.setItem(KEY,JSON.stringify({version:1,lessons}));status.textContent='Đã lưu tiến độ bài học.';}catch{status.textContent='Không lưu được tiến độ. Kiểm tra bộ nhớ trình duyệt.';}render();}
function api(){return window.HSKLessons;}
function course(){return data?.courses.find(c=>c.hsk===hsk);}
function matched(lesson){return api().match(lesson.words);}
function close(){panel.hidden=true;document.body.classList.remove('show-lessons');}
async function load(){if(data)return data;if(!loading)loading=fetch('./lessons-data.json').then(r=>{if(!r.ok)throw Error('Chưa tải được bài học. Hãy cập nhật app rồi thử lại.');return r.json();}).then(d=>{if(d.version!==1||d.courses.length!==6||d.courses.reduce((n,c)=>n+c.lessons.length,0)!==146)throw Error('Dữ liệu bài học chưa đầy đủ.');data=d;return d;}).finally(()=>{loading=null;});return loading;}
async function open(){
 document.body.classList.remove('drawer-open','show-about','show-account','show-admin','show-translator');document.body.classList.add('show-lessons');
 for(const id of ['aboutPanel','accountPanel','adminPanel','translatorPanel'])$(id).hidden=true;
 $('drawer').inert=true;$('drawer').setAttribute('aria-hidden','true');$('menuBtn').setAttribute('aria-expanded','false');panel.hidden=false;document.querySelector('.workspace').scrollTop=0;
 status.textContent='Đang mở bài học…';
 try{await load();if(!api())throw Error('Dữ liệu từ vựng đang tải. Chờ một chút rồi mở lại Bài học.');status.textContent='';render();}catch(e){status.textContent=e.message;root.replaceChildren(button('Thử lại',open));}
}
function render(){
 if(!data||!api())return;root.replaceChildren();const p=progress();
 const levels=el('div',undefined,'lesson-levels');levels.setAttribute('aria-label','Chọn cấp độ bài học');
 for(let h=1;h<=6;h++){const c=data.courses[h-1],done=c.lessons.filter(l=>p[l.id]?.completed).length,b=button('HSK '+h+' · '+done+'/'+c.lessons.length,()=>{hsk=h;volume='';selected=null;render();});b.setAttribute('aria-pressed',String(hsk===h));levels.append(b);}root.append(levels);
 if(selected){renderLesson(selected,p);return;}
 root.append(el('h3','HSK '+hsk+' · '+course().lessons.length+' bài'));
 if(hsk>=4){const volumes=el('div',undefined,'lesson-actions');for(const [v,label] of [['','Cả hai tập'],['A','Thượng · Tập 1'],['B','Hạ · Tập 2']]){const b=button(label,()=>{volume=v;render();});b.setAttribute('aria-pressed',String(volume===v));volumes.append(b);}root.append(volumes);}
 const resume=course().lessons.find(l=>p[l.id]?.startedAt&&!p[l.id]?.completed)||course().lessons.find(l=>!p[l.id]?.completed);
 if(resume)root.append(button('Tiếp tục bài '+resume.number+' · '+resume.vi,()=>select(resume),'lesson-resume'));
 const list=el('div',undefined,'lesson-list');
 for(const l of course().lessons.filter(l=>!volume||l.volume===volume)){
  const row=button('',()=>select(l),'lesson-row');row.append(el('span',String(l.number).padStart(2,'0'),'lesson-number'),el('span',undefined,'lesson-row-text'));
  const text=row.lastChild;text.append(el('strong',l.vi),el('span',l.title),el('small',(l.volume?'Tập '+(l.volume==='A'?'Thượng':'Hạ')+' · ':'')+matched(l).length+' thẻ từ · '+(p[l.id]?.completed?'Đã hoàn thành':p[l.id]?.startedAt?'Đang học':'Chưa học')));list.append(row);
 }root.append(list);
 const sources=el('details',undefined,'lesson-sources');sources.append(el('summary','Về bộ bài học và nguồn đối chiếu'),el('p','Theo thứ tự bài của bộ Giáo trình chuẩn HSK 1–6 trong ảnh. Từ vựng, nghĩa và ví dụ dùng dữ liệu hiện có của app; bài kiểm tra được tạo từ dữ liệu này. Đây là phần luyện tập đi kèm sách, không phải bản sao toàn bộ bài khóa, âm thanh hay sách bài tập.'));
 for(const s of data.sources){const a=el('a',s.label);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a);}root.append(sources);
}
function select(l){selected=l;cardIndex=0;revealed=false;save(l.id,{startedAt:progress()[l.id]?.startedAt||Date.now()});$('lessonsContent').scrollIntoView({block:'start',behavior:'smooth'});}
function renderLesson(l,p){
 const ws=matched(l),known=ws.filter(w=>api().record(w)?.status==='known').length;
 root.append(button('← Danh sách bài',()=>{selected=null;render();}));
 root.append(el('h3','Bài '+l.number+' · '+l.vi),el('p',l.title,'lesson-title-cn'),el('p','HSK '+hsk+(l.volume?' · Tập '+(l.volume==='A'?'Thượng':'Hạ'):'')+' · '+known+'/'+ws.length+' từ đã thuộc','hint'));
 const steps=el('p','Học từ → đọc ví dụ → kiểm tra → ôn lại theo lịch. Các nút đã thuộc/chưa thuộc dùng chung tiến độ với thẻ từ và SRS.','hint');root.append(steps);
 const actions=el('div',undefined,'lesson-actions');actions.append(button('Kiểm tra từ bài này',()=>{close();api().quiz(ws,'HSK '+hsk+' · Bài '+l.number);}),button('Ôn SRS bài này',()=>{close();api().srs(ws);}),button(p[l.id]?.completed?'Đánh dấu chưa hoàn thành':'✓ Hoàn thành bài',()=>save(l.id,{completed:!p[l.id]?.completed})));root.append(actions);
 const card=el('article',undefined,'lesson-card');root.append(card);
 function draw(){
  card.replaceChildren();if(!ws.length){card.append(el('p','Bài này chưa có thẻ tương ứng trong dữ liệu.'));return;}
  const w=ws[cardIndex];card.append(el('small','Từ '+(cardIndex+1)+' / '+ws.length),el('div',w.han,'lesson-han'),el('p',w.pin,'lesson-pinyin'));
  if(!revealed)card.append(button('Xem nghĩa và ví dụ',()=>{revealed=true;draw();}));
  else{card.append(el('p',w.mean,'lesson-meaning'));const examples=api().examples(w);for(const e of examples.slice(0,3)){const x=el('div',undefined,'lesson-example');x.append(el('p',e.cn),el('p',e.pin,'lesson-pinyin'),el('p',e.vi));card.append(x);}if(!examples.length)card.append(el('p','Chưa có ví dụ đã đối chiếu cho mục từ này.','hint'));
   const marks=el('div',undefined,'lesson-actions');for(const [v,label] of [['unknown','Chưa thuộc'],['known','Đã thuộc']]){const b=button(label,()=>{api().mark(w,v);render();},v);b.setAttribute('aria-pressed',String(api().record(w)?.status===v));marks.append(b);}card.append(marks);
  }
  const nav=el('div',undefined,'lesson-actions');const previous=button('← Từ trước',()=>{cardIndex--;revealed=false;draw();});previous.disabled=cardIndex===0;const next=button('Từ tiếp →',()=>{cardIndex++;revealed=false;draw();});next.disabled=cardIndex===ws.length-1;nav.append(previous,next);card.append(nav);
 }draw();
 const vocab=el('details',undefined,'lesson-vocab');vocab.append(el('summary','Danh sách từ của bài · '+ws.length+' thẻ'));const grid=el('div',undefined,'lesson-word-grid');for(let i=0;i<ws.length;i++){const w=ws[i],b=button(w.han+' · '+w.pin,()=>{cardIndex=i;revealed=true;draw();card.scrollIntoView({block:'center',behavior:'smooth'});});grid.append(b);}vocab.append(grid);root.append(vocab);
 const missing=l.words.filter(w=>!api().match([w]).length);if(missing.length){const gaps=el('details',undefined,'lesson-sources');gaps.append(el('summary','Mục từ chưa có thẻ trong app · '+missing.length),el('p',missing.join('、')),el('p','Danh sách giáo trình có thêm tên riêng, từ bổ sung và mục chưa khớp dữ liệu hiện tại. Các mục này chưa được tính vào kiểm tra hay số từ đã thuộc.','hint'));root.append(gaps);}
 const navigation=el('div',undefined,'lesson-actions'),ls=course().lessons,position=ls.indexOf(l);if(position>0)navigation.append(button('← Bài trước',()=>select(ls[position-1])));if(position<ls.length-1)navigation.append(button('Bài tiếp →',()=>select(ls[position+1])));root.append(navigation);
}
$('lessonsBtn').addEventListener('click',open);
for(const n of document.querySelectorAll('.app-tabs button,#translatorBtn,#accountBtn,#adminBtn,#aboutBtn,[data-filter]'))n.addEventListener('click',close);
$('mobileMode').addEventListener('change',close);
window.addEventListener('hsk-account-ready',()=>{selected=null;cardIndex=0;revealed=false;if(!panel.hidden)render();});
window.addEventListener('storage',e=>{if([KEY,'hsk-flashcards-progress-v1'].includes(e.key)&&!panel.hidden)render();});
window.addEventListener('hsk-lessons-ready',()=>{if(!panel.hidden){status.textContent='';render();}});
})();
