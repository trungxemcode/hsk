import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import {matchGroq} from './groq-alignment.mjs';
const spoken=s=>Array.from(String(s)).filter(c=>!/[\s\p{P}\p{S}]/u.test(c)).join('');
export function enrichFromGroq(original,raw,duration){
 const previous=Lyrics.validate(original),old=previous.cues.filter(c=>spoken(c.text));
 const result=matchGroq(original,raw,duration);
 if(result.diagnostics.invalidTimeline)throw Error('Observed Groq timeline needs repair');
 if(result.cues.length!==old.length||result.cues.some((c,i)=>c.text!==old[i].text))throw Error('Reference lines changed');
 const added=[];
 const cues=result.cues.map((c,i)=>{if(old[i].characters?.length)return {...old[i]};if(c.characters?.length){added.push(i);return {...c};}return {...c};});
 const checked=Lyrics.validate({cues});
 for(let i=0;i<old.length;i++)if(old[i].characters?.length&&JSON.stringify(checked.cues[i].characters)!==JSON.stringify(old[i].characters))throw Error('Existing character timing changed');
 const held=checked.cues.flatMap((c,i)=>!c.characters?.length?[{cue:i,text:c.text,reason:'No separate observed onset for every character'}]:[]);
 return {...original,...checked,reviewed:false,wordTiming:{method:'groq-observed-word-timestamps',model:raw.model||'whisper-large-v3',addedCues:added,held,complete:held.length===0,diagnostics:result.diagnostics}};
}
