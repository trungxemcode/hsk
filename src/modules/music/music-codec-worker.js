/* One conversion per worker: termination releases the WASM heap and source bytes. */
'use strict';
async function wasmBytes(){
 const base=new URL('../../../vendor/music-codec/',self.location.href);
 const manifest=await fetch(new URL('manifest.json',base)).then(r=>{if(!r.ok)throw Error('Chưa tải được bộ nén.');return r.json();});
 if(!/^[a-f0-9]{64}$/.test(manifest.sha256))throw Error('Bộ nén chưa hợp lệ.');
 const url=new URL('ffmpeg-core.wasm?v='+manifest.sha256,base).href;
 let cache;try{cache=await caches.open('hsk-music-codec-v1');}catch{}
 let response=await cache?.match(url);if(!response){response=await fetch(url);if(!response.ok)throw Error('Chưa tải được bộ nén.');}
 const bytes=await response.arrayBuffer();
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==manifest.sha256){await cache?.delete(url);throw Error('Bộ nén tải chưa đủ. Thử lại.');}
 try{await cache?.put(url,new Response(bytes,{headers:{'Content-Type':'application/wasm'}}));if(cache)for(const request of await cache.keys())if(request.url!==url)await cache.delete(request);}catch{}
 return bytes;
}
onmessage=async({data})=>{
 try{
  if(![32,64,96].includes(data.bitrate)||!(data.bytes instanceof ArrayBuffer)||!data.bytes.byteLength||data.bytes.byteLength>50*1024*1024)throw Error('Nguồn âm thanh không hợp lệ hoặc vượt 50 MB.');
  postMessage({status:'loading'});
  importScripts('../../../vendor/music-codec/ffmpeg-core.js');
  const core=await createFFmpegCore({wasmBinary:await wasmBytes()});
  core.setLogger(()=>{});core.setTimeout(180000);
  core.FS.writeFile('source',new Uint8Array(data.bytes));
  let sourceInfo='';core.setLogger(({type,message})=>{if(type==='stdout')sourceInfo+=message+'\n';});
  if(core.ffprobe('-v','error','-show_entries','format=duration','-of','json','source')!==0)throw Error('Không đọc được nguồn âm thanh.');
  const duration=Number(JSON.parse(sourceInfo).format?.duration);
  if(!(duration>0&&duration<=900))throw Error('Chọn bài nhạc dài tối đa 15 phút.');
  core.reset();core.setLogger(()=>{});core.setTimeout(180000);
  postMessage({status:'encoding'});
  core.setProgress(({progress})=>postMessage({status:'encoding',progress:Math.max(0,Math.min(1,progress))}));
  const ret=core.exec('-hide_banner','-i','source','-vn','-ac','2','-ar','48000','-c:a','libfdk_aac','-profile:a','aac_he_v2','-b:a',data.bitrate+'k','-movflags','+faststart','-f','mp4','offline.m4a');
  if(ret!==0)throw Error('Không nén được nguồn âm thanh này.');
  let metadata='';core.reset();core.setLogger(({type,message})=>{if(type==='stdout')metadata+=message+'\n';});
  if(core.ffprobe('-v','error','-select_streams','a:0','-show_entries','stream=profile,channels:format=duration','-of','json','offline.m4a')!==0)throw Error('Không kiểm tra được file đã nén.');
  const info=JSON.parse(metadata),stream=info.streams?.[0];
  if(stream?.profile!=='HE-AACv2'||stream.channels!==2||!(Number(info.format?.duration)>0))throw Error('File chưa đúng chuẩn HE-AAC v2.');
  const bytes=core.FS.readFile('offline.m4a');
  if(!bytes.length||bytes.length>50*1024*1024)throw Error('File nén vượt giới hạn lưu trữ.');
  postMessage({status:'done',bytes:bytes.buffer},[bytes.buffer]);
 }catch(error){postMessage({status:'error',error:error.message||'Không chuyển được âm thanh.'});}
};
