/* Import source text on demand. Files stay in the browser; only excerpts enter the tutor request. */
(()=>{
 'use strict';
 const limit=24000;
 const tidy=value=>String(value||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim().slice(0,limit);
 const hosts=new Set(['mandarinbean.com','hskreading.com']);
 async function readLink(value,endpoint){
  const url=new URL(value);
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password){
   throw Error('Hãy nhập một địa chỉ web HTTP hoặc HTTPS hợp lệ.');
  }
  url.hash='';
  if(endpoint&&hosts.has(url.hostname)&&url.protocol==='https:'){
   try{
    const response=await fetch(new URL('/reading-library',endpoint),{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({op:'article',url:url.href}),signal:AbortSignal.timeout(10000)
    });
    if(response.ok){
     const {article}=await response.json();
     const text=tidy(article?.paragraphs?.map(row=>row.hanzi).join('\n'));
     if(text)return {name:String(article.title||url.hostname).slice(0,120),url:url.href,text};
    }
   }catch{}
  }
  // Browser CORS controls which public sites permit direct reading.
  try{
   const response=await fetch(url.href,{credentials:'omit',referrerPolicy:'no-referrer',
    signal:AbortSignal.timeout(6000)});
   if(response.ok&&/^(text\/(?:html|plain)|application\/xhtml\+xml)/i.test(response.headers.get('content-type')||'')){
    const reader=response.body.getReader(),decoder=new TextDecoder();
    let content='',bytes=0;
    try{
     while(bytes<512000){
      const {done,value}=await reader.read();
      if(done)break;
      content+=decoder.decode(value.subarray(0,512000-bytes),{stream:true});
      bytes+=value.length;
     }
    }finally{await reader.cancel();}
    if(response.headers.get('content-type').startsWith('text/plain')){
     return {name:url.hostname,url:url.href,text:tidy(content)};
    }
    const template=document.createElement('template');
    template.innerHTML=content;
    const fragment=template.content;
    fragment.querySelectorAll('script,style,nav,header,footer,aside,template').forEach(node=>node.remove());
    const title=fragment.querySelector('title');
    const name=(title?.textContent||url.hostname).slice(0,120);
    title?.remove();
    return {name,url:url.href,text:tidy((fragment.querySelector('main,article')||fragment).textContent)};
   }
  }catch{}
  return {name:url.hostname,url:url.href,text:''};
 }
 function xml(bytes){
  const doc=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'application/xml');
  if(doc.querySelector('parsererror'))throw Error('Tài liệu Office bị lỗi cấu trúc.');
  return doc;
 }
 const children=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
 const texts=(node,name)=>children(node,name).map(item=>item.textContent);
 async function office(file,ext){
  const {unzipSync}=await import('https://cdn.jsdelivr.net/npm/fflate@0.8.3/esm/browser.js');
  const patterns={docx:/^word\/document\.xml$/,pptx:/^ppt\/slides\/slide\d+\.xml$/,xlsx:/^xl\/(?:sharedStrings|worksheets\/sheet\d+)\.xml$/};
  let expanded=0;
  const entries=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter(entry){
   if(!patterns[ext].test(entry.name))return false;
   expanded+=entry.originalSize;
   if(expanded>8*1024*1024)throw Error('Nội dung bên trong tài liệu quá lớn.');
   return true;
  }});
  const shared=entries['xl/sharedStrings.xml']?children(xml(entries['xl/sharedStrings.xml']),'si').map(item=>texts(item,'t').join('')):[];
  delete entries['xl/sharedStrings.xml'];
  const names=Object.keys(entries).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  let result='';
  for(const [index,name] of names.entries()){
   const doc=xml(entries[name]);
   if(ext==='xlsx'){
    result+=`\n[Trang tính ${index+1}]\n`+children(doc,'row').map(row=>children(row,'c').map(cell=>{
     const value=texts(cell,'v')[0]||'';
     return cell.getAttribute('t')==='s'?shared[Number(value)]||'':value||texts(cell,'t').join('');
    }).join('\t')).join('\n');
   }else{
    if(ext==='pptx')result+=`\n[Slide ${index+1}]\n`;
    result+=children(doc,'p').map(item=>texts(item,'t').join('')).join('\n');
   }
   if(result.length>=limit)break;
  }
  return result;
 }
 async function pdf(file){
  const base='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/';
  const lib=await import(base+'legacy/build/pdf.min.mjs');
  lib.GlobalWorkerOptions.workerSrc=base+'legacy/build/pdf.worker.min.mjs';
  const task=lib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,
   cMapUrl:base+'cmaps/',cMapPacked:true,standardFontDataUrl:base+'standard_fonts/'});
  let text='';
  try{
   const doc=await task.promise;
   for(let i=1;i<=Math.min(doc.numPages,100)&&text.length<limit;i++){
    const page=await doc.getPage(i);
    const content=await page.getTextContent();
    text+=`\n[Trang ${i}]\n`+content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('');
    page.cleanup();
   }
   return text;
  }finally{await task.destroy();}
 }
 async function readFile(file){
  if(file.size>10*1024*1024)throw Error('Chọn tệp tối đa 10 MB.');
  const ext=file.name.split('.').pop().toLowerCase();
  let value='';
  try{value=['txt','md','csv','tsv'].includes(ext)?await file.text():
   ext==='pdf'?await pdf(file):['docx','xlsx','pptx'].includes(ext)?await office(file,ext):'';}catch{}
  const text=tidy(value);
  const hasText=/[\p{L}\p{N}]/u.test(text.replace(/^\[(?:Trang|Slide|Trang tính) \d+\]$/gm,''));
  return {name:file.name.slice(0,120),text:hasText?text:''};
 }
 function select(sources,question){
  const core=window.HSKAIQACore;
  const terms=[...new Set(question.toLowerCase().match(/\p{Script=Han}{1,2}|[^\W\d_]{3,}|[\p{L}\p{N}]{3,}/gu)||[])].slice(0,35);
  return [...sources].sort((a,b)=>Number(!!b.url)-Number(!!a.url)).flatMap(source=>{
   const excerpts=core?.chunkDocumentText?core.chunkDocumentText(source.text,400,50):(source.text.match(/[\s\S]{1,650}/g)||[]);
   if(!excerpts.length)return [];
   const bestText=core?.bm25RetrieveChunks?core.bm25RetrieveChunks(excerpts,question,1)[0]:
    excerpts.map(text=>({text,score:terms.filter(term=>text.toLowerCase().includes(term)).length})).sort((a,b)=>b.score-a.score)[0]?.text;
   return bestText?[{name:source.name,url:source.url,text:bestText}]:[];
  }).slice(0,10);
 }
 // Keep original uploads for formats the text extractor does not understand.
 async function fileStore(mode,operation){
  const db=await new Promise((resolve,reject)=>{
   const request=indexedDB.open('hsk-ai-qa-project-files',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('files');
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  });
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction('files',mode);
    const request=operation(tx.objectStore('files'));
    tx.oncomplete=()=>resolve(request.result);
    tx.onabort=()=>reject(tx.error||Error('Không lưu được tệp trên thiết bị.'));
    tx.onerror=()=>reject(tx.error);
   });
  }finally{db.close();}
 }
 function bindChatAttachment(form){
  const make=(tag,cls)=>{const node=document.createElement(tag);node.className=cls;return node;};
  const plus=make('button','qa-chat-attach'),picker=make('input','qa-chat-file');
  const preview=make('div','qa-chat-file-preview'),caption=make('span','qa-chat-file-name');
  const remove=make('button','qa-chat-file-remove');
  plus.type=remove.type='button';
  plus.textContent='+';plus.title='Đính kèm tệp';plus.setAttribute('aria-label','Đính kèm tệp');
  remove.textContent='×';remove.setAttribute('aria-label','Bỏ tệp đính kèm');
  picker.type='file';picker.hidden=true;
  picker.accept='.pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.tsv';
  picker.setAttribute('aria-label','Chọn tệp đính kèm');
  caption.setAttribute('role','status');
  preview.append(caption,remove);preview.hidden=true;
  form.prepend(preview,plus,picker);
  let revision=0,attachment=null,loading=false,failed=false;
  function clear(){
   revision++;attachment=null;loading=false;failed=false;picker.value='';
   preview.hidden=true;caption.textContent='';remove.hidden=false;
  }
  plus.onclick=()=>picker.click();
  remove.onclick=clear;
  picker.onchange=async()=>{
   const file=picker.files[0];if(!file)return;
   clear();const token=revision;
   loading=true;preview.hidden=false;caption.textContent='Đang đọc '+file.name+'…';
   try{
    const item=await readFile(file);
    if(token!==revision)return;
    if(!item.text)throw Error('Tệp này không có văn bản đọc được.');
    attachment=item;caption.textContent=item.name;
   }catch(error){
    if(token!==revision)return;
    failed=true;caption.textContent=error.message||'Chưa đọc được tệp.';
   }finally{if(token===revision)loading=false;}
  };
  return {clear,get attachment(){return attachment;},get blocked(){return loading||failed;}};
 }
 window.HSKQaProjectSources={readLink,readFile,select,tidy,bindChatAttachment,
  storeFile:(id,file)=>fileStore('readwrite',store=>store.put(file,id)),
  getFile:id=>fileStore('readonly',store=>store.get(id)),
  removeFile:id=>fileStore('readwrite',store=>store.delete(id))
 };
})();
