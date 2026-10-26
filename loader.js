(async function(){
 const status=document.getElementById('appLoadStatus');
 const dataRoot='./content/data/';
 const names=['words','dictionarySupplement','checkedPracticeExamples','exampleMetadata','wordRelationsData','usageFactsData','confusableGroups','contextQuizBank','visualConfusions','hskConfusionIndex'];
 // Bounded, local diagnostics only: no song names, queries, tokens or uploads.
 const timings={},longTasks=[];
 const mark=name=>{try{performance.clearMarks('music:'+name);performance.mark('music:'+name);}catch{}};
 const measure=(name,start,end)=>{try{performance.clearMeasures('music:'+name);performance.measure('music:'+name,'music:'+start,'music:'+end);const entries=performance.getEntriesByName('music:'+name,'measure'),entry=entries[entries.length-1];timings[name]=Math.round(entry.duration*10)/10;}catch{}};
 window.HSKMusicPerf={mark,measure,report:()=>({timings:{...timings},longTasks:[...longTasks]})};
 try{if(PerformanceObserver.supportedEntryTypes?.includes('longtask'))new PerformanceObserver(list=>{if(document.body.dataset.studioHub!=='music')return;for(const e of list.getEntries()){longTasks.push(Math.round(e.duration));if(longTasks.length>20)longTasks.shift();}}).observe({type:'longtask'});}catch{}
 const scripts=new Map(),scriptFailures=new Map();
 function scriptFile(url){if(scripts.has(url))return scripts.get(url);const pending=new Promise((resolve,reject)=>{const el=document.createElement('script'),attempt=scriptFailures.get(url)||0;el.src=attempt?url+(url.includes('?')?'&':'?')+'hsk-retry='+attempt:url;el.onload=resolve;el.onerror=()=>{scriptFailures.set(url,attempt+1);el.remove();reject(Error('Không tải được '+url));};document.body.append(el);});scripts.set(url,pending);pending.catch(()=>scripts.delete(url));return pending;}
 let musicLoad;
 function startMusic(){
  if(window.HSKMusic)return Promise.resolve(window.HSKMusic);if(musicLoad)return musicLoad;
  mark('module-start');musicLoad=(async()=>{for(const url of ['./src/modules/music/music-core.js','./src/modules/music/music-lyrics-core.js','./src/modules/music/music-transcript.js','./src/modules/music/music-lyrics-ui.js','./src/modules/music/music-soundcloud.js','./src/modules/shell/legacy-music-cleanup.js','./src/modules/music/music.js'])await scriptFile(url);if(!window.HSKMusic)throw Error('Trình phát chưa sẵn sàng.');mark('module-ready');measure('module-load','module-start','module-ready');return window.HSKMusic;})().catch(()=>{musicLoad=null;window.dispatchEvent(new Event('hsk-music-load-error'));return null;});return musicLoad;
 }
 window.HSKMusicLoad={start:startMusic};
 window.HSKMusicBootstrap={config:fetch('./music-config.json').then(r=>r.ok?r.json():null).catch(()=>null)};
 startMusic(); // Independent of study data; head preloads fetch all four files concurrently.
 async function dataText(name){
  if(typeof DecompressionStream!=='function'||location.protocol==='file:')return null;
  try{const r=await fetch(dataRoot+name+'.js.gz');if(!r.ok)throw Error('HTTP '+r.status);const code=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();if(!code.trim().startsWith('const '+name+(name==='words'?' ':'='))&&name!=='words')throw Error('Dữ liệu không hợp lệ');return code;}catch(e){return null;}
 }
 try{
  const texts=await Promise.all(names.map(dataText));
  for(let i=0;i<names.length;i++){status.textContent='Dữ liệu học HSK ('+(i+1)+'/'+names.length+') đang load…';if(texts[i]!==null){const el=document.createElement('script');el.textContent=texts[i];document.body.append(el);}else await scriptFile(dataRoot+names[i]+'.js');await new Promise(resolve=>setTimeout(resolve,0));}
  await scriptFile('./src/modules/dictionary/open-dictionary-core.js');await scriptFile('./src/utils/text.js');await scriptFile('./src/utils/format.js');await scriptFile('./src/modules/dictionary/search-core.js');await scriptFile('./src/ui/dictionary-relations.js');await scriptFile('./app.js?v=push-2');await scriptFile('./src/modules/dictionary/open-dictionary.js');await scriptFile('./push.js?v=push-2');status.hidden=true;mark('study-ready');
 }catch(e){status.textContent='Chưa tải được dữ liệu. Kiểm tra mạng và việc đã tải đủ các file dữ liệu lên GitHub. ';const retry=document.createElement('button');retry.textContent='Tải lại';retry.onclick=()=>location.reload();status.append(retry);window.dispatchEvent(new Event('hsk-data-load-error'));}
})();
