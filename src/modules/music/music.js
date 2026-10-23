/* Small music pilot, adapted from the supplied frontend-pwa skeleton. */
(()=>{
 'use strict';
 const C=window.HSKMusicCore;if(!C)return;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const $=id=>document.getElementById(id);
 function animateDisclosure(node,open){
  if(!node||node.hidden===!open)return;
  const height=node.getBoundingClientRect().height;
  node._musicDisclosureAnimation?.cancel();
  if(open)node.hidden=false;
  const targetHeight=node.scrollHeight;
  node.style.overflow='hidden';
  const frames=open?[{height:'0px',opacity:0,transform:'translateY(-5px)'},{height:targetHeight+'px',opacity:1,transform:'translateY(0)'}]:[{height:height+'px',opacity:1,transform:'translateY(0)'},{height:'0px',opacity:0,transform:'translateY(-5px)'}];
  const animation=node.animate(frames,{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});node._musicDisclosureAnimation=animation;
  animation.onfinish=()=>{if(node._musicDisclosureAnimation!==animation)return;node.style.removeProperty('height');node.style.removeProperty('overflow');node.style.removeProperty('opacity');node.style.removeProperty('transform');node.hidden=!open;node._musicDisclosureAnimation=null;};
 }
 const panel=el('section',undefined,'panel music-panel');panel.id='musicPanel';panel.dataset.studioHubPanel='music';panel.dataset.musicMode='study';panel.hidden=true;
 panel.innerHTML=`<div class="music-stage music-np"><img id="musicStageBg" class="music-np-bg" alt="" aria-hidden="true"><div class="music-top-bar"><button type="button" id="musicBack" class="music-top-btn" aria-label="Quay về trang chủ" title="Trang chủ"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 9.5 12 15l5.5-5.5"/></svg><span class="music-sr">← Trang chủ</span></button><div class="music-top-heading"><span id="musicTopEyebrow" class="music-top-eyebrow">ĐANG PHÁT TỪ</span><h2 id="musicHeaderLabel" class="music-top-title">Danh sách phát HSK</h2></div><button type="button" id="musicMenuBtn" class="music-top-btn" aria-expanded="false" aria-controls="musicMenuSheet" aria-label="Mở tùy chọn bài hát" title="Tùy chọn bài hát"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg></button></div>
 <div id="musicEmptyNowPlaying" class="music-np-body music-np-empty"><div class="music-cover"><img id="musicEmptyThumb" class="music-thumb" alt="Đĩa nhạc HSK" loading="lazy"></div><div class="music-np-meta"><h3 id="musicEmptyTitle">Chưa phát bài hát</h3><p id="musicEmptySub" class="music-np-sub">Bấm nút <strong>⋯</strong> ở góc phải trên để mở danh sách bài hát.</p></div><div id="musicStudyQuickCatalog" class="music-study-quick-list music-study-only"></div><button type="button" id="musicEmptyOpenMenu" class="music-primary">⋯ Mở danh sách &amp; tùy chọn</button></div>
 <section id="musicBrowseView" class="music-browse-view music-chill-only" hidden><div class="music-browse-pills" role="tablist" aria-label="Bộ lọc nội dung"><button type="button" class="music-pill active" data-browse-filter="all" role="tab" aria-selected="true">Tất cả</button><button type="button" class="music-pill" data-browse-filter="tracks" role="tab" aria-selected="false">Bài hát</button><button type="button" class="music-pill" data-browse-filter="playlists" role="tab" aria-selected="false">Playlist</button></div><div id="musicBrowseRecentSection"><h3 class="music-browse-section-title">Nội dung bạn hay nghe gần đây</h3><div id="musicRecentList" class="music-recent-list"></div></div><div id="musicBrowsePlaylistsSection"><h3 class="music-browse-section-title">Danh sách phát của bạn</h3><div id="musicBrowsePlaylistList" class="music-browse-playlist-list"></div></div></section>
 <section id="musicLinkPreview" class="music-np-body music-chill-only" hidden><img id="musicLinkBg" class="music-np-bg" alt="" aria-hidden="true" hidden><div id="musicLinkCover" class="music-cover" hidden><img id="musicLinkThumb" class="music-thumb" alt="Ảnh bìa bài hát" loading="lazy"></div><div class="music-np-meta"><div class="music-np-title-row"><div class="music-np-title-copy"><h3 id="musicLinkTitle"></h3><p id="musicLinkNotice" class="music-np-sub"></p></div><button type="button" id="musicQuickSaveBtn" class="music-quick-save-btn" aria-pressed="false" aria-label="Lưu nhanh vào playlist" title="Lưu nhanh vào playlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg></button></div></div><div id="musicLinkScrubRow" class="music-np-scrub" hidden><span id="musicLinkElapsed" class="music-time">00:00</span><input type="range" id="musicLinkScrub" class="music-scrub" min="0" max="100" step="0.1" value="0" aria-label="Thanh tiến trình"><span id="musicLinkTime" class="music-time">-00:00</span></div><div id="musicLinkPlayer" class="music-link-player"></div><div id="musicLinkControls" class="music-transport" hidden><button type="button" id="musicLinkPrev" class="music-transport-btn" title="Bài trước" aria-label="Bài trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M6.5 6h1.8v12H6.5zm3.3 6 8.2 5.6V6.4z"/></svg></button><button type="button" id="musicLinkBack10" class="music-transport-btn" title="Tua lùi 5 giây" aria-label="Tua lùi 5 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4.8 12a7.2 7.2 0 1 0 2.3-5.3L4.8 9M4.8 4.8V9H9"/><text x="12" y="14.6" text-anchor="middle" font-size="7.2" font-weight="700" fill="currentColor" stroke="none">5</text></svg></button><button type="button" id="musicLinkPlay" class="music-transport-btn music-transport-play" title="Phát / tạm dừng" aria-label="Phát hoặc tạm dừng"><svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--palette-dark-paper)!important;fill:var(--palette-dark-paper)!important"><path fill="var(--palette-dark-paper)" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg></button><button type="button" id="musicLinkFwd10" class="music-transport-btn" title="Tua tới 5 giây" aria-label="Tua tới 5 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M19.2 12a7.2 7.2 0 1 1-2.3-5.3L19.2 9M19.2 4.8V9H15"/><text x="12" y="14.6" text-anchor="middle" font-size="7.2" font-weight="700" fill="currentColor" stroke="none">5</text></svg></button><button type="button" id="musicLinkNext" class="music-transport-btn" title="Bài tiếp theo" aria-label="Bài tiếp theo"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M15.7 6h1.8v12h-1.8zM6 17.6 14.2 12 6 6.4z"/></svg></button></div></section>
 <section id="musicLesson" class="music-np-body music-study-only" hidden><div class="music-np-body"><img id="musicLessonBg" class="music-np-bg" alt="" aria-hidden="true" hidden><div id="musicLessonCover" class="music-cover" hidden><img id="musicLessonThumb" class="music-thumb" alt="Ảnh bìa bài học" loading="lazy"></div><video id="musicPlayer" class="music-player" controls playsinline preload="metadata"></video><div id="musicYoutube" class="music-youtube" hidden></div><div class="music-np-meta"><div class="music-np-title-row"><div class="music-np-title-copy"><h3 id="musicTitle"></h3><p id="musicCredit" class="music-credit"></p></div></div></div><div class="music-np-scrub"><span id="musicElapsed" class="music-time">00:00</span><input type="range" id="musicScrub" class="music-scrub" min="0" max="100" step="0.1" value="0" aria-label="Thanh tiến trình bài học"><span id="musicTimeLabel" class="music-time">-00:00</span></div><div class="music-transport"><button type="button" id="musicPrevTrack" class="music-transport-btn" title="Bài / câu trước" aria-label="Bài hoặc câu trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M6.5 6h1.8v12H6.5zm3.3 6 8.2 5.6V6.4z"/></svg></button><button type="button" id="musicRewind10" class="music-transport-btn" title="Tua lùi 5 giây" aria-label="Tua lùi 5 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4.8 12a7.2 7.2 0 1 0 2.3-5.3L4.8 9M4.8 4.8V9H9"/><text x="12" y="14.6" text-anchor="middle" font-size="7.2" font-weight="700" fill="currentColor" stroke="none">5</text></svg></button><button type="button" id="musicPlay" class="music-transport-btn music-transport-play" title="Phát / tạm dừng" aria-label="Phát hoặc tạm dừng"><svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--palette-dark-paper)!important;fill:var(--palette-dark-paper)!important"><path fill="var(--palette-dark-paper)" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg></button><button type="button" id="musicForward10" class="music-transport-btn" title="Tua tới 5 giây" aria-label="Tua tới 5 giây"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M19.2 12a7.2 7.2 0 1 1-2.3-5.3L19.2 9M19.2 4.8V9H15"/><text x="12" y="14.6" text-anchor="middle" font-size="7.2" font-weight="700" fill="currentColor" stroke="none">5</text></svg></button><button type="button" id="musicNextTrack" class="music-transport-btn" title="Bài / câu tiếp theo" aria-label="Bài hoặc câu tiếp theo"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M15.7 6h1.8v12h-1.8zM6 17.6 14.2 12 6 6.4z"/></svg></button></div>
 <div class="music-toolbar"><button type="button" id="musicRewind5" hidden>-5s</button><button type="button" id="musicForward5" hidden>+5s</button><button type="button" id="musicReplay">Nghe lại câu</button><button type="button" id="musicLoop" aria-pressed="false">Lặp câu: tắt</button><button type="button" id="musicHideVideo" aria-pressed="true" hidden>Ẩn khung YouTube: bật</button><button type="button" id="musicRecover">Tải lại nguồn nghe</button></div>
 <div class="music-settings"><label>Câu đang học <select id="musicLine"></select></label><label>Tốc độ <select id="musicRate"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option></select></label><button type="button" id="musicNext">Câu tiếp →</button></div></div>
 <div class="music-study"><div class="music-actions"><button type="button" id="musicHold">Giữ để xem lời</button><button type="button" id="musicReveal" aria-pressed="false">Hiện lời</button><button type="button" id="musicPin" aria-pressed="false">Pinyin</button><button type="button" id="musicVi" aria-pressed="false">Nghĩa Việt</button></div><div class="music-caption"><p id="musicHidden">Lời đang ẩn. Nghe và chọn ý bên dưới.</p><div id="musicLyrics" hidden><p id="musicHanzi" class="music-hanzi" lang="zh"></p><p id="musicPinyin" class="music-pin"></p><p id="musicMeaning" class="music-vi"></p></div></div><p id="musicDistribution" class="music-distribution"></p><div id="musicNewWords" class="music-new" hidden></div><form id="musicQuiz" class="music-quiz"><fieldset id="musicAnswers"></fieldset><button type="submit" id="musicCheck" class="music-primary">Xác nhận đáp án</button><p id="musicResult" class="music-result" role="status" aria-live="polite"></p></form></div></section>
 <div id="musicBottomDock" class="music-bottom-dock"><div class="music-aux-bar"><button type="button" id="musicQuickLoop" class="music-aux-btn" aria-pressed="false" title="Lặp lại bài"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M17 2l4 4-4 4"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M21 13v2a4 4 0 0 1-4 4H3"/></svg><span id="musicQuickLoopLabel" class="music-aux-text">Lặp lại</span></button><button type="button" id="musicQuickRate" class="music-aux-btn" aria-pressed="false" title="Đổi tốc độ phát (0.75x / 1x / 1.25x)"><span id="musicQuickRateLabel">1×</span></button><button type="button" id="musicQuickQueue" class="music-aux-btn" aria-controls="musicQueueSheet" aria-expanded="false" title="Mở danh sách chờ &amp; Playlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg><span class="music-aux-text">Danh sách</span></button></div><div id="musicChillPeekCard" class="music-lyrics-peek-card music-chill-only"><button type="button" id="musicChillPeekToggle" class="music-lyrics-peek-btn" aria-label="Mở danh sách chờ phát" aria-controls="musicQueueSheet" aria-expanded="false"><span class="music-lyrics-pill-bar" aria-hidden="true"></span><span class="music-lyrics-peek-row"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg><strong>Danh sách chờ phát</strong></span></button></div><div id="musicLyricsDrawerCard" class="music-lyrics-card music-study-only" hidden><button type="button" id="musicLyricsDrawerToggle" class="music-lyrics-head" aria-expanded="false"><span class="music-lyrics-pill-bar" aria-hidden="true"></span><span class="music-lyrics-head-row"><strong>Lời bài hát &amp; Đối chiếu HSK</strong><span id="musicLyricsDrawerState" class="music-lyrics-badge">Vuốt / chạm để mở</span></span></button><div id="musicLyricsDrawerBody" class="music-lyrics-body" hidden><div class="music-lyrics-toggles"><button type="button" id="musicDrawerHanziBtn" class="music-lyrics-chip" aria-pressed="true">Chữ Hán</button><button type="button" id="musicDrawerPinBtn" class="music-lyrics-chip" aria-pressed="false">Pinyin</button><button type="button" id="musicDrawerViBtn" class="music-lyrics-chip" aria-pressed="false">Nghĩa Việt</button></div><div class="music-lyrics-lines"><p id="musicDrawerHanzi" class="music-drawer-hanzi" lang="zh"></p><p id="musicDrawerPinyin" class="music-drawer-pin" hidden></p><p id="musicDrawerVi" class="music-drawer-vi" hidden></p></div></div></div></div></div>
 <div id="musicMiniPlayer" class="music-mini-player music-chill-only" hidden><div class="music-mini-inner"><button type="button" id="musicMiniMain" class="music-mini-main" aria-label="Mở trình phát toàn màn hình"><img id="musicMiniThumb" class="music-mini-thumb" alt="" src=""><div class="music-mini-copy"><strong id="musicMiniTitle">Chưa chọn bài hát</strong><small id="musicMiniSub">Nghệ sĩ · YouTube / SoundCloud</small></div></button><div class="music-mini-actions"><button type="button" id="musicMiniSave" class="music-mini-btn music-mini-save" aria-label="Lưu nhanh vào playlist" title="Lưu nhanh vào playlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg></button><button type="button" id="musicMiniPlay" class="music-mini-btn music-mini-play" aria-label="Phát hoặc tạm dừng" title="Phát / tạm dừng"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg></button></div></div><div class="music-mini-progress-track"><div id="musicMiniProgress" class="music-mini-progress-bar" style="width:0%"></div></div></div>
 <div id="musicQueueBackdrop" class="music-menu-backdrop" aria-hidden="true"></div>
 <section id="musicQueueSheet" class="music-menu-sheet music-queue-sheet" role="region" aria-label="Danh sách chờ phát" aria-hidden="true" inert><button type="button" id="musicQueueClose" class="music-menu-close music-queue-handle" aria-label="Thu gọn danh sách chờ phát"><span class="music-drag-bar" aria-hidden="true"></span><strong>Danh sách chờ phát</strong></button><div class="music-queue-content"><h3>Đang phát</h3><div id="musicQueueCurrent"></div><h3 id="musicQueueNextTitle">Tiếp theo</h3><div id="musicQueueNext"></div><button type="button" id="musicQueueLibrary" class="music-flat-row">Chọn playlist khác</button></div></section>
 <div id="musicMenuBackdrop" class="music-menu-backdrop" aria-hidden="true"></div>
 <div id="musicMenuSheet" class="music-menu-sheet" data-view="main" role="region" aria-label="Tùy chọn nhạc và danh sách"><div class="music-sheet-drag-area"><button type="button" id="musicMenuClose" class="music-menu-close" aria-label="Đóng menu"><span class="music-drag-bar" aria-hidden="true"></span><span class="music-sr">✕ Đóng</span></button><strong id="musicMenuTitle" class="music-sr">Tùy chọn &amp; Danh sách nhạc</strong></div>
 <div id="musicMenuTrackHead" class="music-menu-track-head" data-menu-view="main"><img id="musicMenuTrackThumb" class="music-menu-track-thumb" alt="" src=""><div class="music-menu-track-copy"><strong id="musicMenuTrackTitle">Chưa chọn bài hát</strong><small id="musicMenuTrackSub">Nghệ sĩ · YouTube / SoundCloud</small></div></div>
 <hr class="music-sheet-divider" data-menu-view="main">
 <div id="musicMenuSubHead" class="music-sub-head music-chill-only" data-menu-view="save link library"><button type="button" id="musicMenuSubCancel" class="music-sub-link">Hủy</button><strong id="musicMenuSubTitle" class="music-sub-title"></strong><button type="button" id="musicMenuSubDone" class="music-sub-link music-sub-done">Xong</button></div>
 <p id="musicStatus" class="music-status" role="status" aria-live="polite"></p>
 <p class="music-intro" hidden>Nghe từng câu, tự đoán ý rồi đối chiếu lời. Lịch sử luyện nhạc được lưu riêng trên thiết bị.</p>
 <div id="musicLinkExtraActions" class="music-chill-only" data-menu-view="main"><button type="button" id="musicMenuShareRow" class="music-flat-row"><span class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg></span><span class="music-flat-label">Chia sẻ</span></button><button type="button" id="musicPreviewPlaylistAdd" class="music-flat-row"><span id="musicMenuSaveIco" class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 8v8M8 12h8"/></svg></span><span id="musicMenuSaveLabel" class="music-flat-label">Thêm vào danh sách phát</span></button><select id="musicPreviewPlaylistSelect" class="music-sr" aria-label="Chọn playlist lưu"><option value="">— Mặc định —</option></select><div id="musicQuickPlaylistPills" class="music-quick-pills" hidden></div></div>
 <details id="musicLinkImport" class="music-flat-details music-chill-only" data-menu-view="main link"><summary class="music-flat-row"><span class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span><span class="music-flat-label">Dán link bài hát mới (YouTube / SoundCloud)</span></summary><form id="musicLinkForm" class="music-flat-expand-body"><div class="music-link-main-row"><input id="musicLinkUrl" type="url" inputmode="url" required maxlength="2048" placeholder="Dán link YouTube, Spotify, SoundCloud…" autocomplete="off"><button type="submit" id="musicLinkApply" class="music-primary">Phát</button></div><div class="music-link-sub-row"><label>Tên bài hát (tùy chọn) <input id="musicLinkName" maxlength="120" placeholder="Tự lấy từ link nếu để trống" autocomplete="off"></label><label>Thêm vào playlist <select id="musicLinkPlaylist"><option value="">— Không thêm vào playlist —</option></select></label></div><label class="music-study-only">Lời và bài tập JSON (không bắt buộc) <input id="musicLinkLyrics" type="file" accept=".json,application/json"></label></form></details>
 <button type="button" id="musicMenuLibraryRow" class="music-flat-row music-chill-only" data-menu-view="main"><span class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 4v16M9 4v16M14 4.5l6 15"/></svg></span><span class="music-flat-label">Thư viện &amp; danh sách phát</span><span class="music-flat-chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg></span></button>
 <a id="musicSourceLink" class="music-flat-row music-np-source music-chill-only" data-menu-view="main" target="_blank" rel="noopener noreferrer"><span class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="14" x2="21" y2="3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="music-flat-label">Mở bài trên trang nguồn</span></a>
 <details id="musicPlaylistCreateBox" class="music-flat-details music-chill-only" data-menu-view="library"><summary class="music-flat-row"><span class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg></span><span class="music-flat-label">Tạo playlist mới</span></summary><form id="musicPlaylistCreateForm" class="music-flat-expand-body"><div class="music-playlist-create-row"><input id="musicPlaylistName" maxlength="80" placeholder="VD: Nhạc Hoa chill, HSK 3 nghe mỗi ngày…" autocomplete="off" required><button type="submit" id="musicPlaylistCreateBtn" class="music-primary">Tạo</button></div></form></details>
 <details id="musicPlaylistsBox" class="music-flat-details music-chill-only" data-menu-view="library" open><summary class="music-sheet-section-title">Danh sách phát của bạn</summary><div id="musicPlaylistList" class="music-playlist-list"></div></details>
 <details id="musicSavedLinksBox" class="music-flat-details music-chill-only" data-menu-view="library"><summary class="music-flat-row"><span class="music-flat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg></span><span class="music-flat-label">Link đã lưu trên thiết bị</span></summary><div id="musicSavedLinks" class="music-catalog music-flat-expand-body"></div></details>
 <section id="musicSaveView" class="music-save-view music-chill-only" data-menu-view="save" aria-label="Lưu vào danh sách phát"><div class="music-save-head"><h3>Đã lưu vào</h3><button type="button" id="musicSaveNewToggle" class="music-save-new-link">Danh sách phát mới</button></div><form id="musicSaveNewForm" class="music-flat-expand-body" hidden><div class="music-playlist-create-row"><input id="musicSaveNewName" maxlength="80" placeholder="Tên danh sách phát mới" autocomplete="off" required><button type="submit" id="musicSaveNewCreate" class="music-primary">Tạo</button></div></form><div id="musicSavePicker" class="music-save-picker" role="group" aria-label="Chọn danh sách phát"></div><button type="button" id="musicSaveNewRow" class="music-save-new-row"><span class="music-save-new-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg></span><span>Danh sách phát mới</span></button><div class="music-save-done-wrap"><button type="button" id="musicSaveDone" class="music-save-done">Xong</button></div></section>
 <div class="music-settings music-filter-row music-study-only"><label>Lọc câu theo cấp <select id="musicLevel"><option value="all">Tất cả HSK</option><option value="new">Câu có từ mới</option></select></label><button type="button" id="musicRefresh">Tải kho nhạc</button></div><div id="musicCatalog" class="music-catalog music-study-only"></div>
 <details id="musicImport" class="music-study-only"><summary>Thử với file nhạc và lời của bạn</summary><div class="music-import"><p>Chọn file âm thanh/video và file JSON có lời, thời gian, pinyin, nghĩa cùng câu hỏi. File nhạc chỉ được phát trên máy này; không tự tải lên mạng.</p><a href="./content/music/lesson-template.json" download="music-lesson-template.json">Tải mẫu cấu trúc lời JSON</a><label>File lời bài hát JSON <input id="musicManifest" type="file" accept=".json,application/json"></label><label>File nhạc hoặc video (tối đa 50 MB) <input id="musicFile" type="file" accept="audio/*,video/mp4"></label><button type="button" id="musicImportApply" class="music-primary">Mở bài đã chọn</button></div></details>
 <details id="musicHistoryBox" class="music-study-only"><summary>Lịch sử luyện nhạc trên thiết bị này</summary><ul id="musicHistory" class="music-history"></ul></details></div>`;
 document.querySelector('main.workspace').append(panel);
 for(let n=1;n<=6;n++)$('musicLevel').add(new Option('HSK '+n,String(n)));
 const video=$('musicPlayer');
 let song=null,index=0,loop=false,linkLoop=false,linkRate=1,reveal=false,holding=false,pin=false,vi=false,drawerHanzi=true,drawerOpen=false,hideYt=true,menuOpen=false,queueOpen=false,currentMode='study',objectUrl=null,yt=null,ytTimer=null,linkYt=null,linkTimer=null,linkOptimisticPlay=false,linkPendingPlay=false,studyOptimisticPlay=false,currentLinkUrl='',currentLinkTitle='',currentLinkAuthor='',activePlaylistId='',playerExpanded=false,serial=0,fetcher=null,opened=false,checked=false,lastSaved=0,lastTime=0;
 const expandedPlaylists=new Set();
 const BUILTIN_SONGS=[
  {version:1,id:'app-hsk12-yueliang',title:'月亮代表我的心 (Ánh Trăng Nói Hộ Lòng Tôi)',artist:'鄧麗君 · Kho nhạc học HSK App',credit:'Bài học chuẩn HSK 1–2 do App cung cấp',revision:'1',source:{kind:'youtube',videoId:'bv_cEeDlop0'},segments:[
   {id:'yl-1',start:14,end:21,hanzi:'你问我爱你有多深，我爱你有几分。',pinyin:'Nǐ wèn wǒ ài nǐ yǒu duō shēn, wǒ ài nǐ yǒu jǐ fēn.',vi:'Người hỏi tôi yêu người sâu đậm nhường nào, yêu người được mấy phần.',quiz:{question:'Động từ "问" (wèn) trong câu mang nghĩa gì?',options:['Hỏi','Nghe','Nhìn'],answer:0}},
   {id:'yl-2',start:21,end:29,hanzi:'我的情也真，我的爱也真，月亮代表我的心。',pinyin:'Wǒ de qíng yě zhēn, wǒ de ài yě zhēn, yuèliang dàibiǎo wǒ de xīn.',vi:'Tình của tôi cũng thật, yêu của tôi cũng thật, ánh trăng đại diện cho lòng tôi.',quiz:{question:'Hình ảnh nào đại diện cho trái tim ("我的心") trong câu hát?',options:['Ánh trăng (月亮)','Ngôi sao (星星)','Cơn gió (风)'],answer:0}},
   {id:'yl-3',start:30,end:38,hanzi:'轻轻的一个吻，已经打动我的心。',pinyin:'Qīngqīng de yí gè wěn, yǐjīng dǎdòng wǒ de xīn.',vi:'Một nụ hôn dịu nhẹ đã làm rung động trái tim tôi.',quiz:{question:'Phó từ "已经" (yǐjīng) biểu thị ý nghĩa nào?',options:['Đã / rồi','Sắp sửa','Chưa từng'],answer:0}}
  ]},
  {version:1,id:'app-hsk12-tianmimi',title:'甜蜜蜜 (Ngọt Ngào)',artist:'鄧麗君 · Kho nhạc học HSK App',credit:'Bài học chuẩn HSK 1–2 do App cung cấp',revision:'1',source:{kind:'youtube',videoId:'tc2tW0j9P2I'},segments:[
   {id:'tm-1',start:12,end:20,hanzi:'甜蜜蜜，你笑得甜蜜蜜，好像花儿开在春风里。',pinyin:'Tiánmìmì, nǐ xiào de tiánmìmì, hǎoxiàng huār kāi zài chūnfēng lǐ.',vi:'Ngọt ngào thay, nụ cười của bạn ngọt ngào như đóa hoa nở trong gió xuân.',quiz:{question:'Nụ cười trong câu hát được ví với hình ảnh nào?',options:['Hoa nở trong gió xuân','Mặt trời buổi sớm','Cơn mưa mùa hạ'],answer:0}},
   {id:'tm-2',start:25,end:33,hanzi:'在哪里，在哪里见过你，你的笑容这样熟悉。',pinyin:'Zài nǎlǐ, zài nǎlǐ jiànguò nǐ, nǐ de xiàoróng zhèyàng shúxī.',vi:'Ở nơi đâu, đã từng gặp bạn ở nơi đâu, nụ cười của bạn thân thuộc đến thế.',quiz:{question:'Cụm từ "在哪里" (zài nǎlǐ) dùng để hỏi về điều gì?',options:['Ở đâu','Khi nào','Vì sao'],answer:0}}
  ]},
  {version:1,id:'app-hsk23-pengyou',title:'朋友 (Bạn Bè)',artist:'周华健 · Kho nhạc học HSK App',credit:'Bài học chuẩn HSK 2–3 do App cung cấp',revision:'1',source:{kind:'youtube',videoId:'6lbPgfKK7m4'},segments:[
   {id:'py-1',start:28,end:36,hanzi:'朋友一生一起走，那些日子不再有。',pinyin:'Péngyou yìshēng yìqǐ zǒu, nàxiē rìzi bú zài yǒu.',vi:'Bạn bè một đời cùng nhau bước, những tháng ngày ấy không còn lặp lại.',quiz:{question:'Cụm "一起走" (yìqǐ zǒu) có nghĩa là gì?',options:['Cùng nhau đi','Đi một mình','Đứng đợi nhau'],answer:0}},
   {id:'py-2',start:36,end:44,hanzi:'一句话，一辈子，一生情，一杯酒。',pinyin:'Yí jù huà, yíbèizi, yìshēng qíng, yì bēi jiǔ.',vi:'Một lời nói, một đời người, một kiếp tình, một chén rượu.',quiz:{question:'Từ "一辈子" (yíbèizi) chỉ khoảng thời gian nào?',options:['Cả một đời','Một ngày','Một năm'],answer:0}}
  ]}
 ];
 let catalog=BUILTIN_SONGS.map(C.validateSong),config={enabled:false,endpoint:''},lexicon=C.dictionary([]),lexiconSource=null,progress={},metaCache={};
 // The account module restores this local owner before cloud auth is ready.
 // Keep the same local library during its transient user:null notifications.
 const owner=()=>{
  const uid=window.HSKAccountDashboard?.user?.uid;if(uid)return uid;
  try{const uid=JSON.parse(localStorage.getItem('hsk-account-meta-v1')||'null')?.uid;if(typeof uid==='string'&&uid)return uid;}catch{}
  return 'guest';
 };
 const key=type=>'hsk-music-'+type+'-v1:'+owner();
 const fmtTime=sec=>{const s=Math.max(0,Math.floor(Number(sec)||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
 const ICONS={
  play:'<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--palette-dark-paper)!important;fill:var(--palette-dark-paper)!important"><path fill="var(--palette-dark-paper)" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--palette-dark-paper)!important;fill:var(--palette-dark-paper)!important"><rect x="7.5" y="6" width="3" height="12" rx="1" fill="var(--palette-dark-paper)" stroke="none"/><rect x="13.5" y="6" width="3" height="12" rx="1" fill="var(--palette-dark-paper)" stroke="none"/></svg>',
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg>',
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5 9.8 17 19 7.5"/></svg>'
 };
 const MINI_ICONS={
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M8.8 6.2v11.6L18 12z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="6" width="3" height="12" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="6" width="3" height="12" rx="1" fill="currentColor" stroke="none"/></svg>'
 };
 function paintScrub(input,cur,dur){const pct=dur>0?Math.max(0,Math.min(100,cur/dur*100)):0;input.style.setProperty('--pct',pct+'%');}
 const remaining=(cur,dur)=>'-'+fmtTime(Math.max(0,dur-cur));
 const ytMaxThumb=id=>'https://i.ytimg.com/vi/'+id+'/maxresdefault.jpg';
 const ytThumb=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
 const fallbackArt='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#4338ca"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="320" cy="170" r="58" fill="rgba(255,255,255,0.14)"/><text x="320" y="188" text-anchor="middle" font-size="52" fill="#ffffff" font-family="sans-serif">♪</text></svg>');
 function setArt(thumb,bg,src,hqFallback=''){
  const stage=$('musicStageBg');
  const applyFallback=()=>{
   if(hqFallback&&thumb.src!==hqFallback){
    thumb.onerror=bg.onerror=stage.onerror=()=>{thumb.onerror=bg.onerror=stage.onerror=null;thumb.classList.remove('music-thumb-yt');thumb.src=bg.src=stage.src=fallbackArt;};
    thumb.classList.add('music-thumb-yt');
    thumb.src=bg.src=stage.src=hqFallback;
    return;
   }
   thumb.onerror=bg.onerror=stage.onerror=null;
   thumb.classList.remove('music-thumb-yt');
   thumb.src=bg.src=stage.src=fallbackArt;
  };
  thumb.onload=()=>{if(hqFallback&&thumb.naturalWidth>0&&thumb.naturalWidth<=120)applyFallback();};
  thumb.onerror=bg.onerror=stage.onerror=applyFallback;
  thumb.classList.toggle('music-thumb-yt',src!==fallbackArt);
  thumb.src=bg.src=stage.src=src;
  if($('musicMenuTrackThumb'))$('musicMenuTrackThumb').src=src;
  bg.hidden=true;stage.hidden=false;
 }
 $('musicEmptyThumb').src=$('musicStageBg').src=fallbackArt;
 function syncMenuTrackHead(){
  const thumb=$('musicMenuTrackThumb'),title=$('musicMenuTrackTitle'),sub=$('musicMenuTrackSub');
  if(!thumb||!title||!sub)return;
  const artSrc=$('musicStageBg')?.src||fallbackArt;
  thumb.src=artSrc;
  thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
  if(song){
   title.textContent=song.title;
   sub.textContent=song.artist||'Kho nhạc học HSK';
  }else if(currentLinkUrl){
   title.textContent=currentLinkTitle||$('musicLinkTitle').textContent||'Bài hát đang phát';
   const activePl=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
   sub.textContent=activePl?currentLinkAuthor+' · '+activePl.name:(currentLinkAuthor||'Nghệ sĩ · YouTube / SoundCloud');
  }else{
   title.textContent='Chưa chọn bài hát';
   sub.textContent='Dán link hoặc chọn playlist bên dưới';
  }
 }
 function toggleMenu(force){
  menuOpen=typeof force==='boolean'?force:!menuOpen;
  if(menuOpen)toggleQueue(false);
  panel.classList.toggle('music-menu-open',menuOpen);
  $('musicMenuBtn').setAttribute('aria-expanded',String(menuOpen));
  const sheet=$('musicMenuSheet'),backdrop=$('musicMenuBackdrop');
  sheet.setAttribute('aria-hidden',String(!menuOpen));sheet.inert=!menuOpen;
  backdrop.setAttribute('aria-hidden',String(!menuOpen));
  setMenuView('main');
  if(menuOpen){$('musicMenuSheet').scrollTop=0;syncMenuTrackHead();syncQuickSaveBtn();}
 }
 function toggleQueue(force){
  queueOpen=typeof force==='boolean'?force:!queueOpen;
  if(queueOpen)toggleMenu(false);
  panel.classList.toggle('music-queue-open',queueOpen);
  $('musicQueueSheet').inert=!queueOpen;
  $('musicQueueSheet').setAttribute('aria-hidden',String(!queueOpen));
  $('musicQueueBackdrop').setAttribute('aria-hidden',String(!queueOpen));
  for(const id of ['musicChillPeekToggle','musicQuickQueue'])$(id).setAttribute('aria-expanded',String(queueOpen));
  if(queueOpen){drawQueue();$('musicQueueSheet').scrollTop=0;}
 }
 function playbackList(){
  const playlist=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
  return {playlist,list:playlist?.items?.length?playlist.items:savedLinks()};
 }
 function drawQueue(){
  const current=$('musicQueueCurrent'),next=$('musicQueueNext');if(!current)return;
  current.replaceChildren();next.replaceChildren();
  const {playlist,list}=playbackList(),idx=list.findIndex(entry=>entry.url===currentLinkUrl);
  const row=(entry,now)=>{
   let link;try{link=C.parseLink(entry.url);}catch{return;}
   const button=el('button',undefined,'music-row-main music-queue-track'+(now?' music-track-current':''));button.type='button';
   if(now)button.setAttribute('aria-current','true');
   const thumb=el('img');thumb.className='music-row-thumb';thumb.alt='';thumb.src=link.kind==='youtube'?ytThumb(link.source.videoId):fallbackArt;
   const copy=el('span',undefined,'music-row-copy');copy.append(el('strong',now?currentLinkTitle||entry.title||link.label:entry.title||metaCache[link.url]?.title||link.label),el('small',now?'Đang phát':metaCache[link.url]?.author||link.label));
   button.append(thumb,copy);button.onclick=()=>{if(now){toggleQueue(false);return;}$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);openLink(link,entry.title,false,playlist?.id||'',true);toggleQueue(false);};
   (now?current:next).append(button);
  };
  if(currentLinkUrl)row({url:currentLinkUrl,title:currentLinkTitle},true);
  else current.append(el('p','Chưa chọn bài hát.','music-empty-note'));
  // Match next/previous playback, including wraparound at the end of the list.
  const upcoming=idx<0?list:list.slice(idx+1).concat(list.slice(0,idx));
  for(const entry of upcoming)row(entry,false);
  $('musicQueueNextTitle').textContent=playlist?'Tiếp theo từ '+playlist.name:'Tiếp theo từ link đã lưu';
  if(!next.children.length)next.append(el('p','Chưa có bài tiếp theo. Chọn playlist để nghe thêm.','music-empty-note'));
 }
 // Spotify-style compact action sheet: the main view lists only primary actions;
 // details (save picker, link import, library) open as dedicated sub-views.
 function setMenuView(view){
  const sheet=$('musicMenuSheet');if(!sheet)return;
  if(currentMode!=='chill')view='main';
  sheet.dataset.view=view;sheet.scrollTop=0;
  $('musicMenuSubTitle').textContent=({link:'Dán link bài hát mới',library:'Thư viện của bạn'})[view]||'';
  $('musicMenuSubCancel').textContent=view==='save'?'Hủy':'‹ Quay lại';
  $('musicMenuSubDone').hidden=view!=='save';
  if(view==='main'&&currentMode==='chill')$('musicLinkImport').open=false;
  if(view==='save'){$('musicSaveNewForm').hidden=true;drawSavePicker(true);}
  requestAnimationFrame(()=>sheet.querySelectorAll('[data-menu-view]').forEach(node=>{
   if((node.dataset.menuView||'').split(/\s+/).includes(view)&&node.getClientRects().length){
    try{node.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});}catch{}
   }
  }));
 }
 function toggleLyricsDrawer(force){
  drawerOpen=typeof force==='boolean'?force:!drawerOpen;
  panel.classList.toggle('music-lyrics-drawer-open',drawerOpen);
  $('musicLyricsDrawerToggle').setAttribute('aria-expanded',String(drawerOpen));
  $('musicLyricsDrawerBody').hidden=!drawerOpen;
  $('musicLyricsDrawerState').textContent=drawerOpen?'Thu gọn':'Vuốt / chạm để mở';
 }
 function syncQuickSaveBtn(){
  const lists=savedPlaylists();
  const inPlaylist=Boolean(currentLinkUrl&&lists.some(pl=>pl.items.some(it=>it.url===currentLinkUrl)));
  const plFound=inPlaylist?lists.find(pl=>pl.items.some(it=>it.url===currentLinkUrl)):null;
  const btn=$('musicQuickSaveBtn');
  if(btn){
   btn.setAttribute('aria-pressed',String(inPlaylist));
   btn.innerHTML=inPlaylist?ICONS.check:ICONS.plus;
   btn.title=inPlaylist?'Đã lưu trong Playlist':'Lưu nhanh vào Playlist';
  }
  const miniSave=$('musicMiniSave');
  if(miniSave){
   miniSave.setAttribute('aria-pressed',String(inPlaylist));
   miniSave.innerHTML=inPlaylist?ICONS.check:ICONS.plus;
   miniSave.title=inPlaylist?'Đã lưu trong Playlist':'Lưu nhanh vào Playlist';
  }
  const saveLabel=$('musicMenuSaveLabel'),saveIco=$('musicMenuSaveIco'),addBtn=$('musicPreviewPlaylistAdd');
  if(saveLabel){
   saveLabel.textContent=inPlaylist?('Đã lưu trong playlist '+(plFound?.name||'Yêu thích')):'Thêm vào danh sách phát';
  }
  if(saveIco){
   saveIco.innerHTML=inPlaylist
    ?'<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--palette-violet)"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M8 12.5 10.8 15.5 16 9.5"/></svg>'
    :'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 8v8M8 12h8"/></svg>';
  }
  if(addBtn){
   addBtn.setAttribute('aria-pressed',String(inPlaylist));
  }
 }
 function syncAuxControls(){
  const isLesson=!$('musicLesson').hidden;
  const activeLoop=isLesson?loop:linkLoop;
  $('musicQuickLoop').setAttribute('aria-pressed',String(activeLoop));
  $('musicQuickLoopLabel').textContent=activeLoop?'Đang lặp':'Lặp lại';
  const rate=isLesson?Number($('musicRate').value||1):linkRate;
  $('musicQuickRateLabel').textContent=String(rate).replace('.',',')+'×';
  $('musicQuickRate').setAttribute('aria-pressed',String(rate!==1));
 }
 function syncMediaSession(){
  if(!('mediaSession' in navigator)||typeof MediaMetadata==='undefined')return;
  try{
   const activePl=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
   const title=song?song.title:currentLinkTitle||'Nghe nhạc HSK';
   const artist=song?(song.artist||'HSK Music'):(currentLinkAuthor||'Nghệ sĩ Hoa ngữ');
   const album=activePl?activePl.name:'Danh sách phát HSK';
   const artSrc=$('musicStageBg')?.src||fallbackArt;
   navigator.mediaSession.metadata=new MediaMetadata({title,artist,album,artwork:artSrc&&!artSrc.startsWith('data:')?[{src:artSrc,sizes:'512x512',type:'image/jpeg'}]:[]});
   const seekDelta=delta=>{if(song)seekBy(delta);else if(linkYt){const c=Number(linkYt.getCurrentTime?.()||0),d=Number(linkYt.getDuration?.()||0);linkYt.seekTo?.(Math.max(0,d>0?Math.min(d,c+delta):c+delta),true);}};
   const actions={
    play:()=>{if(song)play();else linkYt?.playVideo?.();},
    pause:()=>{if(song){pauseNative();yt?.pauseVideo?.();updatePlayButton();}else{linkYt?.pauseVideo?.();updateLinkPlayButton();}},
    previoustrack:()=>{if(song)stepLessonTrack(-1);else stepSavedLink(-1);},
    nexttrack:()=>{if(song)stepLessonTrack(1);else stepSavedLink(1);},
    seekbackward:d=>seekDelta(-(d?.seekOffset||5)),
    seekforward:d=>seekDelta(d?.seekOffset||5),
    seekto:d=>{if(typeof d?.seekTime==='number'){if(song)seek(d.seekTime);else linkYt?.seekTo?.(d.seekTime,true);}}
   };
   for(const [act,fn] of Object.entries(actions)){try{navigator.mediaSession.setActionHandler(act,fn);}catch{}}
  }catch{}
 }
 function updateBrowseBackIcon(){
  const back=$('musicBack');if(!back)return;
  if(currentMode==='chill'&&!playerExpanded){
   back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/></svg><span class="music-sr">← Trang chủ</span>';
   back.title='Quay về trang chủ';
   $('musicTopEyebrow').textContent='BỘ SƯU TẬP';
   $('musicHeaderLabel').textContent='Nghe nhạc giải trí';
  }else if(currentMode==='chill'){
   back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 9.5 12 15l5.5-5.5"/></svg><span class="music-sr">Thu nhỏ</span>';
   back.title='Thu nhỏ trình phát';
   const activePl=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
   $('musicTopEyebrow').textContent=activePl?'PLAYLIST GIẢI TRÍ':'ĐANG PHÁT TỪ';
   $('musicHeaderLabel').textContent=activePl?activePl.name:(currentLinkTitle||'Trình phát nhạc giải trí');
  }else{
   back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 9.5 12 15l5.5-5.5"/></svg><span class="music-sr">← Trang chủ</span>';
   back.title='Trang chủ';
   $('musicTopEyebrow').textContent='CHẾ ĐỘ HỌC THUẬT';
   $('musicHeaderLabel').textContent=song?song.title:'Nghe nhạc học HSK';
  }
 }
 function setPlayerExpanded(expanded){
  playerExpanded=Boolean(expanded);
  panel.classList.toggle('music-player-expanded',playerExpanded);
  syncEmptyState();
 }
 function syncMiniPlayer(){
  const mini=$('musicMiniPlayer');if(!mini)return;
  if(currentMode!=='chill'||playerExpanded){mini.hidden=true;return;}
  const recents=savedLinks();
  let activeLink=null,activeTitle='',activeAuthor='';
  if(currentLinkUrl){
   try{activeLink=C.parseLink(currentLinkUrl);activeTitle=currentLinkTitle;activeAuthor=currentLinkAuthor;}catch{}
  }else if(recents.length){
   try{
    const r=recents[0];activeLink=C.parseLink(r.url);
    const cached=metaCache[r.url];
    activeTitle=r.title||cached?.title||activeLink.label;
    activeAuthor=cached?.author||('Nghệ sĩ · '+activeLink.label);
   }catch{}
  }
  if(!activeLink){mini.hidden=true;return;}
  mini.hidden=false;
  $('musicMiniTitle').textContent=activeTitle||'Chưa chọn bài hát';
  $('musicMiniSub').textContent=activeAuthor||'YouTube / SoundCloud';
  const miniThumb=$('musicMiniThumb');
  if(miniThumb){
   const src=activeLink.kind==='youtube'?ytThumb(activeLink.source.videoId):fallbackArt;
   miniThumb.src=src;
   miniThumb.onerror=()=>{miniThumb.onerror=null;miniThumb.src=fallbackArt;};
  }
  updateLinkPlayButton();
  syncQuickSaveBtn();
 }
 function drawRecentBrowse(){
  const list=$('musicRecentList');if(!list)return;
  list.replaceChildren();
  const recents=savedLinks();
  const tracks=recents;
  if(!tracks.length){list.append(el('p','Chưa có bài nghe gần đây. Những bài bạn mở sẽ xuất hiện ở đây.','music-empty-note'));return;}
  for(const entry of tracks.slice(0,20)){
   let link;try{link=C.parseLink(entry.url);}catch{continue;}
   const isCurrent=currentLinkUrl===link.url;
   const row=el('div',undefined,'music-recent-row'+(isCurrent?' music-track-current':''));
   const thumb=el('img',undefined,'music-recent-thumb');
   thumb.alt='';thumb.src=link.kind==='youtube'?ytThumb(link.source.videoId):fallbackArt;
   thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
   const meta=el('div',undefined,'music-recent-meta');
   const cached=metaCache[link.url];
   const displayTitle=String(entry.title||cached?.title||link.label).slice(0,120);
   const displayAuthor=cached?.author||(link.kind==='youtube'?'YouTube':link.label);
   const titleEl=el('strong',displayTitle,'music-recent-title');
   const subEl=el('small',(isCurrent?'♫ Đang phát · ':'Bài hát • ')+displayAuthor,'music-recent-sub');
   meta.append(titleEl,subEl);
   const moreBtn=el('button',undefined,'music-recent-more');
   moreBtn.type='button';moreBtn.setAttribute('aria-label','Tùy chọn bài hát');
   moreBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor"/></svg>';
   moreBtn.onclick=e=>{
    e.stopPropagation();
    try{
     $('musicLinkUrl').value=link.url;
     $('musicLinkName').value=displayTitle;
     currentLinkUrl=link.url;
     currentLinkTitle=displayTitle;
     currentLinkAuthor=displayAuthor;
     syncMenuTrackHead();
     toggleMenu(true);
    }catch{}
   };
   row.append(thumb,meta,moreBtn);
   row.onclick=()=>{
    $('musicLinkUrl').value=link.url;
    $('musicLinkName').value=displayTitle;
    $('musicLinkLyrics').value='';
    openLink(link,displayTitle,true,'',true);
    syncMiniPlayer();
   };
   list.append(row);
  }
 }
 function drawBrowsePlaylists(){
  const box=$('musicBrowsePlaylistList');if(!box)return;
  box.replaceChildren();
  const pls=savedPlaylists();
  if(!pls.length){
   box.append(el('p','Chưa có playlist nào. Bấm nút ⋯ ở trên để tạo playlist mới.','music-empty-note'));
   return;
  }
  for(const pl of pls){
   const row=el('div',undefined,'music-recent-row');
   const thumb=el('div',undefined,'music-recent-thumb music-playlist-thumb-icon');
   thumb.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" style="width:24px;height:24px;margin:auto"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>';
   const meta=el('div',undefined,'music-recent-meta');
   meta.append(el('strong',pl.name,'music-recent-title'),el('small','Danh sách phát • '+(pl.items?.length||0)+' bài hát','music-recent-sub'));
   row.append(thumb,meta);
   row.onclick=()=>{
    toggleMenu(true);
    setMenuView('library');
    $('musicPlaylistsBox').open=true;
   };
   box.append(row);
  }
 }
 function syncEmptyState(){
  const isChill=currentMode==='chill';
  panel.dataset.musicMode=currentMode;
  const isLesson=!isChill&&!$('musicLesson').hidden;
  const isLink=isChill&&!$('musicLinkPreview').hidden;
  const hasActive=isLesson||isLink;
  panel.classList.toggle('music-lesson-mode',isLesson);
  if(isChill){
   panel.classList.toggle('music-player-expanded',playerExpanded);
   $('musicEmptyNowPlaying').hidden=true;
   $('musicBrowseView').hidden=playerExpanded;
   $('musicLinkPreview').hidden=!playerExpanded;
   $('musicBottomDock').hidden=!playerExpanded;
   $('musicMiniPlayer').hidden=playerExpanded||(!currentLinkUrl&&!savedLinks().length);
   $('musicMenuTitle').textContent='Playlist & Nhập nhạc giải trí';
   updateBrowseBackIcon();
   syncMiniPlayer();
  }else{
   panel.classList.remove('music-player-expanded');
   $('musicBrowseView').hidden=true;
   $('musicMiniPlayer').hidden=true;
   $('musicEmptyNowPlaying').hidden=hasActive;
   $('musicBottomDock').hidden=!isLink;
   if(!hasActive)$('musicStageBg').src=fallbackArt;
   $('musicTopEyebrow').textContent='CHẾ ĐỘ HỌC THUẬT';
   $('musicHeaderLabel').textContent=song?song.title:'Nghe nhạc học HSK';
   $('musicMenuTitle').textContent='Kho nhạc học HSK & Lịch sử';
   $('musicEmptyTitle').textContent='Kho bài hát học HSK';
   $('musicEmptySub').textContent='Chọn một bài hát do App cung cấp bên dưới để nghe từng câu, đối chiếu Hán tự – Pinyin – Nghĩa Việt và làm trắc nghiệm.';
   $('musicEmptyOpenMenu').textContent='⋯ Bộ lọc HSK & Lịch sử luyện';
   updateBrowseBackIcon();
  }
  syncQuickSaveBtn();
  syncAuxControls();
  syncMediaSession();
 }
 $('musicMenuBtn').onclick=()=>toggleMenu();
 $('musicMenuClose').onclick=()=>toggleMenu(false);
 $('musicMenuBackdrop').onclick=()=>toggleMenu(false);
 $('musicSourceLink').onclick=e=>{if(!currentLinkUrl){e.preventDefault();status('Mở một bài hát từ link để xem trang nguồn.');}};
 $('musicEmptyOpenMenu').onclick=()=>toggleMenu(true);
 $('musicQuickQueue').onclick=()=>toggleQueue(true);
 $('musicQueueClose').onclick=()=>toggleQueue(false);
 $('musicQueueBackdrop').onclick=()=>toggleQueue(false);
 $('musicQueueLibrary').onclick=()=>{toggleMenu(true);setMenuView('library');$('musicPlaylistsBox').open=true;};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&queueOpen){toggleQueue(false);$('musicChillPeekToggle').focus();}});
 $('musicMenuLibraryRow').onclick=()=>{setMenuView('library');$('musicPlaylistsBox').open=true;};
 $('musicMenuSubCancel').onclick=()=>setMenuView('main');
 $('musicMenuSubDone').onclick=()=>commitSavePicker();
 $('musicLinkImport').addEventListener('toggle',()=>{if(currentMode==='chill'&&menuOpen&&$('musicLinkImport').open)setMenuView('link');});
 $('musicMenuShareRow').onclick=async()=>{
  if(!currentLinkUrl){status('Mở một bài hát trước khi chia sẻ.');return;}
  const data={title:currentLinkTitle||'Bài hát',url:currentLinkUrl};
  try{if(navigator.share){await navigator.share(data);}else{await navigator.clipboard.writeText(currentLinkUrl);status('Đã sao chép link bài hát.');}}catch{}
 };
 // Drag surfaces follow the pointer every frame; only snapping is animated.
 function bindMusicDrag(node,handlers){
  let gesture=null,suppress=false;
  node.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();}},true);
  const start=(y,x)=>{gesture={y,x,last:y,time:performance.now(),moved:false,data:null};};
  const move=(y,x,e)=>{
   if(!gesture)return;const g=gesture,dy=y-g.y;
   if(!g.moved){if(Math.abs(dy)<4)return;if(Math.abs(x-g.x)>Math.abs(dy)){gesture=null;return;}g.data=handlers.start(dy);if(g.data===false){gesture=null;return;}g.moved=true;}
   if(e.cancelable)e.preventDefault();if(e.pointerId!==undefined)node.setPointerCapture?.(e.pointerId);g.last=y;handlers.move(dy,g.data);
  };
  const end=cancel=>{if(!gesture)return;const g=gesture;gesture=null;if(g.moved){suppress=!cancel;setTimeout(()=>suppress=false,400);handlers.end(g.last-g.y,g.data,cancel,(g.last-g.y)/Math.max(1,performance.now()-g.time));}};
  node.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;start(e.clientY,e.clientX);e.target.setPointerCapture?.(e.pointerId);});
  node.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')move(e.clientY,e.clientX,e);});
  node.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')end(false);});
  node.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')end(true);});
  node.addEventListener('touchstart',e=>{if(e.touches.length===1)start(e.touches[0].clientY,e.touches[0].clientX);else end(true);},{passive:true});
  node.addEventListener('touchmove',e=>{if(e.touches.length===1)move(e.touches[0].clientY,e.touches[0].clientX,e);},{passive:false});
  node.addEventListener('touchend',()=>end(false));node.addEventListener('touchcancel',()=>end(true));
 }
 const menuSheet=$('musicMenuSheet'),menuBackdrop=$('musicMenuBackdrop');
 const sheetDrag=opening=>({
  start(dy){
   if(opening&&dy>=0||!opening&&(dy<=0||menuSheet.scrollTop>0))return false;
   if(opening){setMenuView('main');syncMenuTrackHead();menuSheet.scrollTop=0;}
   const height=menuSheet.getBoundingClientRect().height+18;
   panel.classList.add('music-sheet-dragging');menuSheet.style.visibility='visible';menuSheet.inert=false;
   return {height,opening};
  },
  move(dy,g){const offset=Math.max(0,Math.min(g.height,(g.opening?g.height:0)+dy));menuSheet.style.transform='translate(-50%,'+offset+'px)';menuBackdrop.style.opacity=String(1-offset/g.height);menuBackdrop.style.visibility='visible';},
  end(dy,g,cancel,velocity){
   const open=cancel?!g.opening:g.opening?(-dy>Math.min(90,g.height*.25)||velocity<-.45):!(dy>Math.min(90,g.height*.25)||velocity>.45);
   // Commit the finger position before enabling the snap transition.
   void menuSheet.offsetHeight;panel.classList.remove('music-sheet-dragging');toggleMenu(open);
   menuSheet.style.removeProperty('transform');menuSheet.style.removeProperty('visibility');menuBackdrop.style.removeProperty('opacity');menuBackdrop.style.removeProperty('visibility');
  }
 });
 bindMusicDrag(menuSheet,sheetDrag(false));
 const queueSheet=$('musicQueueSheet'),queueBackdrop=$('musicQueueBackdrop'),peek=$('musicChillPeekToggle');
 const queueDrag=opening=>({
  start(dy){
   if(opening&&dy>=0||!opening&&(dy<=0||queueSheet.scrollTop>0))return false;
   drawQueue();
   const height=queueSheet.getBoundingClientRect().height;
   const offset=opening?Math.max(0,peek.getBoundingClientRect().top-(innerHeight-height)):height;
   panel.classList.add('music-queue-dragging');queueSheet.inert=false;
   return {height,offset,opening};
  },
  move(dy,g){const offset=Math.max(0,Math.min(g.height,(g.opening?g.offset:0)+dy));queueSheet.style.transform='translate(-50%,'+offset+'px)';queueBackdrop.style.opacity=String(1-offset/g.height);},
  end(dy,g,cancel,velocity){
   const open=cancel?!g.opening:g.opening?(-dy>Math.min(90,g.height*.25)||velocity<-.45):!(dy>Math.min(90,g.height*.25)||velocity>.45);
   void queueSheet.offsetHeight;panel.classList.remove('music-queue-dragging');toggleQueue(open);
   queueSheet.style.removeProperty('transform');queueBackdrop.style.removeProperty('opacity');
  }
 });
 peek.onclick=()=>toggleQueue(true);bindMusicDrag(peek,queueDrag(true));
 bindMusicDrag(queueSheet,queueDrag(false));
 $('musicLyricsDrawerToggle').onclick=()=>toggleLyricsDrawer();
 if($('musicMiniMain')){
  const mini=$('musicMiniMain'),stage=panel.querySelector('.music-stage');mini.onclick=()=>setPlayerExpanded(true);
  bindMusicDrag(mini,{
   start(dy){if(dy>=0)return false;const height=window.innerHeight;panel.classList.add('music-player-dragging');setPlayerExpanded(true);stage.style.transition='none';return {height};},
   move(dy,g){stage.style.transform='translateY('+Math.max(0,g.height+dy)+'px)';},
   end(dy,g,cancel,velocity){const open=!cancel&&(-dy>g.height*.25||velocity<-.45);void stage.offsetHeight;stage.style.transition='transform .32s cubic-bezier(.22,1,.36,1)';stage.style.transform='translateY('+(open?0:g.height)+'px)';setTimeout(()=>{setPlayerExpanded(open);panel.classList.remove('music-player-dragging');stage.style.removeProperty('transition');stage.style.removeProperty('transform');},340);}
  });
 }
 if($('musicMiniPlay'))$('musicMiniPlay').onclick=e=>{e.stopPropagation();$('musicLinkPlay').click();};
 if($('musicMiniSave'))$('musicMiniSave').onclick=e=>{e.stopPropagation();$('musicQuickSaveBtn').click();};
 if($('musicBrowseView')){
  $('musicBrowseView').querySelectorAll('.music-pill').forEach(btn=>{
   btn.onclick=()=>{
    $('musicBrowseView').querySelectorAll('.music-pill').forEach(b=>{
     b.classList.remove('active');
     b.setAttribute('aria-selected','false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    const f=btn.dataset.browseFilter;
    $('musicBrowseRecentSection').hidden=f==='playlists';
    $('musicBrowsePlaylistsSection').hidden=f==='tracks';
   };
  });
 }
 {
  let drawerStartY=0;
  $('musicLyricsDrawerCard').addEventListener('touchstart',e=>{drawerStartY=e.touches?.[0]?.clientY||0;},{passive:true});
  $('musicLyricsDrawerCard').addEventListener('touchend',e=>{if(!drawerStartY)return;const dy=(e.changedTouches?.[0]?.clientY||0)-drawerStartY;drawerStartY=0;if(dy<-30)toggleLyricsDrawer(true);else if(dy>30)toggleLyricsDrawer(false);},{passive:true});
 }
 function read(type,fallback){try{return JSON.parse(localStorage.getItem(key(type))||'null')||fallback;}catch{return fallback;}}
 function save(type,value){try{localStorage.setItem(key(type),JSON.stringify(value));}catch{status('Bộ nhớ thiết bị đầy; chưa lưu được lịch sử.');}}
 function status(message){$('musicStatus').textContent=message;}
 function vocab(){let rows=[];try{rows=typeof words!=='undefined'?words:[];}catch{}if(rows!==lexiconSource){lexicon=C.dictionary(rows);lexiconSource=rows;}return lexicon;}
 const segment=()=>song?.segments[index];
 const time=()=>yt?Number(yt.getCurrentTime?.()||0):video.currentTime;
 const duration=()=>{if(yt){const d=Number(yt.getDuration?.()||0);if(d>0)return d;}else if(Number.isFinite(video.duration)&&video.duration>0)return video.duration;return song?.segments.at(-1)?.end||0;};
 const playing=()=>{
  if(yt){const s=yt.getPlayerState?.();if(s===1)studyOptimisticPlay=true;else if(s===2||s===0)studyOptimisticPlay=false;return studyOptimisticPlay;}
  return !video.paused;
 };
 function updatePlayButton(){const p=playing();$('musicPlay').innerHTML=p?ICONS.pause:ICONS.play;$('musicPlay').setAttribute('aria-pressed',String(p));$('musicPlay').title=p?'Tạm dừng':'Phát';$('musicPlay').setAttribute('aria-label',p?'Tạm dừng':'Phát');}
 function updateLinkPlayButton(){
  const s=linkYt?.getPlayerState?.();
  if(s===1){linkOptimisticPlay=true;linkPendingPlay=false;}
  else if(s===2||s===0){linkOptimisticPlay=false;linkPendingPlay=false;}
  const p=Boolean(linkOptimisticPlay);
  $('musicLinkPlay').innerHTML=p?ICONS.pause:ICONS.play;
  $('musicLinkPlay').setAttribute('aria-pressed',String(p));
  $('musicLinkPlay').title=p?'Tạm dừng':'Phát';
  $('musicLinkPlay').setAttribute('aria-label',p?'Tạm dừng':'Phát');
  const miniPlay=$('musicMiniPlay');
  if(miniPlay){
   miniPlay.innerHTML=p?MINI_ICONS.pause:MINI_ICONS.play;
   miniPlay.setAttribute('aria-pressed',String(p));
   miniPlay.title=p?'Tạm dừng':'Phát';
   miniPlay.setAttribute('aria-label',p?'Tạm dừng':'Phát');
  }
 }
 function updateScrubUI(){const cur=time(),dur=duration();if(dur>0){$('musicScrub').max=String(dur);$('musicScrub').value=String(Math.min(cur,dur));}paintScrub($('musicScrub'),cur,dur);$('musicElapsed').textContent=fmtTime(cur);$('musicTimeLabel').textContent=remaining(cur,dur);updatePlayButton();}
 function checkpoint(force=false){if(!song||(!force&&Date.now()-lastSaved<2000))return;lastSaved=Date.now();progress=read('progress',{});progress[song.id]={revision:song.revision,index,time:time()};const entries=Object.entries(progress).slice(-30);save('progress',Object.fromEntries(entries));}
 function pauseNative(){if(video.hasAttribute('src'))video.pause();}
 function clearPreview(){linkOptimisticPlay=false;linkPendingPlay=false;$('musicLinkScrubRow').hidden=true;$('musicLinkExtraActions').hidden=true;linkYt?.destroy?.();linkYt=null;clearInterval(linkTimer);linkTimer=null;$('musicLinkPlayer').replaceChildren();$('musicLinkCover').hidden=true;$('musicLinkControls').hidden=true;$('musicLinkPreview').hidden=true;syncEmptyState();}
 function release(savePosition=true){if(savePosition)checkpoint(true);if(video.hasAttribute('src')){video.pause();video.removeAttribute('src');video.load();}yt?.destroy?.();yt=null;clearInterval(ytTimer);ytTimer=null;clearPreview();if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
 function stop(){toggleQueue(false);studyOptimisticPlay=false;checkpoint(true);pauseNative();yt?.pauseVideo?.();linkYt?.pauseVideo?.();clearPreview();holding=false;renderReveal();updatePlayButton();}
 function savedLinks(){const value=read('links',[]);return Array.isArray(value)?value:[];}
 function savedPlaylists(){const value=read('playlists',[]);return Array.isArray(value)?value.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.items)):[];}
 function renderQuickPlaylistPills(){
  syncQuickSaveBtn();
 }
 function syncPlaylistSelects(){
  const lists=savedPlaylists();
  for(const [id,placeholder] of [['musicLinkPlaylist','— Không thêm vào playlist —'],['musicPreviewPlaylistSelect','— Chọn playlist —']]){
   const sel=$(id),prev=sel.value;sel.replaceChildren(new Option(placeholder,''));
   for(const p of lists)sel.add(new Option(p.name+' ('+p.items.length+')',p.id));
   if(lists.some(p=>p.id===prev))sel.value=prev;
   else if(id==='musicPreviewPlaylistSelect'&&lists.length)sel.value=lists[0].id;
  }
  renderQuickPlaylistPills();
  syncQuickSaveBtn();
 }
 function addTrackToPlaylist(playlistId,link,title){
  const lists=savedPlaylists(),target=lists.find(p=>p.id===playlistId);if(!target)return false;
  const itemTitle=String(title||link.label).slice(0,120);
  target.items=[{url:link.url,title:itemTitle},...target.items.filter(x=>x.url!==link.url)].slice(0,50);
  save('playlists',lists);drawPlaylists();drawLinks();syncQuickSaveBtn();return true;
 }
 $('musicQuickSaveBtn').onclick=()=>{
  if(!currentLinkUrl)return;
  try{
   const link=C.parseLink(currentLinkUrl);
   let lists=savedPlaylists();
   let targetId=activePlaylistId&&lists.some(p=>p.id===activePlaylistId)?activePlaylistId:lists[0]?.id||'';
   if(!targetId){
    targetId='pl-'+Date.now().toString(36);
    lists=[{id:targetId,name:'Yêu thích',items:[]}];
    save('playlists',lists);
   }
   const pl=savedPlaylists().find(p=>p.id===targetId);
   const already=pl?.items.some(x=>x.url===link.url);
   if(already){
    pl.items=pl.items.filter(x=>x.url!==link.url);
    save('playlists',lists);drawPlaylists();drawLinks();syncQuickSaveBtn();
    status('Đã gỡ khỏi playlist "'+(pl?.name||'Yêu thích')+'".');
   }else{
    addTrackToPlaylist(targetId,link,currentLinkTitle||$('musicLinkTitle').textContent);
    status('Đã lưu nhanh vào playlist "'+(pl?.name||'Yêu thích')+'".');
   }
  }catch(e){status(e.message);}
 };
 function drawPlaylists(){
  if(queueOpen)drawQueue();
  syncPlaylistSelects();
  const box=$('musicPlaylistList'),lists=savedPlaylists();box.replaceChildren();
  if(!lists.length){box.append(el('p','Chưa có playlist nào. Hãy bấm "Tạo playlist mới" ở trên để bắt đầu.','music-empty-note'));return;}
  for(const pl of lists){
   const card=el('div',undefined,'music-playlist-card'+(activePlaylistId===pl.id?' music-playlist-active':''));
   const head=el('div',undefined,'music-playlist-head music-flat-row');
   let coverSrc=fallbackArt;
   for(const item of pl.items){try{const l=C.parseLink(item.url);if(l.kind==='youtube'){coverSrc=ytThumb(l.source.videoId);break;}}catch{}}
   const img=el('img',undefined,'music-playlist-thumb');img.alt=pl.name;img.src=coverSrc;img.onerror=()=>{img.onerror=null;img.src=fallbackArt;};
   const meta=el('div',undefined,'music-playlist-meta');
   meta.append(el('strong',pl.name),el('small',pl.items.length+' bài hát'+(activePlaylistId===pl.id?' · Đang phát':'')));
   const actions=el('div',undefined,'music-playlist-actions');
   const playBtn=el('button',undefined,'music-playlist-ghost-btn');playBtn.type='button';playBtn.title='Phát playlist';
   playBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M8 6.5v11l9-5.5z"/></svg>';
   playBtn.disabled=!pl.items.length;
   playBtn.onclick=e=>{e.stopPropagation();if(!pl.items.length)return;activePlaylistId=pl.id;const first=pl.items[0];try{const link=C.parseLink(first.url);$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(first.title||'').slice(0,120);openLink(link,first.title,false,pl.id,true);}catch{}};
   const delBtn=el('button',undefined,'music-playlist-ghost-btn');delBtn.type='button';delBtn.title='Xóa playlist';
   delBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>';
   delBtn.onclick=e=>{e.stopPropagation();if(activePlaylistId===pl.id)activePlaylistId='';save('playlists',savedPlaylists().filter(x=>x.id!==pl.id));drawPlaylists();drawLinks();syncEmptyState();status('Đã xóa playlist "'+pl.name+'".');};
   const chevron=el('span',undefined,'music-playlist-chevron');
   chevron.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>';
   actions.append(playBtn,delBtn,chevron);
   head.append(img,meta,actions);

   const trackList=el('div',undefined,'music-playlist-tracks');
   const expanded=expandedPlaylists.has(pl.id);
   trackList.hidden=!expanded;head.classList.toggle('music-playlist-head-open',expanded);
   head.onclick=()=>{const open=trackList.hidden;animateDisclosure(trackList,open);animateDisclosure(addForm,open);if(open)expandedPlaylists.add(pl.id);else expandedPlaylists.delete(pl.id);head.classList.toggle('music-playlist-head-open',open);};

   if(!pl.items.length){trackList.append(el('p','Playlist trống. Dán link để thêm bài vào playlist.','music-empty-note'));}
   else{
    pl.items.forEach((entry,idx)=>{
     let link;try{link=C.parseLink(entry.url);}catch{return;}
     const isCurrent=currentLinkUrl===link.url&&activePlaylistId===pl.id;
     const row=el('div',undefined,'music-playlist-track'+(isCurrent?' music-track-current':''));
     const open=el('button',undefined,'music-row-main');open.type='button';
     const thumb=el('img',undefined,'music-row-thumb');thumb.alt='';thumb.src=link.kind==='youtube'?ytThumb(link.source.videoId):fallbackArt;thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
     const copy=el('span',undefined,'music-row-copy');
     const cached=metaCache[link.url];
     copy.append(el('strong',(idx+1)+'. '+String(entry.title||cached?.title||link.label).slice(0,120)),el('small',(isCurrent?'♫ Đang phát · ':'')+(cached?.author||link.label)));
     open.append(thumb,copy);
     open.onclick=()=>{$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);openLink(link,entry.title,false,pl.id,true);};
     const remove=el('button',undefined,'music-row-del');remove.type='button';remove.title='Xóa bài';
     remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>';
     remove.onclick=()=>{const all=savedPlaylists(),found=all.find(x=>x.id===pl.id);if(!found)return;found.items=found.items.filter(x=>x.url!==entry.url);save('playlists',all);drawPlaylists();};
     row.append(open,remove);trackList.append(row);
    });
   }

   const addForm=el('form',undefined,'music-playlist-add-track');
   const urlIn=el('input');urlIn.type='url';urlIn.inputMode='url';urlIn.required=true;urlIn.maxLength=2048;urlIn.placeholder='Dán link YouTube / Spotify / SoundCloud…';
   const titleIn=el('input');titleIn.type='text';titleIn.maxLength=120;titleIn.placeholder='Tên bài hát (tùy chọn)';
   const addBtn=el('button','+ Thêm bài','music-primary');addBtn.type='submit';
   addForm.append(urlIn,titleIn,addBtn);addForm.hidden=!expanded;
   addForm.onsubmit=e=>{e.preventDefault();try{const link=C.parseLink(urlIn.value),t=titleIn.value.trim()||link.label;rememberLink(link,t);addTrackToPlaylist(pl.id,link,t);urlIn.value='';titleIn.value='';status('Đã thêm "'+t+'" vào playlist "'+pl.name+'".');}catch(err){status(err.message);}};

   card.append(head,trackList,addForm);box.append(card);
  }
 }
 function createPlaylist(rawName){
  const name=String(rawName||'').trim().slice(0,80);if(!name)return '';
  const lists=savedPlaylists();
  if(lists.length>=25){status('Tối đa 25 playlist trên thiết bị này.');return '';}
  const id='pl-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  save('playlists',[{id,name,items:[]},...lists]);
  drawPlaylists();drawLinks();
  $('musicLinkPlaylist').value=id;$('musicPreviewPlaylistSelect').value=id;
  status('Đã tạo playlist "'+name+'".');
  return id;
 }
 $('musicPlaylistCreateForm').onsubmit=e=>{
  e.preventDefault();
  if(createPlaylist($('musicPlaylistName').value))$('musicPlaylistName').value='';
 };
 // "Đã lưu vào" picker (Spotify style): choices stay pending until Xong; Hủy discards them.
 let savePending=new Set(),saveInitial=new Set();
 function playlistCover(pl){
  for(const item of pl.items){try{const l=C.parseLink(item.url);if(l.kind==='youtube')return ytThumb(l.source.videoId);}catch{}}
  return fallbackArt;
 }
 function drawSavePicker(reset){
  const lists=savedPlaylists();
  if(reset){saveInitial=new Set(lists.filter(p=>currentLinkUrl&&p.items.some(it=>it.url===currentLinkUrl)).map(p=>p.id));savePending=new Set(saveInitial);}
  const box=$('musicSavePicker');box.replaceChildren();
  if(!lists.length){box.append(el('p','Chưa có danh sách phát nào. Bấm "Danh sách phát mới" để tạo.','music-empty-note'));return;}
  const ordered=[...lists].sort((a,b)=>Number(saveInitial.has(b.id))-Number(saveInitial.has(a.id)));
  for(const pl of ordered){
   const on=savePending.has(pl.id);
   const row=el('button',undefined,'music-save-row');row.type='button';row.setAttribute('role','menuitemcheckbox');row.setAttribute('aria-checked',String(on));row.dataset.playlistId=pl.id;
   const img=el('img',undefined,'music-save-thumb');img.alt='';img.src=playlistCover(pl);img.onerror=()=>{img.onerror=null;img.src=fallbackArt;};
   const copy=el('span',undefined,'music-save-copy');copy.append(el('strong',pl.name),el('small',pl.items.length+' bài hát'));
   const mark=el('span',undefined,'music-save-mark'+(on?' is-on':''));mark.setAttribute('aria-hidden','true');
   mark.innerHTML=on
    ?'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M7 12.4 10.4 15.6 17 9"/></svg>'
    :'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 7.5v9M7.5 12h9"/></svg>';
   row.append(img,copy,mark);
   row.onclick=()=>{if(savePending.has(pl.id))savePending.delete(pl.id);else savePending.add(pl.id);drawSavePicker(false);};
   box.append(row);
  }
 }
 function commitSavePicker(){
  if(!currentLinkUrl){toggleMenu(false);return;}
  try{
   const link=C.parseLink(currentLinkUrl),title=String(currentLinkTitle||$('musicLinkTitle').textContent||link.label).slice(0,120);
   const lists=savedPlaylists();let added=0,removed=0;
   for(const pl of lists){
    const has=pl.items.some(x=>x.url===link.url),want=savePending.has(pl.id);
    if(want&&!has){pl.items=[{url:link.url,title},...pl.items].slice(0,50);added++;}
    else if(!want&&has){pl.items=pl.items.filter(x=>x.url!==link.url);removed++;}
   }
   if(added||removed){save('playlists',lists);drawPlaylists();drawLinks();syncQuickSaveBtn();syncMenuTrackHead();}
   status(added||removed?('Đã cập nhật '+(added+removed)+' danh sách phát.'):'Không có thay đổi.');
  }catch(e){status(e.message);}
  toggleMenu(false);
 }
 const toggleSaveNew=()=>{const f=$('musicSaveNewForm');f.hidden=!f.hidden;if(!f.hidden)$('musicSaveNewName').focus();};
 $('musicSaveNewToggle').onclick=toggleSaveNew;
 $('musicSaveNewRow').onclick=toggleSaveNew;
 $('musicSaveNewForm').onsubmit=e=>{
  e.preventDefault();
  const id=createPlaylist($('musicSaveNewName').value);if(!id)return;
  $('musicSaveNewName').value='';$('musicSaveNewForm').hidden=true;
  if(currentLinkUrl)savePending.add(id);
  drawSavePicker(false);
 };
 $('musicSaveDone').onclick=()=>commitSavePicker();
 $('musicPreviewPlaylistAdd').onclick=()=>{
  if(!currentLinkUrl){status('Mở một bài hát từ link trước khi lưu vào playlist.');return;}
  setMenuView('save');
 };
 function drawLinks(){
  if(queueOpen)drawQueue();
  const box=$('musicSavedLinks'),lists=savedPlaylists();box.replaceChildren();
  for(const entry of savedLinks().slice(0,30)){
   let link;try{link=C.parseLink(entry.url);}catch{continue;}
   const isCurrent=currentLinkUrl===link.url&&!activePlaylistId;
   const item=el('div',undefined,'music-saved-item'+(isCurrent?' music-track-current':'')),open=el('button',undefined,'music-row-main'),remove=el('button','Xóa','music-row-del');
   open.type=remove.type='button';remove.title='Xóa link đã lưu';
   const thumb=el('img',undefined,'music-row-thumb');thumb.alt='';thumb.src=link.kind==='youtube'?ytThumb(link.source.videoId):fallbackArt;thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
   const copy=el('span',undefined,'music-row-copy');
   const cached=metaCache[link.url];
   copy.append(el('strong',String(entry.title||cached?.title||link.label).slice(0,120)),el('small',(isCurrent?'♫ Đang phát · ':'')+(cached?.author||link.label)));
   open.append(thumb,copy);
   open.onclick=()=>{$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);$('musicLinkLyrics').value='';openLink(link,entry.title,true,'',true);};
   remove.onclick=()=>{save('links',savedLinks().filter(x=>x.url!==entry.url));drawLinks();drawRecentBrowse();syncMiniPlayer();};
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
 function rememberLink(link,title){save('links',[{url:link.url,title:String(title||link.label).slice(0,120)},...savedLinks().filter(x=>x.url!==link.url)].slice(0,30));drawLinks();drawRecentBrowse();syncMiniPlayer();}
 function stepSavedLink(dir){
  const {playlist:activePl,list}=playbackList();
  if(!list.length)return;
  const idx=list.findIndex(x=>x.url===currentLinkUrl);
  const nextIdx=idx<0?0:(idx+dir+list.length)%list.length;
  const entry=list[nextIdx];
  try{const link=C.parseLink(entry.url);$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(entry.title||'').slice(0,120);openLink(link,entry.title,false,activePl?.id||'',true);}catch{}
 }
 function fetchLinkMetadata(link,customTitle,epoch){
  const isDefaultTitle=!customTitle||customTitle===link.label||customTitle==='Bài hát '+link.label;
  fetch('https://noembed.com/embed?url='+encodeURIComponent(link.url)).then(r=>r.ok?r.json():null).then(data=>{
   if(!data||epoch!==serial)return;
   const fetchedTitle=String(data.title||'').trim().slice(0,120);
   const fetchedAuthor=String(data.author_name||'').trim().slice(0,80);
   metaCache[link.url]={title:fetchedTitle,author:fetchedAuthor};
   if(isDefaultTitle&&fetchedTitle){
    currentLinkTitle=fetchedTitle;
    $('musicLinkTitle').textContent=fetchedTitle;
    const links=savedLinks(),found=links.find(x=>x.url===link.url);
    if(found&&(!found.title||found.title===link.label)){found.title=fetchedTitle;save('links',links);drawLinks();drawRecentBrowse();syncMiniPlayer();}
    const pls=savedPlaylists();let plUpdated=false;
    for(const pl of pls)for(const it of pl.items)if(it.url===link.url&&(!it.title||it.title===link.label)){it.title=fetchedTitle;plUpdated=true;}
    if(plUpdated){save('playlists',pls);drawPlaylists();}
   }
   if(fetchedAuthor){
    currentLinkAuthor=fetchedAuthor;
    const activePl=activePlaylistId?savedPlaylists().find(p=>p.id===activePlaylistId):null;
    $('musicLinkNotice').textContent=activePl?fetchedAuthor+' · '+activePl.name:fetchedAuthor;
   }
   syncMenuTrackHead();
   syncMediaSession();
  }).catch(()=>{});
 }
 function syncDrawerLyrics(){
  $('musicDrawerHanziBtn').setAttribute('aria-pressed',String(drawerHanzi));
  $('musicDrawerPinBtn').setAttribute('aria-pressed',String(pin));
  $('musicDrawerViBtn').setAttribute('aria-pressed',String(vi));
  $('musicDrawerHanzi').hidden=!drawerHanzi;
  $('musicDrawerPinyin').hidden=!pin;
  $('musicDrawerVi').hidden=!vi;
  if(song){
   const s=segment();
   if(s){
    $('musicDrawerHanzi').textContent=s.hanzi;
    $('musicDrawerPinyin').textContent=s.pinyin;
    $('musicDrawerVi').textContent=s.vi;
   }
  }else{
   $('musicDrawerHanzi').textContent='Nghe tự do — tập bắt chữ Hán trong giai điệu hoặc gắn file lời JSON ở menu ⋯ để đồng bộ từng câu.';
   $('musicDrawerPinyin').textContent='Phiên âm Pinyin sẽ hiển thị theo từng câu hát khi mở bài học HSK.';
   $('musicDrawerVi').textContent='Nghĩa tiếng Việt đối chiếu trực tiếp giúp luyện phản xạ nghe hiểu.';
  }
 }
 function openLink(link,title,saveOrder=true,playlistId='',autoPlay=false){
  currentMode='chill';release();song=null;const epoch=++serial;currentLinkUrl=link.url;
  if(autoPlay)playerExpanded=true;
  panel.classList.toggle('music-player-expanded',playerExpanded);
  linkOptimisticPlay=Boolean(autoPlay);linkPendingPlay=Boolean(autoPlay);
  const cached=metaCache[link.url];
  const cleanTitle=title&&title!==link.label?title:cached?.title||'';
  currentLinkTitle=String(cleanTitle||'Bài hát đang phát').slice(0,120);
  currentLinkAuthor=cached?.author||('Nghệ sĩ · '+link.label);
  activePlaylistId=playlistId;loop=false;$('musicLoop').setAttribute('aria-pressed','false');$('musicLoop').textContent='Lặp câu: tắt';$('musicLesson').hidden=true;$('musicLinkPreview').hidden=false;$('musicLinkExtraActions').hidden=false;$('musicLinkTitle').textContent=currentLinkTitle;$('musicSourceLink').href=link.url;
  const activePl=playlistId?savedPlaylists().find(p=>p.id===playlistId):null;
  $('musicLinkNotice').textContent=activePl?currentLinkAuthor+' · '+activePl.name:currentLinkAuthor;
  const frame=el('iframe');frame.title='Trình phát '+link.label;frame.src=link.embedUrl+(link.kind==='youtube'?'?controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&enablejsapi=1'+(autoPlay?'&autoplay=1':''):'');frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';frame.height=link.kind==='youtube'?'200':link.kind==='spotify'?'352':'166';frame.width='100%';
  $('musicLinkPlayer').classList.toggle('music-youtube-stealth',link.kind==='youtube');$('musicLinkPlayer').append(frame);
  const isYt=link.kind==='youtube';
  $('musicLinkControls').hidden=false;
  for(const id of ['musicLinkBack10','musicLinkPlay','musicLinkFwd10'])$(id).disabled=!isYt;
  if(isYt){
   setArt($('musicLinkThumb'),$('musicLinkBg'),ytMaxThumb(link.source.videoId),ytThumb(link.source.videoId));
   $('musicLinkCover').hidden=false;$('musicLinkScrubRow').hidden=false;$('musicLinkScrub').value='0';paintScrub($('musicLinkScrub'),0,0);$('musicLinkElapsed').textContent='00:00';$('musicLinkTime').textContent='-00:00';updateLinkPlayButton();
   youtubeApi().then(()=>{
    if(epoch!==serial||!opened)return;
    linkYt=new YT.Player(frame,{
     events:{
      onReady:()=>{
       if(epoch===serial){
        if(linkRate!==1)linkYt.setPlaybackRate?.(linkRate);
        if(linkPendingPlay){linkYt.playVideo?.();linkPendingPlay=false;}
        updateLinkPlayButton();
       }
      },
      onStateChange:ev=>{
       if(epoch!==serial)return;
       if(ev?.data===1){linkOptimisticPlay=true;linkPendingPlay=false;}
       else if(ev?.data===2||ev?.data===0){linkOptimisticPlay=false;linkPendingPlay=false;}
       updateLinkPlayButton();
       if(ev?.data===0){
        if(linkLoop){linkYt.seekTo?.(0,true);linkYt.playVideo?.();}
        else if(activePlaylistId)stepSavedLink(1);
       }
      }
     }
    });
    linkTimer=setInterval(()=>{
     if(epoch!==serial||!linkYt)return;
     const c=Number(linkYt.getCurrentTime?.()||0),d=Number(linkYt.getDuration?.()||0);
     if(d>0){$('musicLinkScrub').max=String(d);$('musicLinkScrub').value=String(Math.min(c,d));}
     paintScrub($('musicLinkScrub'),c,d);
     $('musicLinkElapsed').textContent=fmtTime(c);
     $('musicLinkTime').textContent=remaining(c,d);
     if($('musicMiniProgress')){
      const pct=d>0?Math.min(100,(c/d)*100):0;
      $('musicMiniProgress').style.width=pct+'%';
     }
     updateLinkPlayButton();
    },250);
   }).catch(()=>{});
  }else{
   $('musicLinkCover').hidden=true;$('musicLinkBg').hidden=true;$('musicStageBg').src=fallbackArt;$('musicLinkScrubRow').hidden=true;updateLinkPlayButton();
  }
  if(saveOrder)rememberLink(link,cleanTitle||link.label);else drawLinks();
  drawPlaylists();
  drawRecentBrowse();
  drawBrowsePlaylists();
  syncMiniPlayer();
  toggleMenu(false);
  syncDrawerLyrics();
  syncEmptyState();
  syncMenuTrackHead();
  syncQuickSaveBtn();
  fetchLinkMetadata(link,title,epoch);
  status('');
 }
 $('musicLinkPlay').onclick=()=>{
  if(!linkYt){
   linkOptimisticPlay=true;
   linkPendingPlay=true;
   updateLinkPlayButton();
   return;
  }
  const isPlaying=linkOptimisticPlay||linkYt.getPlayerState?.()===1||linkYt.getPlayerState?.()===3;
  if(isPlaying){
   linkOptimisticPlay=false;
   linkPendingPlay=false;
   linkYt.pauseVideo?.();
  }else{
   linkOptimisticPlay=true;
   linkPendingPlay=true;
   linkYt.playVideo?.();
  }
  updateLinkPlayButton();
 };
 $('musicLinkBack10').onclick=()=>{if(!linkYt)return;const cur=Number(linkYt.getCurrentTime?.()||0),dur=Number(linkYt.getDuration?.()||0),next=Math.max(0,dur>0?Math.min(dur,cur-5):cur-5);linkYt.seekTo?.(next,true);};
 $('musicLinkFwd10').onclick=()=>{if(!linkYt)return;const cur=Number(linkYt.getCurrentTime?.()||0),dur=Number(linkYt.getDuration?.()||0),next=Math.max(0,dur>0?Math.min(dur,cur+5):cur+5);linkYt.seekTo?.(next,true);};
 $('musicLinkPrev').onclick=()=>{if(linkYt&&Number(linkYt.getCurrentTime?.()||0)>5){linkYt.seekTo?.(0,true);return;}stepSavedLink(-1);};
 $('musicLinkNext').onclick=()=>stepSavedLink(1);
 $('musicLinkScrub').oninput=()=>{if(!linkYt)return;linkYt.seekTo?.(Number($('musicLinkScrub').value)||0,true);};
 $('musicLinkForm').onsubmit=async event=>{event.preventDefault();const epoch=serial,button=$('musicLinkApply');button.disabled=true;try{const link=C.parseLink($('musicLinkUrl').value),name=$('musicLinkName').value.trim(),playlistId=$('musicLinkPlaylist').value,file=$('musicLinkLyrics').files[0];if(playlistId)addTrackToPlaylist(playlistId,link,name||link.label);if(!file){openLink(link,name,true,playlistId,true);return;}if(link.kind==='spotify')throw Error('Spotify hiện hỗ trợ mở nghe. Học theo câu cần link YouTube, SoundCloud hoặc file nhạc.');if(file.size>500000)throw Error('File lời tối đa 500 KB.');const raw=JSON.parse(await file.text());const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(link.url));if(epoch!==serial||!opened)return;const id='link-'+[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,48);const lesson=C.validateSong({...raw,id,title:name||raw.title,source:link.source});rememberLink(link,name||lesson.title);await openSong(lesson);}catch(e){if(epoch===serial)status(e.message);}finally{button.disabled=false;}};
 function history(){const box=$('musicHistory');box.replaceChildren();const rows=read('history',[]);if(!rows.length){box.append(el('li','Chưa có câu đã trả lời.'));return;}for(const r of rows.slice(0,30))box.append(el('li',r.title+' · '+r.segmentId+' · '+(r.correct?'Đúng':'Cần ôn')+' · '+new Date(r.at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})));}
 function renderReveal(){const visible=reveal||holding;$('musicLyrics').hidden=!visible;$('musicHidden').hidden=visible;$('musicPinyin').hidden=!pin;$('musicMeaning').hidden=!vi;syncDrawerLyrics();}
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
 async function play(){if(!song)return;const epoch=serial;studyOptimisticPlay=true;updatePlayButton();try{if(yt)yt.playVideo();else await video.play();if(epoch===serial){status('');updatePlayButton();}}catch{if(epoch===serial){studyOptimisticPlay=false;updatePlayButton();status('Chạm nút phát của trình nghe để bắt đầu có tiếng.');}}}
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
  const mount=el('div');$('musicYoutube').replaceChildren(mount);yt=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:value.source.videoId,width:'100%',height:'100%',playerVars:{playsinline:1,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,rel:0,origin:location.origin},events:{onReady:event=>{if(epoch!==serial)return;event.target.seekTo(index>0?segment().start:resume,true);updateScrubUI();},onStateChange:()=>{if(epoch===serial)tick();},onAutoplayBlocked:()=>{if(epoch===serial)status('Bấm nút ▶ để tiếp tục phát.');},onError:()=>{if(epoch===serial)status('Video YouTube không khả dụng hoặc không cho phép nhúng. Hãy chọn bài khác.');}}});ytTimer=setInterval(tick,200);
 }
 async function openSong(value,file=null){
  let valid;try{valid=C.validateSong(value);}catch(e){status(e.message);return;}
  if(valid.source.kind==='local'&&!file){status('Chọn lại file nhạc trên thiết bị để mở bài này.');$('musicImport').open=true;toggleMenu(true);return;}
  currentMode='study';release();const epoch=++serial;song=valid;index=0;loop=false;$('musicLoop').textContent='Lặp câu: tắt';$('musicLoop').setAttribute('aria-pressed','false');reveal=false;$('musicReveal').setAttribute('aria-pressed','false');
  const previous=read('progress',{})[song.id],resume=previous?.revision===song.revision?Math.max(0,Math.min(Number(previous.time)||0,song.segments.at(-1).end)):0;
  if(previous?.revision===song.revision&&Number.isInteger(previous.index)&&song.segments[previous.index])index=previous.index;
  const isYt=song.source.kind==='youtube',external=['youtube','soundcloud'].includes(song.source.kind);
  setArt($('musicLessonThumb'),$('musicLessonBg'),isYt?ytMaxThumb(song.source.videoId):fallbackArt,isYt?ytThumb(song.source.videoId):'');
  $('musicLessonCover').hidden=song.source.kind==='soundcloud';$('musicLesson').hidden=false;$('musicTitle').textContent=song.title;$('musicCredit').textContent=[song.artist,song.credit].filter(Boolean).join(' · ');video.hidden=external;$('musicYoutube').hidden=!external;$('musicYoutube').classList.toggle('music-soundcloud',song.source.kind==='soundcloud');$('musicYoutube').classList.toggle('music-youtube-stealth',isYt&&hideYt);$('musicHideVideo').hidden=!isYt;$('musicHideVideo').setAttribute('aria-pressed',String(hideYt));$('musicHideVideo').textContent='Ẩn khung YouTube: '+(hideYt?'bật':'tắt');$('musicRate').disabled=song.source.kind==='soundcloud';lines();drawLine();updateScrubUI();toggleMenu(false);syncEmptyState();
  if(isYt){try{await mountYoutube(song,epoch,resume);}catch(e){if(epoch===serial)status(e.message);}return;}
  if(song.source.kind==='soundcloud'){status('Đang mở trình phát SoundCloud…');try{const adapter=await window.HSKMusicSoundCloud.mount(song.source,$('musicYoutube'),{isCurrent:()=>epoch===serial&&opened,onReady:player=>{player.seekTo(index>0?segment().start:resume,true);status('Chạm vào player SoundCloud để phát.');},onTick:tick,onError:status});if(epoch!==serial||!opened){adapter?.destroy();return;}yt=adapter;}catch(e){if(epoch===serial)status(e.message);}return;}
  const loaded=()=>{if(epoch!==serial)return;video.playbackRate=Number($('musicRate').value);seek(resume);updateScrubUI();status(resume?'Đã khôi phục vị trí nghe. Bấm phát để tiếp tục.':'');};video.addEventListener('loadedmetadata',loaded,{once:true});
  if(song.source.kind==='local'){objectUrl=URL.createObjectURL(file);video.src=objectUrl;}else video.src=config.endpoint+'/media/'+song.source.key;
  video.load();
 }
 async function authenticated(path){const user=window.HSKAccountDashboard?.user;if(!user)throw Error('Đăng nhập tài khoản app để mở kho nhạc.');fetcher?.abort();fetcher=new AbortController();const signal=fetcher.signal;const token=await user.getIdToken();if(signal.aborted)throw new DOMException('Aborted','AbortError');const r=await fetch(config.endpoint+path,{headers:{Authorization:'Bearer '+token},signal});if(!r.ok)throw Error(r.status===401?'Phiên đăng nhập hết hạn. Đăng nhập lại để tải kho.':'Không tải được kho nhạc ('+r.status+').');return r.json();}
 async function refresh(){const epoch=serial;status('Đang tải kho nhạc…');try{const r=await fetch('./music-config.json');if(!r.ok)throw Error('Không tải được cấu hình nhạc.');const cfg=await r.json();if(epoch!==serial||!opened)return;config=cfg;if(cfg.enabled){const endpoint=new URL(cfg.endpoint);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw Error('Địa chỉ kho nhạc chưa hợp lệ.');config.endpoint=endpoint.href.replace(/\/$/,'');const data=await authenticated('/api/songs');if(epoch!==serial||!opened)return;catalog=data.songs.map(C.validateSong);}else catalog=BUILTIN_SONGS.map(C.validateSong);drawCatalog();status(cfg.enabled&&catalog.length?'Chọn bài để bắt đầu.':'Kho nhạc chưa được kết nối. Bạn có thể chọn bài học có sẵn của App hoặc thử bằng file trên thiết bị.');}catch(e){if(epoch===serial&&e.name!=='AbortError')status(e.message);}}
 function drawCatalog(){
  for(const boxId of ['musicCatalog','musicStudyQuickCatalog']){
   const list=$(boxId);if(!list)continue;list.replaceChildren();
   for(const value of catalog){
    const b=el('button',undefined,'music-card music-study-card');b.type='button';
    const isYt=value.source?.kind==='youtube';
    const thumb=el('img',undefined,'music-row-thumb');thumb.alt='';thumb.src=isYt?ytThumb(value.source.videoId):fallbackArt;thumb.onerror=()=>{thumb.onerror=null;thumb.src=fallbackArt;};
    const copy=el('span',undefined,'music-row-copy');
    copy.append(el('strong',value.title),el('small',value.artist+' · '+value.segments.length+' câu học'));
    b.append(thumb,copy);
    b.onclick=()=>{currentMode='study';openSong(value);};
    list.append(b);
   }
  }
 }
 $('musicBack').onclick=()=>{if(currentMode==='chill'&&playerExpanded){setPlayerExpanded(false);}else{window.HSKStudio?.navigate('home');}};$('musicRefresh').onclick=refresh;
 $('musicLevel').onchange=()=>{if(song){stop();lines();drawLine();}};$('musicLine').onchange=()=>choose(Number($('musicLine').value));
 $('musicNext').onclick=()=>stepLessonTrack(1);
 $('musicPrevTrack').onclick=()=>stepLessonTrack(-1);
 $('musicNextTrack').onclick=()=>stepLessonTrack(1);
 $('musicPlay').onclick=()=>playing()?stop():play();$('musicReplay').onclick=()=>{seek(segment().start);play();};
 $('musicRewind10').onclick=()=>seekBy(-5);$('musicRewind5').onclick=()=>seekBy(-5);$('musicForward5').onclick=()=>seekBy(5);$('musicForward10').onclick=()=>seekBy(5);
 $('musicScrub').oninput=()=>{if(song)seek(Number($('musicScrub').value)||0);};
 $('musicHideVideo').onclick=()=>{hideYt=!hideYt;$('musicHideVideo').setAttribute('aria-pressed',String(hideYt));$('musicHideVideo').textContent='Ẩn khung YouTube: '+(hideYt?'bật':'tắt');$('musicYoutube').classList.toggle('music-youtube-stealth',song?.source.kind==='youtube'&&hideYt);};
 $('musicLoop').onclick=()=>{loop=!loop;$('musicLoop').setAttribute('aria-pressed',String(loop));$('musicLoop').textContent='Lặp câu: '+(loop?'bật':'tắt');syncAuxControls();if(loop){seek(segment().start);play();}};
 $('musicQuickLoop').onclick=()=>{
  if(song){$('musicLoop').click();return;}
  linkLoop=!linkLoop;syncAuxControls();
 };
 $('musicRate').onchange=()=>{const rate=Number($('musicRate').value);if(yt){const rates=yt.getAvailablePlaybackRates?.()||[];if(rates.includes(rate))yt.setPlaybackRate(rate);else status('Player này chưa hỗ trợ tốc độ đã chọn.');}else video.playbackRate=rate;syncAuxControls();};
 $('musicQuickRate').onclick=()=>{
  const order=[1,0.75,1.25];
  if(song){
   if($('musicRate').disabled)return;
   const cur=Number($('musicRate').value||1),next=order[(order.indexOf(cur)+1)%order.length];
   $('musicRate').value=String(next);$('musicRate').onchange();
   return;
  }
  linkRate=order[(order.indexOf(linkRate)+1)%order.length];
  linkYt?.setPlaybackRate?.(linkRate);
  syncAuxControls();
 };
 $('musicReveal').onclick=()=>{reveal=!reveal;$('musicReveal').setAttribute('aria-pressed',String(reveal));renderReveal();};
 for(const [id,type]of [['musicPin','pin'],['musicVi','vi']])$(id).onclick=()=>{if(type==='pin')pin=!pin;else vi=!vi;$(id).setAttribute('aria-pressed',String(type==='pin'?pin:vi));renderReveal();};
 $('musicDrawerHanziBtn').onclick=()=>{drawerHanzi=!drawerHanzi;syncDrawerLyrics();};
 $('musicDrawerPinBtn').onclick=()=>{pin=!pin;$('musicPin').setAttribute('aria-pressed',String(pin));renderReveal();};
 $('musicDrawerViBtn').onclick=()=>{vi=!vi;$('musicVi').setAttribute('aria-pressed',String(vi));renderReveal();};
 const hold=$('musicHold'),unhold=()=>{holding=false;renderReveal();};hold.addEventListener('pointerdown',e=>{hold.setPointerCapture?.(e.pointerId);holding=true;renderReveal();});for(const e of ['pointerup','pointercancel','lostpointercapture'])hold.addEventListener(e,unhold);hold.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();holding=true;renderReveal();}};hold.onkeyup=unhold;hold.onblur=unhold;window.addEventListener('blur',unhold);
 $('musicAnswers').addEventListener('change',()=>{pauseNative();yt?.pauseVideo?.();checkpoint(true);});
 $('musicQuiz').onsubmit=e=>{e.preventDefault();if(checked||!song)return;const selected=panel.querySelector('input[name=musicAnswer]:checked');if(!selected){$('musicResult').textContent='Chọn một đáp án trước.';return;}const answer=Number(selected.value),s=segment(),correct=C.grade(s,answer);checked=true;pauseNative();yt?.pauseVideo?.();save('history',C.record(read('history',[]),song,s,answer));history();reveal=true;$('musicReveal').setAttribute('aria-pressed','true');renderReveal();$('musicCheck').disabled=true;$('musicResult').textContent=(correct?'Đúng. ':'Chưa đúng. ')+'Đáp án: '+s.quiz.options[s.quiz.answer]+'. '+s.vi;checkpoint(true);};
 $('musicImportApply').onclick=async()=>{const epoch=serial,json=$('musicManifest').files[0],file=$('musicFile').files[0];try{if(!json||json.size>500000)throw Error('Chọn file lời JSON tối đa 500 KB.');if(!file||file.size>52428800||!(/^(audio\/|video\/mp4)/.test(file.type)||/\.(mp3|mp4|m4a|wav|ogg)$/i.test(file.name)))throw Error('Chọn file nhạc/video tối đa 50 MB.');const value=C.validateSong(JSON.parse(await json.text()));if(epoch!==serial)return;if(value.source.kind!=='local')throw Error('Bài nhập từ thiết bị cần source.kind="local".');await openSong(value,file);}catch(e){if(epoch===serial)status(e.message);}};
 $('musicRecover').onclick=()=>{if(!song)return;const saved=time(),epoch=serial;if(yt){yt.seekTo(saved,true);play();return;}video.addEventListener('loadedmetadata',()=>{if(epoch===serial){seek(saved);status('Nguồn đã tải lại. Bấm phát để tiếp tục.');}},{once:true});video.load();};
 video.addEventListener('timeupdate',tick);video.addEventListener('play',updatePlayButton);video.addEventListener('pause',updatePlayButton);video.addEventListener('error',()=>{if(song)status('Chưa phát được nguồn nhạc. Kiểm tra mạng, định dạng hoặc bấm tải lại nguồn.');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint(true);});window.addEventListener('pagehide',()=>checkpoint(true));
 new MutationObserver(()=>{if(panel.hidden&&opened){opened=false;stop();fetcher?.abort();++serial;}}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hsk-account-ready',()=>{metaCache={};fetcher?.abort();++serial;release(false);song=null;catalog=BUILTIN_SONGS.map(C.validateSong);progress={};currentLinkUrl='';currentLinkTitle='';currentLinkAuthor='';activePlaylistId='';playerExpanded=false;toggleQueue(false);panel.classList.remove('music-player-expanded');$('musicLesson').hidden=true;toggleMenu(false);toggleLyricsDrawer(false);syncEmptyState();$('musicLinkUrl').value='';$('musicLinkName').value='';$('musicLinkLyrics').value='';drawCatalog();drawPlaylists();drawLinks();drawRecentBrowse();drawBrowsePlaylists();history();if(opened)refresh();});
 window.HSKMusic={enter(mode){
  opened=true;
  toggleQueue(false);
  if(mode==='chill'||mode==='study')currentMode=mode;
  panel.dataset.musicMode=currentMode;
  history();drawPlaylists();drawLinks();drawCatalog();
  if(currentMode==='chill'){
   if(song){checkpoint(true);pauseNative();yt?.pauseVideo?.();song=null;$('musicLesson').hidden=true;}
   $('musicLinkImport').open=false;$('musicPlaylistsBox').open=true;$('musicSavedLinksBox').open=false;if($('musicPlaylistCreateBox'))$('musicPlaylistCreateBox').open=false;
   playerExpanded=false;
   panel.classList.remove('music-player-expanded');
   $('musicBrowseView').querySelector('[data-browse-filter=all]').click();
   drawRecentBrowse();
   drawBrowsePlaylists();
   if(!currentLinkUrl){const recent=savedLinks()[0];if(recent){try{const link=C.parseLink(recent.url);$('musicLinkUrl').value=link.url;$('musicLinkName').value=String(recent.title||'').slice(0,120);openLink(link,recent.title,false,'',false);}catch{}}}
   syncMiniPlayer();
  }else{
   if(currentLinkUrl||!$('musicLinkPreview').hidden){linkYt?.pauseVideo?.();clearPreview();currentLinkUrl='';}
   // Mark hidden chill <details> open so queries for the first closed <details> in study mode match #musicImport.
   $('musicLinkImport').open=true;$('musicPlaylistsBox').open=true;$('musicSavedLinksBox').open=true;if($('musicPlaylistCreateBox'))$('musicPlaylistCreateBox').open=true;$('musicImport').open=false;
   if(song){if(['youtube','soundcloud'].includes(song.source.kind))openSong(song);else{lines();drawLine();}}
  }
  syncEmptyState();refresh();
 },stop};
})();
