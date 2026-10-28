import Pinyin from '../../vendor/pinyin-pro/pinyin-pro.js';
import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import {similarity,phonetic} from './batch-reference.mjs';
const sound=s=>Pinyin.pinyin(s,{toneType:'none'});
export function verifyLrc(lrc,source,raw,duration){
 if(typeof lrc!=='string'||lrc.length>32000||!Number.isFinite(duration)||duration>480)throw Error('Invalid reference');
 const credits=/(?:作词|作曲|编曲|混音|录音|和声|监制|制作|出品|发行|策划|统筹|未经授权|OP\s*\/\s*SP|版权所有)/i;
 const cues=[];for(const line of lrc.split(/\r?\n/)){const text=line.replace(/\[.*?\]/g,'').trim();if(!text||/[:：]/.test(text)||credits.test(text)||/^(?:artist|singer|composer|producer|arranger|trans)\s*:/i.test(text)||!/[\u3400-\u9fffA-Za-z]/u.test(text))continue;for(const m of line.matchAll(/\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]/g)){const start=+m[1]*60+(+m[2]);if(start>0&&start<duration+30)cues.push({start,text});}}
 cues.sort((a,b)=>a.start-b.start);if(cues.length<8||cues.length>150||cues.some((c,i)=>i&&c.start<=cues[i-1].start))throw Error('Invalid cue timeline');
 const original=source.lines||[];const marker=original.findIndex(s=>/^lyrics\s*[:：]/i.test(s));const expected=(marker<0?original:original.slice(marker+1)).join(' '),referenceScore=similarity(sound(cues.map(c=>c.text).join(' ')),source.kind==='hanzi'?sound(expected):expected);
 if(referenceScore<.98)throw Error('Canonical lyrics do not match channel reference');
 const segments=(raw.segments||[]).slice(0,400),groups=[];
 for(let i=0;i<segments.length;i++)for(let n=1;n<=3&&i+n<=segments.length;n++){const part=segments.slice(i,i+n);if(part.some(s=>typeof s.text!=='string'||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.end<=s.start))continue;groups.push({segment:i,count:n,start:part[0].start,end:part.at(-1).end,phonetic:sound(part.map(s=>s.text).join(' '))});}
 const clean=s=>Array.from(s).filter(c=>!/[\s\p{P}\p{S}]/u.test(c)).join('').toLowerCase(),words=(raw.words||[]).filter(w=>typeof w.word==='string'&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.start>=0&&w.end>w.start&&w.end<=duration+.5).slice(0,4000).sort((a,b)=>a.start-b.start).map(w=>({...w,chars:clean(w.word)}));
 const candidates=cues.map((c,index)=>{const target=sound(c.text),text=clean(c.text),options=groups.filter(g=>Math.abs(g.start-c.start)<=30).map(g=>({...g,index,time:c.start,delta:g.start-c.start,score:similarity(target,g.phonetic)})).filter(g=>g.score>=.9);
  // A provider often combines several lyric lines into one segment. Anchor the
  // complete canonical phrase to actual word onsets instead of dividing segments.
  for(let i=0;i<words.length;i++){const w=words[i];if(!w.chars||Math.abs(w.start-c.start)>30||w.chars[0]!==text[0]&&phonetic(sound(w.chars[0]))!==phonetic(sound(text[0])))continue;let joined='';for(let j=i;j<Math.min(words.length,i+60);j++){joined+=words[j].chars;if(joined.length>text.length*1.2+2)break;if(joined.length<text.length*.8)continue;const score=joined===text?1:similarity(target,sound(joined));if(score>=.9)options.push({segment:i,count:j-i+1,start:w.start,end:words[j].end,index,time:c.start,delta:w.start-c.start,score,wordAnchored:true});}}
  return options;
 });
 const centers=[...new Set(candidates.flat().map(c=>Math.round(c.delta*10)/10))],span=cues.at(-1).start-cues[0].start;let best=null;
 for(const center of centers){const anchors=[];let lastEnd=-1;for(const choices of candidates){const chosen=choices.filter(c=>c.start>=lastEnd-.05&&Math.abs(c.delta-center)<=.8).sort((a,b)=>b.score-a.score||Math.abs(a.delta-center)-Math.abs(b.delta-center))[0];if(chosen){anchors.push(chosen);lastEnd=chosen.end;}}
  const covered=anchors.length?anchors.at(-1).time-anchors[0].time:0,thirds=[0,0,0];for(const a of anchors)thirds[Math.min(2,Math.floor((a.time-cues[0].start)/span*3))]++;
  if(anchors.length<8||anchors.length/cues.length<.5||covered/span<.75||thirds.some(n=>n<1))continue;
  const mean=anchors.reduce((n,a)=>n+a.delta,0)/anchors.length,variance=anchors.reduce((n,a)=>n+(a.delta-mean)**2,0)/anchors.length,mt=anchors.reduce((n,a)=>n+a.time,0)/anchors.length,slope=anchors.reduce((n,a)=>n+(a.time-mt)*(a.delta-mean),0)/anchors.reduce((n,a)=>n+(a.time-mt)**2,0),sorted=anchors.map(a=>a.delta).sort((a,b)=>a-b),offset=sorted[Math.floor(sorted.length/2)];
  if(Math.abs(offset)>30||Math.sqrt(variance)>.45||Math.abs(slope)>.005||cues.some(c=>c.start+offset<0||c.start+offset>=duration))continue;
  if(!best||anchors.length>best.anchors.length||anchors.length===best.anchors.length&&variance<best.variance)best={anchors,covered,thirds,mean,variance,slope,offset};
 }
 if(!best)throw Error('Insufficient independent audio anchors or recording tempo differs');
 const {anchors,covered,thirds,mean,variance,slope,offset}=best,timed=cues.map(c=>({...c,start:c.start+offset}));
 const value=Lyrics.validate({cues:timed.map((c,i)=>({...c,end:timed[i+1]?.start??duration,pinyin:Pinyin.pinyin(c.text)}))});
 return {...value,status:'draft',reviewed:false,publication:'automatic-draft',method:'lrc-asr-verified',diagnostics:{referenceScore,anchorCount:anchors.length,cueCount:cues.length,anchorSpan:covered/span,anchorThirds:thirds,calibratedOffset:offset,meanOffset:mean,offsetDeviation:Math.sqrt(variance),tempoDrift:slope,renderableCharacters:0},cues:value.cues.map(c=>({...c,uncertain:true,reason:'Mốc LRC gốc đã đối chiếu với audio; chỉ theo dòng.'}))};
}
