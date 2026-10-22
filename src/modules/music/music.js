/* Small music pilot, adapted from the supplied frontend-pwa skeleton. */
(()=>{
 'use strict';
 const C=window.HSKMusicCore;if(!C)return;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const $=id=>document.getElementById(id);
 const panel=el('section',undefined,'panel music-panel');panel.id='musicPanel';panel.dataset.studioHubPanel='music';panel.hidden=true;
 panel.innerHTML=`<button type="button" id="musicBack">← Luyện & Ôn</button><h2>Nghe nhạc học HSK</h2><p class="music-intro">Nghe từng câu, tự đoán ý rồi đối chiếu lời. Lịch sử luyện nhạc được lưu riêng trên thiết bị.</p>
 <div class="music-settings"><label>Lọc câu theo cấp <select id="musicLevel"><option value="all">Tất cả HSK</option><option value="new">Câu có từ mới</option></select></label><button type="button" id="musicRefresh">Tải kho nhạc</button></div><p id="musicStatus" class="music-status" role="status" aria-live="polite"></p><div id="musicCatalog" class="music-catalog"></div>
 <details id="musicImport"><summary>Thử với file nhạc và lời của bạn</summary><div class="music-import"><p>Chọn file âm thanh/video và file JSON có lời, thời gian, pinyin, nghĩa cùng câu hỏi. File nhạc chỉ được phát trên máy này; không tự tải lên mạng.</p><a href="./content/music/lesson-template.json" download="music-lesson-template.json">Tải mẫu cấu trúc lời JSON</a><label>File lời bài hát JSON <input id="musicManifest" type="file" accept=".json,application/json"></label><label>File nhạc hoặc video (tối đa 50 MB) <input id="musicFile" type="file" accept="audio/*,video/mp4"></label><button type="button" id="musicImportApply" class="music-primary">Mở bài đã chọn</button></div></details>
 <section id="musicLesson" hidden><h3 id="musicTitle"></h3><p id="musicCredit" class="music-credit"></p><video id="musicPlayer" class="music-player" controls playsinline preload="metadata"></video><div id="musicYoutube" class="music-youtube" hidden></div>
 <div class="music-toolbar"><button type="button" id="musicPlay">Phát / tạm dừng</button><button type="button" id="musicReplay">Nghe lại câu</button><button type="button" id="musicLoop" aria-pressed="false">Lặp câu: tắt</button><button type="button" id="musicRecover">Tải lại nguồn nghe</button></div>
 <div class="music-settings"><label>Câu đang học <select id="musicLine"></select></label><label>Tốc độ <select id="musicRate"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option></select></label><button type="button" id="musicNext">Câu tiếp →</button></div>
 <div class="music-study"><div class="music-actions"><button type="button" id="musicHold">Giữ để xem lời</button><button type="button" id="musicReveal" aria-pressed="false">Hiện lời</button><button type="button" id="musicPin" aria-pressed="false">Pinyin</button><button type="button" id="musicVi" aria-pressed="false">Nghĩa Việt</button></div><div class="music-caption"><p id="musicHidden">Lời đang ẩn. Nghe và chọn ý bên dưới.</p><div id="musicLyrics" hidden><p id="musicHanzi" class="music-hanzi" lang="zh"></p><p id="musicPinyin" class="music-pin"></p><p id="musicMeaning" class="music-vi"></p></div></div><p id="musicDistribution" class="music-distribution"></p><div id="musicNewWords" class="music-new" hidden></div><form id="musicQuiz" class="music-quiz"><fieldset id="musicAnswers"></fieldset><button type="submit" id="musicCheck" class="music-primary">Xác nhận đáp án</button><p id="musicResult" class="music-result" role="status" aria-live="polite"></p></form></div></section>
 <details><summary>Lịch sử luyện nhạc trên thiết bị này</summary><ul id="musicHistory" class="music-history"></ul></details>`;
 document.querySelector('main.workspace').append(panel);
 for(let n=1;n<=6;n++)$('musicLevel').add(new Option('HSK '+n,String(n)));
 const video=$('musicPlayer');
 let song=null,index=0,loop=false,reveal=false,holding=false,pin=false,vi=false,objectUrl=null,yt=null,ytTimer=null,serial=0,fetcher=null,opened=false,checked=false,lastSaved=0,lastTime=0;
 let catalog=[],config={enabled:false,endpoint:''},lexicon=C.dictionary([]),lexiconSource=null,progress={};
 const owner=()=>window.HSKAccountDashboard?.user?.uid||'guest';
 const key=type=>'hsk-music-'+type+'-v1:'+owner();
 function read(type,fallback){try{return JSON.parse(localStorage.getItem(key(type))||'null')||fallback;}catch{return fallback;}}
 function save(type,value){try{localStorage.setItem(key(type),JSON.stringify(value));}catch{status('Bộ nhớ thiết bị đầy; chưa lưu được lịch sử.');}}
 function status(message){$('musicStatus').textContent=message;}
 function vocab(){let rows=[];try{rows=typeof words!=='undefined'?words:[];}catch{}if(rows!==lexiconSource){lexicon=C.dictionary(rows);lexiconSource=rows;}return lexicon;}
 const segment=()=>song?.segments[index];
 const time=()=>yt?Number(yt.getCurrentTime?.()||0):video.currentTime;
 const playing=()=>yt?yt.getPlayerState?.()===1:!video.paused;
 function checkpoint(force=false){if(!song||(!force&&Date.now()-lastSaved<2000))return;lastSaved=Date.now();progress=read('progress',{});progress[song.id]={revision:song.revision,index,time:time()};const entries=Object.entries(progress).slice(-30);save('progress',Object.fromEntries(entries));}
 function release(savePosition=true){if(savePosition)checkpoint(true);video.pause();video.removeAttribute('src');video.load();yt?.destroy?.();yt=null;clearInterval(ytTimer);ytTimer=null;if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
 function stop(){checkpoint(true);video.pause();yt?.pauseVideo?.();holding=false;renderReveal();}
 function history(){const box=$('musicHistory');box.replaceChildren();const rows=read('history',[]);if(!rows.length){box.append(el('li','Chưa có câu đã trả lời.'));return;}for(const r of rows.slice(0,30))box.append(el('li',r.title+' · '+r.segmentId+' · '+(r.correct?'Đúng':'Cần ôn')+' · '+new Date(r.at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})));}
 function renderReveal(){const visible=reveal||holding;$('musicLyrics').hidden=!visible;$('musicHidden').hidden=visible;$('musicPinyin').hidden=!pin;$('musicMeaning').hidden=!vi;}
 function classify(s){return C.classify(s,vocab());}
 function lines(){
  const select=$('musicLine');select.replaceChildren();if(!song)return;
  song.segments.forEach((s,i)=>{const c=classify(s),filter=$('musicLevel').value;if(filter!=='all'&&(filter==='new'?!c.newWords.length:c.level!==Number(filter)))return;select.add(new Option('Câu '+(i+1)+' · '+(c.level?'HSK '+c.level:'Chưa xếp HSK')+(c.newWords.length?' · có từ mới':''),String(i)));});
  $('musicLesson').hidden=!select.options.length;
  if(!select.options.length){status('Không có câu khớp bộ lọc. Đổi cấp hoặc chọn tất cả.');return;}
  if(![...select.options].some(o=>Number(o.value)===index)){index=Number(select.options[0].value);stop();}select.value=String(index);
 }
 function drawLine(){
  const s=segment();if(!s)return;checked=false;reveal=false;holding=false;
  $('musicHanzi').textContent=s.hanzi;$('musicPinyin').textContent=s.pinyin;$('musicMeaning').textContent=s.vi;renderReveal();
  const c=classify(s);$('musicDistribution').textContent=(c.level?'Cấp có tỷ lệ cao nhất: HSK '+c.level:'Chưa đủ từ chuẩn để xếp HSK')+' · '+c.counts.map((n,i)=>'HSK'+(i+1)+': '+Math.round(c.ratios[i]*100)+'%').join(' · ')+' · Từ mới: '+Math.round(c.unknownRatio*100)+'%';
  $('musicNewWords').hidden=!c.newWords.length;$('musicNewWords').textContent='Từ ngoài bộ HSK: '+c.newWords.join('、')+'. Chưa tự thêm vào sổ từ vựng.';
  const answers=$('musicAnswers');answers.replaceChildren(el('legend',s.quiz.question));s.quiz.options.forEach((answer,i)=>{const label=el('label'),radio=el('input');radio.type='radio';radio.name='musicAnswer';radio.value=String(i);label.append(radio,document.createTextNode(answer));answers.append(label);});$('musicCheck').disabled=false;$('musicResult').textContent='';$('musicLine').value=String(index);
 }
 function seek(t){if(yt)yt.seekTo(t,true);else if(video.readyState>=1)video.currentTime=Math.min(t,Number.isFinite(video.duration)?Math.max(0,video.duration-.05):t);}
 async function play(){if(!song)return;const epoch=serial;try{if(yt)yt.playVideo();else await video.play();if(epoch===serial)status('');}catch{if(epoch===serial)status('Chạm nút phát của trình nghe để bắt đầu có tiếng.');}}
 function tick(){
  if(!song||!opened)return;const t=time();if(!Number.isFinite(t))return;
  if(loop&&playing()&&t>=segment().end-.04){seek(segment().start);lastTime=segment().start;return;}
  if(!loop&&playing()){const active=C.activeSegment(song.segments,t);if(active>=0&&active!==index&&[...$('musicLine').options].some(o=>Number(o.value)===active)){index=active;drawLine();}}
  lastTime=t;checkpoint();
 }
 function choose(i,autoplay=false){if(!song||!song.segments[i])return;stop();index=i;drawLine();seek(segment().start);checkpoint(true);if(autoplay)play();}
 async function youtubeApi(){
  if(window.YT?.Player)return;
  if(!youtubeApi.loading)youtubeApi.loading=new Promise((resolve,reject)=>{const script=el('script');script.src='https://www.youtube.com/iframe_api';const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve();};script.onerror=()=>reject(Error('Không tải được player YouTube.'));document.head.append(script);setTimeout(()=>{if(!window.YT?.Player)reject(Error('Player YouTube chưa sẵn sàng.'));},12000);}).catch(e=>{youtubeApi.loading=null;throw e;});
  return youtubeApi.loading;
 }
 async function mountYoutube(value,epoch,resume){
  await youtubeApi();if(epoch!==serial||!opened)return;
  const mount=el('div');$('musicYoutube').replaceChildren(mount);yt=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:value.source.videoId,width:'100%',height:'100%',playerVars:{playsinline:1,origin:location.origin},events:{onReady:event=>{if(epoch!==serial)return;event.target.seekTo(resume,true);status('Chạm vào player YouTube để phát.');},onStateChange:()=>tick(),onAutoplayBlocked:()=>status('Chạm vào player YouTube để tiếp tục phát.'),onError:()=>status('Video YouTube không khả dụng hoặc không cho phép nhúng. Hãy chọn bài khác.')}});ytTimer=setInterval(tick,200);
 }
 async function openSong(value,file=null){
  let valid;try{valid=C.validateSong(value);}catch(e){status(e.message);return;}
  if(valid.source.kind==='local'&&!file){status('Chọn lại file nhạc trên thiết bị để mở bài này.');$('musicImport').open=true;return;}
  release();const epoch=++serial;song=valid;index=0;loop=false;$('musicLoop').textContent='Lặp câu: tắt';$('musicLoop').setAttribute('aria-pressed','false');reveal=false;$('musicReveal').setAttribute('aria-pressed','false');
  const previous=read('progress',{})[song.id],resume=previous?.revision===song.revision?Math.max(0,Math.min(Number(previous.time)||0,song.segments.at(-1).end)):0;
  if(previous?.revision===song.revision&&Number.isInteger(previous.index)&&song.segments[previous.index])index=previous.index;
  $('musicLesson').hidden=false;$('musicTitle').textContent=song.title;$('musicCredit').textContent=[song.artist,song.credit].filter(Boolean).join(' · ');video.hidden=song.source.kind==='youtube';$('musicYoutube').hidden=song.source.kind!=='youtube';lines();drawLine();
  if(song.source.kind==='youtube'){try{await mountYoutube(song,epoch,resume);}catch(e){if(epoch===serial)status(e.message);}return;}
  const loaded=()=>{if(epoch!==serial)return;video.playbackRate=Number($('musicRate').value);seek(resume);status(resume?'Đã khôi phục vị trí nghe. Bấm phát để tiếp tục.':'Bấm phát để nghe bài.');};video.addEventListener('loadedmetadata',loaded,{once:true});
  if(song.source.kind==='local'){objectUrl=URL.createObjectURL(file);video.src=objectUrl;}else video.src=config.endpoint+'/media/'+song.source.key;
  video.load();
 }
 async function authenticated(path){const user=window.HSKAccountDashboard?.user;if(!user)throw Error('Đăng nhập tài khoản app để mở kho nhạc.');fetcher?.abort();fetcher=new AbortController();const signal=fetcher.signal;const token=await user.getIdToken();if(signal.aborted)throw new DOMException('Aborted','AbortError');const r=await fetch(config.endpoint+path,{headers:{Authorization:'Bearer '+token},signal});if(!r.ok)throw Error(r.status===401?'Phiên đăng nhập hết hạn. Đăng nhập lại để tải kho.':'Không tải được kho nhạc ('+r.status+').');return r.json();}
 async function refresh(){const epoch=serial;status('Đang tải kho nhạc…');try{const r=await fetch('./music-config.json');if(!r.ok)throw Error('Không tải được cấu hình nhạc.');const cfg=await r.json();if(epoch!==serial||!opened)return;config=cfg;if(cfg.enabled){const endpoint=new URL(cfg.endpoint);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw Error('Địa chỉ kho nhạc chưa hợp lệ.');config.endpoint=endpoint.href.replace(/\/$/,'');const data=await authenticated('/api/songs');if(epoch!==serial||!opened)return;catalog=data.songs.map(C.validateSong);}else catalog=[];drawCatalog();status(catalog.length?'Chọn bài để bắt đầu.':'Kho nhạc chưa được kết nối. Bạn có thể thử bằng file nhạc và lời trên thiết bị.');}catch(e){if(epoch===serial&&e.name!=='AbortError')status(e.message);}}
 function drawCatalog(){const list=$('musicCatalog');list.replaceChildren();for(const value of catalog){const b=el('button',undefined,'music-card');b.type='button';b.append(el('strong',value.title),el('small',value.artist+' · '+value.segments.length+' câu'));b.onclick=()=>openSong(value);list.append(b);}}
 $('musicBack').onclick=()=>window.HSKStudio?.navigate('practice');$('musicRefresh').onclick=refresh;
 $('musicLevel').onchange=()=>{if(song){stop();lines();drawLine();}};$('musicLine').onchange=()=>choose(Number($('musicLine').value));
 $('musicNext').onclick=()=>{const options=[...$('musicLine').options].map(o=>Number(o.value)),pos=options.indexOf(index);if(pos+1<options.length)choose(options[pos+1]);else status('Đã đến câu cuối trong bộ lọc.');};
 $('musicPlay').onclick=()=>playing()?stop():play();$('musicReplay').onclick=()=>{seek(segment().start);play();};
 $('musicLoop').onclick=()=>{loop=!loop;$('musicLoop').setAttribute('aria-pressed',String(loop));$('musicLoop').textContent='Lặp câu: '+(loop?'bật':'tắt');if(loop){seek(segment().start);play();}};
 $('musicRate').onchange=()=>{const rate=Number($('musicRate').value);if(yt){const rates=yt.getAvailablePlaybackRates?.()||[];if(rates.includes(rate))yt.setPlaybackRate(rate);else status('Player này chưa hỗ trợ tốc độ đã chọn.');}else video.playbackRate=rate;};
 $('musicReveal').onclick=()=>{reveal=!reveal;$('musicReveal').setAttribute('aria-pressed',String(reveal));renderReveal();};
 for(const [id,type]of [['musicPin','pin'],['musicVi','vi']])$(id).onclick=()=>{if(type==='pin')pin=!pin;else vi=!vi;$(id).setAttribute('aria-pressed',String(type==='pin'?pin:vi));renderReveal();};
 const hold=$('musicHold'),unhold=()=>{holding=false;renderReveal();};hold.addEventListener('pointerdown',e=>{hold.setPointerCapture?.(e.pointerId);holding=true;renderReveal();});for(const e of ['pointerup','pointercancel','lostpointercapture'])hold.addEventListener(e,unhold);hold.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();holding=true;renderReveal();}};hold.onkeyup=unhold;hold.onblur=unhold;window.addEventListener('blur',unhold);
 $('musicAnswers').addEventListener('change',()=>{video.pause();yt?.pauseVideo?.();checkpoint(true);});
 $('musicQuiz').onsubmit=e=>{e.preventDefault();if(checked||!song)return;const selected=panel.querySelector('input[name=musicAnswer]:checked');if(!selected){$('musicResult').textContent='Chọn một đáp án trước.';return;}const answer=Number(selected.value),s=segment(),correct=C.grade(s,answer);checked=true;video.pause();yt?.pauseVideo?.();save('history',C.record(read('history',[]),song,s,answer));history();reveal=true;$('musicReveal').setAttribute('aria-pressed','true');renderReveal();$('musicCheck').disabled=true;$('musicResult').textContent=(correct?'Đúng. ':'Chưa đúng. ')+'Đáp án: '+s.quiz.options[s.quiz.answer]+'. '+s.vi;checkpoint(true);};
 $('musicImportApply').onclick=async()=>{const epoch=serial,json=$('musicManifest').files[0],file=$('musicFile').files[0];try{if(!json||json.size>500000)throw Error('Chọn file lời JSON tối đa 500 KB.');if(!file||file.size>52428800||!(/^(audio\/|video\/mp4)/.test(file.type)||/\.(mp3|mp4|m4a|wav|ogg)$/i.test(file.name)))throw Error('Chọn file nhạc/video tối đa 50 MB.');const value=C.validateSong(JSON.parse(await json.text()));if(epoch!==serial)return;if(value.source.kind!=='local')throw Error('Bài nhập từ thiết bị cần source.kind="local".');await openSong(value,file);}catch(e){if(epoch===serial)status(e.message);}};
 $('musicRecover').onclick=()=>{if(!song)return;const saved=time(),epoch=serial;if(yt){yt.seekTo(saved,true);play();return;}video.addEventListener('loadedmetadata',()=>{if(epoch===serial){seek(saved);status('Nguồn đã tải lại. Bấm phát để tiếp tục.');}},{once:true});video.load();};
 video.addEventListener('timeupdate',tick);video.addEventListener('error',()=>{if(song)status('Chưa phát được nguồn nhạc. Kiểm tra mạng, định dạng hoặc bấm tải lại nguồn.');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint(true);});window.addEventListener('pagehide',()=>checkpoint(true));
 new MutationObserver(()=>{if(panel.hidden&&opened){opened=false;stop();fetcher?.abort();++serial;}}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hsk-account-ready',()=>{fetcher?.abort();++serial;release(false);song=null;catalog=[];progress={};$('musicLesson').hidden=true;drawCatalog();history();if(opened)refresh();});
 window.HSKMusic={enter(){opened=true;history();if(song){lines();drawLine();}refresh();},stop};
})();
