import {verifyLrc} from './lrc-proof.mjs';
const read=async o=>{try{return o?await o.json():null;}catch{return null;}};
export async function recoverVerifiedLrc(id,duration,env){
 const b=env.MUSIC_BUCKET;if(!/^[a-f0-9]{64}\.m4a$/.test(id)||!Number.isFinite(duration)||duration<=0||duration>480||await b.head('lyrics/'+id+'.json'))return null;
 const ah=await b.head('audio/'+id),sh=await b.head('lyrics-sources/'+id+'.json'),rh=await b.head('lyrics-drafts/'+id+'/groq-raw.json'),ch=await b.head('lyrics-lrc-sources/'+id+'.json');
 if(!ah||ah.customMetadata?.published!=='true'||ah.size>12*1024*1024||!sh||!rh||!ch||ch.size>256000||rh.size>1024*1024||sh.size>256000||rh.customMetadata?.sourceEtag!==sh.httpEtag||rh.customMetadata?.audioEtag!==ah.httpEtag||ch.customMetadata?.sourceEtag!==sh.httpEtag||ch.customMetadata?.audioEtag!==ah.httpEtag)return null;
 const source=await read(await b.get('lyrics-sources/'+id+'.json')),raw=await read(await b.get('lyrics-drafts/'+id+'/groq-raw.json')),pack=await read(await b.get('lyrics-lrc-sources/'+id+'.json'));
 if(!source?.batchId||!source.autoPublish||Number.isFinite(source.duration)&&Math.abs(source.duration-duration)>.1||!Array.isArray(pack?.candidates)||pack.candidates.length>8)return null;
 for(const candidate of pack.candidates){
  if(!/^https:\/\/music\.163\.com\/song\?id=\d+$/.test(candidate.referenceSource||''))continue;
  let value;try{value=verifyLrc(candidate.lyric,source,raw,duration);}catch{continue;}
  value.referenceSource=candidate.referenceSource;value.batchId=source.batchId;value.model='whisper-large-v3';value.sourceHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(candidate.lyric)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const a=await b.head('audio/'+id),s=await b.head('lyrics-sources/'+id+'.json');if(a?.httpEtag!==ah.httpEtag||a.customMetadata?.published!=='true'||s?.httpEtag!==sh.httpEtag)return null;
  const written=await b.put('lyrics/'+id+'.json',JSON.stringify(value),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'public, max-age=60'},customMetadata:{reviewed:'false',batchId:source.batchId}});if(!written)return null;
  await b.put('lyrics-drafts/'+id+'/groq.json',JSON.stringify(value),{httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'no-store'},customMetadata:{sourceEtag:sh.httpEtag,audioEtag:ah.httpEtag}});
  return {...value,saved:true};
 }
 return null;
}
