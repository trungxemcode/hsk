(()=>{'use strict';
let dispose=()=>{};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
function presentation(lesson,words,store){
 const examplesFn=w=>window.HSKLessons.examples(w);
 let frames=window.HSKGuidedCore.presentation(lesson,words,examplesFn);
 let pos=0,playing=true,closed=false,timer,watchdog,karaokeTimer,repeatTimer,prefetchTimer,writer=null,epoch=0,wake=null,ownedFullscreen=false,spokenStarted=0,audioDone=false,strokesDone=false,activePacing=null,aiEstimate=null,aiPending=null;
 let vietnameseVoice='';try{vietnameseVoice=localStorage.getItem('hsk-guided-vi-voice')||'';}catch{}
 const AI_TIME_CACHE_KEY='hsk-guided-ai-time-v1';
 const lessonKey=String(lesson?.id||lesson?.vi||lesson?.title||'guided-lesson');
 const readAiCache=()=>{try{const raw=JSON.parse(localStorage.getItem(AI_TIME_CACHE_KEY)||'{}');return raw&&typeof raw==='object'?raw:{};}catch{return {};}};
 const writeAiCache=(key,entry)=>{try{const map=readAiCache();map[key]={...entry,updatedAt:Date.now()};const keys=Object.keys(map);if(keys.length>40){keys.sort((a,b)=>(map[a]?.updatedAt||0)-(map[b]?.updatedAt||0));for(const old of keys.slice(0,keys.length-40))delete map[old];}localStorage.setItem(AI_TIME_CACHE_KEY,JSON.stringify(map));}catch{}};
 {const cached=readAiCache()[lessonKey];if(cached&&Number.isFinite(Number(cached.recommendedMinutes)))aiEstimate=cached;}
 const modelTimes=new Map(),strokeData=new Map();
 const priorFocus=document.activeElement,saved=store.read().guidedShow;
 if(saved?.version===6){const found=frames.findIndex(f=>f.id===saved.frameId);if(found>=0)pos=found;}
 const dialog=el('dialog',undefined,'guided-presentation'),head=el('header'),label=el('p'),progress=el('progress'),stage=el('div',undefined,'guided-slide'),caption=el('p',undefined,'guided-slide-label'),text=el('p',undefined,'guided-slide-text'),pin=el('p',undefined,'guided-slide-pin'),status=el('p',undefined,'guided-slide-status'),foot=el('footer'),actions=el('div',undefined,'guided-slide-actions');
 dialog.setAttribute('aria-label','Trình chiếu học tự động');stage.setAttribute('aria-live','off');status.setAttribute('role','status');progress.max=frames.length||1;progress.setAttribute('aria-label','Tiến độ trình chiếu');
 function unlockAudio(){window.HSKVoiceManager?.unlock?.();try{if(window.speechSynthesis?.paused)window.speechSynthesis.resume();}catch{}}
 const getZhRate=()=>activePacing?activePacing.speechRate:.8*Number(speed.value);
 const getViRate=()=>activePacing?activePacing.viRate:1;
 const getStrokeSpeed=()=>activePacing?activePacing.strokeSpeed:.6*Number(speed.value);
 const getStrokeDelay=()=>activePacing?activePacing.strokeDelayMs:180/Number(speed.value);
 const getTransitionPause=()=>activePacing?Math.round(window.HSKGuidedCore.transitionPause()*activePacing.pauseScale):window.HSKGuidedCore.transitionPause()/Number(speed.value);
 const getPronunciationGap=()=>activePacing?Math.round(window.HSKGuidedCore.pronunciationGap()*activePacing.pauseScale):window.HSKGuidedCore.pronunciationGap()/Number(speed.value);
 const getPracticeLead=()=>activePacing?Math.round(window.HSKGuidedCore.practiceLead()*activePacing.pauseScale):window.HSKGuidedCore.practiceLead();
 const getKaraokeDuration=(f,modelMs)=>activePacing?Math.max(2200,Math.round(window.HSKGuidedCore.karaokeDuration(f,activePacing.speedValue,modelMs)*activePacing.karaokeScale)):window.HSKGuidedCore.karaokeDuration(f,Number(speed.value),modelMs);
 const getSlideDuration=f=>activePacing?Math.max(1200,Math.round(window.HSKGuidedCore.slideDuration(f,activePacing.speedValue))):window.HSKGuidedCore.slideDuration(f,Number(speed.value));
 const pause=button('Tạm dừng',()=>{unlockAudio();if(pos>=frames.length){pos=0;playing=true;render();return;}playing=!playing;stop();update();if(playing)run();});
 const previous=button('← Trước',()=>{unlockAudio();move(-1);}),next=button('Tiếp →',()=>{unlockAudio();move(1);}),exit=button('Thoát',()=>{close();store.exit();}),manual=button('Học từng chặng',()=>close());
 const sound=el('input'),soundLabel=el('label','Âm thanh ');sound.type='checkbox';sound.checked=true;soundLabel.append(sound);sound.onchange=()=>{unlockAudio();stop();if(playing)run();};
 const speed=el('select');speed.setAttribute('aria-label','Tốc độ trình chiếu');for(const [value,name] of [[.65,'Rất chậm'],[.75,'Chậm'],[1,'Vừa']]){const o=el('option',name);o.value=value;speed.append(o);}speed.value='0.75';
 const strokeHost=el('div',undefined,'guided-stroke-stage');strokeHost.hidden=true;strokeHost.setAttribute('aria-label','Mẫu thứ tự nét viết');
 const voiceDialog=el('dialog',undefined,'guided-voice-dialog'),voiceSelect=el('select'),voiceNote=el('p'),voiceStatus=el('p');voiceSelect.setAttribute('aria-label','Giọng tiếng Việt');voiceDialog.setAttribute('aria-label','Chọn giọng tiếng Việt');voiceStatus.setAttribute('role','status');
 const previewPlayer=window.HSKSpeech?.createPlayer({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,voiceURI:()=>vietnameseVoice,rate:1,notify:m=>voiceStatus.textContent=m});
 function refreshVoices(){const voices=(window.speechSynthesis?.getVoices()||[]).filter(v=>/^vi(?:-|_|$)/i.test(v.lang));voiceSelect.replaceChildren();const auto=el('option','Tự động · ưu tiên giọng tự nhiên');auto.value='';voiceSelect.append(auto);for(const v of voices){const o=el('option',v.name+(v.localService?' · trên thiết bị':' · trực tuyến'));o.value=v.voiceURI;voiceSelect.append(o);}voiceSelect.value=voices.some(v=>v.voiceURI===vietnameseVoice)?vietnameseVoice:'';voiceNote.textContent=voices.length>1?'Nghe thử và chọn giọng bạn thích. Giọng trực tuyến cần có mạng.':voices.length===1?'Thiết bị hiện chỉ có một giọng Việt. Có thể thêm giọng Vietnamese chất lượng cao trong cài đặt thiết bị.':'Chưa có giọng Việt. Thêm giọng Vietnamese trong cài đặt thiết bị.';}
 voiceSelect.onchange=()=>{previewPlayer?.stop();vietnameseVoice=voiceSelect.value;try{localStorage.setItem('hsk-guided-vi-voice',vietnameseVoice);}catch{}voiceStatus.textContent='Đã chọn giọng. Bấm Nghe thử để kiểm tra.';};
 const voiceSettings=button('Giọng Việt',()=>{playing=false;stop();update();refreshVoices();voiceStatus.textContent='';voiceDialog.showModal();});
 const closeVoice=()=>{previewPlayer?.stop();voiceDialog.close();voiceSettings.focus();};
 voiceDialog.append(el('h2','Giọng tiếng Việt'),voiceSelect,voiceNote,voiceStatus,button('Nghe thử',()=>previewPlayer?.play('Xin chào, chúng ta cùng học tiếng Trung nhé.',undefined,'vi-VN')),button('Xong',closeVoice));voiceDialog.addEventListener('cancel',e=>{e.preventDefault();closeVoice();});
 window.speechSynthesis?.addEventListener?.('voiceschanged',refreshVoices);

 // Target study duration modal with AI-estimated reference & color-graded slider.
 const timeDialog=el('dialog',undefined,'guided-time-dialog');timeDialog.setAttribute('aria-label','Đặt thời gian học toàn bài');
 const timeHead=el('div',undefined,'guided-time-head'),timeTitle=el('h2','Thời gian học toàn bài'),timeMetricsEl=el('p',undefined,'guided-time-metrics');
 timeHead.append(timeTitle,timeMetricsEl);
 const aiBox=el('div',undefined,'guided-time-ai'),aiTop=el('div',undefined,'guided-time-ai-top'),aiHeadline=el('strong',undefined,'guided-time-ai-title'),aiReason=el('p',undefined,'guided-time-ai-reason'),aiStatus=el('p',undefined,'guided-time-ai-status');
 aiStatus.setAttribute('role','status');
 const aiBtn=button('✨ AI tính thời gian ước tính',()=>requestAiEstimate());aiBtn.className='guided-time-ai-btn';
 aiTop.append(aiHeadline,aiBtn);aiBox.append(aiTop,aiReason,aiStatus);
 const sliderWrap=el('div',undefined,'guided-time-control');
 const sliderReadout=el('div',undefined,'guided-time-readout'),targetReadout=el('strong',undefined,'guided-time-value'),zoneBadge=el('span',undefined,'guided-time-badge');
 sliderReadout.append(targetReadout,zoneBadge);
 const slider=el('input',undefined,'guided-time-slider');slider.type='range';slider.step='1';slider.setAttribute('aria-label','Thời gian học mục tiêu (phút)');
 const sliderTicks=el('div',undefined,'guided-time-ticks'),tickMin=el('span'),tickRef=el('span'),tickMax=el('span');
 sliderTicks.append(tickMin,tickRef,tickMax);
 const zoneNote=el('p',undefined,'guided-time-zone-note');
 sliderWrap.append(sliderReadout,slider,sliderTicks,zoneNote);
 const planBox=el('div',undefined,'guided-time-plan'),planTitle=el('p','Tự động cân chỉnh toàn bài:','guided-time-plan-title'),planGrid=el('div',undefined,'guided-time-grid'),planFooter=el('p',undefined,'guided-time-plan-foot');
 planBox.append(planTitle,planGrid,planFooter);
 const timeActions=el('div',undefined,'guided-time-actions');
 const applyTimeBtn=button('Áp dụng',()=>applySelectedTime());applyTimeBtn.className='guided-time-apply primary';
 const resetTimeBtn=button('Mặc định',()=>resetToDefaultPacing());resetTimeBtn.className='guided-time-reset';
 const closeTimeBtn=button('Đóng',()=>closeTimeDialog());closeTimeBtn.className='guided-time-close';
 timeActions.append(applyTimeBtn,resetTimeBtn,closeTimeBtn);
 timeDialog.append(timeHead,aiBox,sliderWrap,planBox,timeActions);
 let currentBaseline=null,currentPreview=null,currentGrade=null,userTouchedSlider=false;
 function syncTimeButton(){
  if(activePacing){
   timeSettings.textContent=`⏱ ${activePacing.targetMinutes}p`;
   timeSettings.dataset.timeZone=activePacing.zone||'optimal';
   timeSettings.title=`Mục tiêu học trọn bài trong ${activePacing.targetMinutes} phút`;
  }else{
   timeSettings.textContent='⏱ Thời gian';
   delete timeSettings.dataset.timeZone;
   timeSettings.title='Đặt thời gian học toàn bài bằng thanh trượt & AI ước tính';
  }
 }
 function rebuildFrames(nextPacing){
  const prevFrame=frames[pos],prevRatio=frames.length?pos/frames.length:0;
  activePacing=nextPacing;
  frames=nextPacing
   ?window.HSKGuidedCore.presentation(lesson,words,examplesFn,{wordLoops:nextPacing.wordLoops,meaningLoops:nextPacing.meaningLoops})
   :window.HSKGuidedCore.presentation(lesson,words,examplesFn);
  progress.max=frames.length||1;
  if(prevFrame){
   let mapped=frames.findIndex(f=>f.kind===prevFrame.kind&&f.text===prevFrame.text);
   if(mapped<0)mapped=Math.min(Math.max(0,frames.length-1),Math.round(prevRatio*frames.length));
   pos=frames.length?mapped:0;
  }else pos=0;
  syncTimeButton();
 }
 function refreshTimeDialog(preferredValue){
  currentBaseline=window.HSKGuidedCore.estimateLessonBaseline(lesson,words,examplesFn);
  const m=currentBaseline.metrics;
  timeMetricsEl.textContent=`${m.wordCount} từ vựng · ${m.totalLines} câu ví dụ & hội thoại · ${m.grammarCount} ngữ pháp`;
  const refMin=aiEstimate?.recommendedMinutes||currentBaseline.baselineMinutes;
  const maxMin=Math.max(currentBaseline.maxMinutes,Math.min(180,Math.round(refMin*1.5)));
  slider.min=String(currentBaseline.minMinutes);
  slider.max=String(maxMin);
  const desired=Number.isFinite(Number(preferredValue))?Number(preferredValue):Number(slider.value);
  const targetVal=Math.max(currentBaseline.minMinutes,Math.min(maxMin,desired||activePacing?.targetMinutes||refMin));
  slider.value=String(targetVal);
  if(aiEstimate){
   aiHeadline.textContent=`AI ước tính trung bình: ~${aiEstimate.recommendedMinutes} phút`;
   aiReason.textContent=aiEstimate.reasonVi||`Khuyên học trong khoảng ${aiEstimate.minSafeMinutes}–${aiEstimate.maxRelaxedMinutes} phút.`;
   aiBtn.textContent=aiPending?'Đang hỏi AI…':'✨ Tính lại bằng AI';
  }else{
   aiHeadline.textContent=`Ước lượng cơ bản: ~${currentBaseline.baselineMinutes} phút`;
   aiReason.textContent='Bấm nút bên phải để AI phân tích độ khó bài học và tính thời gian trung bình chuẩn.';
   aiBtn.textContent=aiPending?'Đang hỏi AI…':'✨ AI tính thời gian ước tính';
  }
  aiBtn.disabled=Boolean(aiPending);
  currentPreview=window.HSKGuidedCore.computePacingForTarget(lesson,words,targetVal,examplesFn);
  currentGrade=window.HSKGuidedCore.classifyTimeBudget(targetVal,refMin,aiEstimate?.minSafeMinutes,aiEstimate?.maxRelaxedMinutes);
  const span=Math.max(1,maxMin-currentBaseline.minMinutes);
  const pct=Math.max(0,Math.min(100,((targetVal-currentBaseline.minMinutes)/span)*100));
  sliderWrap.dataset.zone=currentGrade.zone;
  sliderWrap.style.setProperty('--slider-pct',pct.toFixed(1)+'%');
  targetReadout.textContent=`${targetVal} phút`;
  zoneBadge.textContent=currentGrade.label;
  tickMin.textContent=`Nhanh nhất ${currentBaseline.minMinutes}p`;
  tickRef.textContent=`${aiEstimate?'AI chuẩn':'Chuẩn'} ~${refMin}p`;
  tickMax.textContent=`Tối đa ${maxMin}p`;
  zoneNote.textContent=`${currentGrade.detail} (Đỏ < ${currentGrade.minSafeMinutes}p · Xanh lá ${currentGrade.minSafeMinutes}–${currentGrade.maxRelaxedMinutes}p · Xanh dương > ${currentGrade.maxRelaxedMinutes}p)`;
  planGrid.replaceChildren();
  const deadTimeText=currentPreview.deadTimeCutPct>=100?'Tối giản (chạm ngưỡng)':currentPreview.deadTimeCutPct>0?`Giảm ${currentPreview.deadTimeCutPct}%`:'Tiêu chuẩn (0%)';
  const voiceText=`${currentPreview.speechRate.toFixed(2)}x (${currentPreview.voiceAccelerated?'Tăng tốc':'Giữ chuẩn'})`;
  const rows=[
   ['Lặp từ & nghĩa',`${currentPreview.wordLoops} từ · ${currentPreview.meaningLoops} nghĩa`],
   ['Thời gian chết & chờ',deadTimeText],
   ['Tốc độ giọng Trung',voiceText],
   ['Nhịp đọc theo',`${currentPreview.rhythmLabel} (${Math.round(currentPreview.karaokeScale*100)}%)`]
  ];
  for(const [k,v] of rows){
   const item=el('div',undefined,'guided-time-metric');
   item.append(el('span',k,'guided-time-metric-k'),el('strong',v,'guided-time-metric-v'));
   planGrid.append(item);
  }
  planFooter.textContent=`${currentPreview.strategyNoteVi}. Dự kiến ~${currentPreview.estimatedMinutes} phút · ${currentPreview.slideCount} thẻ (giữ đủ 100% bài).`;
  applyTimeBtn.textContent=`Áp dụng (${targetVal} phút)`;
  resetTimeBtn.disabled=!activePacing;
 }
 slider.addEventListener('input',()=>{userTouchedSlider=true;refreshTimeDialog();});
 async function loadAiEndpoint(){
  const loaded=await window.HSKAIConfig?.loadTranslationConfig?.().catch(()=>null);
  if(loaded?.endpoint)return loaded.endpoint;
  try{const res=await fetch('./translation-config.json');if(res.ok){const cfg=await res.json();if(cfg?.endpoint)return cfg.endpoint;}}catch{}
  return '';
 }
 async function requestAiEstimate(){
  if(aiPending||closed)return;
  aiStatus.textContent='';
  const user=window.HSKAccountDashboard?.user;
  if(!user){aiStatus.textContent='Hãy đăng nhập tài khoản để dùng AI tính thời gian ước tính.';return;}
  const endpoint=await loadAiEndpoint();
  if(!endpoint){aiStatus.textContent='Chưa cấu hình máy chủ AI. Bạn vẫn có thể kéo thanh thời gian theo ước lượng cơ bản.';return;}
  const controller=new AbortController();aiPending=controller;
  const activeParams=window.HSKAiProviderPicker?.getActiveAiParams?.();
  aiStatus.textContent=(activeParams?.providerInfo?.label||'AI')+' đang phân tích khối lượng & độ khó bài học…';
  refreshTimeDialog();
  const abortTimer=setTimeout(()=>controller.abort(),45000);
  try{
   const token=await user.getIdToken();
   if(closed||aiPending!==controller)return;
   const baseline=currentBaseline||window.HSKGuidedCore.estimateLessonBaseline(lesson,words,examplesFn);
   const level=Number.isInteger(Number(lesson?.hsk))&&Number(lesson.hsk)>=1&&Number(lesson.hsk)<=6?Number(lesson.hsk):1;
   const uniqueWords=[...new Map((words||[]).filter(w=>w.han&&w.mean).map(w=>[w.han,w])).values()];
   const wireLesson={
    id:lessonKey.slice(0,120),
    title:String(lesson?.vi||lesson?.title||lesson?.cn||'Bài học HSK').slice(0,140),
    words:uniqueWords.slice(0,150).map(w=>({han:String(w.han||'').slice(0,24),pin:String(w.pin||'').slice(0,48),mean:String(w.mean||'').slice(0,80)})),
    content:{
     mode:'guided-time-estimate',
     hsk:level,
     metrics:baseline.metrics,
     baselineMinutes:baseline.baselineMinutes,
     minMinutes:baseline.minMinutes,
     grammarTitles:(lesson?.content?.grammar||[]).slice(0,12).map(g=>String(g.title||g.pattern||'').slice(0,80))
    }
   };
   const question=`Ước tính thời gian học trung bình (phút) cho người Việt học trọn bài HSK ${level} này ở chế độ Học tự động (${baseline.metrics.wordCount} từ, ${baseline.metrics.totalLines} câu ví dụ/hội thoại, ${baseline.metrics.grammarCount} ngữ pháp; nhịp máy mặc định ~${baseline.baselineMinutes}p). Chỉ trả JSON thuần: {"recommendedMinutes":số_nguyên,"minSafeMinutes":số_nguyên,"maxRelaxedMinutes":số_nguyên,"reasonVi":"giải thích ngắn 1-2 câu tiếng Việt"}.`;
   const response=await fetch(endpoint.replace(/\/translate$/,'/lesson-ask'),{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({
     question,
     hsk:level,
     lesson:wireLesson,
     history:[],
     ...(activeParams?.thinking?{thinking:activeParams.thinking}:{}),
     ...(activeParams?.aiModel?{aiModel:activeParams.aiModel}:{}),
     ...(activeParams?.aiProvider?{aiProvider:activeParams.aiProvider}:{}),
     ...(activeParams?.personalProvider?{personalProvider:activeParams.personalProvider}:{})
    }),
    signal:controller.signal
   });
   const data=await response.json().catch(()=>({}));
   if(closed||aiPending!==controller)return;
   if(!response.ok)throw Error(data.error||'AI chưa tính được thời gian lúc này. Hãy thử lại.');
   const parsed=window.HSKGuidedCore.parseAiTimeEstimate(data,baseline.baselineMinutes);
   if(!parsed.parsedFromAi)throw Error('AI trả về định dạng chưa rõ số phút. Hãy bấm thử lại.');
   aiEstimate=parsed;
   writeAiCache(lessonKey,parsed);
   if(!userTouchedSlider&&!activePacing){
    const nextMax=Math.max(Number(slider.max)||0,Math.min(180,Math.round(parsed.recommendedMinutes*1.5)));
    slider.max=String(nextMax);
    slider.value=String(parsed.recommendedMinutes);
   }
   aiStatus.textContent=`Đã nhận ước tính từ AI: trung bình ~${parsed.recommendedMinutes} phút.`;
  }catch(err){
   if(!closed&&aiPending===controller){
    aiStatus.textContent=err?.name==='AbortError'?'AI phản hồi quá lâu. Hãy thử lại.':(err?.message||'Chưa gọi được AI. Hãy thử lại.');
   }
  }finally{
   clearTimeout(abortTimer);
   if(aiPending===controller){aiPending=null;if(!closed)refreshTimeDialog();}
  }
 }
 function applySelectedTime(){
  unlockAudio();
  if(!currentPreview||!currentGrade)refreshTimeDialog();
  rebuildFrames({...currentPreview,zone:currentGrade.zone,referenceMinutes:currentGrade.referenceMinutes});
  timeDialog.close();
  playing=true;
  render();
  pause.focus({preventScroll:true});
 }
 function resetToDefaultPacing(){
  unlockAudio();
  rebuildFrames(null);
  userTouchedSlider=false;
  timeDialog.close();
  playing=true;
  render();
  pause.focus({preventScroll:true});
 }
 function closeTimeDialog(){
  aiPending?.abort();aiPending=null;
  if(timeDialog.open)timeDialog.close();
  timeSettings.focus();
 }
 timeDialog.addEventListener('cancel',e=>{e.preventDefault();closeTimeDialog();});
 const timeSettings=button('⏱ Thời gian',()=>{
  playing=false;stop();update();
  userTouchedSlider=false;
  aiStatus.textContent='';
  currentBaseline=window.HSKGuidedCore.estimateLessonBaseline(lesson,words,examplesFn);
  refreshTimeDialog(activePacing?.targetMinutes||aiEstimate?.recommendedMinutes||currentBaseline.baselineMinutes);
  timeDialog.showModal();
 });
 timeSettings.className='guided-time-trigger';
 syncTimeButton();
 speed.onchange=()=>{unlockAudio();if(activePacing)rebuildFrames(null);stop();render();};

 head.append(label,exit);stage.append(caption,text,strokeHost,pin);actions.append(previous,pause,next);foot.append(status,actions,soundLabel,speed,timeSettings,button('Giọng Trung',()=>{playing=false;stop();update();window.HSKChineseVoices?.open();}),voiceSettings,manual);dialog.append(head,progress,stage,foot,voiceDialog,timeDialog);document.body.append(dialog);document.body.classList.add('guided-presenting');dialog.showModal();
 function save(){if(!closed)store.persist({guidedShow:{version:6,frameId:frames[pos]?.id||'done',updatedAt:Date.now()}});}
 function releaseWake(){const old=wake;wake=null;old?.release().catch(()=>{});}
 function keepAwake(){if(!playing||closed||document.hidden||!navigator.wakeLock||wake)return;const id=epoch;navigator.wakeLock.request('screen').then(lock=>{if(closed||!playing||id!==epoch)lock.release().catch(()=>{});else wake=lock;}).catch(()=>{});}
 function stop(){epoch++;clearTimeout(timer);clearTimeout(watchdog);clearTimeout(karaokeTimer);clearTimeout(repeatTimer);clearTimeout(prefetchTimer);writer?.pauseAnimation();writer=null;player?.stop();releaseWake();}
 function prefetchUpcoming(){
  clearTimeout(prefetchTimer);
  if(closed||!sound.checked||window.HSKVoiceManager?.selection?.source!=='pack'||typeof window.HSKVoiceManager.prefetch!=='function')return;
  const id=epoch;
  prefetchTimer=setTimeout(()=>{
   if(closed||id!==epoch||!sound.checked||window.HSKVoiceManager?.selection?.source!=='pack')return;
   const zhRate=getZhRate(),seen=new Set();
   for(let j=pos+1;j<frames.length&&seen.size<2&&j<=pos+10;j++){
    const f=frames[j];
    if(!f?.speak||f.language==='vi-VN')continue;
    if(seen.has(f.speak))continue;
    seen.add(f.speak);
    const parts=window.HSKSpeech?.chunks?window.HSKSpeech.chunks(f.speak,60):[f.speak];
    for(const part of parts)window.HSKVoiceManager.prefetch(part,zhRate);
   }
  },120);
 }
 function update(){pause.textContent=pos>=frames.length?'Học lại':playing?'Tạm dừng':'Tiếp tục';pause.setAttribute('aria-pressed',String(playing));previous.disabled=pos===0;next.disabled=pos>=frames.length;}
 function schedule(ms){const id=epoch;clearTimeout(timer);timer=setTimeout(()=>{if(!closed&&playing&&id===epoch)move(1);},ms);}
 function complete(){if(audioDone&&strokesDone)schedule(getTransitionPause());}
 const player=window.HSKSpeech?.createPlayer({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,voiceURI:()=>vietnameseVoice,rate:()=>frames[pos]?.language==='vi-VN'?getViRate():getZhRate(),gapMs:()=>getPronunciationGap(),notify:message=>{
  if(closed||!playing)return;
  if(message==='Đã nghe xong.'){
   clearTimeout(watchdog);audioDone=true;const f=frames[pos],elapsed=Date.now()-spokenStarted;if(f.kind==='chinese')modelTimes.set(f.text,elapsed);
   if(f.loopWhileStrokes&&!strokesDone){const id=epoch;status.textContent='Vừa xem nét vừa nghe lại…';repeatTimer=setTimeout(()=>{if(!closed&&playing&&id===epoch&&!strokesDone){audioDone=false;speak(f,id);}},getPronunciationGap());return;}
   status.textContent='';complete();
  }
  else if(message.startsWith('Đang phát âm'))status.textContent=frames[pos]?.language==='vi-VN'?'Đang đọc nghĩa tiếng Việt…':'Đang đọc tiếng Trung…';
  else{playing=false;stop();status.title=message;status.textContent=message.includes('Chưa tìm thấy')?(frames[pos]?.language==='vi-VN'?'Chưa có giọng tiếng Việt. Thêm giọng Vietnamese rồi bấm Tiếp tục.':'Chưa có giọng Mandarin. Thêm giọng vào thiết bị, rồi bấm Tiếp tục.'):'Chưa phát được âm thanh. Bấm Tiếp tục để thử lại hoặc tắt Âm thanh.';update();}
 }});
 function run(){
  if(closed||!playing||pos>=frames.length)return;keepAwake();const f=frames[pos];status.textContent='';
  if(f.kind==='repeat'){readAlong(f,epoch);return;}
  audioDone=!sound.checked||!f.speak;strokesDone=!f.strokes;spokenStarted=0;
  if(f.strokes){
   // Start Mandarin pronunciation synchronously inside the user gesture before async stroke loading.
   if(sound.checked&&f.speak)speak(f,epoch);
   animateStrokes(f,epoch);
   return;
  }
  speak(f,epoch);
 }
 function speak(f,id){
  if(closed||!playing||id!==epoch)return;
  if(sound.checked&&f.speak){
   if(!player){playing=false;status.textContent='Thiết bị chưa hỗ trợ giọng đọc. Tắt Âm thanh để xem tự động.';update();return;}
   const id=epoch,repetitions=Math.max(1,Math.min(3,f.repetitions||1));spokenStarted=Date.now();watchdog=setTimeout(()=>{if(!closed&&playing&&id===epoch){playing=false;stop();status.textContent='Giọng đọc chưa kết thúc. Bấm Tiếp tục để thử lại.';update();}},Math.min(240000,15000+f.speak.length*1600*repetitions+getPronunciationGap()*(repetitions-1)));player.play(Array(repetitions).fill(f.speak),undefined,f.language||'zh-CN');
  }else if(f.strokes)complete();else schedule(getSlideDuration(f));
 }
 async function animateStrokes(f,id){
  const active=()=>!closed&&playing&&id===epoch;
  if(!spokenStarted)status.textContent='Đang tải mẫu nét viết…';
  try{
   if(!window.HanziWriter||!window.HSKWritingPractice?.characterData)throw Error('no stroke engine');
   const chars=Array.from(f.text).filter(c=>/\p{Script=Han}/u.test(c));if(!chars.length)throw Error('no Han characters');
   const data=await Promise.all(chars.map(async han=>{if(!strokeData.has(han))strokeData.set(han,await window.HSKWritingPractice.characterData(han));return strokeData.get(han);}));if(!active())return;
   strokeHost.replaceChildren();strokeHost.hidden=false;text.hidden=true;fit();
   const layout=getComputedStyle(stage),availableHeight=stage.clientHeight-caption.offsetHeight-pin.offsetHeight-parseFloat(layout.paddingTop)-parseFloat(layout.paddingBottom)-2*parseFloat(layout.rowGap)-4;
   const size=Math.max(24,Math.min(200,availableHeight,(stage.clientWidth-40)/chars.length)),css=getComputedStyle(document.documentElement);
   const ink=css.getPropertyValue(document.documentElement.dataset.theme==='dark'?'--palette-dark-violet':'--palette-violet-deep').trim(),outline=css.getPropertyValue('--line-dark').trim();
   const writers=chars.map((han,i)=>{const host=el('div');strokeHost.append(host);return HanziWriter.create(host,han,{width:size,height:size,padding:8,showCharacter:false,showOutline:true,strokeColor:ink,outlineColor:outline,strokeAnimationSpeed:getStrokeSpeed(),delayBetweenStrokes:getStrokeDelay(),charDataLoader:()=>data[i]});});
   writer={pauseAnimation:()=>writers.forEach(w=>w.pauseAnimation())};fit();
   await Promise.all(writers.map(w=>w.hideCharacter({duration:0})));if(!active())return;
   for(let loop=0;loop<(f.loops||1);loop++){
    if(loop){await Promise.all(writers.map(w=>w.hideCharacter({duration:0})));if(!active())return;}
    const animations=writers.map(w=>w.animateCharacter());if(loop===0&&!spokenStarted)speak(f,id);
    await Promise.all(animations);if(!active())return;
   }
   strokesDone=true;clearTimeout(repeatTimer);complete();
  }catch{if(!active())return;writer?.pauseAnimation();writer=null;text.hidden=false;strokeHost.hidden=true;strokesDone=true;status.textContent='Chưa tải được mẫu nét. Vẫn đọc từ để tiếp tục học.';if(!spokenStarted)speak(f,id);else complete();}
 }
 function readAlong(f,id){
  const chars=Array.from(f.text).map(c=>el('span',c,'guided-karaoke-char'));text.replaceChildren(...chars);fit();status.textContent='Chuẩn bị đọc theo…';
  const lead=getPracticeLead(),duration=getKaraokeDuration(f,modelTimes.get(f.text)||0),start=Date.now()+lead;
  function tick(){
   if(closed||!playing||id!==epoch)return;const elapsed=Date.now()-start;
   if(elapsed>=0){status.textContent='Bạn đọc theo chữ đổi màu';const current=Math.min(chars.length-1,Math.floor(elapsed/duration*chars.length));chars.forEach((n,i)=>{n.classList.toggle('is-read',i<current||elapsed>=duration);n.classList.toggle('is-current',i===current&&elapsed<duration);});}
   if(elapsed>=duration){status.textContent='Đọc lại thầm một lần…';schedule(getTransitionPause());return;}
   karaokeTimer=setTimeout(tick,80);
  }tick();
 }
 function fit(){
  if(closed)return;dialog.style.setProperty('--slide-scale','1');
  for(let scale=.95;scale>=.6&&(stage.scrollHeight>stage.clientHeight+1||stage.scrollWidth>stage.clientWidth+1);scale-=.05)dialog.style.setProperty('--slide-scale',String(scale));
 }
 function render(){
  stop();save();strokeHost.hidden=true;strokeHost.replaceChildren();text.hidden=false;progress.value=Math.min(pos,frames.length);label.textContent=`${Math.min(pos+1,frames.length)}/${frames.length} · Học tự động${activePacing?` · Mục tiêu ${activePacing.targetMinutes}p`:''}`;
  if(pos>=frames.length){playing=false;caption.textContent='Đã xem hết bài';text.textContent='Sẵn sàng ôn lại?';pin.textContent='Nghe và xem không tự tính là đã thuộc từ.';status.replaceChildren(button('Làm ôn ngắn',()=>{close();store.practice();}));}
  else{const f=frames[pos];stage.dataset.slideKind=f.kind;stage.dataset.frameId=f.id;caption.textContent=f.label;text.textContent=f.kind==='pinyin'?window.HSKGuidedCore.formatPinyin(f.text):f.text;pin.textContent=window.HSKGuidedCore.formatPinyin(f.pin||'',f.speak||f.text);status.textContent='';}
  update();fit();if(playing)run();prefetchUpcoming();
 }
 function move(delta){if(closed)return;pos=Math.max(0,Math.min(frames.length,pos+delta));render();}
 function close(){if(closed)return;save();closed=true;playing=false;stop();aiPending?.abort();aiPending=null;previewPlayer?.stop();if(voiceDialog.open)voiceDialog.close();if(timeDialog.open)timeDialog.close();window.speechSynthesis?.removeEventListener?.('voiceschanged',refreshVoices);observer.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);window.removeEventListener('pagehide',close);window.removeEventListener('hsk-account-ready',close);dialog.removeEventListener('cancel',cancel);dialog.close();dialog.remove();document.body.classList.remove('guided-presenting');if(ownedFullscreen&&document.fullscreenElement===document.documentElement)document.exitFullscreen?.().catch(()=>{});if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true});}
 function visibility(){if(document.hidden){playing=false;stop();previewPlayer?.stop();status.textContent='Đã tạm dừng khi rời màn hình.';update();}}
 function cancel(event){event.preventDefault();close();}
 const observer=new ResizeObserver(fit);observer.observe(stage);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);window.addEventListener('pagehide',close);window.addEventListener('hsk-account-ready',close);dialog.addEventListener('cancel',cancel);
 // CSS fills the viewport on iPhone; supported browsers can also hide browser chrome.
 if(!document.fullscreenElement&&document.documentElement.requestFullscreen)try{const request=document.documentElement.requestFullscreen();request?.then(()=>{if(closed)document.exitFullscreen?.().catch(()=>{});else{ownedFullscreen=true;fit();}}).catch(()=>{});}catch{}
 unlockAudio();window.HSKSpeech?.stop();render();pause.focus({preventScroll:true});return close;
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
 const play=button('Bắt đầu tự chạy',()=>{if(index>=steps.length)return;window.HSKVoiceManager?.unlock?.();running=!running;clear();update();if(running)run();}),back=button('← Trước',()=>{if(index>0){index--;retry=null;draw();}}),next=button('Tiếp →',()=>advance()),exit=button('Về bài học',()=>{dispose();store.exit();});
 function update(){play.textContent=running?'Tạm dừng':'Tiếp tục tự chạy';play.setAttribute('aria-pressed',String(running));back.disabled=index===0;next.disabled=index>=steps.length||(['check','recall'].includes(steps[index]?.kind)&&!answered);next.textContent=retry?'Ôn lại điểm vừa sai →':'Tiếp →';}
 function schedule(ms){clearTimeout(timer);if(running&&live())timer=setTimeout(()=>{if(running&&live())advance();},ms);}
 function run(){if(!live()||!running||index>=steps.length)return;const s=steps[index];startedAt=Date.now();if(['check','recall'].includes(s.kind)){update();return;}const text=s.words?.map(w=>w.han)||s.lines?.map(x=>x.cn)||s.grammar?.examples?.map(x=>x.cn);if(audio&&text?.length&&player){player.play(text);return;}schedule(window.HSKGuidedCore.duration(s,speed));}
 function advance(){if(!live()||next.disabled)return;clear();if(retry){const review=retry;retry=null;body.replaceChildren(el('h3','Cùng xem lại'),el('p',review));feedback.textContent='Đọc lại điểm này rồi bấm Tiếp để tiếp tục.';running=false;update();return;}index++;draw();}
 function lines(xs){for(const [li,x] of (xs||[]).entries()){const row=el('div',undefined,'guided-line');row.append(el('p',(x.speaker?x.speaker+': ':'')+x.cn,'lesson-cn'),el('p',x.pin,'lesson-pinyin'),el('p',x.vi));if(window.HSKSpeaking)row.append(window.HSKSpeaking.button({text:x.cn,pinyin:x.pin,meaning:x.vi,compact:true,items:xs.map(it=>({text:it.cn,pinyin:it.pin,meaning:it.vi})),index:li,onOpen:()=>{running=false;clear();update();}}));body.append(row);}}
 function draw(){clear();persist();answered=false;body.replaceChildren();feedback.textContent='';notice.textContent='';bar.value=Math.min(index,steps.length);meter.textContent=`Chặng ${Math.min(index+1,steps.length)}/${steps.length} · ${lesson.vi}`;
  if(index>=steps.length){running=false;body.append(el('h3','Đã đi hết nội dung hướng dẫn'),el('p','Làm ôn ngắn để kiểm tra lại. Tự chạy không đồng nghĩa đã thuộc từ hay hoàn thành SRS.'),button('Đánh dấu đã học qua',()=>{store.readComplete();notice.textContent='Đã ghi nhận học qua. Kiểm tra từ và SRS vẫn theo tiêu chí hiện có.';}),button('Làm ôn ngắn của bài',()=>{dispose();store.practice();}),button('Học lại từ đầu',()=>{index=0;retries.clear();draw();}));update();return;}
  const s=steps[index];body.dataset.guidedKind=s.kind;body.append(el('h3',s.title));
  if(s.kind==='words')for(const [wi,w] of s.words.entries()){const row=el('article',undefined,'guided-word');row.append(el('strong',w.han,'lesson-han'),el('p',w.pin,'lesson-pinyin'),el('p',w.mean.split(/[;；]/)[0]));if(window.HSKSpeaking)row.append(window.HSKSpeaking.button({text:w.han,pinyin:w.pin,meaning:w.mean.split(/[;；]/)[0],items:s.words.map(it=>({text:it.han,pinyin:it.pin,meaning:it.mean.split(/[;；]/)[0]})),index:wi,onOpen:()=>{running=false;clear();update();}}));if(w.mean.includes(';')||w.mean.includes('；')){const detail=el('details');detail.append(el('summary','Nghĩa khác'),el('p',w.mean));row.append(detail);}const example=window.HSKLessons.examples(w)[0];if(example){const detail=el('details');detail.append(el('summary','Ví dụ'),el('p',example.cn),el('p',example.vi));row.append(detail);}body.append(row);}
  else if(s.kind==='grammar'){const g=s.grammar;body.append(el('p',g.pattern,'lesson-pattern'),el('p',g.usage));lines(g.examples);body.append(el('p',g.error,'lesson-error-note'));}
  else if(s.lines&&!['check','recall'].includes(s.kind))lines(s.lines);
  else {const q=s.question||s;body.append(el('p',s.word?`${s.word.han} (${s.word.pin}) có nghĩa là gì?`:q.prompt));if(s.lines?.length){const source=el('details');source.append(el('summary','Đọc đoạn liên quan'));for(const x of s.lines)source.append(el('p',x.cn),el('p',x.vi));body.append(source);}
   const opts=el('div',undefined,'guided-options'),indices=q.options.map((_,i)=>i).sort(()=>Math.random()-.5);for(const i of indices){const b=button(q.options[i],()=>{if(answered||!live())return;answered=true;const correct=i===q.answer;for(const node of opts.children)node.disabled=true;b.classList.add(correct?'correct':'wrong');const explanation=s.word?`${s.word.han}: ${s.word.mean}.`:q.explanation;feedback.textContent=(correct?'✓ Đúng. ':'Chưa đúng. Đáp án: '+q.options[q.answer]+'. ')+explanation;
    if(s.kind==='check')store.answer(q,correct);if(!correct&&!retries.has(key(s,index))){retries.add(key(s,index));retry=explanation;}update();});b.dataset.guidedAnswer=String(i);opts.append(b);}body.append(opts);
  }update();controls.scrollIntoView?.({block:'nearest',behavior:'auto'});if(running)run();
 }
 settings.append(el('summary','Tốc độ & giọng đọc'));const speedLabel=el('label','Tốc độ chuyển: '),select=el('select');select.setAttribute('aria-label','Tốc độ học tự động');for(const [value,label] of [[.75,'Chậm'],[1,'Vừa'],[1.5,'Nhanh']]){const o=el('option',label);o.value=value;select.append(o);}select.value='1';select.onchange=()=>{speed=Number(select.value);clear();if(running)run();};speedLabel.append(select);const audioLabel=el('label'),check=el('input');check.type='checkbox';check.onchange=()=>{audio=check.checked;if(audio)window.HSKVoiceManager?.unlock?.();clear();if(running)run();};audioLabel.append(check,document.createTextNode('Tự đọc tiếng Trung'));settings.append(speedLabel,audioLabel);controls.append(back,play,next);box.append(meter,bar,controls,body,feedback,notice,settings,exit);host.append(box);
 box.addEventListener('toggle',e=>{if(e.target.open&&running){running=false;clear();update();notice.textContent='Đã tạm dừng để bạn xem chi tiết.';}},true);
 const visibility=()=>{if(document.hidden){running=false;clear();update();}},onLeave=()=>{running=false;clear();update();};document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',onLeave);window.addEventListener('hsk-account-ready',onLeave);
 const openShow=()=>{running=false;clear();closeShow();closeShow=presentation(lesson,words,store);};
 const header=el('header',undefined,'guided-lesson-header'),heading=el('div');
 heading.append(el('h3','Học từng chặng'),meter);
 header.append(heading,button('Trình chiếu rảnh tay',openShow));
 box.prepend(header);
 dispose=()=>{closeShow();dead=true;clear();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',onLeave);window.removeEventListener('hsk-account-ready',onLeave);};draw();openShow();
}
window.HSKLessonGuided={mount,stop:()=>dispose()};
})();
