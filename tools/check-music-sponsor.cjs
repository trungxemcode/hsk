const assert=require('node:assert/strict'),{normalize,create}=require('../src/modules/music/music-sponsor.js');
(async()=>{
 assert.deepEqual(normalize([{category:'sponsor',segment:[2,5]},{category:'intro',segment:[4,7]},{category:'music_offtopic',segment:[8,9]},{category:'sponsor',segment:[-1,2]},{category:'sponsor',segment:[10,12],actionType:'mute'},{category:'chapter',segment:[13,15]}]),[[2,7],[8,9]]);
 const original=global.fetch;let requests=0,slowResolve;
 try{global.fetch=async(url,opts)=>{requests++;assert.equal(opts.credentials,'omit');assert.equal(opts.referrerPolicy,'no-referrer');assert.equal(new URL(url).origin,'https://sponsor.ajay.app');if(new URL(url).searchParams.get('videoID')==='slow1234567')return new Promise(r=>{slowResolve=r;});return new Response(JSON.stringify([{category:'sponsor',segment:[5,10]},{category:'intro',segment:[0,99]}]),{headers:{'Content-Type':'application/json'}});};
 let time=6,state=2,skips=0;const seeks=[],player={getPlayerState:()=>state,getCurrentTime:()=>time,getDuration:()=>100,seekTo:t=>{seeks.push(t);time=t;}},c=create({onSkip:()=>skips++});
 await c.load('abcdefghijk');c.tick(player);assert.deepEqual(seeks,[],'never skip paused video');state=1;c.tick(player);assert.deepEqual(seeks,[10]);assert.equal(skips,1);c.tick(player);assert.equal(seeks.length,1,'no repeated seek outside segment');
 assert(c.undo(player));assert.equal(time,6);c.tick(player);assert.equal(seeks.length,2,'undo lets user hear the segment');
 c.stop();time=6;c.tick(player);assert.equal(seeks.length,2,'track cleanup disables stale ranges');
 await c.load('abcdefghijk');assert.equal(requests,1,'bounded in-memory cache reused');c.stop();
 const stale=c.load('slow1234567');c.stop();slowResolve(new Response(JSON.stringify([{category:'sponsor',segment:[5,10]}])));await stale;time=6;c.tick(player);assert.equal(seeks.length,2,'late responses cannot seek a different track');
 global.fetch=async()=>{throw Error('network unavailable');};await c.load('unavailable');c.tick(player);assert.equal(seeks.length,2,'API failure leaves playback untouched');
 }finally{global.fetch=original;}
 console.log('PASS SponsorBlock: validated/merged content ranges, no paused/full-video skip, undo, cache, cancellation and network failure');
})().catch(e=>{console.error(e);process.exitCode=1});
