(()=>{
  'use strict';
  const panel=document.getElementById('sentenceEditor');
  if(!panel)return;
  const form=panel.querySelector('form'),draft=panel.querySelector('textarea');
  const submit=form.querySelector('[type="submit"]'),aiButton=panel.querySelector('.sentence-deep-check'),undoButton=panel.querySelector('.sentence-undo'),status=panel.querySelector('.sentence-status');
  const count=panel.querySelector('.sentence-count'),mirror=panel.querySelector('.sentence-mirror');
  const example=panel.querySelector('.sentence-example');
  const cards=panel.querySelector('.sentence-suggestions'),filters=[...panel.querySelectorAll('[data-sentence-filter]')];
  const checker=window.HSKSentenceCheckerCore?.checker;
  let localSuggestions=[],onnxSuggestions=[],electraSuggestions=[],aiSuggestions=[],filter='all',pending=null,inputTimer=0,composing=false;
  let dismissed=new Set(),undoStack=[],aiSummary='';
  const onnx=window.HSKSentenceOnnx?.({
    toggle:panel.querySelector('.sentence-onnx-toggle'),
    status:panel.querySelector('.sentence-onnx-status'),
    onSuggestions(items){
      onnxSuggestions=items.map(item=>({...item,kind:'fix',source:'onnx'}));
      render();
    }
  });
  const electra=window.HSKSentenceElectraTrial?.({
    panel,draft,onSuggestions(items){electraSuggestions=items;render();}
  });
  const signature=item=>`${item.start}:${item.end}:${item.original}:${item.replacement}`;
  function cancelPending(){if(pending)pending.abort();pending=null;submit.disabled=false;aiButton.disabled=false;panel.setAttribute('aria-busy','false');}
  function valid(item){return item.start>=0&&item.end<=draft.value.length&&draft.value.slice(item.start,item.end)===item.original;}

  function button(label,className,action){
    const node=document.createElement('button');node.type='button';node.className=className;node.textContent=label;node.addEventListener('click',action);return node;
  }
  function syncScroll(){mirror.scrollTop=draft.scrollTop;mirror.scrollLeft=draft.scrollLeft;}
  function uniqueSuggestions(){
    const seen=new Set(),out=[];
    for(const item of [...aiSuggestions,...localSuggestions,...onnxSuggestions,...electraSuggestions]){
      const key=signature(item);if(seen.has(key)||dismissed.has(key)||!valid(item))continue;if(out.some(other=>item.start<other.end&&item.end>other.start))continue;seen.add(key);out.push(item);
    }
    return out.sort((a,b)=>a.start-b.start);
  }
  function currentErrors(){return uniqueSuggestions().filter(item=>filter==='all'||item.kind===filter);}
  function setStatus(message){status.textContent=message;}
  function render(){
    undoButton.disabled=!undoStack.length;
    example.hidden=Boolean(draft.value.trim());count.textContent=draft.value.length+' / 500 ký tự';mirror.replaceChildren();cards.replaceChildren();
    let cursor=0;
    for(const item of uniqueSuggestions()){
      if(item.start<cursor||item.end>draft.value.length)continue;
      mirror.append(draft.value.slice(cursor,item.start));
      const mark=document.createElement('mark');mark.dataset.kind=item.kind;mark.dataset.source=item.source||'local';mark.dataset.insertion=String(item.start===item.end);mark.textContent=draft.value.slice(item.start,item.end)||'\u200b';mirror.append(mark);cursor=item.end;
    }
    mirror.append(draft.value.slice(cursor)+'\n');syncScroll();
    for(const item of currentErrors()){
      const card=document.createElement('article');card.className='sentence-card';card.dataset.kind=item.kind;card.dataset.source=item.source||'local';
      const head=document.createElement('div');head.className='sentence-card-head';const dot=document.createElement('span');dot.className='sentence-card-dot';
      const title=document.createElement('h4');title.textContent=item.reviewOnly?'Cần xem lại · Model 103 MB':(item.kind==='fix'?'Cần sửa':'Gợi ý diễn đạt')+(item.source==='ai'?' · AI':item.source==='onnx'?' · Tại máy':' · Cục bộ');head.append(dot,title);
      const change=document.createElement('p');change.className='sentence-diff';change.lang='zh';
      const del=document.createElement('del');del.className='sentence-del';del.textContent=item.original||'(thêm tại đây)';
      const arrow=document.createElement('span');arrow.className='sentence-arrow';arrow.textContent=' → ';
      const ins=document.createElement('ins');ins.className='sentence-ins';ins.textContent=item.replacement||'∅';
      if(item.reviewOnly)change.textContent=item.original;
      else change.append(del,arrow,ins);
      const detail=document.createElement('p');detail.className='sentence-card-detail';detail.textContent=item.reason;
      const actions=document.createElement('footer');
      if(!item.reviewOnly)actions.append(button('Áp dụng','sentence-apply',()=>applySuggestion(item)));
      actions.append(button('Bỏ qua','sentence-dismiss',()=>dismissSuggestion(item)),button('Tìm trong bài','sentence-locate',()=>{draft.focus();draft.setSelectionRange(item.start,item.end);}));
      card.append(head,change,detail,actions);cards.append(card);
    }
    if(uniqueSuggestions().length&&!cards.children.length){const empty=document.createElement('p');empty.textContent='Không có gợi ý thuộc nhóm này.';cards.append(empty);}
  }
  function applySuggestion(item){
    if(!valid(item)){resetForInput();setStatus('Văn bản đã thay đổi. Đang kiểm tra lại.');return;}
    const replacement=String(item.replacement||'');if(draft.value.length-(item.end-item.start)+replacement.length>draft.maxLength){setStatus('Áp dụng gợi ý này sẽ vượt giới hạn 500 ký tự.');return;}
    cancelPending();clearTimeout(inputTimer);
    undoStack.push({text:draft.value,ai:aiSuggestions.map(x=>({...x})),dismissed:[...dismissed]});if(undoStack.length>20)undoStack.shift();
    const delta=replacement.length-(item.end-item.start);
    draft.setRangeText(replacement,item.start,item.end,'end');
    electra?.invalidate();
    aiSuggestions=aiSuggestions.filter(other=>other!==item&&(other.end<=item.start||other.start>=item.end)).map(other=>other.start<item.end?other:{...other,start:other.start+delta,end:other.end+delta});
    dismissed.clear();aiSummary='';onnx?.check(draft.value);runLocalCheck();
  }
  function dismissSuggestion(item){
    dismissed.add(signature(item));render();setStatus(uniqueSuggestions().length?`Còn ${uniqueSuggestions().length} gợi ý.`:'Đã xem hết gợi ý.');
  }
  function scheduleLocalCheck(delay=280){clearTimeout(inputTimer);if(composing)return;inputTimer=setTimeout(runLocalCheck,delay);}
  function runLocalCheck(){
    if(!checker){setStatus('Bộ kiểm tra cục bộ chưa sẵn sàng. Bạn vẫn có thể kiểm tra bằng AI.');return;}
    const text=draft.value;localSuggestions=checker.checkText(text).map(item=>({...item,original:text.slice(item.start,item.end),kind:item.kind||'fix',source:'local'}));
    const total=uniqueSuggestions().length;
    if(!pending)setStatus(aiSummary||(text.trim()?(total?`${total} gợi ý${aiSuggestions.length?' · gồm kết quả AI':' · kiểm tra cục bộ, không dùng AI'}`:'Chưa phát hiện lỗi trong các quy tắc cục bộ. Dùng Kiểm tra sâu bằng AI để xét ngữ cảnh.'): 'Nhập tiếng Trung để kiểm tra ngay khi gõ · không dùng AI.'));
    render();
  }
  function resetForInput(){cancelPending();aiSuggestions=[];localSuggestions=[];aiSummary='';dismissed.clear();undoStack=[];setStatus(composing?'Đang nhập chữ…':'Đang kiểm tra cục bộ…');scheduleLocalCheck();electra?.invalidate();onnx?.check(draft.value,composing);render();}
  undoButton.addEventListener('click',()=>{const previous=undoStack.pop();if(!previous)return;cancelPending();clearTimeout(inputTimer);draft.value=previous.text;electra?.invalidate();aiSuggestions=previous.ai;dismissed=new Set(previous.dismissed);aiSummary='';onnx?.check(draft.value);runLocalCheck();draft.focus();});
  function readReviewResponse(payload,text){
    const review=window.HSKSentenceReview.normalize(payload,text);
    if(!review)throw Error('AI chưa trả được gợi ý có vị trí sửa. Hãy bấm kiểm tra lại.');
    return review;
  }
  function readSuggestions(text,data){
    return data.suggestions.map(item=>({...item,source:'ai'}));
  }

  draft.addEventListener('input',resetForInput);draft.addEventListener('scroll',syncScroll);
  draft.addEventListener('compositionstart',()=>{composing=true;resetForInput();});
  draft.addEventListener('compositionend',()=>{composing=false;resetForInput();});
  draft.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();form.requestSubmit();}});
  window.addEventListener('hsk-account-ready',()=>{cancelPending();aiSuggestions=[];aiSummary='';runLocalCheck();});
  new MutationObserver(()=>{
    if(panel.hidden){
      onnx?.pause();electra?.pause();
      if(pending){cancelPending();runLocalCheck();}
    }else onnx?.check(draft.value,composing);
  }).observe(panel,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){onnx?.pause();electra?.pause();}
    else if(!panel.hidden)onnx?.check(draft.value,composing);
  });
  window.addEventListener('hsk-lessons-ready',()=>{window.HSKSentenceCheckerCore?.refresh?.();scheduleLocalCheck(0);});
  example.addEventListener('click',()=>{if(draft.value.trim())return;draft.value='我昨天去了商店，买了一件很漂亮衣服。';resetForInput();draft.focus();});
  filters.forEach(node=>node.addEventListener('click',()=>{filter=node.dataset.sentenceFilter;for(const item of filters)item.setAttribute('aria-pressed',String(item===node));render();}));

  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||composing)return;clearTimeout(inputTimer);runLocalCheck();const text=draft.value;if(!/\p{Script=Han}/u.test(text)){setStatus('Nhập câu hoặc đoạn văn tiếng Trung cần sửa.');draft.focus();return;}
    const user=window.HSKAccountDashboard?.user;if(!user?.uid){setStatus('Bộ kiểm tra cục bộ đã chạy. Đăng nhập để AI kiểm tra ngữ pháp theo ngữ cảnh.');return;}
    const controller=new AbortController();pending=controller;submit.disabled=true;aiButton.disabled=true;panel.setAttribute('aria-busy','true');setStatus('AI đang kiểm tra ngữ pháp và cách diễn đạt…');const timeout=setTimeout(()=>controller.abort(),50000);
    try{
      const config=await fetch('./translation-config.json',{signal:controller.signal,cache:'no-store'}).then(res=>res.json());const endpoint=new URL('/lesson-ask',config.endpoint);if(!config.enabled||endpoint.protocol!=='https:')throw Error('Dịch vụ AI chưa sẵn sàng.');
      const token=await user.getIdToken(),level=Number(document.getElementById('studioTargetLevel')?.value),metrics=checker?.metrics?.();
      if(pending!==controller||controller.signal.aborted||draft.value!==text)return;
      const response=await fetch(endpoint,{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({question:text,hsk:level>=1&&level<=6?level:3,history:[],lesson:{id:'sentence-editor',title:'Sửa câu tiếng Trung',words:[],content:{mode:'sentence-editor',localChecker:true,checkerMetrics:metrics}}})});
      const data=await response.json();if(pending!==controller||draft.value!==text||window.HSKAccountDashboard?.user?.uid!==user.uid)return;if(!response.ok)throw Error(data.error||'Chưa kiểm tra được văn bản.');
      const result=readReviewResponse(data,text);
      aiSuggestions=readSuggestions(text,result);
      const summary=typeof result.summary==='string'?result.summary.trim().slice(0,result.textOnly?4000:800):'';
      const unanchored=result.suggestions.length>0&&!aiSuggestions.length;
      aiSummary=summary||(aiSuggestions.length?'AI đã đề xuất chỉnh sửa.':unanchored?'AI có gợi ý nhưng chưa khớp được đoạn gốc.':'AI chưa thấy chỗ cần sửa.');
      setStatus(aiSummary);render();
    }catch(error){if(pending===controller)setStatus(error.name==='AbortError'?'AI xử lý quá lâu. Gợi ý cục bộ vẫn được giữ.':error.message);}finally{clearTimeout(timeout);if(pending===controller){pending=null;submit.disabled=false;aiButton.disabled=false;panel.setAttribute('aria-busy','false');}}
  });
  (async()=>{try{await checker?.ready;}catch{}runLocalCheck();})();
})();
