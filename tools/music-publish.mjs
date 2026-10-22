// Stage an immutable R2 asset, then publish a validated lesson using an owner ID token.
// Tokens are read from the normal process environment and never printed or committed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import '../src/modules/music/music-core.js';
const C=globalThis.HSKMusicCore;
async function main(){
 const [manifestPath,mediaPath]=process.argv.slice(2);if(!manifestPath)throw Error('Dùng: node tools/music-publish.mjs lesson.json [song.mp3]');
 const endpoint=new URL(process.env.HSK_MUSIC_ENDPOINT||''),token=process.env.HSK_MUSIC_ADMIN_ID_TOKEN;
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!token)throw Error('Cần HSK_MUSIC_ENDPOINT (HTTPS) và HSK_MUSIC_ADMIN_ID_TOKEN của admin.');
 let song=C.validateSong(JSON.parse(fs.readFileSync(manifestPath,'utf8')));
 if(song.source.kind==='local'){
  const extension=path.extname(mediaPath||'').slice(1).toLowerCase();if(!['mp3','mp4','m4a','wav'].includes(extension))throw Error('Chọn mp3/mp4/m4a/wav.');
  const data=fs.readFileSync(mediaPath);if(data.length>52428800)throw Error('Bản thử nhận tối đa 50 MB mỗi tệp.');
  const key='music/'+crypto.createHash('sha256').update(data).digest('hex')+'.'+extension;
  const bucket=process.env.HSK_MUSIC_BUCKET||'hsk-music-pilot';if(!/^[a-z0-9-]{3,63}$/.test(bucket))throw Error('Tên bucket không hợp lệ.');
  const result=spawnSync('npx',['--no-install','wrangler','r2','object','put',bucket+'/'+key,'--file',path.resolve(mediaPath),'--remote'],{stdio:'inherit',shell:false});if(result.error||result.status!==0)throw Error('Chưa tải được tệp lên R2.');
  song={...song,source:{kind:'r2',key}};
 }
 const response=await fetch(endpoint.href.replace(/\/$/,'')+'/api/admin/song',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(song),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Chưa xuất bản được bài ('+response.status+'). Tệp đã tải lên có thể cần dọn thủ công.');
 console.log('Đã xuất bản bài nhạc:',song.id);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
