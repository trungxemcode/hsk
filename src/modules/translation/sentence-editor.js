(()=>{
  'use strict';
  const panel=document.getElementById('sentenceEditor');
  if(!panel)return;
  const form=panel.querySelector('form'),draft=panel.querySelector('textarea');
  const submit=form.querySelector('[type="submit"]'),status=panel.querySelector('.sentence-status');
  const count=panel.querySelector('.sentence-count'),mirror=panel.querySelector('.sentence-mirror');
  const example=panel.querySelector('.sentence-example');
  const cards=panel.querySelector('.sentence-suggestions'),filters=[...panel.querySelectorAll('[data-sentence-filter]')];
  const checker=window.HSKSentenceCheckerCore?.checker;
  let localSuggestions=[],aiSuggestions=[],filter='all',pending=null,inputTimer=0,composing=false;

  function button(label,className,action){
    const node=document.createElement('button');node.type='button';node.className=className;node.textContent=label;node.addEventListener('click',action);return node;
  }
  function syncScroll(){mirror.scrollTop=draft.scrollTop;mirror.scrollLeft=draft.scrollLeft;}
  function uniqueSuggestions(){
    const seen=new Set(),out=[];
    for(const item of [...localSuggestions,...aiSuggestions].sort((a,b)=>a.start-b.start||a.end-b.end)){
      const key=`${item.start}:${item.end}:${item.replacement}`;if(seen.has(key))continue;seen.add(key);out.push(item);
    }
    return out;
  }
  function currentErrors(){return uniqueSuggestions().filter(item=>filter==='all'||item.kind===filter);}
  function setStatus(message){status.textContent=message;}
  function render(){
    example.hidden=Boolean(draft.value.trim());count.textContent=draft.value.length+' / 500 ký tự';mirror.replaceChildren();cards.replaceChildren();
    let cursor=0;
    for(const item of uniqueSuggestions()){
      if(item.start<cursor||item.end>draft.value.length)continue;
      mirror.append(draft.value.slice(cursor,item.start));
      const mark=document.createElement('mark');mark.dataset.kind=item.kind;mark.dataset.source=item.source||'local';mark.textContent=draft.value.slice(item.start,item.end);mirror.append(mark);cursor=item.end;
    }
    mirror.append(draft.value.slice(cursor)+'\n');syncScroll();
    for(const item of currentErrors()){
      const card=document.createElement('article');card.className='sentence-card';card.dataset.kind=item.kind;card.dataset.source=item.source||'local';
      const head=document.createElement('div');head.className='sentence-card-head';const dot=document.createElement('span');dot.className='sentence-card-dot';
      const title=document.createElement('h4');title.textContent=item.source==='ai'?'AI đề xuất':item.kind==='fix'?'Cần sửa':'Tự nhiên hơn';head.append(dot,title);
      const change=document.createElement('p');change.className='sentence-diff';change.lang='zh';
      const del=document.createElement('del');del.className='sentence-del';del.textContent=item.original;
      const arrow=document.createElement('span');arrow.className='sentence-arrow';arrow.textContent=' → ';
      const ins=document.createElement('ins');ins.className='sentence-ins';ins.textContent=item.replacement||'∅';change.append(del,arrow,ins);
      const detail=document.createElement('p');detail.className='sentence-card-detail';detail.textContent=item.reason;
      const actions=document.createElement('footer');
      actions.append(button('Áp dụng','sentence-apply',()=>applySuggestion(item)),button('Bỏ qua','sentence-dismiss',()=>dismissSuggestion(item)),button('Tìm trong bài','sentence-locate',()=>{draft.focus();draft.setSelectionRange(item.start,item.end);}));
      card.append(head,change,detail,actions);cards.append(card);
    }
    if(uniqueSuggestions().length&&!cards.children.length){const empty=document.createElement('p');empty.textContent='Không có gợi ý thuộc nhóm này.';cards.append(empty);}
  }
  function applySuggestion(item){
    const replacement=String(item.replacement||'');if(draft.value.length-(item.end-item.start)+replacement.length>draft.maxLength){setStatus('Áp dụng gợi ý này sẽ vượt giới hạn 500 ký tự.');return;}
    const delta=replacement.length-(item.end-item.start);
    draft.setRangeText(replacement,item.start,item.end,'end');
    aiSuggestions=aiSuggestions.filter(other=>other!==item).map(other=>other.start<item.end?other:{...other,start:other.start+delta,end:other.end+delta});
    runLocalCheck();setStatus(aiSuggestions.length?'Đã áp dụng. Bạn còn '+aiSuggestions.length+' gợi ý AI.':'Đã áp dụng gợi ý cục bộ; đang kiểm tra lại câu.');
  }
  function dismissSuggestion(item){
    const remove=list=>list.filter(other=>other!==item&&!(other.start===item.start&&other.end===item.end&&other.replacement===item.replacement));localSuggestions=remove(localSuggestions);aiSuggestions=remove(aiSuggestions);setStatus(uniqueSuggestions().length?`Còn ${uniqueSuggestions().length} gợi ý.`:'Đã xem hết gợi ý.');render();
  }
  function scheduleLocalCheck(delay=280){clearTimeout(inputTimer);if(composing)return;inputTimer=setTimeout(runLocalCheck,delay);}
  function runLocalCheck(){
    if(!checker){setStatus('Bộ kiểm tra cục bộ chưa sẵn sàng.');return;}
    const text=draft.value;localSuggestions=checker.checkText(text).map(item=>({...item,original:text.slice(item.start,item.end),kind:item.kind||'fix',source:'local'}));
    const total=uniqueSuggestions().length;setStatus(total?`${total} gợi ý · phản hồi tức thời · không dùng AI`:'Đang theo dõi · chưa thấy lỗi chắc chắn · không dùng AI');render();
  }
  function resetForInput(){aiSuggestions=[];scheduleLocalCheck();render();}
  function readSuggestions(text,data){
    if(!data||typeof data.summary!=='string'||!Array.isArray(data.suggestions))throw Error('AI trả về gợi ý chưa đúng định dạng. Hãy thử lại.');
    const items=[];
    for(const item of data.suggestions.slice(0,5)){
      if(!item||!['fix','style'].includes(item.kind)||typeof item.original!=='string'||!item.original||typeof item.replacement!=='string'||item.replacement.length>500||item.replacement===item.original||typeof item.reason!=='string'||!item.reason.trim())continue;
      const start=text.indexOf(item.original),end=start+item.original.length;if(start<0||text.indexOf(item.original,start+1)>=0||items.some(other=>start<other.end&&end>other.start))continue;items.push({...item,start,end,source:'ai',reason:item.reason.slice(0,350)});
    }
    if(data.suggestions.length&&!items.length)throw Error('AI chưa trả được gợi ý khớp với văn bản. Hãy thử lại.');return items.sort((a,b)=>a.start-b.start);
  }

  draft.addEventListener('input',resetForInput);draft.addEventListener('scroll',syncScroll);
  draft.addEventListener('compositionstart',()=>{composing=true;clearTimeout(inputTimer);});
  draft.addEventListener('compositionend',()=>{composing=false;resetForInput();});
  draft.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();form.requestSubmit();}});
  window.addEventListener('hsk-account-ready',()=>{if(pending){pending.abort();pending=null;submit.disabled=false;}});
  window.addEventListener('hsk-lessons-ready',()=>{window.HSKSentenceCheckerCore?.refresh?.();scheduleLocalCheck(0);});
  example.addEventListener('click',()=>{if(draft.value.trim())return;draft.value='我昨天去了商店，买了一件很漂亮衣服。';resetForInput();draft.focus();});
  filters.forEach(node=>node.addEventListener('click',()=>{filter=node.dataset.sentenceFilter;for(const item of filters)item.setAttribute('aria-pressed',String(item===node));render();}));

  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;const text=draft.value;if(!/\p{Script=Han}/u.test(text)){setStatus('Nhập câu hoặc đoạn văn tiếng Trung cần sửa.');draft.focus();return;}
    const user=window.HSKAccountDashboard?.user;if(!user?.uid){setStatus('Bộ kiểm tra cục bộ đã chạy. Đăng nhập nếu muốn AI viết lại cả đoạn.');return;}
    const controller=new AbortController();pending=controller;submit.disabled=true;setStatus('AI đang đề xuất bản viết lại nâng cao…');const timeout=setTimeout(()=>controller.abort(),50000);
    try{
      const config=await fetch('./translation-config.json',{signal:controller.signal,cache:'no-store'}).then(res=>res.json());const endpoint=new URL('/lesson-ask',config.endpoint);if(!config.enabled||endpoint.protocol!=='https:')throw Error('Dịch vụ AI chưa sẵn sàng.');
      const token=await user.getIdToken(),level=Number(document.getElementById('studioTargetLevel')?.value),metrics=checker?.metrics?.();
      const response=await fetch(endpoint,{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({question:text,hsk:level>=1&&level<=6?level:3,history:[],lesson:{id:'sentence-editor',title:'Sửa câu tiếng Trung',words:[],content:{mode:'sentence-editor',localChecker:true,checkerMetrics:metrics}}})});
      const data=await response.json();if(pending!==controller||window.HSKAccountDashboard?.user?.uid!==user.uid)return;if(!response.ok)throw Error(data.error||'Chưa kiểm tra được văn bản.');
      let result;try{result=JSON.parse(data.answer);}catch{throw Error('Máy chủ chưa trả được gợi ý chỉnh sửa. Hãy thử lại.');}aiSuggestions=readSuggestions(text,result);setStatus(result.summary.trim().slice(0,400)||(aiSuggestions.length?'AI đã đề xuất chỉnh sửa.':'AI chưa thấy chỗ cần sửa.'));render();
    }catch(error){if(pending===controller)setStatus(error.name==='AbortError'?'AI xử lý quá lâu. Gợi ý cục bộ vẫn được giữ.':error.message);}finally{clearTimeout(timeout);if(pending===controller){pending=null;submit.disabled=false;}}
  });
  (async()=>{try{await checker?.ready;}catch{}runLocalCheck();})();
})();
