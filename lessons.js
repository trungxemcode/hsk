(()=>{
'use strict';
const $=id=>document.getElementById(id),panel=$('lessonsPanel'),root=$('lessonsContent'),status=$('lessonsStatus'),KEY='hsk-course-lessons-v1';
let data=null,loading=null,hsk=1,volume='',selected=null,cardIndex=0,revealed=false,lessonSection='overview';
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn,cls){const n=el('button',text,cls);n.type='button';n.onclick=fn;return n;}
function progress(){try{return JSON.parse(localStorage.getItem(KEY)||'{}').lessons||{};}catch{return {};}}
const mastery=window.HSKLessonMastery;
function measure(l,p=progress()){return mastery.score(p[l.id],matched(l).map(w=>api().key(w)),l.content?.practice.map(q=>q.id)||[]);}
function save(id,value,refresh=true){const lessons=progress();lessons[id]={...lessons[id],...value,updatedAt:Date.now()};try{localStorage.setItem(KEY,JSON.stringify({version:1,lessons}));status.textContent='Đã lưu tiến độ bài học.';}catch{status.textContent='Không lưu được tiến độ. Kiểm tra bộ nhớ trình duyệt.';}if(refresh&&!panel.hidden)render();}
function api(){return window.HSKLessons;}
function course(){return data?.courses.find(c=>c.hsk===hsk);}
function matched(lesson){return api().match(lesson.words);}
function close(preserve=false){panel.hidden=true;document.body.classList.remove('show-lessons','lesson-focus');if(!preserve&&location.hash.startsWith('#lesson/'))history.replaceState(null,'',location.pathname+location.search);}
function fromHash(){try{const id=decodeURIComponent(location.hash.slice(8));return data?.courses.flatMap(c=>c.lessons).find(l=>l.id===id);}catch{return null;}}
function goList(){selected=null;document.body.classList.remove('lesson-focus');history.pushState(null,'',location.pathname+location.search);render();document.querySelector('.workspace').scrollTop=0;}
async function load(){if(data)return data;if(!loading)loading=fetch('./lessons-data.json').then(r=>{if(!r.ok)throw Error('Chưa tải được bài học. Hãy cập nhật app rồi thử lại.');return r.json();}).then(d=>{if(d.version!==1||d.courses.length!==6||d.courses.reduce((n,c)=>n+c.lessons.length,0)!==146)throw Error('Dữ liệu bài học chưa đầy đủ.');return fetch('./lesson-content-hsk1.json').then(r=>{if(!r.ok)throw Error('Chưa tải được nội dung bài học. Hãy cập nhật app rồi thử lại.');return r.json();}).then(c=>{if(c.version!==1||c.lessons.length!==15)throw Error('Nội dung HSK 1 chưa đầy đủ.');for(const x of c.lessons){const l=d.courses[0].lessons.find(l=>l.id===x.id);if(l)l.content=x;}data=d;return d;});}).finally(()=>{loading=null;});return loading;}
async function open(){
 document.body.classList.remove('drawer-open','show-about','show-account','show-admin','show-translator');document.body.classList.add('show-lessons');
 for(const id of ['aboutPanel','accountPanel','adminPanel','translatorPanel'])$(id).hidden=true;
 $('drawer').inert=true;$('drawer').setAttribute('aria-hidden','true');$('menuBtn').setAttribute('aria-expanded','false');panel.hidden=false;document.querySelector('.workspace').scrollTop=0;
 status.textContent='Đang mở bài học…';
 try{await load();if(!api())throw Error('Dữ liệu từ vựng đang tải. Chờ một chút rồi mở lại Bài học.');status.textContent='';selected=location.hash.startsWith('#lesson/')?fromHash():null;if(selected)hsk=Number(selected.id.split('-')[1]);render();}catch(e){status.textContent=e.message;root.replaceChildren(button('Thử lại',open));}
}
function render(){
 if(!data||!api())return;root.replaceChildren();const p=progress();
 if(selected){document.body.classList.add('lesson-focus');renderLesson(selected,p);return;}document.body.classList.remove('lesson-focus');
 root.append(button('☷ Chọn cấp độ · HSK '+hsk,()=>$('menuBtn').click(),'lesson-level-picker'));
 root.append(el('h3','HSK '+hsk+' · '+course().lessons.length+' bài'));
 if(hsk>=4){const volumes=el('div',undefined,'lesson-actions');for(const [v,label] of [['','Cả hai tập'],['A','Thượng · Tập 1'],['B','Hạ · Tập 2']]){const b=button(label,()=>{volume=v;render();});b.setAttribute('aria-pressed',String(volume===v));volumes.append(b);}root.append(volumes);}
 const resume=course().lessons.find(l=>p[l.id]?.startedAt&&!measure(l,p).mastered)||course().lessons.find(l=>!measure(l,p).mastered);
 if(resume)root.append(button('Tiếp tục bài '+resume.number+' · '+resume.vi,()=>select(resume),'lesson-resume'));
 const list=el('div',undefined,'lesson-list');
 for(const l of course().lessons.filter(l=>!volume||l.volume===volume)){
  const m=measure(l,p),row=button('',()=>select(l),'lesson-row'+(m.mastered?' is-mastered':m.read?' is-read':''));row.append(el('span',String(l.number).padStart(2,'0'),'lesson-number'),el('span',undefined,'lesson-row-text'));
  const text=row.lastChild;text.append(el('strong',l.vi),el('span',l.title),el('small',(l.volume?'Tập '+(l.volume==='A'?'Thượng':'Hạ')+' · ':'')+matched(l).length+' thẻ từ · '+(m.mastered?'Nắm vững':m.read?'Đã học qua':p[l.id]?.startedAt?'Đang học':'Chưa học')+' · '+m.percent+'%'));const bar=el('progress');bar.max=100;bar.value=m.percent;bar.setAttribute('aria-label','Tiến độ bài '+l.number+' · '+m.percent+'%');text.append(bar);list.append(row);
 }root.append(list);
 const sources=el('details',undefined,'lesson-sources');sources.append(el('summary','Về bộ bài học và nguồn đối chiếu'),el('p','Theo thứ tự bài của bộ Giáo trình chuẩn HSK 1–6 trong ảnh. Từ vựng, nghĩa và ví dụ dùng dữ liệu hiện có của app; bài kiểm tra được tạo từ dữ liệu này. Đây là phần luyện tập đi kèm sách, không phải bản sao toàn bộ bài khóa, âm thanh hay sách bài tập.'));
 for(const s of data.sources){const a=el('a',s.label);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a);}root.append(sources);
}
function select(l){history.pushState({lesson:l.id},'','#lesson/'+l.id);selected=l;cardIndex=0;revealed=false;lessonSection='overview';save(l.id,{startedAt:progress()[l.id]?.startedAt||Date.now()});document.querySelector('.workspace').scrollTop=0;}
function renderLesson(l,p){
 const ws=matched(l),known=ws.filter(w=>api().record(w)?.status==='known').length;
 root.append(button('← Quay về danh sách',goList,'lesson-back'));
 root.append(el('h3','Bài '+l.number+' · '+l.vi),el('p',l.title,'lesson-title-cn'),el('p','HSK '+hsk+(l.volume?' · Tập '+(l.volume==='A'?'Thượng':'Hạ'):'')+' · '+known+'/'+ws.length+' từ đã thuộc','hint'));
 const views=l.content?contentShell(l,p):null,overview=views?.overview||root,vocabRoot=views?.vocabulary||root;
 if(!l.content)root.append(el('p','Bài này hiện có phần từ vựng; nội dung ngữ pháp, bài đọc và hội thoại đang chờ đối chiếu.','hint'));
 const steps=el('p','Học từ → đọc ví dụ → kiểm tra → ôn lại theo lịch. Các nút đã thuộc/chưa thuộc dùng chung tiến độ với thẻ từ và SRS.','hint');overview.append(steps);
 const m=measure(l,p),meter=el('section',undefined,'lesson-mastery');
 meter.append(el('strong','Mức độ nắm vững · '+m.percent+'%'));const bar=el('progress');bar.max=100;bar.value=m.percent;meter.append(bar,el('p','Học qua: '+(m.read?'20':'0')+'/20 · Kiểm tra: '+Math.floor(m.quiz*(l.content?15:30))+'/'+(l.content?15:30)+(l.content?' · Hiểu bài: '+Math.floor(m.content*15)+'/15':'')+' · SRS: '+Math.floor(m.srs*50)+'/50'),el('small',m.quizReady+'/'+ws.length+' từ trả lời đúng 2 lần liên tiếp · '+m.srsReady+'/'+ws.length+' từ ôn đúng 3 lần cách nhau ít nhất 24 giờ.'));
 overview.append(meter);
 const actions=el('div',undefined,'lesson-actions');actions.append(button('Kiểm tra từ bài này',()=>{close(true);api().quiz(ws,'HSK '+hsk+' · Bài '+l.number,l.id);}),button('Ôn SRS bài này',()=>{close(true);api().srs(ws,l.id);}),button(m.read?'✓ Đã học qua':'Đánh dấu đã học qua',()=>save(l.id,{read:true,completed:false})));overview.append(actions);
 const card=el('article',undefined,'lesson-card');vocabRoot.append(card);
 function draw(){
  card.replaceChildren();if(!ws.length){card.append(el('p','Bài này chưa có thẻ tương ứng trong dữ liệu.'));return;}
  const w=ws[cardIndex];card.append(el('small','Từ '+(cardIndex+1)+' / '+ws.length),el('div',w.han,'lesson-han'),el('p',w.pin,'lesson-pinyin'));
  if(!revealed)card.append(button('Xem nghĩa và ví dụ',()=>{revealed=true;draw();}));
  else{card.append(el('p',w.mean,'lesson-meaning'));const examples=api().examples(w);for(const e of examples.slice(0,3)){const x=el('div',undefined,'lesson-example');x.append(el('p',e.cn),el('p',e.pin,'lesson-pinyin'),el('p',e.vi));card.append(x);}if(!examples.length)card.append(el('p','Chưa có ví dụ đã đối chiếu cho mục từ này.','hint'));
   const marks=el('div',undefined,'lesson-actions');for(const [v,label] of [['unknown','Chưa thuộc'],['known','Đã thuộc']]){const b=button(label,()=>{api().mark(w,v);render();},v);b.setAttribute('aria-pressed',String(api().record(w)?.status===v));marks.append(b);}card.append(marks);
  }
  const nav=el('div',undefined,'lesson-actions');const previous=button('← Từ trước',()=>{cardIndex--;revealed=false;draw();});previous.disabled=cardIndex===0;const next=button('Từ tiếp →',()=>{cardIndex++;revealed=false;draw();});next.disabled=cardIndex===ws.length-1;nav.append(previous,next);card.append(nav);
 }draw();
 const vocab=el('details',undefined,'lesson-vocab');vocab.append(el('summary','Danh sách từ của bài · '+ws.length+' thẻ'));const grid=el('div',undefined,'lesson-word-grid');for(let i=0;i<ws.length;i++){const w=ws[i],b=button(w.han+' · '+w.pin,()=>{cardIndex=i;revealed=true;draw();card.scrollIntoView({block:'center',behavior:'smooth'});});grid.append(b);}vocab.append(grid);vocabRoot.append(vocab);
 const missing=l.words.filter(w=>!api().match([w]).length);if(missing.length){const gaps=el('details',undefined,'lesson-sources');gaps.append(el('summary','Mục từ chưa có thẻ trong app · '+missing.length),el('p',missing.join('、')),el('p','Danh sách giáo trình có thêm tên riêng, từ bổ sung và mục chưa khớp dữ liệu hiện tại. Các mục này chưa được tính vào kiểm tra hay số từ đã thuộc.','hint'));vocabRoot.append(gaps);}
 const navigation=el('div',undefined,'lesson-actions'),ls=course().lessons,position=ls.indexOf(l);if(position>0)navigation.append(button('← Bài trước',()=>select(ls[position-1])));if(position<ls.length-1)navigation.append(button('Bài tiếp →',()=>select(ls[position+1])));root.append(navigation);
}
function languageLine(x){const row=el('div',undefined,'lesson-language-line');row.append(el('p',(x.speaker?x.speaker+': ':'')+x.cn,'lesson-cn'),el('p',x.pin,'lesson-pinyin'),el('p',x.vi));return row;}
function contentShell(l,p){
 const c=l.content,nav=el('div',undefined,'lesson-section-nav'),views={};nav.setAttribute('aria-label','Các phần của bài học');root.append(nav);
 for(const [id,label] of [['overview','Tổng quan'],['grammar','Ngữ pháp'],['reading','Bài đọc'],['dialogue','Hội thoại'],['vocabulary','Từ vựng'],['practice','Luyện tập']]){
  const v=el('section',undefined,'lesson-section');v.hidden=lessonSection!==id;v.setAttribute('aria-label',label);views[id]=v;
  const b=button(label,()=>{lessonSection=id;render();document.querySelector('.workspace').scrollTop=0;});b.setAttribute('aria-pressed',String(!v.hidden));nav.append(b);root.append(v);
 }
 views.overview.append(el('h4','Mục tiêu'),el('p',c.objectives.join(' ')),el('h4','Nội dung trọng tâm'),el('p',c.summary),button('Bắt đầu học ngữ pháp',()=>{lessonSection='grammar';render();}));
 const source=el('details',undefined,'lesson-sources');source.append(el('summary','Nội dung và nguồn đối chiếu'),el('p',c.provenance.label));for(const s of c.provenance.sources){const a=el('a',s.label);a.href=s.url;a.target='_blank';a.rel='noopener';source.append(a);}views.overview.append(source);
 views.grammar.append(el('p',Number(l.id.split('-')[2])<3?'Hai bài đầu ưu tiên ngữ âm và giao tiếp. Các phần dưới đây bao gồm hướng dẫn phát âm và mẫu giao tiếp.':'Học mẫu câu, đọc ví dụ rồi đối chiếu lỗi thường gặp.','hint'));
 for(const x of c.grammar){const box=el('article',undefined,'lesson-grammar-point');box.append(el('h4',x.title),el('p',x.pattern,'lesson-pattern'),el('p',x.usage));for(const e of x.examples)box.append(languageLine(e));box.append(el('p','Lưu ý: '+x.error,'lesson-error-note'));views.grammar.append(box);}
 views.reading.append(el('h4',c.reading.title),el('p','Đoạn luyện đọc được biên soạn cho app theo chủ đề bài; các bài đầu dùng chuỗi lời nói ngắn.','hint'));for(const x of c.reading.lines)views.reading.append(languageLine(x));
 views.dialogue.append(el('p','Ba tình huống luyện giao tiếp. Đọc cả vai A và vai B, sau đó thử nói lại khi che bản dịch.','hint'));
 for(const d of c.dialogues){const box=el('article',undefined,'lesson-dialogue');box.append(el('h4',d.title));for(const x of d.lines)box.append(languageLine(x));views.dialogue.append(box);}
 renderContentPractice(l,views.practice);
 return views;
}
function renderContentPractice(l,view){
 const qs=l.content.practice,done=progress()[l.id]?.contentEvidence||{};
 view.append(el('h4','Kiểm tra hiểu bài'),el('p',qs.length+' câu về cấu trúc, giao tiếp và đọc hiểu. Câu sai có giải thích; trả lời đúng hai lần liên tiếp cho từng câu mới đạt phần điểm hiểu bài.','hint'));
 let order=[...qs].sort((a,b)=>(done[a.id]?.streak||0)-(done[b.id]?.streak||0)),position=0,answered=false;const stage=el('div',undefined,'lesson-test');view.append(stage);
 function draw(){stage.replaceChildren();answered=false;if(position>=order.length){stage.append(el('p','Đã làm xong lượt kiểm tra.'),button('Làm lượt mới',()=>{render();}));return;}
  const q=order[position];stage.append(el('strong','Câu '+(position+1)+' / '+order.length),el('p',q.prompt));const indices=q.options.map((_,i)=>i);for(let i=indices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
  const opts=el('div',undefined,'lesson-test-options'),feedback=el('p',undefined,'lesson-test-feedback');feedback.setAttribute('role','status');
  const next=button(position===order.length-1?'Xem kết quả':'Câu tiếp theo',()=>{position++;draw();});next.hidden=true;
  for(const index of indices){const b=button(q.options[index],()=>{if(answered)return;answered=true;const correct=index===q.answer;for(const node of opts.children){node.disabled=true;node.classList.toggle('correct',node.dataset.index===String(q.answer));if(node===b&&!correct)node.classList.add('wrong');}
   const old=progress()[l.id]||{},evidence={...old.contentEvidence},r=evidence[q.id]||{streak:0,attempts:0};evidence[q.id]={streak:correct?Math.min(2,r.streak+1):0,attempts:r.attempts+1,last:Date.now()};save(l.id,{contentEvidence:evidence},false);feedback.textContent=(correct?'✓ Chính xác. ':'× Chưa đúng. ')+q.explanation;next.hidden=false;
  });b.dataset.index=String(index);opts.append(b);}stage.append(opts,feedback,next);
 }draw();
}

window.HSKLessonNav={open};
$('lessonPracticeBack').onclick=()=>api()?.show();
for(const b of document.querySelectorAll('[data-lesson-level]'))b.addEventListener('click',()=>{hsk=Number(b.dataset.lessonLevel);volume='';goList();$('drawerClose').click();});
window.addEventListener('popstate',()=>{if(location.hash.startsWith('#lesson/'))api()?.show();else if(!panel.hidden)goListFromHistory();});
function goListFromHistory(){selected=null;document.body.classList.remove('lesson-focus');render();document.querySelector('.workspace').scrollTop=0;}
window.addEventListener('hsk-lesson-evidence',e=>{const l=data?.courses.flatMap(c=>c.lessons).find(l=>l.id===e.detail?.id);if(!l||!matched(l).some(w=>api().key(w)===e.detail.key))return;save(l.id,mastery.apply(progress()[l.id],e.detail));});
for(const n of document.querySelectorAll('.app-tabs button:not([data-mode="lessons"]),#translatorBtn,#accountBtn,#adminBtn,#aboutBtn,[data-filter]'))n.addEventListener('click',()=>close());
$('mobileMode').addEventListener('change',()=>{if($('mobileMode').value!=='lessons')close();});
window.addEventListener('hsk-account-ready',()=>{selected=location.hash.startsWith('#lesson/')?fromHash():null;cardIndex=0;revealed=false;if(!panel.hidden)render();});
window.addEventListener('storage',e=>{if([KEY,'hsk-flashcards-progress-v1'].includes(e.key)&&!panel.hidden)render();});
window.addEventListener('hsk-lessons-ready',()=>{if(location.hash.startsWith('#lesson/'))api().show();if(!panel.hidden){status.textContent='';render();}});
})();
