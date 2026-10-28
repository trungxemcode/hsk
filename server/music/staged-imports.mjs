// Private R2 staging is written only by the owner's authenticated Wrangler session.
// No public endpoint accepts these manifests or accepts arbitrary remote audio URLs.
import {bounded} from './groq-alignment.mjs';
import {stageImportReference} from './batch-reference.mjs';
import {enqueueGroqJob} from './groq-queue.mjs';
import {youtubeId} from './import-jobs.mjs';
const PREFIX='batch-staging/',LIMIT=12*1024*1024;
async function save(b,key,value,onlyIf){return b.put(key,JSON.stringify(value),{...(onlyIf?{onlyIf}:{}),httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'no-store'},customMetadata:{state:value.state,createdAt:String(value.createdAt||0),leaseUntil:String(value.leaseUntil||0)}});}
export async function runStagedImport(env,now=Date.now()){
 const b=env.MUSIC_BUCKET;if(!b)return {state:'disabled'};
 const page=await b.list({prefix:PREFIX,limit:100,include:['customMetadata']});
 const next=page.objects.filter(o=>/batch-staging\/[a-f0-9]{32}\.json$/.test(o.key)&&((o.customMetadata?.state||'queued')==='queued'||o.customMetadata?.state==='running'&&Number(o.customMetadata.leaseUntil)<now)).sort((a,b)=>Number(a.customMetadata?.createdAt||0)-Number(b.customMetadata?.createdAt||0))[0];
 if(!next)return {state:'idle'};
 const head=await b.head(next.key),obj=await b.get(next.key);if(!head||!obj)return {state:'idle'};
 const job=JSON.parse(new TextDecoder().decode(await bounded(obj.body,100000))),id=next.key.slice(PREFIX.length,-5);
 if(!job.batchId||job.id!==id||!Number.isFinite(job.duration)||job.duration<=0||job.duration>480||!/^[a-f0-9]{64}$/.test(job.audioSha256||''))return {state:'invalid'};
 youtubeId(job.url);
 const claimed={...job,state:'running',leaseUntil:now+600000};if(!await save(b,next.key,claimed,{etagMatches:head.etag}))return {state:'busy'};
 try{
  const audio=await b.get('batch-audio/'+id+'.m4a');if(!audio)throw Error('missing audio');
  const bytes=await bounded(audio.body,LIMIT);if(bytes.length<12||String.fromCharCode(...bytes.slice(4,8))!=='ftyp')throw Error('invalid audio');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==job.audioSha256)throw Error('audio checksum');
  const trackId=hash+'.m4a',existing=await b.head('audio/'+trackId);
  // Do not republish an existing hidden/unpublished track or overwrite its metadata.
  if(existing&&existing.customMetadata?.published!=='true')throw Error('existing private audio');
  if(!existing)await b.put('audio/'+trackId,bytes,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'audio/mp4',cacheControl:'public, max-age=86400'},customMetadata:{title:String(job.title||'').slice(0,120),artist:String(job.artist||'').slice(0,80),composer:String(job.composer||'').slice(0,120),sourceUrl:job.url,published:'true'}});
  const publicLyrics=await b.head('lyrics/'+trackId+'.json');
  const alignment=publicLyrics?{queued:false,preserved:true}:await stageImportReference(env,job,trackId,enqueueGroqJob);
  await save(b,next.key,{...claimed,state:'completed',leaseUntil:0,finishedAt:Date.now(),trackId,alignment});
  await b.delete('batch-audio/'+id+'.m4a');return {state:'completed',trackId};
 }catch{await save(b,next.key,{...claimed,state:'failed',leaseUntil:0,error:'Chưa nhập được bản audio đã chuẩn bị; cần kiểm tra.'});return {state:'failed'};}
}
