import Lyrics from '../../src/modules/music/music-lyrics-core.js';
const spoken=s=>Array.from(String(s)).filter(c=>!/[\s\p{P}\p{S}]/u.test(c)).join('');
export function enrichCharacters(original,base,small,trackId){
 if(!/^[a-f0-9]{64}\.m4a$/.test(trackId||'')||base?.model!=='base'||small?.model!=='small'||!['context-confidence-v3','observed-neighbor-context-v4'].includes(base.engineVersion)||small.engineVersion!==base.engineVersion||base.audioSha256!==trackId.slice(0,-4)||small.audioSha256!==base.audioSha256||base.scriptSha256!==small.scriptSha256||!base.complete||!small.complete)throw Error('Unmatched audio or model evidence');
 const checked=Lyrics.validate(original),cues=checked.cues.map(c=>({...c})),added=[],held=[];
 for(let i=0;i<cues.length;i++){
  const cue=cues[i];if(cue.characters?.length||!spoken(cue.text))continue;const a=base.cues?.[i],b=small.cues?.[i];if(!a||!b||a.text!==cue.text||b.text!==cue.text){held.push({cue:i,reason:'Missing exact transcript'});continue;}
  const options=[];for(const x of a.attempts||[])for(const y of b.attempts||[]){
   const ax=(x.words||[]).filter(w=>spoken(w.text)),by=(y.words||[]).filter(w=>spoken(w.text));if(!ax.length||ax.length!==by.length||ax.map(w=>spoken(w.text)).join('')!==spoken(cue.text)||by.map(w=>spoken(w.text)).join('')!==spoken(cue.text))continue;
   const natural=[x,y].map(v=>(v.naturalWords||[]).filter(w=>spoken(w.text)));
   if(natural.some(ws=>!ws.length||ws.map(w=>spoken(w.text)).join('')!==spoken(cue.text)||ws.some(w=>!Number.isFinite(w.probability)||w.probability<.05)||ws.reduce((n,w)=>n+w.probability,0)/ws.length<.45))continue;
   if(ax.some((w,j)=>Array.from(spoken(w.text)).length!==1||Array.from(spoken(by[j].text)).length!==1||spoken(w.text)!==spoken(by[j].text)||![w.start,w.end,w.probability,by[j].start,by[j].end,by[j].probability].every(Number.isFinite)||w.end<=w.start||by[j].end<=by[j].start||Math.abs(w.start-by[j].start)>.15))continue;
   if(ax[0].start<=x.windowStart+.06||by[0].start<=y.windowStart+.06||ax.at(-1).end>=x.windowEnd-.06||by.at(-1).end>=y.windowEnd-.06)continue;
   const chars=by.map((w,j)=>({text:spoken(w.text),start:w.start,end:Math.min(w.end,by[j+1]?.start??w.end)}));if(chars.some(c=>c.end<=c.start))continue;options.push({chars,delta:Math.max(...ax.map((w,j)=>Math.abs(w.start-by[j].start)))});
  }
  options.sort((a,b)=>a.delta-b.delta);if(!options.length){held.push({cue:i,reason:'Insufficient corroborated character onsets'});continue;}const chars=options[0].chars;cue.start=Math.min(cue.start,chars[0].start);cue.end=Math.max(cue.end??chars.at(-1).end,chars.at(-1).end);cue.characters=chars;added.push(i);
 }
 const accepted=[];for(const i of added){const c=cues[i],prev=cues[i-1],next=cues[i+1];if(prev?.characters&&prev.characters.at(-1).end>c.start||next&&c.characters.at(-1).start>=next.start){cues[i]={...checked.cues[i]};held.push({cue:i,reason:'Conflicts with neighboring observed timing'});continue;}if(prev&&prev.end>c.start){if(prev.characters&&prev.characters.at(-1).end>c.start){cues[i]={...checked.cues[i]};continue;}prev.end=c.start;}if(next&&c.end>next.start){c.end=next.start;c.characters.at(-1).end=Math.min(c.characters.at(-1).end,c.end);}if(c.characters.at(-1).end<=c.characters.at(-1).start){cues[i]={...checked.cues[i]};continue;}accepted.push(i);}
 const value=Lyrics.validate({cues});return {...original,...value,wordTiming:{method:'dual-ctranslate2-forced-alignment',models:['base','small'],confidenceMethod:'natural-transcript-probability',audioSha256:base.audioSha256,addedCues:accepted,held,complete:value.cues.every(c=>!spoken(c.text)||c.characters?.length)}};
}
