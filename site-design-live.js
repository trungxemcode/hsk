/* Applies only validated public design CSS; never restarts application modules. */
(function(){
 'use strict';
 if(new URLSearchParams(location.search).has('home-designer-preview'))return;
 const script=document.currentScript,configURL=new URL('./site-design-config.json',script.src),key='hsk-live-design-v1';
 let endpoint='',revision='',etag='',timer=null,working=false,delay=15000;
 function apply(css,rev){if(typeof css!=='string'||css.length>2000000||typeof rev!=='string')return;let style=document.getElementById('hsk-live-design');if(!style){style=document.createElement('style');style.id='hsk-live-design';document.head.append(style);}style.textContent=css;revision=rev;window.dispatchEvent(new CustomEvent('hsk-design-updated',{detail:{revision:rev}}));}
 function schedule(){clearTimeout(timer);if(endpoint&&!document.hidden&&navigator.onLine!==false)timer=setTimeout(check,delay);}
 async function check(){
  clearTimeout(timer);if(working||!endpoint||document.hidden||navigator.onLine===false)return;working=true;
  try{const response=await fetch(endpoint,{cache:'no-store',headers:etag?{'If-None-Match':etag}:{},signal:AbortSignal.timeout(6000)});
   if(response.status!==304){if(!response.ok)throw Error('design unavailable');const value=await response.json();if(typeof value.css!=='string'||value.css.length>2000000||typeof value.revision!=='string')throw Error('invalid design');if(value.revision!==revision)apply(value.css,value.revision);etag=response.headers.get('ETag')||'';try{localStorage.setItem(key,JSON.stringify({endpoint,revision:value.revision,css:value.css}));}catch{}}
   delay=15000;
  }catch{delay=Math.min(60000,delay*2);}finally{working=false;schedule();}
 }
 async function start(){
  try{const response=await fetch(configURL,{cache:'no-store'});if(!response.ok)return;const config=await response.json();if(config.enabled!==true||(Array.isArray(config.publicOrigins)&&!config.publicOrigins.includes(location.origin)))return;const url=new URL(config.endpoint,location.href);if(url.protocol!=='https:'&&!(url.hostname==='127.0.0.1'&&location.hostname==='127.0.0.1'))return;endpoint=url.href;try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.endpoint===endpoint)apply(saved.css,saved.revision);}catch{}await check();}catch{}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else check();});window.addEventListener('online',check);window.addEventListener('offline',()=>clearTimeout(timer));window.addEventListener('pagehide',()=>clearTimeout(timer));window.addEventListener('pageshow',check);start();
})();
