/* Two optional review games. Never writes mastered-word or SRS scores. */
(function(){
'use strict';
const C=window.HSKPracticeGamesCore;
const $=id=>document.getElementById(id);
const rounds={};
const state={match:null,sentence:null},kinds={match:'matchGamePanel',sentence:'sentenceGamePanel'};
function node(tag,cls,text){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(text!==undefined)n.textContent=text;
 return n;
}
function button(text,fn,cls){
 const n=node('button',cls,text);n.type='button';n.onclick=fn;return n;
}
function selectedLevel(){
 const active=document.querySelector('.filter-btn[data-filter].active')?.dataset.filter;
 if(active==='all')return 'all';
 if(active&&/^[1-6]$/.test(active))return active;
 const goal=window.HSKPlanner?.plan?.target;
 return goal>=1&&goal<=6?String(goal):'3';
}
function source(){
 try{return typeof words!=='undefined'?words:[];}catch{return [];}
}
function heading(type,round,draw){
 const box=node('div','pg-controls'),back=button('← Luyện & Ôn',()=>window.HSKStudio?.navigate('practice'),'pg-back');
 const labels=node('div','pg-config');
 const levelLabel=node('label','pg-select-label','Cấp HSK');
 const level=node('select','pg-select');
 for(const [value,title] of [['all','Tất cả HSK'],...[1,2,3,4,5,6].map(n=>[String(n),'HSK '+n])]){
  const option=node('option',null,title);option.value=value;level.append(option);
 }
 level.value=String(round.level);level.onchange=()=>{
  const current=state[type];const n=type==='match'?current.count:current.count;
  create(type,level.value,n);
 };
 levelLabel.append(level);
 const countLabel=node('label','pg-select-label','Số '+(type==='match'?'bộ từ':'câu'));
 const count=node('select','pg-select');
 for(const n of [5,10,15]){const option=node('option',null,String(n));option.value=String(n);count.append(option);}
 count.value=String(round.count);count.onchange=()=>create(type,level.value,Number(count.value));
 countLabel.append(count);
 labels.append(levelLabel,countLabel,button('↻ Lượt mới',()=>create(type,level.value,Number(count.value)),'pg-restart'));
 box.append(back,labels);return box;
}
function status(text,role='status'){
 const p=node('p','pg-message',text);p.setAttribute('role',role);p.setAttribute('aria-live','polite');return p;
}
function create(type,level=selectedLevel(),count=10){
 const normalized=/^[1-6]$/.test(String(level))?String(level):'all';
 const n=[5,10,15].includes(Number(count))?Number(count):10;
 if(type==='match'){
  const items=C.triples(source(),normalized,n);state.match={level:normalized,count:n,items,orders:Object.fromEntries(['han','pin','mean'].map(k=>[k,C.shuffled(items)])),picked:{han:null,pin:null,mean:null},solved:new Set(),attempts:0,hidden:{han:false,pin:false,mean:false},message:'Chọn một ô ở mỗi cột, sau đó bấm Xác nhận.'};
 }else{
  state.sentence={level:normalized,count:n,qs:C.sentences(source(),normalized,n),position:0,picks:[],answered:false,correct:0,hidden:{pin:false,vi:false},message:''};
 }
 draw(type);
}
function draw(type){
 const round=state[type],panel=$(kinds[type]);if(!round||!panel)return;
 const content=panel.querySelector('.pg-content');
 content.replaceChildren(heading(type,round,()=>draw(type)));
 if(type==='match')drawMatch(round,content);else drawSentence(round,content);
}
function drawMatch(s,content){
 const size=s.items.length,done=s.solved.size;
 const info=node('div','pg-summary');
 info.append(node('strong',null,'Đối chiếu Hán tự · Pinyin · Nghĩa'));
 info.append(node('span',null,done+' / '+size+' bộ đã đúng'));
 content.append(info);
 if(size<2){
  content.append(status('Chưa đủ từ có Hán tự, pinyin và nghĩa phân biệt trong cấp này. Hãy đổi HSK hoặc chọn Tất cả HSK.'));
  return;
 }
 const tools=node('div','pg-visibility');
 for(const key of ['han','pin','mean']){
  const label={han:'Hán',pin:'Pinyin',mean:'Nghĩa'}[key];
  const b=button((s.hidden[key]?'Hiện ':'Ẩn ')+label,()=>{s.hidden[key]=!s.hidden[key];draw('match');},'pg-toggle'+(s.hidden[key]?' is-on':''));
  b.setAttribute('aria-pressed',String(s.hidden[key]));tools.append(b);
 }
 content.append(tools);
 const header=node('div','pg-grid-head');
 for(const name of ['Hán tự','Pinyin','Nghĩa tiếng Việt'])header.append(node('span',null,name));
 content.append(header);
 const grid=node('div','pg-match-grid');
 for(const key of ['han','pin','mean']){
  const column=node('div','pg-match-column');column.dataset.column=key;
  const order=s.orders[key];
  // Rows are shuffled independently per column; answers are not presented by row.
  for(const item of order){
   const solved=s.solved.has(item.id),picked=s.picked[key]===item.id;
   const tile=button(s.hidden[key]&&!picked&&!solved?'•••':item[key],()=>{
    if(solved)return;
    s.picked[key]=picked?null:item.id;
    s.message='Đã chọn '+Object.values(s.picked).filter(v=>v!==null).length+'/3 cột.';
    draw('match');
   },'pg-match-tile'+(solved?' is-solved':'')+(picked?' is-picked':''));
   tile.dataset.matchId=String(item.id);tile.dataset.role=key;tile.disabled=solved;
   tile.setAttribute('aria-pressed',String(picked));
   tile.setAttribute('aria-label',s.hidden[key]&&!picked&&!solved?'Ô '+key+' số '+(order.indexOf(item)+1):item[key]);
   column.append(tile);
  }
  grid.append(column);
 }
 content.append(grid);
 const actions=node('div','pg-actions');
 const check=button('Xác nhận',()=>{
  const ids=['han','pin','mean'].map(k=>s.picked[k]);if(ids.some(x=>x===null))return;
  if(C.gradeTriplet(s.items,ids)){
   s.solved.add(ids[0]);s.message='✓ Chính xác! '+s.solved.size+'/'+size+' bộ từ.';
  }else{s.attempts++;s.message='Chưa đúng. Hãy đối chiếu lại ba cột và thử tiếp.';}
  s.picked={han:null,pin:null,mean:null};draw('match');
 },'pg-primary');
 check.disabled=Object.values(s.picked).some(x=>x===null)||done===size;actions.append(check);
 if(done===size)actions.append(button('Luyện lượt khác',()=>create('match',s.level,s.count),'pg-restart'));
 content.append(actions,status(done===size?'Hoàn thành '+size+'/'+size+' bộ từ. Lỗi thử: '+s.attempts+'. Kết quả này không tự đổi điểm SRS.':s.message));
}
function drawSentence(s,content){
 const total=s.qs.length;
 const top=node('div','pg-summary');top.append(node('strong',null,'Sắp xếp câu từ các ô chữ'),node('span',null,s.position<total?'Câu '+(s.position+1)+' / '+total:'Hoàn thành'));
 content.append(top);
 if(!total){content.append(status('Chưa đủ câu ví dụ đã đối chiếu cho HSK này. Hãy chọn cấp khác hoặc Tất cả HSK.'));return;}
 if(s.position>=total){
  const end=node('section','pg-finish');end.append(node('strong',null,'Hoàn thành lượt luyện'),node('p',null,'Đúng '+s.correct+' / '+total+' câu. Đây là điểm của lượt tập, không tự thay đổi SRS.'));
  end.append(button('Làm lượt mới',()=>create('sentence',s.level,s.count),'pg-primary'));content.append(end);return;
 }
 const q=s.qs[s.position];
 const helper=node('div','pg-visibility');
 for(const key of ['pin','vi']){
  const b=button((s.hidden[key]?'Hiện ':'Ẩn ')+(key==='pin'?'pinyin':'nghĩa Việt'),()=>{s.hidden[key]=!s.hidden[key];draw('sentence');},'pg-toggle'+(s.hidden[key]?' is-on':''));
  b.setAttribute('aria-pressed',String(s.hidden[key]));helper.append(b);
 }
 content.append(helper);
 const prompt=node('section','pg-sentence-prompt');
 const audio=window.HSKSpeech?.button(q.cn,'Nghe câu tiếng Trung',true);
 if(audio)prompt.append(audio);
 if(!s.hidden.pin)prompt.append(node('p','pg-pinyin',q.pin));
 if(!s.hidden.vi)prompt.append(node('p','pg-translation',q.vi));
 if(s.hidden.pin&&s.hidden.vi)prompt.append(node('p','pg-help','Nghe câu hoặc hiện gợi ý để luyện.'));
 content.append(prompt);
 const slot=node('div','pg-answer-zone'+(s.answered?' is-complete':''));slot.setAttribute('aria-label','Câu tiếng Trung đang ghép');
 if(!s.picks.length)slot.append(node('span','pg-empty','Chọn các ô bên dưới để ghép câu…'));
 for(let j=0;j<s.picks.length;j++){
  const index=s.picks[j],tile=button(q.tokens[index],()=>{if(s.answered)return;s.picks.splice(j,1);draw('sentence');},'pg-token is-chosen');
  tile.dataset.token=String(index);tile.disabled=s.answered;tile.title='Chạm để đưa ô này về danh sách';slot.append(tile);
 }
 content.append(slot);
 const pool=node('div','pg-token-pool');pool.setAttribute('aria-label','Từ cho sẵn');
 const order=s.order||(s.order=C.shuffled(q.tokens.map((_,i)=>i)));
 for(const i of order)if(!s.picks.includes(i)){
  const tile=button(q.tokens[i],()=>{if(s.answered)return;s.picks.push(i);draw('sentence');},'pg-token');
  tile.dataset.token=String(i);pool.append(tile);
 }
 content.append(pool);
 const actions=node('div','pg-actions');
 if(!s.answered){
  const clear=button('Làm lại câu',()=>{s.picks=[];s.message='';draw('sentence');},'pg-restart');clear.disabled=s.picks.length===0;
  const confirm=button('Xác nhận',()=>{
   const correct=C.gradeSentence(q,s.picks);s.answered=true;if(correct)s.correct++;
   s.message=correct?'✓ Chính xác! Câu đã ghép khớp mẫu.':'Chưa đúng với câu mẫu. Đáp án: '+q.cn;
   draw('sentence');
  },'pg-primary');
  confirm.disabled=s.picks.length!==q.tokens.length;actions.append(clear,confirm);
 }else actions.append(button(s.position===total-1?'Xem kết quả':'Câu tiếp theo →',()=>{
  s.position++;s.picks=[];s.order=null;s.answered=false;s.message='';draw('sentence');
 },'pg-primary'));
 content.append(actions,status(s.message||'Chọn từng từ để ghép thành câu hoàn chỉnh. Chạm ô đã chọn để hoàn tác.'));
}
window.HSKPracticeGames={start(route){if(route==='match-game')create('match');else if(route==='sentence-game')create('sentence');},restart(type){create(type);}};
})();
