const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),source=process.argv[2],output=process.argv[3]||path.join(root,'handwriting-data.json');
if(!source)throw Error('Usage: node tools/build-handwriting-data.cjs graphics.txt [output.json]');
const vocabulary=vm.runInNewContext(fs.readFileSync(path.join(root,'content/data/words.js'),'utf8')+';words',{}, {timeout:10000});
const wanted=new Set(vocabulary.flatMap(w=>Array.from(w.han).filter(c=>/[\u3400-\u9fff\u3007]/.test(c))));
const sourceBytes=fs.readFileSync(source),entries=new Map();
for(const line of sourceBytes.toString('utf8').split('\n')){if(!line.trim())continue;const data=JSON.parse(line);if(wanted.has(data.character)&&data.medians?.length)entries.set(data.character,data.medians.map(stroke=>stroke.map(([x,y])=>[x,900-y])));}
function compact(strokes){
 const points=strokes.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),span=Math.max(Math.max(...xs)-left,Math.max(...ys)-top);
 return strokes.map(stroke=>stroke.map(([x,y])=>[Math.round((x-left)*127/span),Math.round((y-top)*127/span)]));
}
const characters=[...entries.keys()].sort((a,b)=>a.codePointAt(0)-b.codePointAt(0));
const data={version:1,name:'HSK Shape Templates',license:'Arphic Public License',copyright:'Copyright (C) 1999 Arphic Technology Co., Ltd.',source:{url:'https://github.com/skishore/makemeahanzi/blob/master/graphics.txt',sha256:crypto.createHash('sha256').update(sourceBytes).digest('hex')},modification:'2026-10-12: filtered to characters in words.js; extracted medians, inverted Y, normalized and quantized coordinates. No dictionary entries included.',vocabularyCharacters:wanted.size,characters:characters.join(''),samples:characters.map(c=>compact(entries.get(c))),unsupported:[...wanted].filter(c=>!entries.has(c)).sort()};
const bytes=Buffer.from(JSON.stringify(data));fs.writeFileSync(output,bytes);
console.log(JSON.stringify({words:vocabulary.length,characters:wanted.size,supported:characters.length,unsupported:data.unsupported,bytes:bytes.length,gzipBytes:zlib.gzipSync(bytes).length,sourceSha256:data.source.sha256,output},null,2));
