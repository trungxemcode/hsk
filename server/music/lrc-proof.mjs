import Pinyin from '../../vendor/pinyin-pro/pinyin-pro.js';
import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import {similarity} from './batch-reference.mjs';
const sound=s=>Pinyin.pinyin(s,{toneType:'none'});
export function verifyLrc(lrc,source,raw,duration){
 if(typeof lrc!=='string'||lrc.length>32000||!Number.isFinite(duration)||duration>480)throw Error('Invalid reference');
 const credits=/(?:作词|作曲|编曲|混音|录音|和声|监制|制作|出品|发行|策划|统筹|未经授权|OP\s*\/\s*SP|版权所有)/i;
 const cues=[];for(const line of lrc.split(/\r?\n/)){const text=line.replace(/\[.*?\]/g,'').trim();if(!text||credits.test(text)||/^(?:artist|singer|composer|producer|arranger|trans)\s*:/i.test(text)||!/[\u3400-\u9fffA-Za-z]/u.test(text))continue;for(const m of line.matchAll(/\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]/g)){const start=+m[1]*60+(+m[2]);if(start>0&&start<duration)cues.push({start,text});}}
 cues.sort((a,b)=>a.start-b.start);if(cues.length<8||cues.length>150||cues.some((c,i)=>i&&c.start<=cues[i-1].start))throw Error('Invalid cue timeline');
 const original=source.lines||[];const marker=original.findIndex(s=>/^lyrics\s*[:：]/i.test(s));const expected=(marker<0?original:original.slice(marker+1)).join(' '),referenceScore=similarity(sound(cues.map(c=>c.text).join(' ')),source.kind==='hanzi'?sound(expected):expected);
 if(referenceScore<.98)throw Error('Canonical lyrics do not match channel reference');
 const segments=raw.segments||[],used=new Set(),anchors=[];
 for(const [index,c]of cues.entries()){const matches=[];for(let i=0;i<segments.length;i++){if(used.has(i)||Math.abs(segments[i].start-c.start)>1.2)continue;for(let n=1;n<=3&&i+n<=segments.length;n++){const part=segments.slice(i,i+n);if(part.some((s,j)=>used.has(i+j)||!Number.isFinite(s.start)||!Number.isFinite(s.end)))continue;const score=similarity(sound(c.text),sound(part.map(s=>s.text).join(' ')));if(score>=.9)matches.push({index,segment:i,count:n,score,time:c.start,delta:segments[i].start-c.start});}}matches.sort((a,b)=>b.score-a.score||Math.abs(a.delta)-Math.abs(b.delta));const best=matches[0];if(best){anchors.push(best);for(let i=0;i<best.count;i++)used.add(best.segment+i);}}
 const span=cues.at(-1).start-cues[0].start,covered=anchors.length?anchors.at(-1).time-anchors[0].time:0,thirds=[0,0,0];for(const a of anchors)thirds[Math.min(2,Math.floor((a.time-cues[0].start)/span*3))]++;
 if(anchors.length<8||anchors.length/cues.length<.5||covered/span<.75||thirds.some(n=>n<1))throw Error('Insufficient independent audio anchors');
 const mean=anchors.reduce((n,a)=>n+a.delta,0)/anchors.length,variance=anchors.reduce((n,a)=>n+(a.delta-mean)**2,0)/anchors.length;
 const mt=anchors.reduce((n,a)=>n+a.time,0)/anchors.length,slope=anchors.reduce((n,a)=>n+(a.time-mt)*(a.delta-mean),0)/anchors.reduce((n,a)=>n+(a.time-mt)**2,0);
 if(Math.abs(mean)>.8||Math.sqrt(variance)>.45||Math.abs(slope)>.005)throw Error('Recording offset or tempo differs');
 const value=Lyrics.validate({cues:cues.map((c,i)=>({...c,end:cues[i+1]?.start??duration,pinyin:Pinyin.pinyin(c.text)}))});
 return {...value,status:'draft',reviewed:false,publication:'automatic-draft',method:'lrc-asr-verified',diagnostics:{referenceScore,anchorCount:anchors.length,cueCount:cues.length,anchorSpan:covered/span,anchorThirds:thirds,meanOffset:mean,offsetDeviation:Math.sqrt(variance),tempoDrift:slope,renderableCharacters:0},cues:value.cues.map(c=>({...c,uncertain:true,reason:'Mốc LRC gốc đã đối chiếu với audio; chỉ theo dòng.'}))};
}
