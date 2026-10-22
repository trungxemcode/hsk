/* Shared, deterministic music lesson contracts. No network or learner writes. */
(function(root){
 'use strict';
 const VERSION=1, HISTORY_KEY='hsk-music-history-v1';
 const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 function validateSong(value){
  if(!value||value.version!==VERSION||!/^[-a-zA-Z0-9_]{1,80}$/.test(value.id||'')||!text(value.title,120))throw Error('Bài hát cần version=1, mã id và tên hợp lệ.');
  if(!Array.isArray(value.segments)||!value.segments.length||value.segments.length>250)throw Error('Mỗi bài cần 1–250 câu có mốc thời gian.');
  const source=value.source;
  if(!source||!['local','r2','youtube'].includes(source.kind))throw Error('Chọn nguồn local, r2 hoặc youtube.');
  if(source.kind==='r2'&&!/^music\/[a-f0-9]{64}\.(mp4|mp3|m4a|wav)$/.test(source.key||''))throw Error('Khóa R2 phải dùng music/<sha256>.<đuôi tệp>.');
  if(source.kind==='youtube'&&!/^[a-zA-Z0-9_-]{11}$/.test(source.videoId||''))throw Error('Mã video YouTube không hợp lệ.');
  const ids=new Set();let end=0;
  const segments=value.segments.map((s,i)=>{
   if(!s||!/^[-a-zA-Z0-9_]{1,80}$/.test(s.id||'')||ids.has(s.id))throw Error('Mã câu không được trùng.');ids.add(s.id);
   if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<end||s.end<=s.start||s.end>1800)throw Error('Mốc thời gian phải tăng, không chồng nhau và nằm trong 30 phút.');end=s.end;
   if(!text(s.hanzi,300)||!text(s.pinyin,600)||!text(s.vi,600))throw Error('Mỗi câu cần lời Hán, pinyin và nghĩa Việt.');
   if(s.tokens!==undefined&&(!Array.isArray(s.tokens)||s.tokens.length>150||s.tokens.some(t=>!text(t,40))||s.tokens.join('').replace(/[^\p{Script=Han}]/gu,'')!==s.hanzi.replace(/[^\p{Script=Han}]/gu,'')))throw Error('Danh sách tách từ phải khớp lời câu.');
   const q=s.quiz;
   if(!q||!text(q.question,300)||!Array.isArray(q.options)||q.options.length<2||q.options.length>4||q.options.some(o=>!text(o,300))||new Set(q.options).size!==q.options.length||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)throw Error('Mỗi câu cần câu hỏi, 2–4 lựa chọn khác nhau và chỉ số đáp án.');
   return {id:s.id,start:s.start,end:s.end,hanzi:s.hanzi,pinyin:s.pinyin,vi:s.vi,...(s.tokens?{tokens:s.tokens.slice()}:{}),quiz:{question:q.question,options:q.options.slice(),answer:q.answer}};
  });
  return {version:VERSION,id:value.id,title:value.title,artist:String(value.artist||'').slice(0,120),credit:String(value.credit||'').slice(0,500),revision:String(value.revision||'1').slice(0,80),source:{kind:source.kind,...(source.kind==='r2'?{key:source.key}:source.kind==='youtube'?{videoId:source.videoId}:{})},segments};
 }
 function dictionary(words){
  const map=new Map();
  for(const w of words||[]){const level=Number(w.hsk);if(!Number.isInteger(level)||level<1||level>6)continue;
   for(const han of [w.han,...String(w.han||'').split(/[()（）]/)])if(han&&/^[\p{Script=Han}]+$/u.test(han)&&(!map.has(han)||map.get(han).hsk>level))map.set(han,{han,hsk:level,pin:w.pin||'',mean:w.mean||''});
  }return map;
 }
 function tokenize(hanzi){
  if(typeof Intl.Segmenter==='function')return [...new Intl.Segmenter('zh',{granularity:'word'}).segment(hanzi)].filter(x=>x.isWordLike&&/\p{Script=Han}/u.test(x.segment)).map(x=>x.segment);
  // Keep unknown phrases intact rather than guessing they are HSK1 characters.
  return hanzi.match(/[\p{Script=Han}]+/gu)||[];
 }
 function classify(segment,lexicon){
  const tokens=(segment.tokens||tokenize(segment.hanzi)).filter(t=>/\p{Script=Han}/u.test(t));
  const counts=Array(6).fill(0),unknown=[],items=[];
  for(const token of tokens){const w=lexicon.get(token);if(w)counts[w.hsk-1]++;else unknown.push(token);items.push(w||{han:token,hsk:null,pin:'',mean:''});}
  const known=counts.reduce((a,b)=>a+b,0),largest=Math.max(...counts);
  // Dominant exact HSK level by token occurrences; ties prefer the higher level.
  const level=known?counts.lastIndexOf(largest)+1:null,total=tokens.length;
  return {level,total,counts,ratios:counts.map(n=>total?n/total:0),unknownRatio:total?unknown.length/total:0,newWords:[...new Set(unknown)],items};
 }
 function activeSegment(segments,time){return segments.findIndex(s=>time>=s.start&&time<s.end);}
 function grade(segment,index){return Number.isInteger(index)&&index>=0&&index<segment.quiz.options.length?index===segment.quiz.answer:null;}
 function record(history,song,segment,index,time=Date.now()){
  const correct=grade(segment,index);if(correct===null)throw Error('Chọn đáp án trước khi xác nhận.');
  const rows=Array.isArray(history)?history:[],key=song.id+':'+song.revision+':'+segment.id;
  return [{key,songId:song.id,revision:song.revision,segmentId:segment.id,title:song.title,correct,answer:index,at:time},...rows.filter(x=>x.key!==key)].slice(0,200);
 }
 function renderedRect(cw,ch,vw,vh,fit='contain'){
  const scale=fit==='cover'?Math.max(cw/vw,ch/vh):Math.min(cw/vw,ch/vh);
  return {width:vw*scale,height:vh*scale,x:(cw-vw*scale)/2,y:(ch-vh*scale)/2};
 }
 const api={VERSION,HISTORY_KEY,validateSong,dictionary,tokenize,classify,activeSegment,grade,record,renderedRect};
 root.HSKMusicCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
