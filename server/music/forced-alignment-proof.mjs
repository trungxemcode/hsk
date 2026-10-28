import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import Pinyin from '../../vendor/pinyin-pro/pinyin-pro.js';
import {checkRestoration} from './batch-reference.mjs';
const clean=s=>Array.from(String(s)).filter(c=>!/[\s\p{P}\p{S}]/u.test(c)).join('').toLowerCase();
const reject=s=>{throw Error(s);};
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function verifyDualAlignment({referenceLines,source,small,medium,smallMeta,mediumMeta,duration,trackId}){
 if(!/^[a-f0-9]{64}\.m4a$/.test(trackId||'')||!Number.isFinite(duration)||duration<=0||duration>480||!Array.isArray(referenceLines)||!referenceLines.length||referenceLines.length>150||referenceLines.some(s=>typeof s!=='string'||!clean(s)))reject('Invalid forced alignment input');
 const textHash=await hash(referenceLines.join('\n')),audioHash=trackId.slice(0,-4);for(const [meta,name] of [[smallMeta,'small'],[mediumMeta,'medium']])if(meta?.model!==name||meta.audioSha256!==audioHash||meta.textSha256!==textHash)reject('Audio, transcript or model identity changed');
 if(source.kind==='pinyin')checkRestoration(referenceLines,source.lines);else if(source.kind==='hanzi'){if(clean(referenceLines.join(''))!==clean(source.lines.join('')))reject('Canonical Chinese transcript changed');}else if(source.kind==='asr'){if(clean(referenceLines.join(''))!==clean((source.recognizedReferenceLines||[]).join('')))reject('Audio-generated reference changed');}else reject('Unsupported reference source');
 const profiles=[];
 for(const result of [small,medium]){
  if(!Array.isArray(result?.segments)||result.segments.length!==referenceLines.length)reject('Incomplete aligned transcript');let previous=-1,low=0,total=0,sum=0,zero=0;const rows=[];
  for(let i=0;i<referenceLines.length;i++){const s=result.segments[i];if(clean(s.text)!==clean(referenceLines[i])||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>duration+.1||s.start<=previous)reject('Invalid line content or timeline');previous=s.start;const words=s.words;if(!Array.isArray(words)||!words.length||clean(words.map(w=>w.word).join(''))!==clean(referenceLines[i]))reject('Incomplete word alignment');let mean=0;
   for(const w of words){if(!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<s.start-.05||w.end>s.end+.05||w.end<w.start||!Number.isFinite(w.probability)||w.probability<0||w.probability>1)reject('Invalid observed word timing or confidence');mean+=w.probability;sum+=w.probability;total++;if(w.probability<.3)low++;if(w.end===w.start)zero++;}mean/=words.length;if(mean<.3)reject('Low confidence aligned line '+(i+1));rows.push({mean,words});
  }
  if(sum/total<.55||low/total>.25||zero/total>.05)reject('Insufficient overall alignment confidence');profiles.push({rows,mean:sum/total,lowRatio:low/total,zeroRatio:zero/total});
 }
 const deltas=referenceLines.map((_,i)=>Math.abs(small.segments[i].start-medium.segments[i].start));if(deltas.some(d=>d>.75)||deltas.filter(d=>d<=.35).length/deltas.length<.9)reject('Independent model onset disagreement');
 const cues=medium.segments.map((s,i)=>{const row={start:s.start,end:s.end,text:referenceLines[i],pinyin:source.kind==='pinyin'?source.lines[i]:Pinyin.pinyin(referenceLines[i]),uncertain:true,reason:'Audio alignment from two independent model sizes; not manually reviewed.'},a=small.segments[i].words,b=s.words;const precise=a.length===b.length&&b.every((w,j)=>clean(w.word).length===1&&clean(a[j].word)===clean(w.word)&&w.probability>=.45&&a[j].probability>=.45&&Math.abs(w.start-a[j].start)<=.2&&w.end>w.start);
  if(precise){const characters=b.map((w,j)=>({text:Array.from(w.word).find(c=>clean(c)),start:w.start,end:Math.min(w.end,b[j+1]?.start??s.end)}));if(characters.every(c=>c.end>c.start))row.characters=characters;}return row;});
 for(let i=0;i<cues.length-1;i++){cues[i].end=Math.min(cues[i].end,cues[i+1].start);if(cues[i].characters){const last=cues[i].characters.at(-1);last.end=Math.min(last.end,cues[i].end);if(last.end<=last.start)delete cues[i].characters;}}
 const checked=Lyrics.validate({cues});return {...checked,status:'draft',reviewed:false,publication:'automatic-draft',method:'dual-forced-alignment',model:'whisper-small+medium',generatedFromAudio:source.kind==='asr',diagnostics:{models:['small','medium'],meanConfidence:profiles.map(p=>p.mean),lowConfidenceRatio:profiles.map(p=>p.lowRatio),maximumOnsetDisagreement:Math.max(...deltas),closeLineRatio:deltas.filter(d=>d<=.35).length/deltas.length,renderableCharacters:checked.cues.reduce((n,c)=>n+(c.characters?.length||0),0)}};
}
