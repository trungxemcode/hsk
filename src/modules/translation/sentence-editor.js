(()=>{
  'use strict';
  const panel=document.getElementById('sentenceEditor');
  if(!panel)return;
  const form=panel.querySelector('form'),draft=panel.querySelector('textarea');
  const submit=form.querySelector('[type="submit"]'),status=panel.querySelector('.sentence-status');
  const count=panel.querySelector('.sentence-count'),mirror=panel.querySelector('.sentence-mirror');
  const example=panel.querySelector('.sentence-example');
  const cards=panel.querySelector('.sentence-suggestions'),filters=[...panel.querySelectorAll('[data-sentence-filter]')];
  let suggestions=[],filter='all',pending=null;

  function button(label,className,action){
    const node=document.createElement('button');
    node.type='button';node.className=className;node.textContent=label;
    node.addEventListener('click',action);
    return node;
  }

  function syncScroll(){mirror.scrollTop=draft.scrollTop;}
  function render(){
    example.hidden=Boolean(draft.value.trim());
    count.textContent=draft.value.length+' / 500 ký tự';
    mirror.replaceChildren();
    cards.replaceChildren();
    let cursor=0;
    for(const item of suggestions){
      const {start,end,kind,original,replacement,reason}=item;
      const mark=document.createElement('mark');
      mark.dataset.kind=kind;mark.textContent=original;
      mirror.append(draft.value.slice(cursor,start),mark);
      cursor=end;
      if(filter!=='all'&&filter!==kind)continue;
      const card=document.createElement('article'),title=document.createElement('h4');
      const change=document.createElement('p'),detail=document.createElement('p'),actions=document.createElement('footer');
      card.className='sentence-card';card.dataset.kind=kind;
      title.textContent=kind==='fix'?'Cần sửa':'Tự nhiên hơn';
      change.lang='zh';change.textContent=original+' → '+(replacement||'∅');
      detail.textContent=reason;
      actions.append(button('Áp dụng','sentence-apply',()=>{
        if(draft.value.length-(end-start)+replacement.length>draft.maxLength){
          status.textContent='Áp dụng gợi ý này sẽ vượt giới hạn 500 ký tự.';return;
        }
        draft.setRangeText(replacement,start,end,'end');
        const delta=replacement.length-(end-start);
        suggestions=suggestions.filter(other=>other!==item).map(other=>other.start<end?other:
          {...other,start:other.start+delta,end:other.end+delta});
        status.textContent=suggestions.length?'Đã áp dụng. Bạn còn '+suggestions.length+' gợi ý.':'Đã áp dụng gợi ý.';
        render();
      }),button('Bỏ qua','sentence-dismiss',()=>{
        suggestions=suggestions.filter(other=>other!==item);
        status.textContent=suggestions.length?'Còn '+suggestions.length+' gợi ý.':'Đã xem hết gợi ý.';
        render();
      }),button('Tìm trong bài','sentence-locate',()=>{
        draft.focus();draft.setSelectionRange(start,end);
      }));
      card.append(title,change,detail,actions);cards.append(card);
    }
    mirror.append(draft.value.slice(cursor)+'\n');
    syncScroll();
    if(suggestions.length&&!cards.children.length){
      const empty=document.createElement('p');
      empty.textContent='Không có gợi ý thuộc nhóm này.';
      cards.append(empty);
    }
  }

  function resetDraft(){
    pending?.abort();pending=null;submit.disabled=false;suggestions=[];
    status.textContent='Bấm Kiểm tra để nhận gợi ý cho văn bản hiện tại.';
    render();
  }

  function readSuggestions(text,data){
    if(!data||typeof data.summary!=='string'||!Array.isArray(data.suggestions))throw Error('AI trả về gợi ý chưa đúng định dạng. Hãy thử lại.');
    const items=[];
    for(const item of data.suggestions.slice(0,3)){
      if(!item||!['fix','style'].includes(item.kind)||typeof item.original!=='string'||!item.original||
        typeof item.replacement!=='string'||item.replacement.length>500||item.replacement===item.original||
        typeof item.reason!=='string'||!item.reason.trim())continue;
      const start=text.indexOf(item.original),end=start+item.original.length;
      if(start<0||text.indexOf(item.original,start+1)>=0||items.some(other=>start<other.end&&end>other.start))continue;
      items.push({...item,start,end,reason:item.reason.slice(0,350)});
    }
    if(data.suggestions.length&&!items.length)throw Error('AI chưa trả được gợi ý khớp với văn bản. Hãy thử lại.');
    return items.sort((a,b)=>a.start-b.start);
  }

  draft.addEventListener('input',resetDraft);
  draft.addEventListener('scroll',syncScroll);
  window.addEventListener('hsk-account-ready',()=>{if(pending)resetDraft();});
  example.addEventListener('click',()=>{
    if(draft.value.trim())return;
    draft.value='我昨天去了商店，买了一件很漂亮衣服。';resetDraft();draft.focus();
  });
  filters.forEach(node=>node.addEventListener('click',()=>{
    filter=node.dataset.sentenceFilter;
    for(const item of filters)item.setAttribute('aria-pressed',String(item===node));
    render();
  }));
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(pending)return;
    const text=draft.value;
    if(!/\p{Script=Han}/u.test(text)){
      status.textContent='Nhập câu hoặc đoạn văn tiếng Trung cần sửa.';draft.focus();return;
    }
    const user=window.HSKAccountDashboard?.user;
    if(!user?.uid){status.textContent='Hãy đăng nhập tài khoản HSK để kiểm tra câu.';return;}
    const controller=new AbortController();
    pending=controller;submit.disabled=true;suggestions=[];
    status.textContent='Đang kiểm tra văn bản…';render();
    const timeout=setTimeout(()=>controller.abort(),50000);
    try{
      const config=await fetch('./translation-config.json',{signal:controller.signal}).then(res=>res.json());
      const endpoint=new URL('/lesson-ask',config.endpoint);
      if(!config.enabled||endpoint.protocol!=='https:')throw Error('Dịch vụ kiểm tra câu chưa sẵn sàng.');
      const token=await user.getIdToken();
      const level=Number(document.getElementById('studioTargetLevel')?.value);
      const response=await fetch(endpoint,{method:'POST',signal:controller.signal,
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({question:text,hsk:level>=1&&level<=6?level:3,history:[],
          lesson:{id:'sentence-editor',title:'Sửa câu tiếng Trung',words:[],content:{mode:'sentence-editor'}}})});
      const data=await response.json();
      if(pending!==controller||window.HSKAccountDashboard?.user?.uid!==user.uid)return;
      if(!response.ok)throw Error(data.error||'Chưa kiểm tra được văn bản.');
      let result;
      try{result=JSON.parse(data.answer);}catch{throw Error('Máy chủ chưa trả được gợi ý chỉnh sửa. Hãy thử lại.');}
      suggestions=readSuggestions(text,result);
      status.textContent=result.summary.trim().slice(0,400)||(suggestions.length?'Đã kiểm tra văn bản.':'Chưa thấy chỗ cần sửa.');
      filters[0].click();
    }catch(error){
      if(pending===controller)status.textContent=error.name==='AbortError'?'Kiểm tra quá lâu. Hãy thử lại.':error.message;
    }finally{
      clearTimeout(timeout);
      if(pending===controller){pending=null;submit.disabled=false;}
    }
  });
})();
