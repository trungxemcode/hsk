const fs=require('node:fs');
module.exports=async function cloudFixture(page,count=3){
 const audio=fs.readFileSync('tools/fixtures/music-heaacv2-64k.m4a'),tracks=Array.from({length:count},(_,i)=>({id:(i+1).toString(16).padStart(64,'0')+'.m4a',title:'Bài kho R2 '+(i+1),artist:'Nghệ sĩ '+(i+1)})).map(t=>({...t,url:'https://music.example/audio/'+t.id}));
 await page.route('**/music-config.json',r=>r.fulfill({json:{version:2,enabled:false,cloudEndpoint:'https://music.example'}}));
 await page.route('https://music.example/api/library*',r=>r.fulfill({json:{tracks,cursor:null}}));
 await page.route('https://music.example/audio/**',r=>{const m=r.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/),start=m?Number(m[1]):0,end=m&&m[2]?Number(m[2]):audio.length-1;return r.fulfill({status:m?206:200,body:audio.subarray(start,end+1),contentType:'audio/mp4',headers:{'Access-Control-Allow-Origin':'*','Accept-Ranges':'bytes',...(m?{'Content-Range':`bytes ${start}-${end}/${audio.length}`}:{})}});});
 return tracks;
};
