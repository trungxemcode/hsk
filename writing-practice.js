(()=>{
'use strict';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
const dialog=el('dialog');dialog.id='writingPractice';dialog.setAttribute('aria-labelledby','writingTitle');
const heading=el('h2','Học viết');heading.id='writingTitle';
const close=button('Đóng',()=>dialog.close()),form=el('form'),input=el('input'),label=el('label','Chữ hoặc từ muốn luyện');input.id='writingInput';input.maxLength=20;input.value='你好';label.htmlFor=input.id;
const load=button('Học chữ này',()=>openWord(input.value));form.append(label,input,load);form.onsubmit=e=>{e.preventDefault();openWord(input.value);};
const choices=el('div'),stage=el('div');choices.className='writing-choices';stage.id='writingStage';stage.setAttribute('aria-label','Khung viết từng nét');
const status=el('p');status.id='writingStatus';status.setAttribute('role','status');
const controls=el('div');controls.className='writing-controls';
let writer=null,serial=0,current='你',queue=[],data=null,mode='watch',step=0,loading=false,starterPromise=null;
const speed=el('select');speed.setAttribute('aria-label','Tốc độ mẫu');for(const[v,t]of [['0.6','Chậm'],['1','Bình thường'],['1.8','Nhanh']]){const o=el('option',t);o.value=v;speed.append(o);}speed.value='1';
const outline=el('input');outline.type='checkbox';outline.checked=true;const outlineLabel=el('label');outlineLabel.className='writing-outline';outlineLabel.append(outline,document.createTextNode('Hiện chữ mờ'));
function colors(){const css=getComputedStyle(document.documentElement);return {strokeColor:css.getPropertyValue('--ink').trim(),outlineColor:css.getPropertyValue('--line-dark').trim(),drawingColor:css.getPropertyValue('--accent').trim(),highlightColor:css.getPropertyValue('--accent').trim()};}
function setDisabled(value){loading=value;for(const b of [...controls.querySelectorAll('button'),...dialog.querySelectorAll('.writing-mode-bar button')])b.disabled=value;}
async function charData(c){
 const starter=await (starterPromise||=fetch('./writing-starter.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>{starterPromise=null;return {};}));if(starter[c])return starter[c];
 const url='https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/'+encodeURIComponent(c)+'.json';let cache;try{cache=await caches.open('hsk-writing-data-2');const hit=await cache.match(url);if(hit)return await hit.json();}catch{}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.strokes)||!Array.isArray(d.medians)||d.strokes.length!==d.medians.length)throw Error();try{await cache?.put(url,new Response(JSON.stringify(d),{headers:{'Content-Type':'application/json'}}));}catch{}return d;}finally{clearTimeout(timer);}
}
async function select(c){
 const id=++serial;writer?.cancelQuiz();writer?.pauseAnimation();writer=null;current=c;data=null;stage.replaceChildren();setDisabled(true);status.textContent='Đang mở thứ tự nét của '+c+'…';for(const b of choices.children)b.setAttribute('aria-pressed',String(b.textContent===c));
 try{const d=await charData(c);if(id!==serial||!dialog.open)return;data=d;build();setDisabled(false);status.textContent=c+' · '+d.strokes.length+' nét. Xem mẫu trước, rồi bấm Viết theo.';}
 catch{if(id===serial){setDisabled(true);status.textContent='Chưa tải được mẫu chữ '+c+'. Chữ cơ bản có sẵn offline; các chữ khác cần mạng lần đầu. Thử lại hoặc chọn chữ khác.';}}
}
function build(){writer?.cancelQuiz();writer?.pauseAnimation();stage.replaceChildren();const size=Math.min(360,Math.max(220,dialog.clientWidth-48));writer=HanziWriter.create(stage,current,{width:size,height:size,padding:20,showCharacter:true,showOutline:outline.checked,strokeAnimationSpeed:Number(speed.value),delayBetweenStrokes:250,...colors(),charDataLoader:()=>data});step=0;mode='watch';}
async function watch(){if(!writer||loading)return;const id=serial;mode='watch';watchButton.setAttribute('aria-pressed','true');practiceButton.setAttribute('aria-pressed','false');writer.cancelQuiz();status.textContent='Đang xem thứ tự nét: '+current;await writer.animateCharacter();if(id===serial&&mode==='watch')status.textContent='Đã xem đủ '+data.strokes.length+' nét. Chọn Viết theo để bắt đầu.';}
function practice(){if(!writer||loading)return;mode='practice';watchButton.setAttribute('aria-pressed','false');practiceButton.setAttribute('aria-pressed','true');step=0;const id=serial;writer.quiz({showHintAfterMisses:2,highlightOnComplete:true,onMistake:s=>{if(id===serial)status.textContent='Nét '+(s.strokeNum+1)+' chưa khớp hướng hoặc vị trí. Thử lại; sau 2 lần sai sẽ hiện gợi ý.';},onCorrectStroke:s=>{if(id===serial){step=s.strokeNum+1;status.textContent='Đúng '+step+'/'+data.strokes.length+' nét.';}},onComplete:s=>{if(id===serial)status.textContent='Hoàn thành '+current+' · '+data.strokes.length+' nét · '+s.totalMistakes+' lần cần sửa. Có thể tắt chữ mờ để tự viết lại.';}});status.textContent='Viết nét 1/'+data.strokes.length+' theo đúng hướng và thứ tự.';}
const modeBar=el('div');modeBar.className='writing-mode-bar';const watchButton=button('Xem nét mẫu',watch),practiceButton=button('Tự viết',practice);watchButton.setAttribute('aria-pressed','true');practiceButton.setAttribute('aria-pressed','false');modeBar.append(watchButton,practiceButton);
controls.append(button('Xem mẫu',watch),button('Viết theo',practice),button('Gợi ý nét',()=>{if(!writer)return;writer.highlightStroke(Math.min(step,data.strokes.length-1));}),button('Viết lại',practice),button('Chữ tiếp theo',()=>select(queue[(queue.indexOf(current)+1)%queue.length])));
speed.onchange=()=>{if(data){build();status.textContent='Đã đổi tốc độ. Bấm Xem mẫu hoặc Viết theo.';}};outline.onchange=()=>{if(writer)outline.checked?writer.showOutline():writer.hideOutline();};
function openWord(text){queue=[...new Set([...text].filter(c=>/\p{Script=Han}/u.test(c)))];if(!queue.length){status.textContent='Nhập ít nhất một chữ Hán để luyện viết.';return;}choices.replaceChildren(...queue.map(c=>button(c,()=>select(c))));select(queue[0]);}
dialog.append(heading,close,form,choices,modeBar,stage,status,controls,speed,outlineLabel,el('p','Mẹo: từ trên xuống dưới, từ trái sang phải. Khung viết nhận thao tác vẽ; vuốt bên ngoài khung để cuộn.'));
document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{++serial;writer?.cancelQuiz();writer?.pauseAnimation();stage.replaceChildren();writer=null;});
const entry=button('Học viết · Xem thứ tự nét và viết theo',()=>{dialog.showModal();openWord(input.value);});entry.className='hub-card';entry.id='writingPracticeOpen';document.querySelector('.practice-hubs')?.append(entry);
const symbol=el('span','字'),content=el('span');symbol.className='hub-symbol lilac';symbol.setAttribute('aria-hidden','true');content.className='hub-content';content.append(el('strong','Học viết'),el('small','Xem thứ tự nét, rồi viết theo từng nét.'),el('em','Bắt đầu viết ↗'));entry.replaceChildren(symbol,content);
window.HSKWritingPractice={characterData:charData,open(text='你好'){input.value=text;dialog.showModal();openWord(text);}};
new MutationObserver(()=>{if(writer)for(const[k,v]of Object.entries(colors()))writer.updateColor(k,v);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
