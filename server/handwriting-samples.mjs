// Confirmed, normalized bitmaps only. This endpoint never calls Gemini.
export function validateHandwritingSample(sample){
 if(!sample||sample.schema!==1||sample.confirmed!==true||typeof sample.label!=='string'||!(/^[\u3400-\u9fff\u3007]$/u.test(sample.label))||typeof sample.modelVersion!=='string'||!(/^[a-zA-Z0-9_.-]{1,80}$/.test(sample.modelVersion))||sample.source!==undefined&&!['local','ai','manual'].includes(sample.source))return false;
 if(Object.keys(sample).some(key=>!['schema','confirmed','label','bitmap','modelVersion','source'].includes(key)))return false;
 if(typeof sample.bitmap!=='string'||sample.bitmap.length!==172||!(/^[A-Za-z0-9+/]{171}=$/.test(sample.bitmap)))return false;
 try{const bytes=atob(sample.bitmap);if(bytes.length!==128||btoa(bytes)!==sample.bitmap)return false;let count=0;for(const c of bytes){let n=c.charCodeAt(0);while(n){count+=n&1;n>>=1;}}return count>=4&&count<=800;}catch{return false;}
}
async function sampleHash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');}
export async function submitHandwritingSample(sample,uid,env,time){
 if(!env.HANDWRITING_DB)return {status:503,body:{error:'Dịch vụ góp mẫu chưa sẵn sàng. Mẫu vẫn được giữ trên thiết bị.'}};
 const author=await sampleHash('hsk-handwriting:'+uid),id=await sampleHash(author+'\0'+sample.bitmap),dayStart=Math.floor(time/86400000)*86400000;
 const result=await env.HANDWRITING_DB.prepare(`
  INSERT INTO handwriting_samples (id,author_hash,label,bitmap,model_version,suggestion_source,review_status,created_at,updated_at)
  SELECT ?,?,?,?,?,?,'pending',?,?
  WHERE EXISTS (SELECT 1 FROM handwriting_samples WHERE id=?)
   OR ((SELECT COUNT(*) FROM handwriting_samples WHERE author_hash=? AND created_at>=?)<100
    AND (SELECT COUNT(*) FROM handwriting_samples WHERE created_at>=?)<10000)
  ON CONFLICT(id) DO UPDATE SET
   review_status=CASE WHEN handwriting_samples.label<>excluded.label THEN 'pending' ELSE handwriting_samples.review_status END,
   label=excluded.label,model_version=excluded.model_version,suggestion_source=excluded.suggestion_source,updated_at=excluded.updated_at
 `).bind(id,author,sample.label,sample.bitmap,sample.modelVersion,sample.source||'local',time,time,id,author,dayStart,dayStart).run();
 if(!result.success)throw Error('Handwriting sample persistence failed');
 if(!result.meta?.changes)return {status:429,body:{error:'Đã đạt giới hạn góp mẫu hôm nay. Mẫu vẫn được giữ trên thiết bị.'}};
 return {status:202,body:{accepted:true,review:'pending-or-previously-reviewed'}};
}
