(function(root){'use strict';
const MAX=8*1024*1024,plain=v=>v&&typeof v==='object'&&!Array.isArray(v),map=(v,name)=>{if(!plain(v))throw Error('Sai cấu trúc '+name);return v;};
function safe(value,depth=0){if(depth>20)throw Error('Dữ liệu lồng quá sâu.');if(typeof value==='string'&&value.length>90000)throw Error('Một mục dữ liệu quá dài.');if(Array.isArray(value)){if(value.length>50000)throw Error('Danh sách quá dài.');for(const v of value)safe(v,depth+1);}else if(plain(value)){for(const[k,v]of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Tệp chứa khóa không hợp lệ.');safe(v,depth+1);}}}
function validate(input,C){
 if(typeof input==='string'){if(new TextEncoder().encode(input).length>MAX)throw Error('Bản sao lưu tối đa 8 MB.');try{input=JSON.parse(input);}catch{throw Error('Tệp JSON không đọc được.');}}
 if(!plain(input)||input.version!==1||!plain(input.storage))throw Error('Chọn tệp hsk-progress-backup.json do app xuất ra.');if(new TextEncoder().encode(JSON.stringify(input)).length>MAX)throw Error('Bản sao lưu tối đa 8 MB.');
 const storage={},ignored=Object.keys(input.storage).filter(k=>!C.KEYS.includes(k));
 for(const key of C.KEYS){if(input.storage[key]===undefined)continue;if(typeof input.storage[key]!=='string')throw Error('Dữ liệu lưu trữ phải là chuỗi JSON: '+key);let v;try{v=JSON.parse(input.storage[key]);}catch{throw Error('Dữ liệu bên trong JSON bị hỏng: '+key);}map(v,key);safe(v);
  const index=C.KEYS.indexOf(key);if(index===0){for(const r of Object.values(map(v.words,'tiến độ từ'))){map(r,'thẻ từ');if(r.status!==undefined&&!['known','unknown'].includes(r.status))throw Error('Trạng thái từ không hợp lệ.');for(const f of ['due','interval','reps','lapses','ease'])if(r[f]!==undefined&&(!Number.isFinite(r[f])||r[f]<0))throw Error('Lịch SRS không hợp lệ.');}}
  if(index===1&&(!Array.isArray(v.entries)||v.entries.some(e=>!plain(e)||typeof e.id!=='string')))throw Error('Lịch sử câu sai không hợp lệ.');
  if(index===2)map(v.stats,'thống kê thích ứng');
  if(index===3&&Object.values(v).some(x=>typeof x!=='boolean'))throw Error('Tùy chọn ghi nhớ không hợp lệ.');
  if(index===4)for(const r of Object.values(map(v.lessons,'tiến độ bài học')))map(r,'tiến độ bài');
  if(index===5){map(v.records,'kết quả đề');map(v.drafts,'bản nháp');}
  if(index===6){for(const[k,r]of Object.entries(map(v.items,'SRS mở rộng')))if(!root.HSKOpenDictionaryCore?.valid(r)||root.HSKOpenDictionaryCore.id(r.word)!==k)throw Error('Một từ SRS mở rộng không hợp lệ.');}
  if(index===7){for(const r of Object.values(map(v.items,'sổ từ vựng'))){if(!root.HSKNotebookTools.word(r)||typeof r.han!=='string'||typeof r.mean!=='string'||r.han.length>80||r.mean.length>500)throw Error('Một mục trong sổ không hợp lệ.');for(const[k,max]of Object.entries({pin:160,example:1500,note:1500,deck:80}))if(r[k]!==undefined&&(typeof r[k]!=='string'||r[k].length>max))throw Error('Trường trong sổ không hợp lệ: '+k);if(r.practice&&['attempts','correct','wrong'].some(k=>!Number.isInteger(r.practice[k])||r.practice[k]<0))throw Error('Kết quả ôn trong sổ không hợp lệ.');}}
  if(index===8){if(v.version!==1||typeof v.owner!=='string')throw Error('Kế hoạch học không hợp lệ.');map(v.parts,'nhật ký');map(v.activity,'hoạt động');if(v.plan){const p=v.plan;if(!plain(p)||p.version!==1||typeof p.id!=='string'||!Number.isInteger(p.target)||p.target<1||p.target>6||!Number.isFinite(p.end)||!Array.isArray(p.keys)||p.keys.some(k=>typeof k!=='string'))throw Error('Mục tiêu học không hợp lệ.');}}
  if(index===9){for(const s of Object.values(map(v.stories,'truyện đã lưu'))){if(!Array.isArray(s.words)||!Number.isInteger(s.hsk)||s.hsk<1||s.hsk>6)throw Error('Truyện đã lưu không hợp lệ.');root.HSKNotebookTools.story(JSON.stringify(s),s.words);}}
  storage[key]=JSON.stringify(v);
 }
 const flat=C.flatten(storage);if(Object.keys(flat).length>50000)throw Error('Bản sao lưu vượt quá 50.000 mục.');for(const[id,value]of Object.entries(flat)){if(!C.supportedId(id)||id.length>=1000||new TextEncoder().encode(JSON.stringify(value)).length>=90000)throw Error('Một mục không thể đồng bộ an toàn.');}if(!Object.keys(flat).length)throw Error('Tệp không có tiến độ có thể nhập.');return {storage,ignored,count:Object.keys(flat).length};
}
function mergeMissing(current,storage,C,time,writer){const source=C.capture({}, {},storage,time,writer),items={...current},added=[];let existing=0;for(const[id,r]of Object.entries(source.items)){if(Object.hasOwn(current,id)){existing++;continue;}items[id]=r;added.push(id);}return {items,added,existing};}
const api={MAX,validate,mergeMissing};root.HSKBackupCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
