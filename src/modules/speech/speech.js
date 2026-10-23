/* Device speech: Mandarin by default, Vietnamese when explicitly requested. */
(function(root){
 'use strict';
 function chooseVoice(voices,language='zh-CN',preferredURI=''){
  if(/^vi(?:-|_|$)/i.test(language)){const choices=voices.filter(v=>/^vi(?:-|_|$)/i.test(v.lang));const selected=choices.find(v=>v.voiceURI===preferredURI);if(selected)return selected;const quality=v=>/natural|neural|premium|enhanced/i.test(v.name)?3:!v.localService?2:1;return choices.slice().sort((a,b)=>quality(b)-quality(a))[0]||null;}
  const mandarin=voices.filter(v=>/^(zh|cmn)(-|_|$)/i.test(v.lang)&&!/^zh[-_]hk/i.test(v.lang)&&!/(cantonese|yue)/i.test(v.name));
  const selected=mandarin.find(v=>v.voiceURI===preferredURI);if(selected)return selected;
  const preferred=mandarin.filter(v=>/^(zh[-_](cn|hans)|cmn[-_]cn)/i.test(v.lang));
  const choices=preferred.length?preferred:mandarin;
  return choices.find(v=>v.localService)||choices[0]||null;
 }
 function chunks(input,max=100){
  const lines=Array.isArray(input)?input:[input],result=[];
  for(const line of lines){const text=String(line||'').trim();if(!text)continue;let current='';
   for(const ch of Array.from(text)){current+=ch;if(/[。！？!?；;\n]/.test(ch)||Array.from(current).length>=max){result.push(current);current='';}}
   if(current)result.push(current);
  }return result;
 }
 function createPlayer({synth,Utterance,notify=()=>{},rate=.85,gapMs=0,voiceURI=''}){
  let token=0,active=null,held=null,queueTimer,packController;
  const reset=button=>{if(button){button.classList.remove('is-speaking');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',button.dataset.speechLabel);}};
  function stop(){token++;packController?.abort();packController=null;if(root.HSKVoiceManager?.selection.source==='pack')root.HSKVoiceManager.stop();clearTimeout(queueTimer);reset(active);active=null;held=null;synth?.cancel();}
  function play(input,button,language='zh-CN'){
   if(active===button&&active){stop();notify('Đã dừng phát âm.');return;}
   stop();
   const manager=root.HSKVoiceManager,vietnamese=/^vi(?:-|_|$)/i.test(language);
   if(!vietnamese&&manager?.selection.source==='pack'){
    const parts=chunks(input,60);if(!parts.length)return;manager.unlock();const controller=new AbortController();packController=controller;const id=token;active=button;
    if(button){button.classList.add('is-speaking');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Dừng phát âm');}
    notify('Đang phát âm tiếng Trung…');let index=0;
    const next=()=>{if(id!==token)return;if(index===parts.length){reset(active);active=null;packController=null;notify('Đã nghe xong.');return;}
     manager.speak(parts[index++],typeof rate==='function'?rate():rate,controller.signal).then(()=>{if(id!==token)return;const gap=Math.max(0,Math.min(10000,Number(typeof gapMs==='function'?gapMs():gapMs)||0));if(index<parts.length&&gap)queueTimer=setTimeout(next,gap);else next();}).catch(e=>{if(id!==token)return;stop();if(e.name!=='AbortError')notify(e.message||'Không phát được giọng mở rộng. Hãy thử giọng thiết bị.');});};next();return;
   }
   if(!synth||!Utterance){notify('Trình duyệt chưa hỗ trợ phát âm. Hãy thử Chrome, Edge hoặc Safari.');return;}
   const parts=chunks(input,vietnamese?500:100);if(!parts.length)return;
   const requested=typeof voiceURI==='function'?voiceURI():voiceURI;
   const voice=chooseVoice(synth.getVoices(),language,vietnamese?requested:(manager?.selection.voiceURI||requested));
   if(!voice){notify(vietnamese?'Chưa tìm thấy giọng tiếng Việt. Hãy thêm giọng Vietnamese trong cài đặt giọng nói của thiết bị, rồi thử lại.':'Chưa tìm thấy giọng tiếng Trung. Hãy thêm giọng Mandarin / Chinese trong cài đặt giọng nói của thiết bị, rồi thử lại.');return;}
   const id=token;active=button;if(button){button.classList.add('is-speaking');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Dừng phát âm');}
   let index=0;notify(vietnamese?'Đang phát âm tiếng Việt…':'Đang phát âm tiếng Trung…');
   function next(){
    if(id!==token)return;
    if(index===parts.length){reset(active);active=null;held=null;notify('Đã nghe xong.');return;}
    const utterance=new Utterance(parts[index++]);held=utterance;utterance.voice=voice;utterance.lang=voice.lang||'zh-CN';utterance.rate=Math.max(.5,Math.min(1.5,Number(typeof rate==='function'?rate():rate)||.85));utterance.pitch=1;utterance.volume=1;
    let ended=false;
    utterance.onend=()=>{if(ended||id!==token)return;ended=true;const gap=Math.max(0,Math.min(10000,Number(typeof gapMs==='function'?gapMs():gapMs)||0));if(index<parts.length&&gap)queueTimer=setTimeout(next,gap);else next();};utterance.onerror=event=>{if(ended||id!==token)return;ended=true;stop();notify(event.error==='network'?'Giọng đọc này cần kết nối mạng. Hãy kết nối hoặc cài giọng đọc offline.':'Không phát được âm thanh. Kiểm tra âm lượng và giọng đọc của thiết bị.');};
    try{synth.speak(utterance);}catch{if(id===token){stop();notify('Không phát được âm thanh. Hãy thử lại.');}}
   }next();
  }
  return {play,stop,get currentUtterance(){return held;}};
 }
 const api={chooseVoice,chunks,createPlayer};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 let status,statusTimer;
 function notify(message){if(!status){status=document.createElement('p');status.id='speechStatus';status.className='speech-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);}status.textContent=message;root.clearTimeout(statusTimer);statusTimer=root.setTimeout(()=>{status.textContent='';},8000);}
 const player=createPlayer({synth:root.speechSynthesis,Utterance:root.SpeechSynthesisUtterance,notify});
 // Prime engines whose voice inventory arrives asynchronously; refreshed on every click.
 root.speechSynthesis?.getVoices();
 function button(text,label='Nghe phát âm',full=false){
  const b=document.createElement('button');b.type='button';b.className='speech-button'+(full?' speech-button-full':'');
  b.innerHTML='<svg class="speech-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  if(full){const caption=document.createElement('span');caption.textContent=label;b.append(caption);}
  b.title=label;b.dataset.speechLabel=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed','false');
  b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();player.play(typeof text==='function'?text():text,b);});return b;
 }
 root.HSKSpeech={...api,button,stop:player.stop};root.addEventListener('pagehide',player.stop);
})(typeof window==='object'?window:globalThis);
