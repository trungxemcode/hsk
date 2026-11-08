/* Hỏi đáp AI: chọn nhà cung cấp AI trong ô chat. Mục chưa khả dụng bị khóa (ổ khóa) và không chọn được. */
(()=>{'use strict';
  const PERSONAL=[
    ['claude','Claude'],['deepseek','DeepSeek'],['openai','OpenAI'],
    ['gemini','Gemini (API riêng)'],['fosta','Fosta'],['chatgpt-cookie','ChatGPT (cookie riêng)']
  ];
  const LOCK='<svg class="qa-provider-lock" aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const CHIP='<svg class="qa-provider-chip" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>';
  const CARET='<svg class="qa-provider-caret" aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>';
  const storeKey=uid=>`hsk-ai-qa-provider-v1:${String(uid||'guest').replace(/[^\w:.-]/g,'_').slice(0,150)}`;
  const controls=['aiQaThinking','qaProjectThinking'].map(id=>document.getElementById(id)).filter(Boolean);
  if(!controls.length)return;
  let uid='guest',selected='auto',availability=null,openPicker=null;
  const picks=[];

  function readSaved(){try{return localStorage.getItem(storeKey(uid))||'auto';}catch{return 'auto';}}
  function save(){try{localStorage.setItem(storeKey(uid),selected);}catch{}}
  // Mỗi mục: id (lưu local), value (gửi lên Worker), nhãn, mô tả, khóa hay không.
  function items(){
    const a=availability,p=a?.personal||{};
    const known=Boolean(a);
    const list=[{group:'Hệ thống'},
      {id:'auto',value:'auto',label:'Tự động',sub:'Hệ thống chọn giúp bạn',locked:false},
      {id:'system-gemini',value:'system-gemini',label:'Gemini',sub:a?.system?.gemini?.available?'Key mặc định của hệ thống':known?'Hệ thống chưa sẵn sàng':'Chưa kiểm tra được',locked:!a?.system?.gemini?.available},
      {id:'system-chatgpt',value:'system-chatgpt',label:'ChatGPT',sub:a?.system?.chatgpt?.available?'Do admin cài trên Worker':known?'Admin chưa cài cookie':'Chưa kiểm tra được',locked:!a?.system?.chatgpt?.available},
      {group:'Của bạn'}];
    for(const [provider,label] of PERSONAL){
      const mine=p.provider===provider,ready=mine&&p.enabled===true;
      list.push({id:`personal:${provider}`,value:'personal',label,locked:!ready,
        sub:ready?(p.model||'API riêng của bạn'):mine&&p.configured?'Đang tắt trong Cài đặt':known?'Thêm trong Cài đặt → API riêng':'Chưa kiểm tra được'});
    }
    return list;
  }
  function entry(id){return items().find(item=>item.id===id&&!item.locked)||null;}
  function normalizeSelection(){if(!entry(selected))selected='auto';}
  function current(){return items().find(item=>item.id===selected)||items()[1];}
  function closeAll(){if(openPicker){openPicker.close();openPicker=null;}}

  function build(control){
    const wrap=document.createElement('div');wrap.className='qa-provider';
    const button=document.createElement('button');button.type='button';button.className='qa-provider-btn';
    button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
    const label=document.createElement('span');label.className='qa-provider-label';
    button.innerHTML=CHIP;button.append(label);button.insertAdjacentHTML('beforeend',CARET);
    const menu=document.createElement('div');menu.className='qa-provider-menu';menu.setAttribute('role','menu');menu.hidden=true;menu.setAttribute('aria-label','Chọn nhà cung cấp AI');
    wrap.append(button,menu);control.before(wrap);
    function place(){
      const r=button.getBoundingClientRect(),width=Math.min(300,window.innerWidth-24);
      menu.style.width=width+'px';
      menu.style.left=Math.max(12,Math.min(window.innerWidth-width-12,r.right-width))+'px';
      menu.style.bottom=Math.max(12,window.innerHeight-r.top+8)+'px';
      menu.style.maxHeight=Math.max(160,Math.min(480,r.top-24))+'px';
    }
    function fill(){
      menu.textContent='';
      for(const item of items()){
        if(item.group){const h=document.createElement('div');h.className='qa-provider-group';h.setAttribute('role','presentation');h.textContent=item.group;menu.append(h);continue;}
        const row=document.createElement('button');row.type='button';row.className='qa-provider-item';row.setAttribute('role','menuitemradio');
        row.dataset.provider=item.id;row.setAttribute('aria-checked',String(item.id===selected));
        if(item.locked){row.setAttribute('aria-disabled','true');row.dataset.locked='true';row.title=item.sub;}
        const text=document.createElement('span');text.className='qa-provider-text';
        const name=document.createElement('b');name.textContent=item.label;
        const sub=document.createElement('small');sub.textContent=item.sub;
        text.append(name,sub);row.append(text);
        if(item.locked)row.insertAdjacentHTML('beforeend',LOCK);
        else if(item.id===selected)row.insertAdjacentHTML('beforeend','<svg class="qa-provider-check" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>');
        row.addEventListener('click',event=>{
          if(item.locked){event.preventDefault();event.stopPropagation();return;}
          selected=item.id;save();closeAll();renderAll();
        });
        menu.append(row);
      }
    }
    function open(){closeAll();fill();menu.hidden=false;place();button.setAttribute('aria-expanded','true');openPicker=api;
      (menu.querySelector('[aria-checked="true"]')||menu.querySelector('.qa-provider-item'))?.focus();}
    function close(){menu.hidden=true;button.setAttribute('aria-expanded','false');}
    const api={close,render(){
      const item=current();label.textContent=item.label;
      button.setAttribute('aria-label','Nhà cung cấp AI: '+item.label);button.title='Nhà cung cấp AI: '+item.label;
      if(!menu.hidden)fill();
    },menu,button};
    button.addEventListener('click',()=>menu.hidden?open():closeAll());
    menu.addEventListener('keydown',event=>{
      const rows=[...menu.querySelectorAll('.qa-provider-item:not([aria-disabled="true"])')],i=rows.indexOf(document.activeElement);
      if(event.key==='ArrowDown'){event.preventDefault();rows[Math.min(rows.length-1,i+1)]?.focus();}
      else if(event.key==='ArrowUp'){event.preventDefault();rows[Math.max(0,i-1)]?.focus();}
      else if(event.key==='Escape'){event.preventDefault();closeAll();button.focus();}
    });
    return api;
  }
  function renderAll(){normalizeSelection();for(const p of picks)p.render();}
  for(const control of controls)picks.push(build(control));
  document.addEventListener('pointerdown',event=>{if(openPicker&&!openPicker.menu.contains(event.target)&&!openPicker.button.contains(event.target))closeAll();});
  window.addEventListener('resize',closeAll);
  window.addEventListener('scroll',event=>{
    if(openPicker&&event.target!==openPicker.menu)closeAll();
  },true);

  async function refresh(user,config){
    const nextUid=user?.uid||'guest';
    if(nextUid!==uid){uid=nextUid;selected=readSaved();availability=null;}
    else if(!selected)selected=readSaved();
    renderAll();
    if(!user?.uid||!config?.endpoint)return;
    try{
      const token=await user.getIdToken();
      const response=await fetch(new URL('/ai-providers',config.endpoint),{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
      const data=response.ok?await response.json():null;
      if(uid!==nextUid)return;
      availability=data&&typeof data==='object'&&data.system&&data.personal?data:null;
    }catch{if(uid===nextUid)availability=null;}
    renderAll();
  }
  selected=readSaved();renderAll();
  window.HSKAiProviderPicker={
    refresh,
    // Giá trị gửi lên Worker; 'auto' không gửi gì để giữ hành vi mặc định.
    choice(){normalizeSelection();return entry(selected)?.value||'auto';}
  };
})();
