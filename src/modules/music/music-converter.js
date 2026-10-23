/* Device-side encoding. The optional source service only supplies original audio bytes. */
(function(root){
 'use strict';
 const MAX=50*1024*1024;
 async function readSource(response,signal){
  if(!response.ok)throw Error('Không tải được nguồn âm thanh ('+response.status+').');
  if(Number(response.headers.get('Content-Length'))>MAX)throw Error('Nguồn vượt 50 MB.');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){if(signal.aborted)throw new DOMException('Đã hủy.','AbortError');const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX)throw Error('Nguồn vượt 50 MB.');chunks.push(value);}}
  catch(e){await reader.cancel().catch(()=>{});throw e;}
  if(!size)throw Error('Nguồn âm thanh trống.');
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes.buffer;
 }
 function encode(bytes,bitrate,{signal,onStatus=()=>{}}){
  return new Promise((resolve,reject)=>{
   if(signal.aborted){reject(new DOMException('Đã hủy.','AbortError'));return;}
   const worker=new Worker(new URL('./music-codec-worker.js',document.querySelector('script[src*="music-converter.js"]')?.src||new URL('./src/modules/music/music-converter.js',document.baseURI)));
   const finish=(error,value)=>{clearTimeout(timer);signal.removeEventListener('abort',abort);worker.terminate();error?reject(error):resolve(value);};
   const abort=()=>finish(new DOMException('Đã hủy.','AbortError'));
   const timer=setTimeout(()=>finish(Error('Chuyển nhạc quá lâu. Thử lại với bài ngắn hơn.')),240000);
   signal.addEventListener('abort',abort,{once:true});
   worker.onerror=()=>finish(Error('Không tải được bộ nén âm thanh. Kiểm tra mạng rồi thử lại.'));
   worker.onmessage=({data})=>{if(data.status==='done')finish(null,new File([data.bytes],'offline.m4a',{type:'audio/mp4'}));else if(data.status==='error')finish(Error(data.error));else onStatus(data.status,data.progress);};
   worker.postMessage({bytes,bitrate},[bytes]);
  });
 }
 root.HSKMusicConverter={readSource,encode};
})(window);
