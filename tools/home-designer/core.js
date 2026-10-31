(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKHomeDesignerCore=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const modes=['desktop','mobile'];
 const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
 const own=(o,k)=>Object.hasOwn(o,k);
 function pages(schema){return schema.pages||[{id:'home',label:'Trang chủ',root:'#studioHome',scope:'html body.studio-enabled[data-studio-hub="home"] #studioHome#studioHome#studioHome',reorder:true,components:schema.components,groups:schema.groups}];}
 function pageSchema(schema,id){const page=pages(schema).find(p=>p.id===id);if(!page)throw Error('Trang không được hỗ trợ: '+id);return page;}
 function empty(schema){return {schema:1,page:'home',styles:{desktop:{},mobile:{}},order:{desktop:[...schema.groups.desktop],mobile:[...schema.groups.mobile]}};}
 function blankPage(){return {components:{},styles:{desktop:{},mobile:{}},order:{desktop:[],mobile:[]}};}
 function emptyProject(schema){return {schema:2,pages:Object.fromEntries(pages(schema).map(p=>[p.id,blankPage()]))};}
 function selectorOK(value){if(typeof value!=='string'||value.length>360)return false;if(value==='')return true;const segment='(?:#[A-Za-z_][\\w-]*|[a-z][a-z0-9-]*(?::nth-of-type\\([1-9][0-9]{0,4}\\))?)';return new RegExp('^'+segment+'(?: > '+segment+')*$').test(value)&&!/(?:^| > )(?:html|body|head|script|style|link|meta)(?:$|:| > )/.test(value);}
 function styles(schema,input,keys){
  if(!plain(input)||Object.keys(input).length!==2||modes.some(m=>!plain(input[m])))throw Error('Thiếu cấu hình PC/điện thoại.');
  const out={desktop:{},mobile:{}};
  for(const mode of modes)for(const [key,props] of Object.entries(input[mode])){
   if(!keys.has(key)||!plain(props))throw Error('Phần tử không được phép chỉnh: '+key);
   const next={};for(const [name,value] of Object.entries(props)){
    if(!own(schema.properties,name))throw Error('Thuộc tính không được phép: '+name);const p=schema.properties[name];
    if(p.type==='number'){if(typeof value!=='number'||!Number.isFinite(value)||value<p.min||value>p.max||(p.integer&&!Number.isInteger(value)))throw Error('Giá trị ngoài giới hạn: '+p.label);}
    else if(p.type==='color'?(typeof value!=='string'||value!==value.trim()||(!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)&&!p.options.some(o=>o.value===value))):(typeof value!=='string'||!p.options.some(o=>o.value===value)))throw Error('Giá trị không hợp lệ: '+p.label);next[name]=value;
   }if(Object.keys(next).length)out[mode][key]=next;
  }return out;
 }
 function legacy(schema,input){
  if(!plain(input)||input.schema!==1||input.page!=='home'||Object.keys(input).some(k=>!['schema','page','styles','order'].includes(k)))throw Error('Bản nháp trang chủ không hợp lệ.');
  const out=empty(schema);out.styles=styles(schema,input.styles,new Set(schema.components.map(c=>c.key)));
  if(!plain(input.order)||Object.keys(input.order).length!==2)throw Error('Thiếu thứ tự khối.');
  for(const mode of modes){const order=input.order[mode],allowed=schema.groups[mode];if(!Array.isArray(order)||order.length!==allowed.length||new Set(order).size!==order.length||order.some(k=>!allowed.includes(k)))throw Error('Danh sách khối có phần tử thiếu, trùng hoặc không hợp lệ.');out.order[mode]=[...order];}return out;
 }
 function validate(schema,input){
  if(input?.schema===1)return legacy(schema,input);
  if(!plain(input)||input.schema!==2||Object.keys(input).some(k=>!['schema','pages'].includes(k))||!plain(input.pages))throw Error('Tệp không phải bản nháp giao diện HSK phiên bản 1 hoặc 2.');
  const out=emptyProject(schema);
  for(const [id,data] of Object.entries(input.pages)){
   const page=pageSchema(schema,id);if(!plain(data)||Object.keys(data).some(k=>!['components','styles','order'].includes(k))||!plain(data.components)||Object.keys(data.components).length>1000)throw Error('Danh sách phần tử không hợp lệ: '+id);
   const result=blankPage(),byKey=Object.fromEntries((page.components||[]).map(c=>[c.key,c]));
   for(const [key,c] of Object.entries(data.components)){
    if(!/^[a-z][a-z0-9-]{0,95}$/.test(key)||own(byKey,key)||!plain(c)||Object.keys(c).some(k=>!['selector','label'].includes(k))||!selectorOK(c.selector)||typeof c.label!=='string'||!c.label.length||c.label.length>120)throw Error('Phần tử nhập không hợp lệ: '+key);
    result.components[key]={selector:c.selector,label:c.label};byKey[key]=result.components[key];
   }
   result.styles=styles(schema,data.styles,new Set(Object.keys(byKey)));
   if(!plain(data.order)||Object.keys(data.order).length!==2)throw Error('Thiếu thứ tự khối: '+id);
   for(const mode of modes){const order=data.order[mode];if(!Array.isArray(order)||order.length>100||new Set(order).size!==order.length||order.some(k=>typeof k!=='string'||!own(byKey,k)||!byKey[k].selector||byKey[k].selector.includes(' '))||(!page.reorder&&order.length))throw Error('Thứ tự khối không hợp lệ: '+id);result.order[mode]=[...order];}
   out.pages[id]=result;
  }return out;
 }
 function upgrade(schema,input){const checked=validate(schema,input);if(checked.schema===2)return checked;const out=emptyProject(schema);out.pages.home.styles=checked.styles;for(const mode of modes)if(checked.order[mode].some((k,i)=>k!==schema.groups[mode][i]))out.pages.home.order[mode]=checked.order[mode];return out;}
 function registry(schema,config,id){return {...Object.fromEntries((pageSchema(schema,id).components||[]).map(c=>[c.key,c])),...config.pages[id].components};}
 function elementRules(schema,props,selector){
  const declarations=[],extra=[],name=props.animationName,preset=!!name&&name!=='none',trigger=props.animationTrigger||'appear';
  for(const [key,p] of Object.entries(schema.properties))if(own(props,key)&&!p.meta&&key!=='animationName')declarations.push(p.css+':'+props[key]+(p.unit||'')+'!important');
  const importance=key=>schema.motion?.channels?.[name]?.includes(key)?'':'!important';
  for(const [key,variable,fallback] of [['moveX','x','0px'],['moveY','y','0px'],['rotate','rotate','0deg'],['scale','scale','1'],['opacity','opacity','1']])if((preset||((key==='moveX'||key==='moveY')&&(own(props,'moveX')||own(props,'moveY'))))&&!own(props,key))declarations.push('--hsk-design-'+variable+':'+fallback+'!important');
  if(own(props,'moveX')||own(props,'moveY'))declarations.push('translate:var(--hsk-design-x,0px) var(--hsk-design-y,0px)'+importance('translate'));
  for(const [key,css,fallback] of [['rotate','rotate','0deg'],['scale','scale','1'],['opacity','opacity','1']])if(own(props,key))declarations.push(css+':var(--hsk-design-'+key+','+fallback+')'+importance(key));
  if(preset){
   for(const [key,value] of Object.entries(schema.motion.defaults))if(!own(props,key)){const p=schema.properties[key];declarations.push(p.css+':'+value+(p.unit||'')+'!important');}
   declarations.push('animation-name:'+(trigger==='appear'?name:'none')+'!important');
   if(trigger!=='appear')extra.push(selector+(trigger==='hover'?':hover':':active')+'{animation-name:'+name+'!important;}');
  }else if(name==='none')declarations.push('animation-name:none!important');
  return {rules:[...(declarations.length?[selector+'{'+declarations.join(';')+';}']:[]),...extra],motion:preset||Object.keys(props).some(k=>k.startsWith('transition')||k.startsWith('animation')),preset};
 }
 function generateCSS(schema,input){
  const config=upgrade(schema,input);let css='/* HSK Visual Designer v2 — generated; edit the JSON in the local designer. */\n',needsFrames=false;
  for(const page of pages(schema)){const data=config.pages[page.id],byKey=registry(schema,config,page.id);
   for(const mode of modes){const scope=page.scope.replace('body.studio-enabled',mode==='desktop'?'body.studio-enabled:not(.mobile-ux)':'body.studio-enabled.mobile-ux'),rules=[],reduced=[];
    for(const key of Object.keys(data.styles[mode]).sort()){const c=byKey[key],selector=scope+(c.selector?' '+c.selector:''),result=elementRules(schema,data.styles[mode][key],selector);rules.push(...result.rules);needsFrames=needsFrames||result.preset;if(result.motion)reduced.push(selector);}
    const order=data.order[mode];if(order.length){rules.push(scope+':not([hidden]){display:flex!important;flex-direction:column!important;}');rules.push(scope+'>*{order:900!important;}');if(page.id==='home')rules.push(scope+'>#updateNotice{order:-1!important;}');order.forEach((key,i)=>rules.push(scope+'>'+byKey[key].selector+'{order:'+i+'!important;}'));}
    if(reduced.length)rules.push('@media(prefers-reduced-motion:reduce){'+reduced.map(s=>s+'{animation-duration:0.001ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;animation-play-state:running!important;transition-duration:0.001ms!important;}').join('')+'}');
    if(rules.length)css+='@media '+(mode==='desktop'?'(min-width:721px)':'(max-width:720px), (orientation:landscape) and (max-height:500px) and (pointer:coarse)')+'{\n'+rules.join('\n')+'\n}\n';
   }
  }return (needsFrames?schema.motion.keyframes:'')+css;
 }
 return {empty,emptyProject,validate,upgrade,generateCSS,pages,pageSchema,registry,selectorOK};
});
