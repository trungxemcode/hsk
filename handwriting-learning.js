/* Confirmed handwriting only; isolated local storage and an authenticated upload queue. */
(function(root){
 'use strict';
 const MAX_SAMPLES=500,PER_CHARACTER=5,MAX_QUEUE=100;
 function pack(bitmap){if(!bitmap||bitmap.length!==1024)throw Error('Mẫu nét không hợp lệ.');const bytes=new Uint8Array(128);for(let i=0;i<1024;i++)if(bitmap[i])bytes[i>>3]|=1<<(i&7);let text='';for(const b of bytes)text+=String.fromCharCode(b);return typeof btoa==='function'?btoa(text):Buffer.from(bytes).toString('base64');}
 function unpack(value){if(typeof value!=='string'||value.length!==172||!/^[A-Za-z0-9+/]{171}=$/.test(value))throw Error('Mẫu nét không hợp lệ.');const text=typeof atob==='function'?atob(value):Buffer.from(value,'base64').toString('binary');if(text.length!==128)throw Error('Mẫu nét không hợp lệ.');const bitmap=new Uint8Array(1024);let count=0;for(let i=0;i<1024;i++){bitmap[i]=(text.charCodeAt(i>>3)>>(i&7))&1;count+=bitmap[i];}if(count<4||count>800)throw Error('Mẫu nét quá ít hoặc quá dày.');return bitmap;}
 function createStore({storage,owner='guest',characters,modelVersion,now=()=>Date.now()}){
  const allowed=new Set(Array.from(characters)),key='hsk-handwriting-learning-v1:'+owner;
  let state={schema:1,samples:[],queue:[]},busy=false,lastSaveError='';
  const valid=s=>{try{return s&&allowed.has(s.label)&&!!unpack(s.bitmap);}catch{return false;}};
  try{const data=JSON.parse(storage.getItem(key)||'null');if(data?.schema===1){state.samples=(data.samples||[]).filter(valid).slice(-MAX_SAMPLES);state.queue=(data.queue||[]).filter(valid).slice(-MAX_QUEUE);}}catch{}
  function save(next){try{storage.setItem(key,JSON.stringify(next));state=next;lastSaveError='';return true;}catch{lastSaveError='Bộ nhớ đầy; mẫu này chưa được lưu.';return false;}}
  function record(label,bitmap,{confirmed=false,share=false}={}){
   if(!confirmed)throw Error('Cần xác nhận chữ đúng trước khi học.');
   if(!allowed.has(label)||Array.from(label).length!==1)throw Error('Chữ này không có trong dữ liệu HSK của app.');
   unpack(bitmap);
   const sample={label,bitmap,modelVersion,updatedAt:now()},samples=state.samples.filter(s=>s.bitmap!==bitmap);
   samples.push(sample);
   while(samples.filter(s=>s.label===label).length>PER_CHARACTER)samples.splice(samples.findIndex(s=>s.label===label),1);
   const queue=state.queue.filter(s=>s.bitmap!==bitmap);
   if(share&&owner!=='guest')queue.push(sample);
   const saved=save({schema:1,samples:samples.slice(-MAX_SAMPLES),queue:queue.slice(-MAX_QUEUE)});
   return {saved,samples:state.samples.length,queued:state.queue.length,error:lastSaveError};
  }
  async function flush({user,endpoint,fetchFn=root.fetch,online=true}){
   if(busy||!online||!user||user.uid!==owner||owner==='guest'||!state.queue.length)return {sent:0,pending:state.queue.length};
   const url=new URL(endpoint);if(url.protocol!=='https:')throw Error('Dịch vụ góp mẫu cần HTTPS.');
   busy=true;let sent=0,error='';
   try{
    const token=await user.getIdToken();
    for(const sample of [...state.queue]){
     if(!state.queue.some(s=>s.bitmap===sample.bitmap&&s.label===sample.label))continue;
     const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
     let response;try{response=await fetchFn(url.href,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({schema:1,label:sample.label,bitmap:sample.bitmap,modelVersion:sample.modelVersion,confirmed:true}),signal:controller.signal});}finally{clearTimeout(timer);}
     if(!response.ok){error=response.status===401?'Đăng nhập lại để gửi mẫu.':response.status===429?'Gửi mẫu đạt giới hạn; app sẽ thử lại khi bạn dùng tiếp.':'Chưa gửi được mẫu; mẫu vẫn được giữ trên thiết bị.';break;}
     const result=await response.json();if(result.accepted!==true){error='Dịch vụ chưa xác nhận lưu mẫu.';break;}
     if(!save({...state,queue:state.queue.filter(s=>s.bitmap!==sample.bitmap||s.label!==sample.label)})){error=lastSaveError;break;}sent++;
    }
   }catch{error='Chưa gửi được mẫu; mẫu vẫn được giữ trên thiết bị.';}
   finally{busy=false;}
   return {sent,pending:state.queue.length,error};
  }
  function clear(){return save({schema:1,samples:[],queue:[]});}
  return {record,flush,clear,snapshot:()=>JSON.parse(JSON.stringify(state)),stats:()=>({samples:state.samples.length,pending:state.queue.length,error:lastSaveError}),key};
 }
 const api={pack,unpack,createStore,MAX_SAMPLES,PER_CHARACTER,MAX_QUEUE};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKHandwritingLearning=api;
})(typeof self==='object'?self:globalThis);
