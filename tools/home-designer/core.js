(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKHomeDesignerCore=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const modes=['desktop','mobile'];
 function empty(schema){return {schema:1,page:'home',styles:{desktop:{},mobile:{}},order:{desktop:[...schema.groups.desktop],mobile:[...schema.groups.mobile]}};}
 function plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
 function validate(schema,input){
  if(!plain(input)||input.schema!==1||input.page!=='home')throw Error('Tệp không phải cấu hình trang chủ HSK phiên bản 1.');
  for(const key of Object.keys(input))if(!['schema','page','styles','order'].includes(key))throw Error('Trường cấu hình không được hỗ trợ: '+key);
  if(!plain(input.styles)||!plain(input.order))throw Error('Thiếu cấu hình kiểu chữ hoặc thứ tự khối.');
  if(Object.keys(input.styles).some(k=>!modes.includes(k))||Object.keys(input.order).some(k=>!modes.includes(k)))throw Error('Chế độ màn hình không hợp lệ.');
  const out=empty(schema),keys=new Set(schema.components.map(c=>c.key));
  for(const mode of modes){
   if(!plain(input.styles[mode])||!Array.isArray(input.order[mode]))throw Error('Thiếu cấu hình PC/điện thoại.');
   const order=input.order[mode],allowed=schema.groups[mode];
   if(order.length!==allowed.length||new Set(order).size!==order.length||order.some(k=>!allowed.includes(k)))throw Error('Danh sách khối có phần tử thiếu, trùng hoặc không hợp lệ.');
   out.order[mode]=[...order];
   for(const [key,props] of Object.entries(input.styles[mode])){
    if(!keys.has(key)||!plain(props))throw Error('Phần tử không được phép chỉnh: '+key);
    const next={};
    for(const [name,value] of Object.entries(props)){
     const p=schema.properties[name];if(!p)throw Error('Thuộc tính không được phép: '+name);
     if(p.type==='number'){if(typeof value!=='number'||!Number.isFinite(value)||value<p.min||value>p.max||(p.integer&&!Number.isInteger(value)))throw Error('Giá trị ngoài giới hạn: '+p.label);}
     else if(typeof value!=='string'||!p.options.some(o=>o.value===value))throw Error('Giá trị không hợp lệ: '+p.label);
     next[name]=value;
    }
    if(Object.keys(next).length)out.styles[mode][key]=next;
   }
  }
  return out;
 }
 const prefix='html body.studio-enabled[data-studio-hub="home"] #studioHome#studioHome#studioHome';
 function generateCSS(schema,input){
  const config=validate(schema,input),byKey=Object.fromEntries(schema.components.map(c=>[c.key,c]));
  let css='/* HSK Home Designer v1 — generated; edit the JSON in the local designer. */\n';
  for(const mode of modes){
   const scope=prefix.replace('body.studio-enabled',mode==='desktop'?'body.studio-enabled:not(.mobile-ux)':'body.studio-enabled.mobile-ux');
   const rules=[],styles=config.styles[mode];
   for(const c of schema.components){const props=styles[c.key];if(!props)continue;const declarations=[];
    for(const [name,p] of Object.entries(schema.properties))if(Object.hasOwn(props,name))declarations.push(p.css+':'+props[name]+(p.unit||'')+'!important');
    if(declarations.length)rules.push(scope+' '+c.selector+'{'+declarations.join(';')+';}');
   }
   if(config.order[mode].some((k,i)=>k!==schema.groups[mode][i])){
    rules.push(scope+':not([hidden]){display:flex!important;flex-direction:column!important;}');
    rules.push(scope+'>*{order:900!important;}');
    rules.push(scope+'>#updateNotice{order:-1!important;}');
    config.order[mode].forEach((key,index)=>rules.push(scope+'>'+byKey[key].selector+'{order:'+index+'!important;}'));
   }
   if(rules.length)css+='@media '+(mode==='desktop'?'(min-width:721px)':'(max-width:720px), (orientation:landscape) and (max-height:500px) and (pointer:coarse)')+'{\n'+rules.join('\n')+'\n}\n';
  }
  return css;
 }
 return {empty,validate,generateCSS};
});
