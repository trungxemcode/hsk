(()=>{'use strict';
let dispose=()=>{};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
function presentation(lesson,words,store){
 const frames=window.HSKGuidedCore.presentation(lesson,words,w=>window.HSKLessons.examples(w));
 let pos=0,playing=true,closed=false,timer,watchdog,epoch=0,wake=null,ownedFullscreen=false;
 const priorFocus=document.activeElement,saved=store.read().guidedShow;
 if(saved?.version===1){const found=frames.findIndex(f=>f.id===saved.frameId);if(found>=0)pos=found;}
 const dialog=el('dialog',undefined,'guided-presentation'),head=el('header'),label=el('p'),progress=el('progress'),stage=el('div',undefined,'guided-slide'),caption=el('p',undefined,'guided-slide-label'),text=el('p',undefined,'guided-slide-text'),pin=el('p',undefined,'guided-slide-pin'),status=el('p',undefined,'guided-slide-status'),foot=el('footer'),actions=el('div',undefined,'guided-slide-actions');
 dialog.setAttribute('aria-label','Trình chiếu học tự động');stage.setAttribute('aria-live','off');status.setAttribute('role','status');progress.max=frames.length||1;progress.setAttribute('aria-label','Tiến độ trình chiếu');
 const pause=button('Tạm dừng',()=>{if(pos>=frames.length){pos=0;playing=true;render();return;}playing=!playing;stop();update();if(playing)run();});
 const previous=button('← Trước',()=>move(-1)),next=button('Tiếp →',()=>move(1)),exit=button('Thoát',()=>{close();store.exit();}),manual=button('Học từng chặng',()=>close());
 const sound=el('input'),soundLabel=el('label','Âm thanh ');sound.type='checkbox';sound.checked=true;soundLabel.append(sound);sound.onchange=()=>{stop();if(playing)run();};
 const speed=el('select');speed.setAttribute('aria-label','Tốc độ trình chiếu');for(const [value,name] of [[.75,'Chậm'],[1,'Vừa'],[1.5,'Nhanh']]){const o=el('option',name);o.value=value;speed.append(o);}speed.value='1';speed.onchange=()=>{stop();if(playing)run();};
 head.append(label,exit);stage.append(caption,text,pin);actions.append(previous,pause,next);foot.append(status,actions,soundLabel,speed,manual);dialog.append(head,progress,stage,foot);document.body.append(dialog);document.body.classList.add('guided-presenting');dialog.showModal();
 function save(){if(!closed)store.persist({guidedShow:{version:1,frameId:frames[pos]?.id||'done',updatedAt:Date.now()}});}
 function releaseWake(){const old=wake;wake=null;old?.release().catch(()=>{});}
 function keepAwake(){if(!playing||closed||document.hidden||!navigator.wakeLock||wake)return;const id=epoch;navigator.wakeLock.request('screen').then(lock=>{if(closed||!playing||id!==epoch)lock.release().catch(()=>{});else wake=lock;}).catch(()=>{});}
 function stop(){epoch++;clearTimeout(timer);clearTimeout(watchdog);player?.stop();releaseWake();}
 function update(){pause.textContent=pos>=frames.length?'Học lại':playing?'Tạm dừng':'Tiếp tục';pause.setAttribute('aria-pressed',String(playing));previous.disabled=pos===0;next.disabled=pos>=frames.length;}
 function schedule(ms){const id=epoch;clearTimeout(timer);timer=setTimeout(()=>{if(!closed&&playing&&id===epoch)move(1);},ms);}
 const player=window.HSKSpeech?.createPlayer({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,notify:message=>{
  if(closed||!playing)return;
  if(message==='Đã nghe xong.'){clearTimeout(watchdog);status.textContent='';schedule(900/Number(speed.value));}
  else if(message==='Đang phát âm tiếng Trung…')status.textContent='Đang đọc…';
  else{playing=false;stop();status.title=message;status.textContent=message.includes('Chưa tìm thấy')?'Chưa có giọng Mandarin. Thêm giọng vào thiết bị, rồi bấm Tiếp tục.':'Chưa phát được âm thanh. Bấm Tiếp tục để thử lại hoặc tắt Âm thanh.';update();}
 }});
 function run(){
  if(closed||!playing||pos>=frames.length)return;keepAwake();const f=frames[pos];status.textContent='';
  if(sound.checked&&f.speak){
   if(!player){playing=false;status.textContent='Thiết bị chưa hỗ trợ giọng đọc. Tắt Âm thanh để xem tự động.';update();return;}
   const id=epoch;watchdog=setTimeout(()=>{if(!closed&&playing&&id===epoch){playing=false;stop();status.textContent='Giọng đọc chưa kết thúc. Bấm Tiếp tục để thử lại.';update();}},Math.min(90000,10000+f.speak.length*900));player.play(f.speak);
  }else schedule(window.HSKGuidedCore.slideDuration(f,Number(speed.value)));
 }
 function fit(){
  if(closed)return;dialog.style.setProperty('--slide-scale','1');
  for(let scale=.95;scale>=.6&&(stage.scrollHeight>stage.clientHeight+1||stage.scrollWidth>stage.clientWidth+1);scale-=.05)dialog.style.setProperty('--slide-scale',String(scale));
 }
 function render(){
  stop();save();progress.value=Math.min(pos,frames.length);label.textContent=`${Math.min(pos+1,frames.length)}/${frames.length} · Học tự động`;
  if(pos>=frames.length){playing=false;caption.textContent='Đã xem hết bài';text.textContent='Sẵn sàng ôn lại?';pin.textContent='Nghe và xem không tự tính là đã thuộc từ.';status.replaceChildren(button('Làm ôn ngắn',()=>{close();store.practice();}));}
  else{const f=frames[pos];stage.dataset.slideKind=f.kind;stage.dataset.frameId=f.id;caption.textContent=f.label;text.textContent=f.text;pin.textContent=f.pin||'';status.textContent='';}
  update();fit();if(playing)run();
 }
 function move(delta){if(closed)return;pos=Math.max(0,Math.min(frames.length,pos+delta));render();}
 function close(){if(closed)return;save();closed=true;playing=false;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);window.removeEventListener('pagehide',close);window.removeEventListener('hsk-account-ready',close);dialog.removeEventListener('cancel',cancel);dialog.close();dialog.remove();document.body.classList.remove('guided-presenting');if(ownedFullscreen&&document.fullscreenElement===document.documentElement)document.exitFullscreen?.().catch(()=>{});if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true});}
 function visibility(){if(document.hidden){playing=false;stop();status.textContent='Đã tạm dừng khi rời màn hình.';update();}}
 function cancel(event){event.preventDefault();close();}
 const observer=new ResizeObserver(fit);observer.observe(stage);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);window.addEventListener('pagehide',close);window.addEventListener('hsk-account-ready',close);dialog.addEventListener('cancel',cancel);
 // CSS fills the viewport on iPhone; supported browsers can also hide browser chrome.
 if(!document.fullscreenElement&&document.documentElement.requestFullscreen)try{const request=document.documentElement.requestFullscreen();request?.then(()=>{if(closed)document.exitFullscreen?.().catch(()=>{});else{ownedFullscreen=true;fit();}}).catch(()=>{});}catch{}
 window.HSKSpeech?.stop();render();pause.focus({preventScroll:true});return close;
}
function mount(host,lesson,words,store){
 dispose();const steps=window.HSKGuidedCore.plan(lesson,words);let startedAt=0,index=0,running=false,timer=null,dead=false,answered=false,audio=false,speed=1,retry=null,retries=new Set(),closeShow=()=>{};
 const saved=store.read().guided;if(saved?.version===1&&saved.stepId){const found=steps.findIndex((s,i)=>key(s,i)===saved.stepId);if(found>=0)index=found;}
 function key(s,i){return s.kind+':'+(s.word?.han||s.question?.id||i);}
 const box=el('section',undefined,'lesson-guided'),body=el('div',undefined,'guided-body'),meter=el('p',undefined,'hint'),bar=el('progress'),feedback=el('p'),controls=el('div',undefined,'guided-controls'),settings=el('details'),notice=el('p',undefined,'hint');box.setAttribute('aria-label','Học tự động theo bài');feedback.setAttribute('role','status');notice.setAttribute('role','status');bar.max=steps.length;bar.setAttribute('aria-label','Tiến độ học tự động');
 const player=window.HSKSpeech?.createPlayer({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,notify:message=>{if(dead||!box.isConnected)return;if(message==='Đã nghe xong.')schedule(Math.max(2000,window.HSKGuidedCore.duration(steps[index],speed)-(Date.now()-startedAt)));else if(message!=='Đang phát âm tiếng Trung…'){notice.textContent=message;running=false;update();}}});
 function live(){return !dead&&box.isConnected&&!document.getElementById('lessonsPanel').hidden;}
 function clear(){clearTimeout(timer);timer=null;player?.stop();}
 function persist(){if(live())store.persist({guided:{version:1,stepId:index<steps.length?key(steps[index],index):'done',updatedAt:Date.now()}});}
 const play=button('Bắt đầu tự chạy',()=>{if(index>=steps.length)return;running=!running;clear();update();if(running)run();}),back=button('← Trước',()=>{if(index>0){index--;retry=null;draw();}}),next=button('Tiếp →',()=>advance()),exit=button('Về bài học',()=>{dispose();store.exit();});
 function update(){play.textContent=running?'Tạm dừng':'Tiếp tục tự chạy';play.setAttribute('aria-pressed',String(running));back.disabled=index===0;next.disabled=index>=steps.length||(['check','recall'].includes(steps[index]?.kind)&&!answered);next.textContent=retry?'Ôn lại điểm vừa sai →':'Tiếp →';}
 function schedule(ms){clearTimeout(timer);if(running&&live())timer=setTimeout(()=>{if(running&&live())advance();},ms);}
 function run(){if(!live()||!running||index>=steps.length)return;const s=steps[index];startedAt=Date.now();if(['check','recall'].includes(s.kind)){update();return;}const text=s.words?.map(w=>w.han)||s.lines?.map(x=>x.cn)||s.grammar?.examples?.map(x=>x.cn);if(audio&&text?.length&&player){player.play(text);return;}schedule(window.HSKGuidedCore.duration(s,speed));}
 function advance(){if(!live()||next.disabled)return;clear();if(retry){const review=retry;retry=null;body.replaceChildren(el('h3','Cùng xem lại'),el('p',review));feedback.textContent='Đọc lại điểm này rồi bấm Tiếp để tiếp tục.';running=false;update();return;}index++;draw();}
 function lines(xs){for(const x of xs||[]){const row=el('div',undefined,'guided-line');row.append(el('p',(x.speaker?x.speaker+': ':'')+x.cn,'lesson-cn'),el('p',x.pin,'lesson-pinyin'),el('p',x.vi));body.append(row);}}
 function draw(){clear();persist();answered=false;body.replaceChildren();feedback.textContent='';notice.textContent='';bar.value=Math.min(index,steps.length);meter.textContent=`Chặng ${Math.min(index+1,steps.length)}/${steps.length} · ${lesson.vi}`;
  if(index>=steps.length){running=false;body.append(el('h3','Đã đi hết nội dung hướng dẫn'),el('p','Làm ôn ngắn để kiểm tra lại. Tự chạy không đồng nghĩa đã thuộc từ hay hoàn thành SRS.'),button('Đánh dấu đã học qua',()=>{store.readComplete();notice.textContent='Đã ghi nhận học qua. Kiểm tra từ và SRS vẫn theo tiêu chí hiện có.';}),button('Làm ôn ngắn của bài',()=>{dispose();store.practice();}),button('Học lại từ đầu',()=>{index=0;retries.clear();draw();}));update();return;}
  const s=steps[index];body.dataset.guidedKind=s.kind;body.append(el('h3',s.title));
  if(s.kind==='words')for(const w of s.words){const row=el('article',undefined,'guided-word');row.append(el('strong',w.han,'lesson-han'),el('p',w.pin,'lesson-pinyin'),el('p',w.mean.split(/[;；]/)[0]));if(w.mean.includes(';')||w.mean.includes('；')){const detail=el('details');detail.append(el('summary','Nghĩa khác'),el('p',w.mean));row.append(detail);}const example=window.HSKLessons.examples(w)[0];if(example){const detail=el('details');detail.append(el('summary','Ví dụ'),el('p',example.cn),el('p',example.vi));row.append(detail);}body.append(row);}
  else if(s.kind==='grammar'){const g=s.grammar;body.append(el('p',g.pattern,'lesson-pattern'),el('p',g.usage));lines(g.examples);body.append(el('p',g.error,'lesson-error-note'));}
  else if(s.lines&&!['check','recall'].includes(s.kind))lines(s.lines);
  else {const q=s.question||s;body.append(el('p',s.word?`${s.word.han} (${s.word.pin}) có nghĩa là gì?`:q.prompt));if(s.lines?.length){const source=el('details');source.append(el('summary','Đọc đoạn liên quan'));for(const x of s.lines)source.append(el('p',x.cn),el('p',x.vi));body.append(source);}
   const opts=el('div',undefined,'guided-options'),indices=q.options.map((_,i)=>i).sort(()=>Math.random()-.5);for(const i of indices){const b=button(q.options[i],()=>{if(answered||!live())return;answered=true;const correct=i===q.answer;for(const node of opts.children)node.disabled=true;b.classList.add(correct?'correct':'wrong');const explanation=s.word?`${s.word.han}: ${s.word.mean}.`:q.explanation;feedback.textContent=(correct?'✓ Đúng. ':'Chưa đúng. Đáp án: '+q.options[q.answer]+'. ')+explanation;
    if(s.kind==='check')store.answer(q,correct);if(!correct&&!retries.has(key(s,index))){retries.add(key(s,index));retry=explanation;}update();});b.dataset.guidedAnswer=String(i);opts.append(b);}body.append(opts);
  }update();controls.scrollIntoView?.({block:'nearest',behavior:'auto'});if(running)run();
 }
 settings.append(el('summary','Tốc độ & giọng đọc'));const speedLabel=el('label','Tốc độ chuyển: '),select=el('select');select.setAttribute('aria-label','Tốc độ học tự động');for(const [value,label] of [[.75,'Chậm'],[1,'Vừa'],[1.5,'Nhanh']]){const o=el('option',label);o.value=value;select.append(o);}select.value='1';select.onchange=()=>{speed=Number(select.value);clear();if(running)run();};speedLabel.append(select);const audioLabel=el('label'),check=el('input');check.type='checkbox';check.onchange=()=>{audio=check.checked;clear();if(running)run();};audioLabel.append(check,document.createTextNode('Tự đọc tiếng Trung'));settings.append(speedLabel,audioLabel);controls.append(back,play,next);box.append(meter,bar,controls,body,feedback,notice,settings,exit);host.append(box);
 box.addEventListener('toggle',e=>{if(e.target.open&&running){running=false;clear();update();notice.textContent='Đã tạm dừng để bạn xem chi tiết.';}},true);
 const visibility=()=>{if(document.hidden){running=false;clear();update();}},onLeave=()=>{running=false;clear();update();};document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',onLeave);window.addEventListener('hsk-account-ready',onLeave);
 const openShow=()=>{running=false;clear();closeShow();closeShow=presentation(lesson,words,store);};box.prepend(button('Trình chiếu rảnh tay',openShow));
 dispose=()=>{closeShow();dead=true;clear();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',onLeave);window.removeEventListener('hsk-account-ready',onLeave);};draw();openShow();
}
window.HSKLessonGuided={mount,stop:()=>dispose()};
})();
