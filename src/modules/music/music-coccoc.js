/* Browser-native media handoff. No adblock / download extension API is exposed to websites. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HSKCocCocBridge=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const POSITIVE=/(?:coc[_\s.-]?coc(?:[_\s.-]?(?:browser|mobile))?|corom\/)/i;
 function isCocCoc(navigatorLike,windowLike){
  const nav=navigatorLike||{},win=windowLike||{};
  // Cốc Cốc may expose an intentionally Chrome-like UA. Absence of a
  // positive marker means UNKNOWN, not "Chrome definitely" or a fallback.
  const ua=String(nav.userAgent||'');
  const brands=Array.isArray(nav.userAgentData?.brands)?nav.userAgentData.brands:[];
  const ascii=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(POSITIVE.test(ua)||brands.some(item=>POSITIVE.test(ascii(item?.brand))))return true;
  // Some Cốc Cốc builds expose a page-visible proprietary marker.
  // It is a UX hint, not proof of identity and never grants privileges.
  return Boolean((win.coccoc&&typeof win.coccoc==='object')||(nav.coccoc&&typeof nav.coccoc==='object'));
 }
 const PREF_KEY='hsk-music-coccoc-mode-v1';
 // Scoped to this browser/PWA storage partition, not to the HSK account or cloud.
 function readChoice(storage){
  try{const value=storage?.getItem(PREF_KEY);return value==='on'||value==='off'?value:null;}catch{return null;}
 }
 function writeChoice(storage,value){
  if(value!=='on'&&value!=='off')return false;
  try{storage?.setItem(PREF_KEY,value);return storage?.getItem(PREF_KEY)===value;}catch{return false;}
 }
 function modeEnabled(storage,navigatorLike,windowLike){
  const value=readChoice(storage);
  return value==='on'||(value===null&&isCocCoc(navigatorLike,windowLike));
 }
 function providerSource(raw,parseLink){
  if(typeof raw!=='string'||typeof parseLink!=='function')return null;
  try{
   const entry=parseLink(raw);
   if(!['youtube','soundcloud','spotify'].includes(entry.kind))return null;
   const url=new URL(entry.url);
   if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
   if(!['www.youtube.com','youtube.com','soundcloud.com','open.spotify.com'].includes(url.hostname))return null;
   return url.href;
  }catch{return null;}
 }
 return Object.freeze({isCocCoc,providerSource,readChoice,writeChoice,modeEnabled});
});
