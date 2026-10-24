/* Community content timestamps only; never inspects or blocks platform-served ads. */
(function(root){'use strict';
 const categories=['sponsor','music_offtopic','intro','outro'],cache=new Map();
 function normalize(rows,duration=Infinity,merge=true){
  const ranges=(Array.isArray(rows)?rows.slice(0,1000):[]).filter(r=>categories.includes(r.category)&&(!r.actionType||r.actionType==='skip')&&Array.isArray(r.segment)&&r.segment.length===2&&r.segment.every(Number.isFinite)&&r.segment[0]>=0&&r.segment[1]>r.segment[0]+.2&&r.segment[1]<=duration&&r.segment[1]-r.segment[0]<duration*.9).map(r=>r.segment.slice()).sort((a,b)=>a[0]-b[0]);
  if(!merge)return ranges;
  const merged=[];for(const r of ranges){const last=merged.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r);}return merged;
 }
 async function segments(id,signal){
  if(!/^[\w-]{11}$/.test(id))return [];
  const hit=cache.get(id);if(hit&&hit.until>Date.now())return hit.ranges;
  const url=new URL('https://sponsor.ajay.app/api/skipSegments');url.searchParams.set('videoID',id);url.searchParams.set('categories',JSON.stringify(categories));url.searchParams.set('actionTypes','["skip"]');
  const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(response.status!==404&&!response.ok)throw Error('SponsorBlock chưa sẵn sàng');
  const ranges=response.status===404?[]:normalize(await response.json(),Infinity,false);if(cache.size>=50)cache.delete(cache.keys().next().value);cache.set(id,{ranges,until:Date.now()+21600000});return ranges;
 }
 function create({onSkip=()=>{}}={}){
  let run=0,controller,ranges=[],ignored=new Set(),last=null,attempt=-1;
  function stop(){run++;controller?.abort();controller=null;ranges=[];ignored.clear();last=null;attempt=-1;}
  async function load(id){stop();const epoch=run,c=new AbortController();controller=c;const timer=setTimeout(()=>c.abort(),5000);try{const data=await segments(id,c.signal);if(epoch===run&&!c.signal.aborted)ranges=data;}catch{}finally{clearTimeout(timer);if(controller===c)controller=null;}}
  function tick(player){
   if(!player||player.getPlayerState?.()!==1)return;
   const t=Number(player.getCurrentTime?.()),duration=Number(player.getDuration?.());if(!Number.isFinite(t)||!(duration>0))return;
   const playable=normalize(ranges.map(segment=>({category:'sponsor',segment})),duration);
   if(attempt>=0&&!(t>=playable[attempt]?.[0]&&t<playable[attempt]?.[1]))attempt=-1;
   const index=playable.findIndex(([a,b],i)=>!ignored.has(i)&&i!==attempt&&a<=t&&t<b-.15&&b<=duration&&b-a<duration*.9);
   if(index<0)return;attempt=index;last={index,time:t};player.seekTo(playable[index][1],true);onSkip();
  }
  function undo(player){if(!last||!player)return false;ignored.add(last.index);player.seekTo(last.time,true);last=null;return true;}
  return {load,tick,stop,undo};
 }
 const api={normalize,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKMusicSponsor=api;
})(typeof window==='object'?window:globalThis);
