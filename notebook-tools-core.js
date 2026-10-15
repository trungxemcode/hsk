/* Pure import/export and personal review rules. No HSK mastery writes. */
(function(root){'use strict';
const LIMIT=10000,MAX_FILE=5*1024*1024;
const text=(v,max)=>String(v??'').replace(/\u0000/g,'').trim().slice(0,max);
function word(v){if(!v||typeof v!=='object')return null;const w={};for(const [k,n]of Object.entries({han:80,pin:160,mean:500,example:1500,note:1500,deck:80}))w[k]=text(v[k],n);return w.han&&w.mean?w:null;}
const signature=w=>w.han+'\u0000'+(w.pin||'');
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[ _-]/g,'');
const headers={han:['han','chutrung','chuhan','chinese','simplifiedchinese','tuvung','中文','汉语','漢字','詞語','simplified','front','term','word','汉字','词语','tu'],pin:['pin','pinyin','phienam','拼音'],mean:['mean','meaning','nghia','nghiatiengviet','vietnamese','definition','dinhnghia','translation','越南语','back','释义'],example:['example','vidu','sentence','例句'],note:['note','notes','ghichu'],deck:['deck','collection','bosuutap','bo','folder']};
function parseTable(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>MAX_FILE)throw Error('Tệp tối đa 5 MB.');
 let source=input.replace(/^\uFEFF/,'');const lines=source.split(/\r?\n/),directives=[];
 while(lines.length&&(!lines[0].trim()||lines[0].startsWith('#'))){const line=lines.shift();if(line.startsWith('#'))directives.push(line);}
 const directive=name=>directives.find(l=>l.toLowerCase().startsWith('#'+name.toLowerCase()+':'))?.slice(name.length+2)||'';
 const html=/^true$/i.test(directive('html').trim());source=lines.join('\n');const first=source.split(/\r?\n/)[0]||'',sep=directive('separator').trim().toLowerCase(),known={tab:'\t',comma:',',semicolon:';',pipe:'|'};
 if(sep&&!known[sep])throw Error('Tệp Anki cần dùng dấu phẩy, chấm phẩy, tab hoặc pipe.');
 const delimiter=known[sep]||(first.includes('\t')?'\t':first.includes(';')&&!first.includes(',')?';':',');
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){value+='"';i++;}else if(quoted||!value)quoted=!quoted;else value+=c;}else if(c===delimiter&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value='';if(rows.length>LIMIT+1)throw Error('Mỗi lần nhập tối đa 10.000 dòng.');}else value+=c;}
 if(quoted)throw Error('Dấu ngoặc kép trong tệp chưa đóng.');row.push(value);if(row.some(x=>x.trim()))rows.push(row);if(!rows.length)throw Error('Tệp không có dữ liệu.');if(rows.length>LIMIT+1)throw Error('Mỗi lần nhập tối đa 10.000 dòng.');
 const mapping={};const columnHeader=directive('columns');(columnHeader?columnHeader.split(delimiter):rows[0]).forEach((v,i)=>{for(const [k,names]of Object.entries(headers))if(names.includes(normalize(v)))mapping[k]=i;});
 const hasHeader=mapping.han!==undefined&&mapping.mean!==undefined;if(!hasHeader){Object.keys(mapping).forEach(k=>delete mapping[k]);const excluded=new Set(directives.map(l=>l.match(/^#(?:guid|notetype|tags|deck) column:(\d+)/i)?.[1]).filter(Boolean).map(Number).map(i=>i-1)),indices=rows[0].map((_,i)=>i).filter(i=>!excluded.has(i));['han','mean','pin','example','note','deck'].forEach((key,i)=>{if(indices[i]!==undefined)mapping[key]=indices[i];});}
 const skipHeader=hasHeader&&!columnHeader;const deckColumn=Number(directive('deck column'));if(deckColumn>0)mapping.deck=deckColumn-1;if(rows.length-(skipHeader?1:0)>LIMIT)throw Error('Mỗi lần nhập tối đa 10.000 dòng.');const imported=[],invalid=[],seen=new Set();let duplicate=0;
 const decode=s=>{let v=String(s||'');if(html)v=v.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"');return v.replace(/^'(?=[=+@-])/,'');};
 for(let i=skipHeader?1:0;i<rows.length;i++){const raw={};for(const[k,index]of Object.entries(mapping))raw[k]=decode(rows[i][index]);raw.deck=raw.deck||directive('deck');const tooLong=Object.entries({han:80,pin:160,mean:500,example:1500,note:1500,deck:80}).some(([k,max])=>String(raw[k]||'').trim().length>max);if(tooLong){invalid.push(i+1);continue;}const w=word(raw);if(!w){invalid.push(i+1);continue;}if(seen.has(signature(w))){duplicate++;continue;}seen.add(signature(w));imported.push(w);}
 return {words:imported,invalid,duplicate,delimiter,hasHeader,total:rows.length-(skipHeader?1:0)};
}
function mergeWords(items,words,deck='',now=Date.now(),uuid=()=>crypto.randomUUID()){
 const next={...items},known=new Set(Object.values(items).filter(Boolean).map(signature));let added=0,duplicate=0,total=Object.keys(next).length;for(const raw of words){const w=word({...raw,deck:deck.trim()||raw.deck});if(!w)continue;if(known.has(signature(w))){duplicate++;continue;}if(total>=LIMIT)throw Error('Sổ tối đa 10.000 từ. Hãy tách dữ liệu trước khi nhập.');known.add(signature(w));next[uuid()]={...w,createdAt:now,updatedAt:now};added++;total++;}return {items:next,added,duplicate};
}
function exportTable(words,format='csv'){
 const delimiter=format==='csv'?',':'\t',keys=format==='quizlet'?['han','mean']:['han','mean','pin','example','note','deck'];
 const cell=v=>{let s=String(v||'');if(/^[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return /["\n\r,;\t]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 if(format==='quizlet')return words.map(w=>['han','mean'].map(k=>{let s=String(w[k]||'').replace(/[\r\n\t]+/g,' ').trim();return /^[=+@-]/.test(s)?"'"+s:s;}).join('\t')).join('\r\n');const rows=words.map(w=>keys.map(k=>cell(w[k])).join(delimiter));if(format==='anki')return '#separator:Tab\n#html:false\n#columns:'+keys.join('\t')+'\n'+rows.join('\r\n');if(format==='csv')rows.unshift(keys.join(delimiter));return (format==='csv'?'\uFEFF':'')+rows.join('\r\n');
}
function shuffled(a,rng=Math.random){const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function uniqueWords(entries){const seen=new Set();return entries.filter(([,w])=>{if(!word(w)||seen.has(w.han))return false;seen.add(w.han);return true;});}
function questions(entries,format='quiz',rng=Math.random){
 const words=uniqueWords(entries),out=[];for(const[id,w]of shuffled(words,rng)){
  const sentence=format==='cloze'?String(w.example||'').split(/[\n\r]+/).find(s=>s.includes(w.han)):null;if(format==='cloze'&&!sentence)continue;
  const answer=format==='cloze'?w.han:w.mean,other=shuffled(words.filter(([key,x])=>key!==id&&x.han!==w.han&&x.mean!==w.mean),rng),options=[answer];
  for(const[,x]of other){const value=format==='cloze'?x.han:x.mean;if(!options.includes(value))options.push(value);if(options.length===4)break;}if(options.length<2)continue;
  out.push({id,han:w.han,pin:w.pin,prompt:format==='cloze'?sentence.split(w.han).join('_____'):w.han,answer,options:shuffled(options,rng),explanation:format==='cloze'?sentence+' · '+w.mean:w.han+' · '+(w.pin||'')+' · '+w.mean});if(out.length===10)break;
 }return out;
}
function matching(entries,rng=Math.random){const meanings=new Set();return shuffled(uniqueWords(entries),rng).filter(([,w])=>{if(meanings.has(w.mean))return false;meanings.add(w.mean);return true;}).slice(0,5);}
function story(raw,words){
 if(words.length!==10||new Set(words.map(w=>w.han)).size!==10)throw Error('Chọn đúng 10 từ khác nhau.');if(typeof raw!=='string'||raw.length>10000)throw Error('AI chưa trả truyện hợp lệ.');
 let data;const candidates=[raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''),raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1)];for(const s of candidates){try{data=JSON.parse(s);break;}catch{}}
 if(!data||!['title','zh','vi'].every(k=>typeof data[k]==='string'&&data[k].trim())||data.title.length>120||data.zh.length>4000||data.vi.length>6000)throw Error('AI chưa trả đủ truyện tiếng Trung và bản dịch Việt. Hãy tạo lại.');
 const missing=words.filter(w=>!data.zh.includes(w.han));if(missing.length)throw Error('Truyện còn thiếu: '+missing.map(w=>w.han).join('、')+'. Hãy tạo lại.');return {title:data.title.trim(),zh:data.zh.trim(),vi:data.vi.trim()};
}
function weakWords(entries,events=[]){const unique=new Set();const errors=new Map();const seen=new Set();for(const e of events){if(e?.correct!==false||typeof e.expected!=='string')continue;const key=e.id+'|'+e.time;if(seen.has(key))continue;seen.add(key);const han=e.expected.trim();errors.set(han,(errors.get(han)||0)+1);}return entries.map(([id,w])=>({id,word:w,wrong:(Number(w.practice?.wrong)||0)+(errors.get(w.han)||0)})).filter(x=>x.wrong>0).sort((a,b)=>b.wrong-a.wrong).filter(x=>{if(unique.has(x.word.han))return false;unique.add(x.word.han);return true;}).slice(0,10);}
const api={LIMIT,MAX_FILE,word,signature,parseTable,mergeWords,exportTable,shuffled,questions,matching,story,weakWords};root.HSKNotebookTools=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
