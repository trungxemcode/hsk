/* Timestamped, read-only lyrics shared by browser and publication service. */
(function(root){
'use strict';
const MAX_BYTES=500000,MAX_CUES=2000,MAX_TIME=86400;
const plain=value=>String(value??'').replace(/<[^>]*>/g,'').trim();
function validate(input){
 const rows=Array.isArray(input)?input:input?.cues||input?.segments;
 if(!Array.isArray(rows)||!rows.length||rows.length>MAX_CUES)throw Error('Script cần từ 1 đến 2000 câu có mốc thời gian.');
 const cues=rows.map(row=>{
  const start=row.start,end=row.end??null,text=plain(row.text??row.hanzi),pinyin=plain(row.pinyin),vi=plain(row.vi);
  if(typeof start!=='number'||!Number.isFinite(start)||start<0||start>MAX_TIME||end!==null&&(typeof end!=='number'||!Number.isFinite(end)||end<=start||end>MAX_TIME)||text.length>2000||pinyin.length>2000||vi.length>2000)throw Error('Mốc thời gian hoặc nội dung câu chưa hợp lệ.');
  return {start,end,text,pinyin,vi};
 }).sort((a,b)=>a.start-b.start);
 if(!cues.some(c=>c.text))throw Error('Script chưa có lời bài hát.');
 for(let i=0;i<cues.length-1;i++){
  if(cues[i].start===cues[i+1].start||cues[i].end!==null&&cues[i].end>cues[i+1].start+.001)throw Error('Các câu bị trùng hoặc chồng mốc thời gian.');
  if(cues[i].end===null)cues[i].end=cues[i+1].start;
 }
 const result={version:1,cues};
 if(new TextEncoder().encode(JSON.stringify(result)).length>MAX_BYTES)throw Error('Script tối đa 500 KB.');
 return result;
}
function parse(source,filename=''){
 if(typeof source!=='string'||new TextEncoder().encode(source).length>MAX_BYTES)throw Error('Script tối đa 500 KB.');
 source=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 if(/\.json$/i.test(filename)||/^\{/.test(source)||/^\[\s*\{/.test(source)){let data;try{data=JSON.parse(source);}catch{throw Error('JSON chưa hợp lệ.');}return validate(data);}
 const cues=[];
 if(/-->/.test(source)){
  const stamp=s=>{const m=s.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/);if(!m||+m[2]>=60||+m[3]>=60)throw Error('Mốc thời gian SRT chưa hợp lệ.');return +m[1]*3600+ +m[2]*60+ +m[3]+ +m[4]/1000;};
  for(const block of source.split(/\n\s*\n/)){
   const lines=block.split('\n');if(/^\d+$/.test(lines[0]))lines.shift();
   const m=lines.shift()?.match(/^(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/);if(!m)throw Error('Mỗi đoạn SRT phải có mốc bắt đầu và kết thúc.');
   cues.push({start:stamp(m[1]),end:stamp(m[2]),text:lines.join('\n')});
  }
 }else{
  let offset=0;const byTime=new Map();
  for(const line of source.split('\n')){const m=line.match(/^\[offset:([+-]?\d+)\]$/i);if(m)offset=+m[1]/1000;}
  if(!Number.isFinite(offset)||Math.abs(offset)>MAX_TIME)throw Error('Độ lệch LRC chưa hợp lệ.');
  for(const line of source.split('\n')){
   const stamps=[...line.matchAll(/\[(\d{1,4}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
   if(!stamps.length){if(line.trim()&&!/^\[[a-z]+:.*\]$/i.test(line))throw Error('LRC cần mốc [phút:giây] cho từng câu.');continue;}
   const text=line.replace(/\[[^\]]*\]/g,'').trim();
   for(const m of stamps){if(+m[2]>=60)throw Error('Giây LRC phải nhỏ hơn 60.');const start=+m[1]*60+ +m[2]+Number('0.'+(m[3]||'0'))+offset;if(start<0)throw Error('Độ lệch LRC làm mốc thời gian âm.');const old=byTime.get(start);byTime.set(start,old&&text&&!old.split('\n').includes(text)?old+'\n'+text:old||text);}
  }
  for(const[start,text]of byTime)cues.push({start,text});
 }
 return validate({cues});
}
function active(cues,time,duration=Infinity){
 let lo=0,hi=cues.length-1,best=-1;
 while(lo<=hi){const m=(lo+hi)>>1;if(cues[m].start<=time){best=m;lo=m+1;}else hi=m-1;}
 return best>=0&&time<(cues[best].end??duration)?best:-1;
}
// Line-only scripts have no phoneme timing: distribute visible characters evenly.
// This estimate never changes the uploaded cue times or invents an end time.
function characterCount(cue,time,duration=Infinity){
 const count=Array.from(cue.text).filter(c=>!/[\s\p{P}\p{S}]/u.test(c)).length,end=cue.end??duration;
 if(!count||time<cue.start||!Number.isFinite(end)||end<=cue.start)return 0;
 if(time>=end)return count;
 return Math.min(count,Math.floor((time-cue.start)/(end-cue.start)*count)+1);
}
const api={parse,validate,active,characterCount,MAX_BYTES};root.HSKMusicLyricsCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
