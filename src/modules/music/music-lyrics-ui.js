/* One native player, timestamped text and the existing authenticated AI assistant. */
(function(root){
'use strict';
root.HSKMusicLyricsUI={install(api){
 const C=root.HSKMusicLyricsCore,$=id=>document.getElementById(id),panel=$('musicPanel');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 let track=null,script=null,request=null,sequence=0,active=-1,pointer=false,manualUntil=0,selected='',selectionTrack='',uploadSequence=0,uploadBusy=false;
 const box=el('section',undefined,'music-timed-panel');box.id='musicTimedPanel';box.hidden=true;box.setAttribute('aria-label','Lời bài hát theo thời gian');
 const head=el('div',undefined,'music-timed-head'),heading=el('h3','Lời bài hát'),follow=el('button','Theo nhạc'),lookup=el('button','Tra cứu AI');follow.type=lookup.type='button';follow.id='musicLyricsFollow';lookup.id='musicLyricsAsk';lookup.hidden=true;
 const note=el('p','','music-timed-note');note.id='musicTimedStatus';note.setAttribute('role','status');
 const words=el('div',undefined,'music-timed-words');words.id='musicTimedLyrics';words.tabIndex=0;words.lang='zh';words.setAttribute('aria-label','Lời bài hát chỉ đọc; nhấn giữ hoặc kéo để chọn chữ');
 head.append(heading,follow,lookup);box.append(head,note,words);const cover=$('musicLinkCover'),thumb=$('musicLinkThumb'),front=el('button','Lật xem lời','music-cover-flip-open'),back=el('button','Ảnh bìa');front.id='musicLyricsFlip';back.id='musicLyricsBack';front.type=back.type='button';front.hidden=true;front.setAttribute('aria-controls','musicTimedPanel');front.setAttribute('aria-expanded','false');back.setAttribute('aria-label','Lật lại ảnh bìa');head.prepend(back);cover.append(front,box);box.inert=true;box.setAttribute('aria-hidden','true');
 function flip(show,focus=true){if(show&&!track?.hasLyrics)return;cover.classList.toggle('is-script-flipped',show);box.inert=!show;box.setAttribute('aria-hidden',String(!show));front.setAttribute('aria-expanded',String(show));thumb.setAttribute('aria-hidden',String(show));if(show){active=-1;tick(api.time(),api.duration());if(focus)back.focus({preventScroll:true});}else if(focus&&!front.hidden)front.focus({preventScroll:true});}
 front.onclick=()=>flip(true);back.onclick=()=>flip(false);box.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();flip(false);}});
 const heroCover=$('musicHeroThumb')?.parentElement;
 function openFromAvatar(event){if(!api.track()?.hasLyrics)return;event?.preventDefault();event?.stopPropagation();api.expand?.();flip(true);}
 if(heroCover){heroCover.addEventListener('click',openFromAvatar);heroCover.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){openFromAvatar(event);}});}
 $('musicMiniThumb')?.addEventListener('click',openFromAvatar);
 function coverEligibility(has){front.hidden=!has;cover.classList.toggle('has-script-cover',has);if(heroCover){heroCover.dataset.script=String(has);if(has){heroCover.setAttribute('role','button');heroCover.tabIndex=0;heroCover.setAttribute('aria-label','Lật ảnh bìa để xem lời bài hát');}else{heroCover.removeAttribute('role');heroCover.removeAttribute('tabindex');heroCover.removeAttribute('aria-label');}}}

 const upload=el('button','Gắn script LRC / SRT / JSON','music-flat-row music-chill-only');upload.id='musicLyricsUpload';upload.type='button';upload.dataset.menuView='main';upload.hidden=true;
 const file=el('input');file.type='file';file.accept='.lrc,.srt,.json,text/plain,application/json';file.id='musicLyricsFile';file.hidden=true;
 const uploadStatus=el('p','','music-status');uploadStatus.id='musicLyricsUploadStatus';uploadStatus.dataset.menuView='main';uploadStatus.hidden=true;uploadStatus.setAttribute('role','status');
 $('musicMenuBody').append(upload,file,uploadStatus);
 const sourceIcon=$('musicMenuLibraryRow').querySelector('.music-flat-ico').cloneNode(true),uploadLabel=el('span',upload.textContent,'music-flat-label');upload.replaceChildren(sourceIcon,uploadLabel);
 function selection(){const s=getSelection();return s&&s.rangeCount&&!s.isCollapsed&&words.contains(s.anchorNode)&&words.contains(s.focusNode)?s.toString().trim().slice(0,280):'';}
 function clear(){flip(false,false);coverEligibility(false);request?.abort();request=null;++sequence;script=null;active=-1;selected='';selectionTrack='';lookup.hidden=true;words.replaceChildren();box.hidden=true;panel.classList.remove('music-has-script');root.dispatchEvent(new Event('hsk-music-context-end'));}
 function tick(time,duration){
  if(!script||panel.hidden||api.mode()!=='chill')return;
  const next=C.active(script.cues,time,duration||Infinity);if(next===active)return;
  if(active>=0){const n=words.children[active];n?.classList.remove('is-current');n?.removeAttribute('aria-current');}
  active=next;if(next<0)return;const row=words.children[next];row.classList.add('is-current');row.setAttribute('aria-current','true');
  if(!pointer&&!selection()&&Date.now()>manualUntil){const top=Math.max(0,row.offsetTop-words.offsetTop-(words.clientHeight-row.clientHeight)/2);words.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 }
 async function load(next){
  if(next?.id===track?.id&&next?.lyricsRevision===track?.lyricsRevision)return;
  clear();track=next?{...next}:null;if(!next?.hasLyrics)return;
  box.hidden=false;coverEligibility(true);panel.classList.add('music-has-script');note.textContent='Đang tải lời bài hát…';const epoch=sequence,controller=new AbortController();request=controller;
  try{const response=await fetch(api.endpoint()+'/api/tracks/'+encodeURIComponent(next.id)+'/lyrics',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error(response.status===404?'Chưa có script cho bài này.':'Chưa tải được lời bài hát.');const text=await response.text();if(controller.signal.aborted||epoch!==sequence)return;script=C.parse(text,'lyrics.json');
   words.replaceChildren(...script.cues.map((cue,i)=>{const row=el('p',undefined,'music-timed-line');row.dataset.cue=String(i);row.append(el('span',cue.text,'music-timed-text'));if(cue.pinyin)row.append(el('small',cue.pinyin,'music-timed-pinyin'));if(cue.vi)row.append(el('small',cue.vi,'music-timed-vi'));return row;}));
   const shared=JSON.parse(text);note.textContent=(shared.status==='draft'?'Script AI · Chưa được admin duyệt. ':shared.reviewed===true?'Script đã được admin duyệt. ':'')+'Nhấn giữ hoặc kéo chọn lời để tra cứu AI.';tick(api.time(),api.duration());
  }catch(error){if(epoch===sequence&&error.name!=='AbortError'){note.textContent=error.message;const retry=el('button','Thử tải lại');retry.type='button';retry.onclick=()=>{track=null;load(next);};words.append(retry);}}
  finally{if(request===controller)request=null;}
 }
 function sync(){
  const selectedTrack=api.menuTrack();upload.hidden=!api.isOwner()||!selectedTrack;upload.disabled=uploadBusy;
  if(panel.hidden||api.mode()!=='chill'){box.hidden=true;root.dispatchEvent(new Event('hsk-music-context-end'));return;}
  load(api.track());box.hidden=!api.track()?.hasLyrics;
 }
 upload.onclick=()=>{file.value='';file.click();};
 file.onchange=async()=>{
  const f=file.files?.[0],target=api.menuTrack(),uid=root.HSKAccountDashboard?.user?.uid;if(!f||!target||!api.isOwner()||uploadBusy)return;
  const epoch=++uploadSequence;uploadBusy=true;upload.disabled=true;uploadStatus.hidden=false;uploadStatus.textContent='Đang kiểm tra script…';
  try{if(f.size>C.MAX_BYTES)throw Error('Script tối đa 500 KB.');const value=C.parse(await f.text(),f.name);if(epoch!==uploadSequence||root.HSKAccountDashboard?.user?.uid!==uid)return;
   uploadStatus.textContent='Đang lưu '+value.cues.length+' câu vào kho…';await api.publish(target.id,value);
   if(epoch!==uploadSequence||root.HSKAccountDashboard?.user?.uid!==uid)return;
   await api.refresh();uploadStatus.textContent='Đã gắn script. Bài hát có trong mục Học HSK.';track=null;sync();
  }catch(error){if(epoch===uploadSequence)uploadStatus.textContent=error.message;}finally{if(epoch===uploadSequence){uploadBusy=false;upload.disabled=false;}}
 };
 words.addEventListener('pointerdown',()=>{pointer=true;});document.addEventListener('pointerup',()=>{pointer=false;});document.addEventListener('pointercancel',()=>{pointer=false;});
 for(const event of ['wheel','touchmove'])words.addEventListener(event,()=>{manualUntil=Date.now()+5000;},{passive:true});
 document.addEventListener('selectionchange',()=>{const value=selection();if(value){selected=value;selectionTrack=track?.id||'';lookup.hidden=false;}else if(document.activeElement!==lookup){selected='';lookup.hidden=true;}});
 lookup.addEventListener('pointerdown',event=>event.preventDefault());
 lookup.onclick=()=>{
  const text=selection()||selected;if(!text||!script||selectionTrack!==track?.id)return;
  const cues=script.cues,context=cues.filter(c=>c.text&&(c.text.includes(text)||text.includes(c.text))).slice(0,3);const excerpt=(context.length?context:cues.slice(Math.max(0,active-1),Math.max(0,active-1)+3)).map(c=>({hanzi:c.text,pinyin:c.pinyin,vi:c.vi}));
  root.dispatchEvent(new CustomEvent('hsk-music-ask',{detail:{lesson:{id:'music-'+track.id,title:track.title,vi:track.title,number:'Âm nhạc',hsk:1,words:[],content:{lyrics:excerpt}},question:('Giải thích nghĩa, pinyin và cách dùng trong lời bài hát của đoạn: “'+text+'”.').slice(0,500)}}));
 };
 follow.onclick=()=>{manualUntil=0;pointer=false;getSelection()?.removeAllRanges();active=-1;tick(api.time(),api.duration());};
 new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class','hidden','data-music-mode']});
 new MutationObserver(sync).observe($('musicMenuSheet'),{attributes:true,attributeFilter:['data-view','aria-hidden']});
 root.addEventListener('hsk-account-ready',()=>{++uploadSequence;uploadBusy=false;upload.disabled=false;uploadStatus.hidden=true;file.value='';track=null;clear();});
 root.HSKMusicTranscript?.install({...api,sync:()=>{track=null;sync();}});

 return {sync,tick,showLyrics:()=>flip(true),reset(){track=null;clear();}};
}};
})(window);
