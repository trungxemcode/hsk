/* Personal, explicitly reviewed transcripts; media goes only to the authenticated AI service. */
(function(root){
'use strict';
const C=()=>root.HSKMusicLyricsCore,uid=()=>root.HSKAccountDashboard?.user?.uid;
const key=()=> 'hsk_music_private_scripts_v1:'+uid();
function all(){try{return JSON.parse(localStorage.getItem(key())||'[]');}catch{return [];}}
function read(id){return uid()?(all().find(x=>x.id===id)||null):null;}
function save(id,title,value){if(!uid())throw Error('Hãy đăng nhập trước khi lưu.');const list=all().filter(x=>x.id!==id);list.unshift({id,title,value,updatedAt:Date.now()});localStorage.setItem(key(),JSON.stringify(list.slice(0,5)));root.dispatchEvent(new Event('hsk-music-private-script'));}
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
root.HSKMusicTranscript={read,install(api){
 const openButton=make('button','Tự tạo / sửa script riêng');openButton.type='button';openButton.className='music-flat-row music-chill-only';openButton.dataset.menuView='main';openButton.id='musicTranscriptOpen';document.getElementById('musicMenuBody').append(openButton);
 const dialog=make('dialog');dialog.id='musicTranscriptDialog';dialog.className='music-transcript-dialog';
 const title=make('h2','Tạo script chữ Hán'),close=make('button','Đóng');close.type='button';
 const info=make('p','AI nghe hai lượt để đối chiếu chữ Hán. Kết quả chưa bảo đảm chính xác; cần nghe và duyệt từng câu. Mỗi lần tạo dùng 2 lượt truy vấn AI. Script riêng lưu trên thiết bị này, tối đa 5 bài cho mỗi tài khoản.');
 const choose=make('input');choose.type='file';choose.accept='.mp3,.m4a,.wav,.ogg,.flac,.mp4,.webm';choose.setAttribute('aria-label','Chọn audio hoặc video tối đa 6 MB, 8 phút');
 const refLabel=make('label','Lời chuẩn để tham khảo (nếu có)'),reference=make('textarea');reference.maxLength=12000;reference.rows=3;reference.placeholder='Dán lời chữ Hán chuẩn để AI đối chiếu với âm thanh';refLabel.append(reference);
 const audio=make('video');audio.controls=true;audio.preload='metadata';audio.playsInline=true;
 const status=make('p');status.id='musicTranscriptStatus';status.setAttribute('role','status');
 const generate=make('button','Tạo script'),cancel=make('button','Hủy xử lý'),store=make('button','Lưu script riêng'),download=make('button','Tải JSON'),publish=make('button','Xuất bản vào kho chung');
 for(const b of [generate,cancel,store,download,publish])b.type='button';
 const rows=make('div');rows.id='musicTranscriptRows';const actions=make('div');actions.className='music-transcript-actions';actions.append(generate,cancel,store,download,publish);
 dialog.append(title,close,info,choose,refLabel,audio,status,actions,rows);document.body.append(dialog);
 let target=null,media=null,value=null,objectURL='',request=null,serial=0,owner='',lastFocus=null;
 function message(s){status.textContent=s;}
 function busy(on){generate.disabled=on;choose.disabled=on;reference.disabled=on;cancel.hidden=!on;store.disabled=download.disabled=on||!value;publish.disabled=on||!value;rows.inert=on;}
 function cleanup(){++serial;request?.abort();request=null;audio.pause();audio.removeAttribute('src');audio.load();if(objectURL)URL.revokeObjectURL(objectURL);objectURL='';media=null;busy(false);}
 function setSource(blob){if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(blob);audio.src=objectURL;media=blob;}
 function reviewed(){return !!value?.cues.length&&value.cues.every(c=>c.reviewed===true);}
 function canonical(){if(!media||!Number.isFinite(audio.duration))throw Error('Chọn lại audio/video để kiểm tra thời gian.');const result=C().validate(value);if(result.cues.some((c,i)=>c.start!==value.cues[i].start))throw Error('Các câu phải theo đúng thứ tự thời gian.');for(const c of result.cues)if(c.end===null||c.end>audio.duration+.5)throw Error('Kiểm tra lại thời gian câu và độ dài bài.');return result;}
 function draft(){const result=canonical();return {...result,status:reviewed()?'reviewed':'draft',reviewed:reviewed(),cues:result.cues.map((c,i)=>({...c,uncertain:!!value.cues[i].uncertain,reason:value.cues[i].reason||'',reviewed:!!value.cues[i].reviewed}))};}
 function render(){
  rows.replaceChildren();if(!value){busy(false);return;}
  value.cues.forEach((cue,i)=>{
   const row=make('fieldset'),legend=make('legend','Câu '+(i+1)+(cue.uncertain?' · Cần nghe kỹ':' · Chưa xác nhận thủ công'));row.append(legend);
   for(const field of ['start','end','text']){const label=make('label',field==='start'?'Bắt đầu (giây)':field==='end'?'Kết thúc (giây)':'Chữ Hán'),input=make(field==='text'?'textarea':'input');if(field==='text'){input.rows=2;input.lang='zh';}else{input.type='number';input.min='0';input.step='.01';}input.value=cue[field];input.addEventListener('input',()=>{cue[field]=field==='text'?input.value:Number(input.value);cue.reviewed=false;checkbox.checked=false;message('Nội dung đã đổi; hãy nghe và xác nhận lại câu này.');});label.append(input);row.append(label);}
   if(cue.reason)row.append(make('p',cue.reason));
   const listen=make('button','Nghe câu này');listen.type='button';listen.onclick=()=>{api.pause?.();audio.currentTime=Number(cue.start);audio.play().catch(()=>message('Hãy nhấn phát trên khung audio/video.'));audio.ontimeupdate=()=>{if(audio.currentTime>=Number(cue.end))audio.pause();};};
   const confirm=make('label','Tôi đã nghe đối chiếu và xác nhận chữ Hán cùng thời gian'),checkbox=make('input');checkbox.type='checkbox';checkbox.checked=!!cue.reviewed;checkbox.onchange=()=>{cue.reviewed=checkbox.checked;message(value.cues.filter(c=>c.reviewed).length+'/'+value.cues.length+' câu đã duyệt.');};confirm.prepend(checkbox);row.append(listen,confirm);rows.append(row);
  });busy(false);
 }
 async function metadata(){if(audio.readyState>=1)return;if(!media)throw Error('Chọn file để nghe đối chiếu.');await new Promise((resolve,reject)=>{const timer=setTimeout(()=>end(Error('Chưa đọc được audio/video.')),15000);function end(err){clearTimeout(timer);audio.removeEventListener('loadedmetadata',ok);audio.removeEventListener('error',bad);err?reject(err):resolve();}const ok=()=>end(),bad=()=>end(Error('Trình duyệt không đọc được file này.'));audio.addEventListener('loadedmetadata',ok,{once:true});audio.addEventListener('error',bad,{once:true});});}
 choose.onchange=async()=>{const f=choose.files?.[0];if(!f)return;const epoch=++serial;value=null;render();try{if(f.size>6*1024*1024)throw Error('File tối đa 6 MB. Hãy chọn bản audio hoặc đoạn video ngắn.');const bytes=await f.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(epoch!==serial)return;target={id:'file-'+hash,title:f.name};setSource(f);await metadata();if(epoch!==serial)return;value=read(target.id)?.value||null;render();message(value?'Đã mở script riêng đã lưu.':'Đã chọn '+f.name+'.');publish.hidden=true;}catch(e){if(epoch===serial){media=null;message(e.message);}}};
 openButton.onclick=async()=>{
  if(!uid()){root.alert('Hãy đăng nhập để tạo script riêng.');return;}lastFocus=document.activeElement;cleanup();owner=uid();target=api.menuTrack();value=target?read(target.id)?.value||null:null;reference.value='';choose.value='';render();publish.hidden=!api.isOwner()||!target;dialog.showModal();const epoch=serial;
  if(!target){message('Chọn audio hoặc video MP4/WebM tối đa 6 MB, 8 phút.');return;}
  title.textContent='Script · '+target.title;message('Đang lấy audio từ kho…');busy(true);request=new AbortController();
  try{const r=await fetch(target.url,{signal:request.signal});if(!r.ok)throw Error('Chưa tải được audio từ kho.');if(Number(r.headers.get('Content-Length'))>6*1024*1024)throw Error('Audio lớn hơn 6 MB. Hãy chọn bản nhẹ hơn.');const reader=r.body.getReader(),chunks=[];let size=0;while(true){const {done,value:chunk}=await reader.read();if(done)break;size+=chunk.length;if(size>6*1024*1024){await reader.cancel();throw Error('Audio lớn hơn 6 MB.');}chunks.push(chunk);}if(epoch!==serial)return;setSource(new Blob(chunks,{type:target.id.endsWith('.m4a')?'audio/mp4':'audio/mpeg'}));await metadata();if(epoch!==serial)return;message(value?'Đã mở script riêng.':'Có thể tạo script từ bài trong kho hoặc chọn file khác.');}catch(e){if(epoch===serial)message(e.name==='AbortError'?'Đã hủy.':e.message);}finally{if(epoch===serial){request=null;busy(false);}}
 };
 generate.onclick=async()=>{
  const epoch=serial,user=root.HSKAccountDashboard?.user;if(!user||user.uid!==owner||request)return;const controller=new AbortController();request=controller;busy(true);message('Đang nghe và đối chiếu chữ Hán hai lượt…');const timer=setTimeout(()=>controller.abort(),180000);
  try{await metadata();if(!Number.isFinite(audio.duration)||audio.duration<=0||audio.duration>480)throw Error('Chọn đoạn nhạc không quá 8 phút.');
   const map={mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',ogg:'audio/ogg',flac:'audio/flac',mp4:'video/mp4',webm:'video/webm'},mimeType=target.id.startsWith('file-')?(map[target.title.split('.').pop().toLowerCase()]||media.type):media.type;if(!Object.values(map).includes(mimeType))throw Error('Định dạng file chưa hỗ trợ.');
   const bytes=new Uint8Array(await media.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));const config=await fetch('./translation-config.json',{signal:controller.signal}).then(r=>r.json());if(!config.enabled)throw Error('Dịch vụ AI chưa bật.');const endpoint=new URL(config.endpoint);if(endpoint.protocol!=='https:')throw Error('Địa chỉ AI chưa hợp lệ.');endpoint.pathname=endpoint.pathname.replace(/\/translate$/,'/music-transcript');const token=await user.getIdToken();
   if(epoch!==serial||owner!==uid())return;
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},signal:controller.signal,body:JSON.stringify({media:{mimeType,data:btoa(binary)},duration:audio.duration,reference:reference.value})});const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa tạo được script.');if(epoch!==serial||owner!==uid())return;
   C().validate(result);value=result;value.cues.forEach(c=>c.reviewed=false);render();message('Bản nháp đã đối chiếu AI. Hãy nghe từng câu, sửa chữ Hán nếu cần rồi đánh dấu xác nhận.');
  }catch(e){if(epoch===serial)message(e.name==='AbortError'?'Đã hủy hoặc quá thời gian.':e.message);}finally{clearTimeout(timer);if(epoch===serial){request=null;busy(false);}}
 };
 cancel.onclick=()=>{++serial;request?.abort();request=null;busy(false);message('Đã hủy xử lý.');};
 store.onclick=()=>{try{if(owner!==uid())throw Error('Tài khoản đã thay đổi.');save(target.id,target.title,draft());message(reviewed()?'Đã lưu script riêng đã duyệt trên thiết bị.':'Đã lưu bản nháp riêng; vẫn cần duyệt từng câu.');api.sync?.();api.privateChanged?.();}catch(e){message(e.name==='QuotaExceededError'?'Bộ nhớ đầy. Hãy tải JSON để giữ bản script.':e.message);}};
 download.onclick=()=>{try{const blob=new Blob([JSON.stringify(draft(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='hsk-lyrics-'+(reviewed()?'reviewed':'draft')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){message(e.message);}};
 publish.onclick=async()=>{if(!api.isOwner()||!target||target.id.startsWith('file-')||!reviewed()||request){message('Chủ kho cần duyệt tất cả các câu trước khi xuất bản.');return;}const epoch=serial;busy(true);try{await api.publish(target.id,canonical());if(epoch!==serial||owner!==uid())return;await api.refresh();message('Đã xuất bản script vào kho chung.');api.sync?.();}catch(e){if(epoch===serial)message(e.message);}finally{if(epoch===serial)busy(false);}};
 audio.addEventListener('play',()=>api.pause?.());
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{cleanup();rows.replaceChildren();value=null;lastFocus?.focus();});root.addEventListener('hsk-account-ready',()=>{if(dialog.open)dialog.close();api.privateChanged?.();});
 busy(false);return {open:()=>openButton.click()};
}};
})(window);
