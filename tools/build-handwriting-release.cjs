const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),learning=require('../src/modules/handwriting/handwriting-learning.js');
function buildRelease(input,characters,revision){
 if(!/^[a-zA-Z0-9_.-]{1,80}$/.test(revision))throw Error('Invalid release revision');
 const allowed=new Set(Array.from(characters));
 const rows=Array.isArray(input)?input.flatMap(item=>Array.isArray(item.results)?item.results:[item]):input.results||[];
 const labelsByBitmap=new Map();let invalid=0;
 for(const row of rows){if(row.review_status!=='approved'||!allowed.has(row.label)){invalid++;continue;}try{learning.unpack(row.bitmap);}catch{invalid++;continue;}const labels=labelsByBitmap.get(row.bitmap)||new Set();labels.add(row.label);labelsByBitmap.set(row.bitmap,labels);}
 const selected=[],seen=new Set(),counts=new Map();let conflicting=0;
 for(const row of [...rows].sort((a,b)=>(b.updated_at||0)-(a.updated_at||0))){
  if(row.review_status!=='approved'||!allowed.has(row.label)||!labelsByBitmap.has(row.bitmap))continue;
  if(labelsByBitmap.get(row.bitmap).size!==1){conflicting++;continue;}
  if(seen.has(row.label+'|'+row.bitmap)||(counts.get(row.label)||0)>=3||selected.length>=2000)continue;
  seen.add(row.label+'|'+row.bitmap);counts.set(row.label,(counts.get(row.label)||0)+1);selected.push({label:row.label,bitmap:row.bitmap});
 }
 return {schema:1,revision,samples:selected,source:{approvedRows:rows.filter(row=>row.review_status==='approved').length,included:selected.length,ignoredInvalidOrUnreviewed:invalid,ignoredConflicting:conflicting},note:'Reviewed normalized handwriting bitmaps. No author IDs or account data are published.'};
}
if(require.main===module){const input=process.argv[2],output=process.argv[3]||'handwriting-learned.json',revision=process.argv[4];if(!input||!revision)throw Error('Usage: node tools/build-handwriting-release.cjs approved-export.json output.json revision');const base=JSON.parse(fs.readFileSync(path.join(__dirname,'..','handwriting-data.json')));const release=buildRelease(JSON.parse(fs.readFileSync(input)),base.characters,revision);const text=JSON.stringify(release);fs.writeFileSync(output,text);console.log(JSON.stringify({revision,characters:new Set(release.samples.map(s=>s.label)).size,samples:release.samples.length,bytes:Buffer.byteLength(text),sha256:crypto.createHash('sha256').update(text).digest('hex')}));}
module.exports={buildRelease};
