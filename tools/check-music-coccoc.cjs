const assert=require('node:assert/strict'),C=require('../src/modules/music/music-coccoc.js'),Core=require('../src/modules/music/music-core.js');
const cases=[
 [{userAgent:'Mozilla/5.0 Chrome/148.0.0.0 Safari/537.36'}, {},false],
 [{userAgent:'Mozilla/5.0 Version/26.0 Mobile Safari/604.1'}, {},false],
 [{userAgent:'Mozilla/5.0 (Linux; Android) Chrome/144 Safari/537'}, {},false],
 [{userAgent:'Mozilla/5.0 Chrome/144 coc_coc_browser/144.0.0'}, {},true],
 [{userAgent:'CocCocMobile/122'}, {},true],
 [{userAgent:'Mozilla/5.0 Corom/27.1'}, {},true],
 [{userAgent:'Mozilla/5.0 Chrome/148',userAgentData:{brands:[{brand:'Cốc Cốc',version:'140'}]}}, {},true],
 [{userAgent:'Mozilla/5.0 Chrome/148'}, {coccoc:{}},true]
];
for(const [navigator,win,expected] of cases)assert.equal(C.isCocCoc(navigator,win),expected,JSON.stringify(navigator));
assert.equal(C.isCocCoc({userAgent:'Chrome/148',userAgentData:{brands:[{brand:'Google Chrome'}]}},{}),false);
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,v)=>values.set(key,v)};
assert.equal(C.readChoice(storage),null);
assert.equal(C.modeEnabled(storage,cases[0][0],{}),false);
assert.equal(C.modeEnabled(storage,cases[3][0],{}),true);
assert.equal(C.writeChoice(storage,'on'),true);
assert.equal(C.readChoice(storage),'on');
assert.equal(C.modeEnabled(storage,cases[0][0],{}),true,'Chrome-like Coc Coc can be declared manually');
assert.equal(C.writeChoice(storage,'off'),true);
assert.equal(C.modeEnabled(storage,cases[3][0],{}),false,'explicit opt-out overrides branded UA');
assert.equal(C.writeChoice(storage,'other'),false,'reject invalid preference');
assert.equal(C.readChoice(storage),'off');
assert.equal(C.readChoice({getItem(){throw Error('blocked');}}),null);
assert.equal(C.writeChoice({setItem(){throw Error('blocked');}},'on'),false);
assert.equal(C.providerSource('https://youtu.be/abcdefghijk',Core.parseLink),'https://www.youtube.com/watch?v=abcdefghijk');
assert.equal(C.providerSource('https://soundcloud.com/artist/song',Core.parseLink),'https://soundcloud.com/artist/song');
assert.equal(C.providerSource('https://open.spotify.com/track/0123456789abcdef012345',Core.parseLink),'https://open.spotify.com/track/0123456789abcdef012345');
for(const raw of ['javascript:alert(1)','https://evil.example.com/song','https://youtube.com.evil.example/watch?v=abcdefghijk','https://localhost:4000/secret','offline:xxx'])
 assert.equal(C.providerSource(raw,Core.parseLink),null,raw);
assert.equal(typeof C.download,'undefined','No invented browser download API');
assert.equal(typeof C.adBlock,'undefined','No invented ad-block toggles');
console.log('PASS Coc Coc positive detection, manually declared browser preference (per-browser), persisted off override, validated provider links, no spoofed capabilities');
