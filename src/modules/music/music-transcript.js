/* Admin generates shared server scripts; listeners only read the synchronized lyrics. */
(function(root){
'use strict';
const C=()=>root.HSKMusicLyricsCore,uid=()=>root.HSKAccountDashboard?.user?.uid;
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
root.HSKMusicTranscript={install(api){
 const openButton=make('button','Tạo / duyệt script trên máy chủ');openButton.type='button';openButton.className='music-flat-row music-chill-only';openButton.dataset.menuView='main';openButton.id='musicTranscriptOpen';document.getElementById('musicMenuBody').append(openButton);
 const dialog=make('dialog');dialog.id='musicTranscriptDialog';dialog.className='music-transcript-dialog';
 const title=make('h2','Tạo script chữ Hán'),close=make('button','Đóng');close.type='button';
 const info=make('p','Groq căn thời gian theo script trong kho, lưu nháp riêng để duyệt. Cần key trên Worker. Tạo script bằng AI hai lượt vẫn dùng dịch vụ cũ; kết quả đó lưu lên kho với nhãn chưa duyệt.');
 const refLabel=make('label','Lời chuẩn để tham khảo (nếu có)'),reference=make('textarea');reference.maxLength=12000;reference.rows=3;reference.placeholder='Dán lời chữ Hán chuẩn để AI đối chiếu với âm thanh';refLabel.append(reference);
 const audio=make('video');audio.controls=true;audio.preload='metadata';audio.playsInline=true;
 const status=make('p');status.id='musicTranscriptStatus';status.setAttribute('role','status');
 const groq=make('button','Căn thời gian bằng Groq');groq.type='button';groq.id='musicGroqAlign';
 const jobCheck=make('button','Xem tiến độ / kết quả Groq'),jobCancel=make('button','Hủy bài trong hàng đợi');jobCheck.type=jobCancel.type='button';jobCheck.id='musicGroqJobStatus';jobCancel.id='musicGroqJobCancel';jobCancel.hidden=true;
 const generate=make('button','Tạo script và lưu lên máy chủ'),cancel=make('button','Hủy xử lý'),download=make('button','Tải JSON'),publish=make('button','Lưu bản đã duyệt');
 for(const b of [generate,cancel,download,publish])b.type='button';
 const rows=make('div');rows.id='musicTranscriptRows';const actions=make('div');actions.className='music-transcript-actions';actions.append(groq,jobCheck,jobCancel,generate,cancel,download,publish);
 dialog.append(title,close,info,refLabel,audio,status,actions,rows);document.body.append(dialog);
 let target=null,media=null,value=null,objectURL='',request=null,serial=0,owner='',lastFocus=null,jobTimer=0,jobPoll=null,dirty=false;
 function message(s){status.textContent=s;}
 function busy(on){generate.disabled=on;groq.disabled=on;reference.disabled=on;cancel.hidden=!on;download.disabled=on||!value;publish.disabled=on||!value;rows.inert=on;}
 function cleanup(){jobCancel.hidden=true;clearTimeout(jobTimer);jobPoll?.abort();jobPoll=null;dirty=false;++serial;request?.abort();request=null;audio.pause();audio.removeAttribute('src');audio.load();if(objectURL)URL.revokeObjectURL(objectURL);objectURL='';media=null;busy(false);}
 function setSource(blob){if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(blob);audio.src=objectURL;media=blob;}
 function reviewed(){return !!value?.cues.length&&value.cues.every(c=>c.reviewed===true);}
 function canonical(){if(!media||!Number.isFinite(audio.duration))throw Error('Tải lại audio trong kho để kiểm tra thời gian.');const result=C().validate(value);if(result.cues.some((c,i)=>c.start!==value.cues[i].start))throw Error('Các câu phải theo đúng thứ tự thời gian.');for(const c of result.cues)if(c.end===null||c.end>audio.duration+.5)throw Error('Kiểm tra lại thời gian câu và độ dài bài.');return result;}
 function draft(){const result=canonical();return {...result,status:reviewed()?'reviewed':'draft',reviewed:reviewed(),cues:result.cues.map((c,i)=>({...c,uncertain:!!value.cues[i].uncertain,reason:value.cues[i].reason||'',reviewed:!!value.cues[i].reviewed}))};}
 function render(){
  rows.replaceChildren();if(!value){busy(false);return;}
  value.cues.forEach((cue,i)=>{
   const row=make('fieldset'),legend=make('legend','Câu '+(i+1)+(cue.uncertain?' · Cần nghe kỹ':' · Chưa xác nhận thủ công'));row.append(legend);
   for(const field of ['start','end','text']){const label=make('label',field==='start'?'Bắt đầu (giây)':field==='end'?'Kết thúc (giây)':'Chữ Hán'),input=make(field==='text'?'textarea':'input');if(field==='text'){input.rows=2;input.lang='zh';}else{input.type='number';input.min='0';input.step='.01';}input.value=cue[field];input.addEventListener('input',()=>{cue[field]=field==='text'?input.value:Number(input.value);dirty=true;delete cue.characters;cue.reviewed=false;checkbox.checked=false;message('Nội dung đã đổi; hãy nghe và xác nhận lại câu này.');});label.append(input);row.append(label);}
   if(cue.reason)row.append(make('p',cue.reason));
   const listen=make('button','Nghe câu này');listen.type='button';listen.onclick=()=>{api.pause?.();audio.currentTime=Number(cue.start);audio.play().catch(()=>message('Hãy nhấn phát trên khung audio/video.'));audio.ontimeupdate=()=>{if(audio.currentTime>=Number(cue.end))audio.pause();};};
   const confirm=make('label','Tôi đã nghe đối chiếu và xác nhận chữ Hán cùng thời gian'),checkbox=make('input');checkbox.type='checkbox';checkbox.checked=!!cue.reviewed;checkbox.onchange=()=>{dirty=true;cue.reviewed=checkbox.checked;message(value.cues.filter(c=>c.reviewed).length+'/'+value.cues.length+' câu đã duyệt.');};confirm.prepend(checkbox);row.append(listen,confirm);rows.append(row);
  });busy(false);
 }
 async function metadata(){if(audio.readyState>=1)return;if(!media)throw Error('Chưa tải được audio trong kho để đối chiếu.');await new Promise((resolve,reject)=>{const timer=setTimeout(()=>end(Error('Chưa đọc được audio/video.')),15000);function end(err){clearTimeout(timer);audio.removeEventListener('loadedmetadata',ok);audio.removeEventListener('error',bad);err?reject(err):resolve();}const ok=()=>end(),bad=()=>end(Error('Trình duyệt không đọc được file này.'));audio.addEventListener('loadedmetadata',ok,{once:true});audio.addEventListener('error',bad,{once:true});});}
 openButton.onclick=async()=>{
  if(!uid()||!api.isOwner())return;const libraryTrack=api.menuTrack();if(!libraryTrack)return;lastFocus=document.activeElement;cleanup();owner=uid();target=libraryTrack;value=null;reference.value='';render();publish.hidden=!api.isOwner()||!target;dialog.showModal();const epoch=serial;
  title.textContent='Script · '+target.title;message('Đang lấy audio từ kho…');busy(true);request=new AbortController();
  try{if(target.hasLyrics){const sr=await fetch(api.endpoint()+'/api/tracks/'+encodeURIComponent(target.id)+'/lyrics',{signal:request.signal,cache:'no-store'});if(sr.ok){const saved=await sr.json();C().validate(saved);if(epoch!==serial)return;value=saved;if(saved.reviewed===true)value.cues.forEach(c=>c.reviewed=true);render();busy(true);}}const r=await fetch(target.url,{signal:request.signal});if(!r.ok)throw Error('Chưa tải được audio từ kho.');if(Number(r.headers.get('Content-Length'))>6*1024*1024)throw Error('Audio lớn hơn 6 MB. Transcript chỉ hỗ trợ bài trong kho tối đa 6 MB.');const reader=r.body.getReader(),chunks=[];let size=0;while(true){const {done,value:chunk}=await reader.read();if(done)break;size+=chunk.length;if(size>6*1024*1024){await reader.cancel();throw Error('Audio lớn hơn 6 MB.');}chunks.push(chunk);}if(epoch!==serial)return;setSource(new Blob(chunks,{type:target.id.endsWith('.m4a')?'audio/mp4':'audio/mpeg'}));await metadata();if(epoch!==serial)return;message(value?'Đã tải script hiện tại trên máy chủ.':'Có thể tạo script từ bài này trong kho.');}catch(e){if(epoch===serial)message(e.name==='AbortError'?'Đã hủy.':e.message);}finally{if(epoch===serial){request=null;busy(false);checkJob(epoch);}}
 };
 function groqSummary(result){const d=result.diagnostics||{};return 'Nháp Groq: '+result.cues.filter(c=>c.characters?.length).length+'/'+result.cues.length+' câu có mốc từng chữ · '+(d.missing||0)+' chữ chưa khớp. Nghe duyệt trước khi lưu.';}
 async function jobCall(method,suffix='',body,signal){const user=root.HSKAccountDashboard?.user;if(!user||!api.isOwner()||user.uid!==owner)throw Error('Đăng nhập admin để xem hàng đợi.');const token=await user.getIdToken();const r=await fetch(api.endpoint()+'/api/admin/tracks/'+encodeURIComponent(target.id)+'/alignment-job'+suffix,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},...(body?{body:JSON.stringify(body)}:{}),signal});const result=await r.json();if(!r.ok)throw Error(result.error||'Chưa kết nối được hàng đợi.');return result;}
 async function checkJob(epoch=serial,force=false){
  clearTimeout(jobTimer);jobPoll?.abort();const controller=new AbortController();jobPoll=controller;
  try{const job=await jobCall('GET','',null,controller.signal);if(epoch!==serial||owner!==uid()||!dialog.open)return;
   jobCancel.hidden=!['queued','running','waiting'].includes(job.state);
   if(job.state==='done'&&job.result){if(dirty&&!force){message('Nháp Groq đã xong. Bấm Xem kết quả để tải; nội dung bạn đang sửa được giữ.');return;}C().validate(job.result);value=job.result;value.cues.forEach(c=>c.reviewed=false);dirty=false;render();message(groqSummary(value));return;}
   if(job.state==='failed'||job.state==='stale'||job.state==='cancelled'){message(job.error||({stale:'Script đã đổi; hãy xếp hàng lại.',cancelled:'Đã hủy bài trong hàng đợi.'})[job.state]||'Bài xử lý lỗi.');return;}
   if(['queued','running','waiting'].includes(job.state)){message(({queued:'Đã xếp hàng Groq.',running:'Worker đang căn lời.',waiting:'Đang chờ thử lại theo hạn mức Groq.'})[job.state]+' Có thể đóng app hoặc tắt máy.');jobTimer=setTimeout(()=>checkJob(epoch),10000);}
  }catch(e){if(epoch===serial&&e.name!=='AbortError'&&dialog.open){if(force)message(e.message);jobTimer=setTimeout(()=>checkJob(epoch),15000);}}
  finally{if(jobPoll===controller)jobPoll=null;}
 }
 jobCheck.onclick=()=>checkJob(serial,true);
 jobCancel.onclick=async()=>{const epoch=serial;try{await jobCall('POST','/cancel',{});if(epoch===serial){clearTimeout(jobTimer);jobCancel.hidden=true;message('Đã hủy hàng đợi bài này.');}}catch(e){if(epoch===serial)message(e.message);}};
 groq.onclick=async()=>{
  const epoch=serial;if(!api.isOwner()||request||!target)return;const controller=new AbortController();request=controller;busy(true);message('Đang gửi vào hàng đợi…');
  try{await metadata();const result=await jobCall('POST','',{duration:audio.duration},controller.signal);if(epoch!==serial||owner!==uid())return;if(!result.queued)throw Error('Chưa xếp được hàng.');jobCancel.hidden=false;message('Đã xếp hàng Groq. Có thể đóng app hoặc tắt máy.');checkJob(epoch);
  }catch(e){if(epoch===serial)message(e.name==='AbortError'?'Yêu cầu đã hủy; xem tiến độ để biết máy chủ đã nhận chưa.':e.message);}finally{if(epoch===serial){request=null;busy(false);}}
 };
 generate.onclick=async()=>{
  const epoch=serial,user=root.HSKAccountDashboard?.user;if(!user||!api.isOwner()||user.uid!==owner||request)return;const controller=new AbortController();request=controller;busy(true);message('Đang nghe và đối chiếu chữ Hán hai lượt…');const timer=setTimeout(()=>controller.abort(),180000);
  try{await metadata();if(!Number.isFinite(audio.duration)||audio.duration<=0||audio.duration>480)throw Error('Transcript chỉ hỗ trợ bài trong kho không quá 8 phút.');
   const config=await fetch('./translation-config.json',{signal:controller.signal}).then(r=>r.json());if(!config.enabled)throw Error('Dịch vụ AI chưa bật.');const endpoint=new URL(config.endpoint);if(endpoint.protocol!=='https:')throw Error('Địa chỉ AI chưa hợp lệ.');endpoint.pathname=endpoint.pathname.replace(/\/translate$/,'/music-transcript');const token=await user.getIdToken();
   if(epoch!==serial||owner!==uid())return;
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},signal:controller.signal,body:JSON.stringify({trackId:target.id,duration:audio.duration,reference:reference.value})});const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa tạo được script.');if(epoch!==serial||owner!==uid())return;
   C().validate(result);if(!result.saved)throw Error('Máy chủ chưa xác nhận lưu script.');value=result;value.cues.forEach(c=>c.reviewed=false);render();busy(true);await api.refresh();if(epoch!==serial)return;api.sync?.();message('Đã tạo và lưu script lên máy chủ · Chưa duyệt. Hãy nghe từng câu rồi xác nhận chữ Hán và thời gian.');
  }catch(e){if(epoch===serial)message(e.name==='AbortError'?'Đã hủy hoặc quá thời gian.':e.message);}finally{clearTimeout(timer);if(epoch===serial){request=null;busy(false);}}
 };
 cancel.onclick=()=>{++serial;request?.abort();request=null;busy(false);message('Đã hủy xử lý.');};
 download.onclick=()=>{try{const blob=new Blob([JSON.stringify(draft(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='hsk-lyrics-'+(reviewed()?'reviewed':'draft')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){message(e.message);}};
 publish.onclick=async()=>{if(!api.isOwner()||!target||!reviewed()||request){message('Chủ kho cần duyệt tất cả các câu trước khi xuất bản.');return;}const epoch=serial;busy(true);try{await api.publish(target.id,{...canonical(),status:'reviewed',reviewed:true});if(epoch!==serial||owner!==uid())return;await api.refresh();message('Đã lưu bản đã duyệt lên máy chủ.');api.sync?.();}catch(e){if(epoch===serial)message(e.message);}finally{if(epoch===serial)busy(false);}};
 audio.addEventListener('play',()=>api.pause?.());
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{cleanup();rows.replaceChildren();value=null;lastFocus?.focus();});root.addEventListener('hsk-account-ready',()=>{if(dialog.open)dialog.close();});
 function syncEligibility(){openButton.hidden=!api.isOwner()||!api.menuTrack();}new MutationObserver(syncEligibility).observe(document.getElementById('musicMenuSheet'),{attributes:true,attributeFilter:['data-view','aria-hidden']});syncEligibility();
 busy(false);return {open:()=>openButton.click()};
}};
})(window);
