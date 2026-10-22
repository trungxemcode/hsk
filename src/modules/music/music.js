/* Small music pilot, adapted from the supplied frontend-pwa skeleton. */
(()=>{
 'use strict';
 const C=window.HSKMusicCore;if(!C)return;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const $=id=>document.getElementById(id);
 const panel=el('section',undefined,'panel music-panel');panel.id='musicPanel';panel.dataset.studioHubPanel='music';panel.hidden=true;
 panel.innerHTML=`<div class="music-stage music-np"><img id="musicStageBg" class="music-np-bg" alt="" aria-hidden="true"><div class="music-top-bar"><button type="button" id="musicBack" class="music-top-btn" aria-label="Quay về trang chủ" title="Trang chủ"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 9.5 12 15l5.5-5.5"/></svg><span class="music-sr">← Trang chủ</span></button><h2 id="musicHeaderLabel" class="music-top-title">Nghe nhạc học HSK</h2><button type="button" id="musicMenuBtn" class="music-top-btn" aria-expanded="false" aria-controls="musicMenuSheet" aria-label="Mở menu nhạc và danh sách" title="Menu tùy chọn & danh sách bài"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg></button></div>
 <div id="musicEmptyNowPlaying" class="music-np-body music-np-empty"><div class="music-cover"><img id="musicEmptyThumb" class="music-thumb" alt="Đĩa nhạc HSK" loading="lazy"></div><div class="music-np-meta"><h3>Chưa phát bài hát</h3><p class="music-np-sub">Bấm nút <strong>⋯</strong> ở góc phải trên để dán link YouTube / Spotify / SoundCloud, mở Playlist hoặc chọn bài học HSK.</p></div><button type="button" id="musicEmptyOpenMenu" class="music-primary">⋯ Mở danh sách &amp; nhập nhạc</button></div>
 <section id="musicLinkPreview" class="music-np-body" hidden><img id="musicLinkBg" class="music-np-bg" alt="" aria-hidden="true" hidden><div id="musicLinkCover" class="music-cover" hidden><img id="musicLinkThumb" class="music-thumb" alt="Ảnh bìa bài hát" loading="lazy"></div><div class="music-np-meta"><h3 id="musicLinkTitle"></h3><p id="musicLinkNotice" class="music-np-sub"></p></div><div id="musicLinkScrubRow" class="music-np-scrub" hidden><span id="musicLinkElapsed" class="music-time">00:00</span><input type="range" id="musicLinkScrub" class="music-scrub" min="0" max="100" step="0.1" value="0" aria-label="Thanh tiến trình"><span id="musicLinkTime" class="music-time">-00:00</span></div><div id="musicLinkPlayer" class="music-link-player"></div><div id="musicLinkControls" class="music-transport" hidden><button type="button" id="musicLinkPrev" class="music-transport-btn" title="Bài trước" aria-label="Bài trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M6.5 6h1.8v12H6.5zm3.3 6 8.2 5.6V6.4z"/></svg></button><button type="button" id="musicLinkBack10" class="music-transport-btn" title="Tua ngược 10 giây" aria-label="Tua ngược 10 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4.8 12a7.2 7.2 0 1 0 2.3-5.3L4.8 9M4.8 4.8V9H9"/><text x="12" y="14.6" text-anchor="middle" font-size="6.8" font-weight="600" fill="currentColor" stroke="none">10</text></svg></button><button type="button" id="musicLinkPlay" class="music-transport-btn music-transport-play" title="Phát / tạm dừng" aria-label="Phát hoặc tạm dừng"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg></button><button type="button" id="musicLinkFwd10" class="music-transport-btn" title="Tua tới 10 giây" aria-label="Tua tới 10 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M19.2 12a7.2 7.2 0 1 1-2.3-5.3L19.2 9M19.2 4.8V9H15"/><text x="12" y="14.6" text-anchor="middle" font-size="6.8" font-weight="600" fill="currentColor" stroke="none">10</text></svg></button><button type="button" id="musicLinkNext" class="music-transport-btn" title="Bài tiếp theo" aria-label="Bài tiếp theo"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M15.7 6h1.8v12h-1.8zM6 17.6 14.2 12 6 6.4z"/></svg></button></div></section>
 <section id="musicLesson" class="music-np-body" hidden><div class="music-np-body"><img id="musicLessonBg" class="music-np-bg" alt="" aria-hidden="true" hidden><div id="musicLessonCover" class="music-cover" hidden><img id="musicLessonThumb" class="music-thumb" alt="Ảnh bìa bài học" loading="lazy"></div><video id="musicPlayer" class="music-player" controls playsinline preload="metadata"></video><div id="musicYoutube" class="music-youtube" hidden></div><div class="music-np-meta"><h3 id="musicTitle"></h3><p id="musicCredit" class="music-credit"></p></div><div class="music-np-scrub"><span id="musicElapsed" class="music-time">00:00</span><input type="range" id="musicScrub" class="music-scrub" min="0" max="100" step="0.1" value="0" aria-label="Thanh tiến trình bài học"><span id="musicTimeLabel" class="music-time">-00:00</span></div><div class="music-transport"><button type="button" id="musicPrevTrack" class="music-transport-btn" title="Bài / câu trước" aria-label="Bài hoặc câu trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M6.5 6h1.8v12H6.5zm3.3 6 8.2 5.6V6.4z"/></svg></button><button type="button" id="musicRewind10" class="music-transport-btn" title="Tua ngược 10 giây" aria-label="Tua ngược 10 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4.8 12a7.2 7.2 0 1 0 2.3-5.3L4.8 9M4.8 4.8V9H9"/><text x="12" y="14.6" text-anchor="middle" font-size="6.8" font-weight="600" fill="currentColor" stroke="none">10</text></svg></button><button type="button" id="musicPlay" class="music-transport-btn music-transport-play" title="Phát / tạm dừng" aria-label="Phát hoặc tạm dừng"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg></button><button type="button" id="musicForward10" class="music-transport-btn" title="Tua tới 10 giây" aria-label="Tua tới 10 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M19.2 12a7.2 7.2 0 1 1-2.3-5.3L19.2 9M19.2 4.8V9H15"/><text x="12" y="14.6" text-anchor="middle" font-size="6.8" font-weight="600" fill="currentColor" stroke="none">10</text></svg></button><button type="button" id="musicNextTrack" class="music-transport-btn" title="Bài / câu tiếp theo" aria-label="Bài hoặc câu tiếp theo"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M15.7 6h1.8v12h-1.8zM6 17.6 14.2 12 6 6.4z"/></svg></button></div>
 <div class="music-toolbar"><button type="button" id="musicRewind5" hidden>-5s</button><button type="button" id="musicForward5" hidden>+5s</button><button type="button" id="musicReplay">Nghe lại câu</button><button type="button" id="musicLoop" aria-pressed="false">Lặp câu: tắt</button><button type="button" id="musicHideVideo" aria-pressed="true" hidden>Ẩn khung YouTube: bật</button><button type="button" id="musicRecover">Tải lại nguồn nghe</button></div>
 <div class="music-settings"><label>Câu đang học <select id="musicLine"></select></label><label>Tốc độ <select id="musicRate"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option></select></label><button type="button" id="musicNext">Câu tiếp →</button></div></div>
 <div class="music-study"><div class="music-actions"><button type="button" id="musicHold">Giữ để xem lời</button><button type="button" id="musicReveal" aria-pressed="false">Hiện lời</button><button type="button" id="musicPin" aria-pressed="false">Pinyin</button><button type="button" id="musicVi" aria-pressed="false">Nghĩa Việt</button></div><div class="music-caption"><p id="musicHidden">Lời đang ẩn. Nghe và chọn ý bên dưới.</p><div id="musicLyrics" hidden><p id="musicHanzi" class="music-hanzi" lang="zh"></p><p id="musicPinyin" class="music-pin"></p><p id="musicMeaning" class="music-vi"></p></div></div><p id="musicDistribution" class="music-distribution"></p><div id="musicNewWords" class="music-new" hidden></div><form id="musicQuiz" class="music-quiz"><fieldset id="musicAnswers"></fieldset><button type="submit" id="musicCheck" class="music-primary">Xác nhận đáp án</button><p id="musicResult" class="music-result" role="status" aria-live="polite"></p></form></div></section></div>
 <div id="musicMenuBackdrop" class="music-menu-backdrop" hidden></div>
 <div id="musicMenuSheet" class="music-menu-sheet" role="region" aria-label="Tùy chọn nhạc và danh sách"><div class="music-menu-head"><strong>Tùy chọn &amp; Danh sách nhạc</strong><button type="button" id="musicMenuClose" class="music-menu-close" aria-label="Đóng menu">✕ Đóng</button></div>
 <p id="musicStatus" class="music-status" role="status" aria-live="polite"></p>
 <p class="music-intro">Nghe từng câu, tự đoán ý rồi đối chiếu lời. Lịch sử luyện nhạc được lưu riêng trên thiết bị.</p>
 <div id="musicLinkExtraActions" class="music-link-extra" hidden><div class="music-quick-playlist"><label>Lưu bài đang mở vào playlist <select id="musicPreviewPlaylistSelect"><option value="">— Chọn playlist —</option></select></label><button type="button" id="musicPreviewPlaylistAdd">+ Lưu vào playlist</button></div><a id="musicSourceLink" class="music-np-source" target="_blank" rel="noopener noreferrer">Mở bài trên trang nguồn ↗</a></div>
 <details id="musicLinkImport" open><summary>Nhập bài hát từ link</summary><form id="musicLinkForm" class="music-import"><label>Link YouTube, Spotify hoặc SoundCloud <input id="musicLinkUrl" type="url" inputmode="url" required maxlength="2048" placeholder="https://…" autocomplete="off"></label><label>Tên bài hát (không bắt buộc) <input id="musicLinkName" maxlength="120" autocomplete="off"></label><label>Thêm vào playlist (không bắt buộc) <select id="musicLinkPlaylist"><option value="">— Không thêm vào playlist —</option></select></label><label>Lời và bài tập JSON (không bắt buộc) <input id="musicLinkLyrics" type="file" accept=".json,application/json"></label><p>Chỉ có link: mở nghe bằng player của nguồn. Có lời theo thời gian: học từng câu trên YouTube hoặc SoundCloud. Spotify hiện mở nghe, chưa đồng bộ bài tập theo câu.</p><button type="submit" id="musicLinkApply" class="music-primary">Mở bài từ link</button></form></details>
 <details id="musicPlaylistsBox" open><summary>Bộ sưu tập &amp; Playlist của bạn</summary><div class="music-import"><form id="musicPlaylistCreateForm" class="music-playlist-create"><label>Tên playlist mới <input id="musicPlaylistName" maxlength="80" placeholder="VD: Nhạc Hoa chill, HSK 3 nghe mỗi ngày…" autocomplete="off" required></label><button type="submit" id="musicPlaylistCreateBtn" class="music-primary">+ Tạo playlist</button></form><div id="musicPlaylistList" class="music-playlist-list"></div></div></details>
 <details><summary>Link đã lưu trên thiết bị này</summary><div id="musicSavedLinks" class="music-catalog"></div></details>
 <div class="music-settings music-filter-row"><label>Lọc câu theo cấp <select id="musicLevel"><option value="all">Tất cả HSK</option><option value="new">Câu có từ mới</option></select></label><button type="button" id="musicRefresh">Tải kho nhạc</button></div><div id="musicCatalog" class="music-catalog"></div>
 <details id="musicImport"><summary>Thử với file nhạc và lời của bạn</summary><div class="music-import"><p>Chọn file âm thanh/video và file JSON có lời, thời gian, pinyin, nghĩa cùng câu hỏi. File nhạc chỉ được phát trên máy này; không tự tải lên mạng.</p><a href="./content/music/lesson-template.json" download="music-lesson-template.json">Tải mẫu cấu trúc lời JSON</a><label>File lời bài hát JSON <input id="musicManifest" type="file" accept=".json,application/json"></label><label>File nhạc hoặc video (tối đa 50 MB) <input id="musicFile" type="file" accept="audio/*,video/mp4"></label><button type="button" id="musicImportApply" class="music-primary">Mở bài đã chọn</button></div></details>
 <details><summary>Lịch sử luyện nhạc trên thiết bị này</summary><ul id="musicHistory" class="music-history"></ul></details></div>`;
 document.querySelector('main.workspace').append(panel);
 for(let n=1;n<=6;n++)$('musicLevel').add(new Option('HSK '+n,String(n)));
 const video=$('musicPlayer');
 let song=null,index=0,loop=false,reveal=false,holding=false,pin=false,vi=false,hideYt=true,menuOpen=false,objectUrl=null,yt=null,ytTimer=null,linkYt=null,linkTimer=null,currentLinkUrl='',currentLinkTitle='',activePlaylistId='',serial=0,fetcher=null,opened=false,checked=false,lastSaved=0,lastTime=0;
 let catalog=[],config={enabled:false,endpoint:''},lexicon=C.dictionary([]),lexiconSource=null,progress={};
 const owner=()=>window.HSKAccountDashboard?.user?.uid||'guest';
 const key=type=>'hsk-music-'+type+'-v1:'+owner();
 const fmtTime=sec=>{const s=Math.max(0,Math.floor(Number(sec)||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
 const ICONS={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg>',pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="6" width="3" height="12" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="6" width="3" height="12" rx="1" fill="currentColor" stroke="none"/></svg>'};
 function paintScrub(input,cur,dur){const pct=dur>0?Math.max(0,Math.min(100,cur/dur*100)):0;input.style.setProperty('--pct',pct+'%');}
 const remaining=(cur,dur)=>'-'+fmtTime(Math.max(0,dur-cur));
 function setArt(thumb,bg,src){const stage=$('musicStageBg'),fall=()=>{thumb.onerror=bg.onerror=stage.onerror=null;thumb.classList.remove('music-thumb-yt');thumb.src=bg.src=stage.src=fallbackArt;};thumb.onerror=bg.onerror=stage.onerror=fall;thumb.classList.toggle('music-thumb-yt',src!==fallbackArt);thumb.src=bg.src=stage.src=src;bg.hidden=true;stage.hidden=false;}
 const ytThumb=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
 const fallbackArt='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#4338ca"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="320" cy="170" r="58" fill="rgba(255,255,255,0.14)"/><text x="320" y="188" text-anchor="middle" font-size="52" fill="#ffffff" font-family="sans-serif">♪</text></svg>');
 $('musicEmptyThumb').src=$('musicStageBg').src=fallbackArt;
 function toggleMenu(force){
  menuOpen=typeof force==='boolean'?force:!menuOpen;
  panel.classList.toggle('music-menu-open',menuOpen);
  $('musicMenuBtn').setAttribute('aria-expanded',String(menuOpen));
  $('musicMenuBackdrop').hidden=!menuOpen;
  if(menuOpen)$('musicMenuSheet').scrollTop=0;
 }
 function syncEmptyState(){
  const hasActive=!$('musicLinkPreview').hidden||!$('musicLesson').hidden;
  $('musicEmptyNowPlaying').hidden=hasActive;
  if(!hasActive)$('musicStageBg').src=fallbackArt;
  const activePl=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
  $('musicHeaderLabel').textContent=activePl?activePl.name:song?song.title:currentLinkTitle||'Nghe nhạc học HSK';
 }
 $('musicMenuBtn').onclick=()=>toggleMenu();
 $('musicMenuClose').onclick=()=>toggleMenu(false);
 $('musicMenuBackdrop').onclick=()=>toggleMenu(false);
 $('musicEmptyOpenMenu').onclick=()=>toggleMenu(true);
 function read(type,fallback){try{return JSON.parse(localStorage.getItem(key(type))||'null')||fallback;}catch{return fallback;}}
 function save(type,value){try{localStorage.setItem(key(type),JSON.stringify(value));}catch{status('Bộ nhớ thiết bị đầy; chưa lưu được lịch sử.');}}
 function status(message){$('musicStatus').textContent=message;}
 function vocab(){let rows=[];try{rows=typeof words!=='undefined'?words:[];}catch{}if(rows!==lexiconSource){lexicon=C.dictionary(rows);lexiconSource=rows;}return lexicon;}
 const segment=()=>song?.segments[index];
 const time=()=>yt?Number(yt.getCurrentTime?.()||0):video.currentTime;
 const duration=()=>{if(yt){const d=Number(yt.getDuration?.()||0);if(d>0)return d;}else if(Number.isFinite(video.duration)&&video.duration>0)return video.duration;return song?.segments.at(-1)?.end||0;};
 const playing=()=>yt?yt.getPlayerState?.()===1:!video.paused;
 function updatePlayButton(){$('musicPlay').innerHTML=playing()?ICONS.pause:ICONS.play;$('musicPlay').setAttribute('aria-pressed',String(playing()));}
 function updateLinkPlayButton(){const p=linkYt?.getPlayerState?.()===1;$('musicLinkPlay').innerHTML=p?ICONS.pause:ICONS.play;$('musicLinkPlay').setAttribute('aria-pressed',String(p));}
 function updateScrubUI(){const cur=time(),dur=duration();if(dur>0){$('musicScrub').max=String(dur);$('musicScrub').value=String(Math.min(cur,dur));}paintScrub($('musicScrub'),cur,dur);$('musicElapsed').textContent=fmtTime(cur);$('musicTimeLabel').textContent=remaining(cur,dur);updatePlayButton();}
 function checkpoint(force=false){if(!song||(!force&&Date.now()-lastSaved<2000))return;lastSaved=Date.now();progress=read('progress',{});progress[song.id]={revision:song.revision,index,time:time()};const entries=Object.entries(progress).slice(-30);save('progress',Object.fromEntries(entries));}
 function pauseNative(){if(video.hasAttribute('src'))video.pause();}
 function clearPreview(){$('musicLinkScrubRow').hidden=true;$('musicLinkExtraActions').hidden=true;linkYt?.destroy?.();linkYt=null;clearInterval(linkTimer);linkTimer=null;$('musicLinkPlayer').replaceChildren();$('musicLinkCover').hidden=true;$('musicLinkControls').hidden=true;$('musicLinkPreview').hidden=true;syncEmptyState();}
 function release(savePosition=true){if(savePosition)checkpoint(true);if(video.hasAttribute('src')){video.pause();video.removeAttribute('src');video.load();}yt?.destroy?.();yt=null;clearInterval(ytTimer);ytTimer=null;clearPreview();if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
 function stop(){checkpoint(true);pauseNative();yt?.pauseVideo?.();linkYt?.pauseVideo?.();clearPreview();holding=false;renderReveal();updatePlayButton();}
 function savedLinks(){const value=read('links',[]);return Array.isArray(value)?value:[];}
 function savedPlaylists(){const value=read('playlists',[]);return Array.isArray(value)?value.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.items)):[];}
 function syncPlaylistSelects(){
  const lists=savedPlaylists();
  for(const [id,placeholder] of [['musicLinkPlaylist','— Không thêm vào playlist —'],['musicPreviewPlaylistSelect','— Chọn playlist —']]){
   const sel=$(id),prev=sel.value;sel.replaceChildren(new Option(placeholder,''));
   for(const p of lists)sel.add(new Option(p.name+' ('+p.items.length+')',p.id));
   if(lists.some(p=>p.id===prev))sel.value=prev;
  }
 }
 function addTrackToPlaylist(playlistId,link,title){
  const lists=savedPlaylists(),target=lists.find(p=>p.id===playlistId);if(!target)return false;
  const itemTitle=String(title||link.label).slice(0,120);
  target.items=[{url:link.url,title:itemTitle},...target.items.filter(x=>x.url!==link.url)].slice(0,50);
  save('playlists',lists);drawPlaylists();drawLinks();return true;
 }
 function drawPlaylists(){
  syncPlaylistSelects();
  const box=$('musicPlaylistList'),lists=savedPlaylists();box.replaceChildren();
  if(!lists.length){box.append(el('p','Chưa có playlist nào. Đặt tên ở trên để tạo bộ sưu tập bài hát của bạn.'));return;}
  for(const pl of lists){
   const card=el('div',undefined,'music-playlist-card'+(activePlaylistId===pl.id?' music-playlist-active':''));
   const head=el('div',undefined,'music-playlist-head');
   let coverSrc=fallbackArt;
   for(const item of pl.items){try{const l=C.parseLink(item.url);if(l.kind==='youtube'){coverSrc=ytThumb(l.source.videoId);break;}}catch{}}
   const img=el('img',undefined,'music-playlist-thumb');img.alt=pl.name;img.src=coverSrc;img.onerror=()=>{img.onerror=null;img.src=fallbackArt;};
   const meta=el('div',undefined,'music-playlist-meta');
   meta.append(el('strong',pl.name),el('small',pl.items.length+' bài hát'+(activePlaylistId===pl.id?' · Đang phát':'')));
   const actions=el('div',undefined,'music-playlist-actions');
   const playBtn=el('button','▶ Phát bộ sưu tập','music-primary');playBtn.type='button';playBtn.disabled=!pl.items.length;
   playBtn.onclick=()=>{if(!pl.items.length)return;activePlaylistId=pl.id;const first=pl.items[0];try{const link=C.parseLink(first.url);$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(first.title||'').slice(0,120);openLink(link,first.title,false,pl.id);}catch{}};
   const renameBtn=el('button','Đổi tên');renameBtn.type='button';
   renameBtn.onclick=()=>{const row=card.querySelector('.music-playlist-rename');if(row){row.hidden=!row.hidden;if(!row.hidden)row.querySelector('input')?.focus();}};
   const delBtn=el('button','Xóa');delBtn.type='button';
   delBtn.onclick=()=>{if(activePlaylistId===pl.id)activePlaylistId='';save('playlists',savedPlaylists().filter(x=>x.id!==pl.id));drawPlaylists();drawLinks();syncEmptyState();status('Đã xóa playlist "'+pl.name+'".');};
   actions.append(playBtn,renameBtn,delBtn);
   head.append(img,meta,actions);
   const renameRow=el('form',undefined,'music-playlist-rename');renameRow.hidden=true;
   const renameInput=el('input');renameInput.type='text';renameInput.maxLength=80;renameInput.value=pl.name;renameInput.required=true;
   const renameSave=el('button','Lưu tên','music-primary');renameSave.type='submit';
   renameRow.append(renameInput,renameSave);
   renameRow.onsubmit=e=>{e.preventDefault();const nextName=renameInput.value.trim().slice(0,80);if(!nextName)return;const all=savedPlaylists(),found=all.find(x=>x.id===pl.id);if(found){found.name=nextName;save('playlists',all);drawPlaylists();syncEmptyState();status('Đã đổi tên playlist thành "'+nextName+'".');}};
   const addForm=el('form',undefined,'music-playlist-add-track');
   const urlIn=el('input');urlIn.type='url';urlIn.inputMode='url';urlIn.required=true;urlIn.maxLength=2048;urlIn.placeholder='Dán link YouTube / Spotify / SoundCloud…';
   const titleIn=el('input');titleIn.type='text';titleIn.maxLength=120;titleIn.placeholder='Tên bài hát (tùy chọn)';
   const addBtn=el('button','+ Thêm bài');addBtn.type='submit';
   addForm.append(urlIn,titleIn,addBtn);
   addForm.onsubmit=e=>{e.preventDefault();try{const link=C.parseLink(urlIn.value),t=titleIn.value.trim()||link.label;rememberLink(link,t);addTrackToPlaylist(pl.id,link,t);urlIn.value='';titleIn.value='';status('Đã thêm "'+t+'" vào playlist "'+pl.name+'".');}catch(err){status(err.message);}};
   const trackList=el('div',undefined,'music-playlist-tracks');
   if(!pl.items.length){trackList.append(el('p','Playlist trống. Dán link ở trên hoặc chọn từ mục Link đã lưu để thêm bài.'));}
   else{
    pl.items.forEach((entry,idx)=>{
     let link;try{link=C.parseLink(entry.url);}catch{return;}
     const isCurrent=currentLinkUrl===link.url&&activePlaylistId===pl.id;
     const row=el('div',undefined,'music-playlist-track'+(isCurrent?' music-track-current':''));
     const open=el('button',undefined,'music-row-main');open.type='button';
     const thumb=el('img',undefined,'music-row-thumb');thumb.alt='';thumb.src=link.kind==='youtube'?ytThumb(link.source.videoId):fallbackArt;thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
     const copy=el('span',undefined,'music-row-copy');
     copy.append(el('strong',(idx+1)+'. '+String(entry.title||link.label).slice(0,120)),el('small',(isCurrent?'♫ Đang phát · ':'')+link.label));
     open.append(thumb,copy);
     open.onclick=()=>{$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);openLink(link,entry.title,false,pl.id);};
     const remove=el('button','Gỡ','music-row-del');remove.type='button';
     remove.onclick=()=>{const all=savedPlaylists(),found=all.find(x=>x.id===pl.id);if(!found)return;found.items=found.items.filter(x=>x.url!==entry.url);save('playlists',all);drawPlaylists();};
     row.append(open,remove);trackList.append(row);
    });
   }
   card.append(head,renameRow,trackList,addForm);box.append(card);
  }
 }
 $('musicPlaylistCreateForm').onsubmit=e=>{
  e.preventDefault();
  const name=$('musicPlaylistName').value.trim().slice(0,80);if(!name)return;
  const lists=savedPlaylists();
  if(lists.length>=25){status('Tối đa 25 playlist trên thiết bị này.');return;}
  const id='pl-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  save('playlists',[{id,name,items:[]},...lists]);
  $('musicPlaylistName').value='';drawPlaylists();drawLinks();
  $('musicLinkPlaylist').value=id;$('musicPreviewPlaylistSelect').value=id;
  status('Đã tạo playlist "'+name+'".');
 };
 $('musicPreviewPlaylistAdd').onclick=()=>{
  if(!currentLinkUrl){status('Mở một bài hát từ link trước khi lưu vào playlist.');return;}
  const pid=$('musicPreviewPlaylistSelect').value;
  if(!pid){status('Chọn một playlist để lưu bài hát.');return;}
  try{
   const link=C.parseLink(currentLinkUrl);
   const pl=savedPlaylists().find(p=>p.id===pid);
   if(addTrackToPlaylist(pid,link,currentLinkTitle||$('musicLinkTitle').textContent)){
    status('Đã lưu vào playlist "'+(pl?.name||'')+'".');
   }
  }catch(e){status(e.message);}
 };
 function drawLinks(){
  const box=$('musicSavedLinks'),lists=savedPlaylists();box.replaceChildren();
  for(const entry of savedLinks().slice(0,30)){
   let link;try{link=C.parseLink(entry.url);}catch{continue;}
   const isCurrent=currentLinkUrl===link.url&&!activePlaylistId;
   const item=el('div',undefined,'music-saved-item'+(isCurrent?' music-track-current':'')),open=el('button',undefined,'music-row-main'),remove=el('button','Xóa','music-row-del');
   open.type=remove.type='button';remove.title='Xóa link đã lưu';
   const thumb=el('img',undefined,'music-row-thumb');thumb.alt='';thumb.src=link.kind==='youtube'?ytThumb(link.source.videoId):fallbackArt;thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
   const copy=el('span',undefined,'music-row-copy');
   copy.append(el('strong',String(entry.title||link.label).slice(0,120)),el('small',(isCurrent?'♫ Đang phát · ':'')+link.label));
   open.append(thumb,copy);
   open.onclick=()=>{$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);$('musicLinkLyrics').value='';openLink(link,entry.title);};
   remove.onclick=()=>{save('links',savedLinks().filter(x=>x.url!==entry.url));drawLinks();};
   const actions=el('div',undefined,'music-saved-actions');
   if(lists.length){
    const addRow=el('div',undefined,'music-saved-add-pl');
    const sel=el('select');sel.setAttribute('aria-label','Chọn playlist');sel.add(new Option('+ Playlist…',''));
    for(const p of lists)sel.add(new Option(p.name,p.id));
    sel.onchange=()=>{if(!sel.value)return;const pl=lists.find(x=>x.id===sel.value);addTrackToPlaylist(sel.value,link,entry.title);sel.value='';status('Đã thêm vào playlist "'+(pl?.name||'')+'".');};
    addRow.append(sel);actions.append(addRow);
   }
   actions.append(remove);item.append(open,actions);box.append(item);
  }
  if(!box.children.length)box.append(el('p','Chưa có link bài hát.'));
 }
 function rememberLink(link,title){save('links',[{url:link.url,title:String(title||link.label).slice(0,120)},...savedLinks().filter(x=>x.url!==link.url)].slice(0,30));drawLinks();}
 function stepSavedLink(dir){
  const activePl=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
  const list=activePl?.items?.length?activePl.items:savedLinks();
  if(!list.length)return;
  const idx=list.findIndex(x=>x.url===currentLinkUrl);
  const nextIdx=idx<0?0:(idx+dir+list.length)%list.length;
  const entry=list[nextIdx];
  try{const link=C.parseLink(entry.url);$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);openLink(link,entry.title,false,activePl?.id||'');}catch{}
 }
 function openLink(link,title,saveOrder=true,playlistId=''){
  release();song=null;const epoch=++serial;currentLinkUrl=link.url;currentLinkTitle=String(title||link.label).slice(0,120);activePlaylistId=playlistId;loop=false;$('musicLoop').setAttribute('aria-pressed','false');$('musicLoop').textContent='Lặp câu: tắt';$('musicLesson').hidden=true;$('musicLinkPreview').hidden=false;$('musicLinkExtraActions').hidden=false;$('musicLinkTitle').textContent=title||'Bài hát '+link.label;$('musicSourceLink').href=link.url;
  const activePl=playlistId?savedPlaylists().find(p=>p.id===playlistId):null;
  $('musicLinkNotice').textContent=activePl?activePl.name+' · '+link.label:link.label;
  const frame=el('iframe');frame.title='Trình phát '+link.label;frame.src=link.embedUrl+(link.kind==='youtube'?'?controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&enablejsapi=1':'');frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';frame.height=link.kind==='youtube'?'200':link.kind==='spotify'?'352':'166';frame.width='100%';
  $('musicLinkPlayer').classList.toggle('music-youtube-stealth',link.kind==='youtube');$('musicLinkPlayer').append(frame);
  const isYt=link.kind==='youtube';
  $('musicLinkControls').hidden=false;
  for(const id of ['musicLinkBack10','musicLinkPlay','musicLinkFwd10'])$(id).disabled=!isYt;
  if(isYt){
   setArt($('musicLinkThumb'),$('musicLinkBg'),ytThumb(link.source.videoId));
   $('musicLinkCover').hidden=false;$('musicLinkScrubRow').hidden=false;$('musicLinkScrub').value='0';paintScrub($('musicLinkScrub'),0,0);$('musicLinkElapsed').textContent='00:00';$('musicLinkTime').textContent='-00:00';updateLinkPlayButton();
   youtubeApi().then(()=>{if(epoch!==serial||!opened)return;linkYt=new YT.Player(frame,{events:{onReady:()=>{if(epoch===serial){updateLinkPlayButton();status('Bấm ▶ để phát hoặc tua bằng bộ nút << < || > >>.');}},onStateChange:ev=>{if(epoch!==serial)return;updateLinkPlayButton();if(ev?.data===0&&activePlaylistId)stepSavedLink(1);}}});linkTimer=setInterval(()=>{if(epoch!==serial||!linkYt)return;const c=Number(linkYt.getCurrentTime?.()||0),d=Number(linkYt.getDuration?.()||0);if(d>0){$('musicLinkScrub').max=String(d);$('musicLinkScrub').value=String(Math.min(c,d));}paintScrub($('musicLinkScrub'),c,d);$('musicLinkElapsed').textContent=fmtTime(c);$('musicLinkTime').textContent=remaining(c,d);updateLinkPlayButton();},250);}).catch(()=>{});
  }else{
   $('musicLinkCover').hidden=true;$('musicLinkBg').hidden=true;$('musicStageBg').src=fallbackArt;$('musicLinkScrubRow').hidden=true;updateLinkPlayButton();
  }
  if(saveOrder)rememberLink(link,title);else drawLinks();
  drawPlaylists();
  toggleMenu(false);
  syncEmptyState();
  status('Đã mở link '+link.label+'. Chưa gắn dữ liệu bài học HSK.');
 }
 $('musicLinkPlay').onclick=()=>{if(!linkYt)return;if(linkYt.getPlayerState?.()===1)linkYt.pauseVideo?.();else linkYt.playVideo?.();updateLinkPlayButton();};
 $('musicLinkBack10').onclick=()=>{if(!linkYt)return;const cur=Number(linkYt.getCurrentTime?.()||0),dur=Number(linkYt.getDuration?.()||0),next=Math.max(0,dur>0?Math.min(dur,cur-10):cur-10);linkYt.seekTo?.(next,true);};
 $('musicLinkFwd10').onclick=()=>{if(!linkYt)return;const cur=Number(linkYt.getCurrentTime?.()||0),dur=Number(linkYt.getDuration?.()||0),next=Math.max(0,dur>0?Math.min(dur,cur+10):cur+10);linkYt.seekTo?.(next,true);};
 $('musicLinkPrev').onclick=()=>{if(linkYt&&Number(linkYt.getCurrentTime?.()||0)>5){linkYt.seekTo?.(0,true);return;}stepSavedLink(-1);};
 $('musicLinkNext').onclick=()=>stepSavedLink(1);
 $('musicLinkScrub').oninput=()=>{if(!linkYt)return;linkYt.seekTo?.(Number($('musicLinkScrub').value)||0,true);};
 $('musicLinkForm').onsubmit=async event=>{event.preventDefault();const epoch=serial,button=$('musicLinkApply');button.disabled=true;try{const link=C.parseLink($('musicLinkUrl').value),name=$('musicLinkName').value.trim(),playlistId=$('musicLinkPlaylist').value,file=$('musicLinkLyrics').files[0];if(playlistId)addTrackToPlaylist(playlistId,link,name||link.label);if(!file){openLink(link,name,true,playlistId);return;}if(link.kind==='spotify')throw Error('Spotify hiện hỗ trợ mở nghe. Học theo câu cần link YouTube, SoundCloud hoặc file nhạc.');if(file.size>500000)throw Error('File lời tối đa 500 KB.');const raw=JSON.parse(await file.text());const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(link.url));if(epoch!==serial||!opened)return;const id='link-'+[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,48);const lesson=C.validateSong({...raw,id,title:name||raw.title,source:link.source});rememberLink(link,name||lesson.title);await openSong(lesson);}catch(e){if(epoch===serial)status(e.message);}finally{button.disabled=false;}};
 function history(){const box=$('musicHistory');box.replaceChildren();const rows=read('history',[]);if(!rows.length){box.append(el('li','Chưa có câu đã trả lời.'));return;}for(const r of rows.slice(0,30))box.append(el('li',r.title+' · '+r.segmentId+' · '+(r.correct?'Đúng':'Cần ôn')+' · '+new Date(r.at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})));}
 function renderReveal(){const visible=reveal||holding;$('musicLyrics').hidden=!visible;$('musicHidden').hidden=visible;$('musicPinyin').hidden=!pin;$('musicMeaning').hidden=!vi;}
 function classify(s){return C.classify(s,vocab());}
 function lines(){
  const select=$('musicLine');select.replaceChildren();if(!song)return;
  song.segments.forEach((s,i)=>{const c=classify(s),filter=$('musicLevel').value;if(filter!=='all'&&(filter==='new'?!c.newWords.length:c.level!==Number(filter)))return;select.add(new Option('Câu '+(i+1)+' · '+(c.level?'HSK '+c.level:'Chưa xếp HSK')+(c.newWords.length?' · có từ mới':''),String(i)));});
  $('musicLesson').hidden=!select.options.length;
  syncEmptyState();
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
 function seek(t){const clamped=Math.max(0,t);if(yt)yt.seekTo(clamped,true);else if(video.readyState>=1)video.currentTime=Math.min(clamped,Number.isFinite(video.duration)?Math.max(0,video.duration-.05):clamped);updateScrubUI();}
 function seekBy(delta){if(!song)return;const d=duration(),target=Math.max(0,time()+delta);seek(d>0?Math.min(d-.05,target):target);}
 async function play(){if(!song)return;const epoch=serial;try{if(yt)yt.playVideo();else await video.play();if(epoch===serial){status('');updatePlayButton();}}catch{if(epoch===serial)status('Chạm nút phát của trình nghe để bắt đầu có tiếng.');}}
 function tick(){
  if(!song||!opened)return;const t=time();if(!Number.isFinite(t))return;
  updateScrubUI();
  if(loop&&playing()&&t>=segment().end-.04){seek(segment().start);lastTime=segment().start;return;}
  if(!loop&&playing()){const active=C.activeSegment(song.segments,t);if(active>=0&&active!==index&&[...$('musicLine').options].some(o=>Number(o.value)===active)){index=active;drawLine();}}
  lastTime=t;checkpoint();
 }
 function choose(i,autoplay=false){if(!song||!song.segments[i])return;stop();index=i;drawLine();seek(segment().start);checkpoint(true);if(autoplay)play();}
 function stepLessonTrack(dir){
  if(!song)return;
  const options=[...$('musicLine').options].map(o=>Number(o.value)),pos=options.indexOf(index);
  if(pos+dir>=0&&pos+dir<options.length){choose(options[pos+dir]);return;}
  if(catalog.length>1){const cIdx=catalog.findIndex(s=>s.id===song.id);if(cIdx>=0){openSong(catalog[(cIdx+dir+catalog.length)%catalog.length]);return;}}
  status(dir>0?'Đã đến câu cuối trong bộ lọc.':'Đã ở câu đầu tiên trong bộ lọc.');
 }
 async function youtubeApi(){
  if(window.YT?.Player)return;
  if(!youtubeApi.loading)youtubeApi.loading=new Promise((resolve,reject)=>{const script=el('script');script.src='https://www.youtube.com/iframe_api';const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve();};script.onerror=()=>reject(Error('Không tải được player YouTube.'));document.head.append(script);setTimeout(()=>{if(!window.YT?.Player)reject(Error('Player YouTube chưa sẵn sàng.'));},12000);}).catch(e=>{youtubeApi.loading=null;throw e;});
  return youtubeApi.loading;
 }
 async function mountYoutube(value,epoch,resume){
  await youtubeApi();if(epoch!==serial||!opened)return;
  const mount=el('div');$('musicYoutube').replaceChildren(mount);yt=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:value.source.videoId,width:'100%',height:'100%',playerVars:{playsinline:1,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,rel:0,origin:location.origin},events:{onReady:event=>{if(epoch!==serial)return;event.target.seekTo(resume,true);updateScrubUI();status('Bấm ▶ để phát hoặc tua bằng bộ điều khiển << < || > >>.');},onStateChange:()=>{if(epoch===serial)tick();},onAutoplayBlocked:()=>{if(epoch===serial)status('Bấm nút ▶ để tiếp tục phát.');},onError:()=>{if(epoch===serial)status('Video YouTube không khả dụng hoặc không cho phép nhúng. Hãy chọn bài khác.');}}});ytTimer=setInterval(tick,200);
 }
 async function openSong(value,file=null){
  let valid;try{valid=C.validateSong(value);}catch(e){status(e.message);return;}
  if(valid.source.kind==='local'&&!file){status('Chọn lại file nhạc trên thiết bị để mở bài này.');$('musicImport').open=true;toggleMenu(true);return;}
  release();const epoch=++serial;song=valid;index=0;loop=false;$('musicLoop').textContent='Lặp câu: tắt';$('musicLoop').setAttribute('aria-pressed','false');reveal=false;$('musicReveal').setAttribute('aria-pressed','false');
  const previous=read('progress',{})[song.id],resume=previous?.revision===song.revision?Math.max(0,Math.min(Number(previous.time)||0,song.segments.at(-1).end)):0;
  if(previous?.revision===song.revision&&Number.isInteger(previous.index)&&song.segments[previous.index])index=previous.index;
  const isYt=song.source.kind==='youtube',external=['youtube','soundcloud'].includes(song.source.kind);
  setArt($('musicLessonThumb'),$('musicLessonBg'),isYt?ytThumb(song.source.videoId):fallbackArt);
  $('musicLessonCover').hidden=false;$('musicLesson').hidden=false;$('musicTitle').textContent=song.title;$('musicCredit').textContent=[song.artist,song.credit].filter(Boolean).join(' · ');video.hidden=external;$('musicYoutube').hidden=!external;$('musicYoutube').classList.toggle('music-soundcloud',song.source.kind==='soundcloud');$('musicYoutube').classList.toggle('music-youtube-stealth',isYt&&hideYt);$('musicHideVideo').hidden=!isYt;$('musicHideVideo').setAttribute('aria-pressed',String(hideYt));$('musicHideVideo').textContent='Ẩn khung YouTube: '+(hideYt?'bật':'tắt');$('musicRate').disabled=song.source.kind==='soundcloud';lines();drawLine();updateScrubUI();toggleMenu(false);syncEmptyState();
  if(isYt){try{await mountYoutube(song,epoch,resume);}catch(e){if(epoch===serial)status(e.message);}return;}
  if(song.source.kind==='soundcloud'){status('Đang mở trình phát SoundCloud…');try{const adapter=await window.HSKMusicSoundCloud.mount(song.source,$('musicYoutube'),{isCurrent:()=>epoch===serial&&opened,onReady:player=>{player.seekTo(resume,true);status('Chạm vào player SoundCloud để phát.');},onTick:tick,onError:status});if(epoch!==serial||!opened){adapter?.destroy();return;}yt=adapter;}catch(e){if(epoch===serial)status(e.message);}return;}
  const loaded=()=>{if(epoch!==serial)return;video.playbackRate=Number($('musicRate').value);seek(resume);updateScrubUI();status(resume?'Đã khôi phục vị trí nghe. Bấm phát để tiếp tục.':'Bấm phát để nghe bài.');};video.addEventListener('loadedmetadata',loaded,{once:true});
  if(song.source.kind==='local'){objectUrl=URL.createObjectURL(file);video.src=objectUrl;}else video.src=config.endpoint+'/media/'+song.source.key;
  video.load();
 }
 async function authenticated(path){const user=window.HSKAccountDashboard?.user;if(!user)throw Error('Đăng nhập tài khoản app để mở kho nhạc.');fetcher?.abort();fetcher=new AbortController();const signal=fetcher.signal;const token=await user.getIdToken();if(signal.aborted)throw new DOMException('Aborted','AbortError');const r=await fetch(config.endpoint+path,{headers:{Authorization:'Bearer '+token},signal});if(!r.ok)throw Error(r.status===401?'Phiên đăng nhập hết hạn. Đăng nhập lại để tải kho.':'Không tải được kho nhạc ('+r.status+').');return r.json();}
 async function refresh(){const epoch=serial;status('Đang tải kho nhạc…');try{const r=await fetch('./music-config.json');if(!r.ok)throw Error('Không tải được cấu hình nhạc.');const cfg=await r.json();if(epoch!==serial||!opened)return;config=cfg;if(cfg.enabled){const endpoint=new URL(cfg.endpoint);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw Error('Địa chỉ kho nhạc chưa hợp lệ.');config.endpoint=endpoint.href.replace(/\/$/,'');const data=await authenticated('/api/songs');if(epoch!==serial||!opened)return;catalog=data.songs.map(C.validateSong);}else catalog=[];drawCatalog();status(catalog.length?'Chọn bài để bắt đầu.':'Kho nhạc chưa được kết nối. Bạn có thể thử bằng file nhạc và lời trên thiết bị.');}catch(e){if(epoch===serial&&e.name!=='AbortError')status(e.message);}}
 function drawCatalog(){const list=$('musicCatalog');list.replaceChildren();for(const value of catalog){const b=el('button',undefined,'music-card');b.type='button';b.append(el('strong',value.title),el('small',value.artist+' · '+value.segments.length+' câu'));b.onclick=()=>openSong(value);list.append(b);}}
 $('musicBack').onclick=()=>window.HSKStudio?.navigate('home');$('musicRefresh').onclick=refresh;
 $('musicLevel').onchange=()=>{if(song){stop();lines();drawLine();}};$('musicLine').onchange=()=>choose(Number($('musicLine').value));
 $('musicNext').onclick=()=>stepLessonTrack(1);
 $('musicPrevTrack').onclick=()=>stepLessonTrack(-1);
 $('musicNextTrack').onclick=()=>stepLessonTrack(1);
 $('musicPlay').onclick=()=>playing()?stop():play();$('musicReplay').onclick=()=>{seek(segment().start);play();};
 $('musicRewind10').onclick=()=>seekBy(-10);$('musicRewind5').onclick=()=>seekBy(-5);$('musicForward5').onclick=()=>seekBy(5);$('musicForward10').onclick=()=>seekBy(10);
 $('musicScrub').oninput=()=>{if(song)seek(Number($('musicScrub').value)||0);};
 $('musicHideVideo').onclick=()=>{hideYt=!hideYt;$('musicHideVideo').setAttribute('aria-pressed',String(hideYt));$('musicHideVideo').textContent='Ẩn khung YouTube: '+(hideYt?'bật':'tắt');$('musicYoutube').classList.toggle('music-youtube-stealth',song?.source.kind==='youtube'&&hideYt);};
 $('musicLoop').onclick=()=>{loop=!loop;$('musicLoop').setAttribute('aria-pressed',String(loop));$('musicLoop').textContent='Lặp câu: '+(loop?'bật':'tắt');if(loop){seek(segment().start);play();}};
 $('musicRate').onchange=()=>{const rate=Number($('musicRate').value);if(yt){const rates=yt.getAvailablePlaybackRates?.()||[];if(rates.includes(rate))yt.setPlaybackRate(rate);else status('Player này chưa hỗ trợ tốc độ đã chọn.');}else video.playbackRate=rate;};
 $('musicReveal').onclick=()=>{reveal=!reveal;$('musicReveal').setAttribute('aria-pressed',String(reveal));renderReveal();};
 for(const [id,type]of [['musicPin','pin'],['musicVi','vi']])$(id).onclick=()=>{if(type==='pin')pin=!pin;else vi=!vi;$(id).setAttribute('aria-pressed',String(type==='pin'?pin:vi));renderReveal();};
 const hold=$('musicHold'),unhold=()=>{holding=false;renderReveal();};hold.addEventListener('pointerdown',e=>{hold.setPointerCapture?.(e.pointerId);holding=true;renderReveal();});for(const e of ['pointerup','pointercancel','lostpointercapture'])hold.addEventListener(e,unhold);hold.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();holding=true;renderReveal();}};hold.onkeyup=unhold;hold.onblur=unhold;window.addEventListener('blur',unhold);
 $('musicAnswers').addEventListener('change',()=>{pauseNative();yt?.pauseVideo?.();checkpoint(true);});
 $('musicQuiz').onsubmit=e=>{e.preventDefault();if(checked||!song)return;const selected=panel.querySelector('input[name=musicAnswer]:checked');if(!selected){$('musicResult').textContent='Chọn một đáp án trước.';return;}const answer=Number(selected.value),s=segment(),correct=C.grade(s,answer);checked=true;pauseNative();yt?.pauseVideo?.();save('history',C.record(read('history',[]),song,s,answer));history();reveal=true;$('musicReveal').setAttribute('aria-pressed','true');renderReveal();$('musicCheck').disabled=true;$('musicResult').textContent=(correct?'Đúng. ':'Chưa đúng. ')+'Đáp án: '+s.quiz.options[s.quiz.answer]+'. '+s.vi;checkpoint(true);};
 $('musicImportApply').onclick=async()=>{const epoch=serial,json=$('musicManifest').files[0],file=$('musicFile').files[0];try{if(!json||json.size>500000)throw Error('Chọn file lời JSON tối đa 500 KB.');if(!file||file.size>52428800||!(/^(audio\/|video\/mp4)/.test(file.type)||/\.(mp3|mp4|m4a|wav|ogg)$/i.test(file.name)))throw Error('Chọn file nhạc/video tối đa 50 MB.');const value=C.validateSong(JSON.parse(await json.text()));if(epoch!==serial)return;if(value.source.kind!=='local')throw Error('Bài nhập từ thiết bị cần source.kind="local".');await openSong(value,file);}catch(e){if(epoch===serial)status(e.message);}};
 $('musicRecover').onclick=()=>{if(!song)return;const saved=time(),epoch=serial;if(yt){yt.seekTo(saved,true);play();return;}video.addEventListener('loadedmetadata',()=>{if(epoch===serial){seek(saved);status('Nguồn đã tải lại. Bấm phát để tiếp tục.');}},{once:true});video.load();};
 video.addEventListener('timeupdate',tick);video.addEventListener('play',updatePlayButton);video.addEventListener('pause',updatePlayButton);video.addEventListener('error',()=>{if(song)status('Chưa phát được nguồn nhạc. Kiểm tra mạng, định dạng hoặc bấm tải lại nguồn.');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint(true);});window.addEventListener('pagehide',()=>checkpoint(true));
 new MutationObserver(()=>{if(panel.hidden&&opened){opened=false;stop();fetcher?.abort();++serial;}}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hsk-account-ready',()=>{fetcher?.abort();++serial;release(false);song=null;catalog=[];progress={};currentLinkUrl='';currentLinkTitle='';activePlaylistId='';$('musicLesson').hidden=true;toggleMenu(false);syncEmptyState();$('musicLinkUrl').value='';$('musicLinkName').value='';$('musicLinkLyrics').value='';drawCatalog();drawPlaylists();drawLinks();history();if(opened)refresh();});
 window.HSKMusic={enter(){opened=true;history();drawPlaylists();drawLinks();if(song){if(['youtube','soundcloud'].includes(song.source.kind))openSong(song);else{lines();drawLine();}}else if(!currentLinkUrl){const recent=savedLinks()[0];if(recent){try{const link=C.parseLink(recent.url);$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(recent.title||'').slice(0,120);openLink(link,recent.title,false);}catch{}}}syncEmptyState();refresh();},stop};
})();
