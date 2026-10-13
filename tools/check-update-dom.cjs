const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const d=new JSDOM('<span id="offlineStatus"></span><button id="offlineUpdate"></button><button id="offlineCheck"></button><aside id="updateNotice" hidden><p id="updateNoticeText"></p><button id="updateNoticeApply"></button><button id="updateNoticeLater"></button></aside>',{url:'https://example.com/hsk/',runScripts:'outside-only'}),w=d.window;
 const version=fs.readFileSync('offline.js','utf8').match(/BUILD='([^']+)'/)[1];
 const active={scriptURL:'https://example.com/hsk/OneSignalSDKWorker.js',postMessage(_,ports){ports[0].postMessage({ready:true,version});}},waiting={postMessage(){}};
 const reg={active,waiting,updateViaCache:'none',addEventListener(){}};
 Object.defineProperty(w,'isSecureContext',{value:true});w.MessageChannel=MessageChannel;
 Object.defineProperty(w.navigator,'serviceWorker',{value:{addEventListener(){},getRegistration:async()=>reg,ready:Promise.resolve(reg)}});
 w.fetch=async()=>({ok:true,json:async()=>({version:'hsk-offline-next',label:'next'})});
 w.eval(fs.readFileSync('offline.js','utf8'));await new Promise(r=>setTimeout(r,30));
 assert.equal(w.document.getElementById('updateNotice').hidden,false);assert.equal(w.document.getElementById('updateNoticeApply').disabled,false);w.document.getElementById('updateNoticeLater').click();assert.equal(w.document.getElementById('updateNotice').hidden,true);d.window.close();
 const p=new JSDOM('<p id="pushStatus"></p><button id="pushEnable"></button><button id="pushDisable"></button><select id="pushHour"></select><p id="updatePushStatus"></p><button id="updatePushEnable"></button><button id="updatePushDisable"></button>',{url:'https://example.com/',runScripts:'outside-only'}),v=p.window;let tags,outs=0,permissions=0;
 v.$=id=>v.document.getElementById(id);v.records={};v.wordByKey=new Map();v.saveRecords=()=>{};v.matchMedia=()=>({matches:false});v.PushManager=class{};Object.defineProperty(v,'isSecureContext',{value:true});Object.defineProperty(v.navigator,'serviceWorker',{value:{}});
 v.fetch=async()=>({ok:true,json:async()=>({appId:'f041b500-da77-4200-8595-179ba2c4a256',schedulerEnabled:true})});
 const subscription={optedIn:false,id:null,addEventListener(){},async optIn(){this.optedIn=true;this.id='test';},async optOut(){outs++;this.optedIn=false;}};
 const sdk={init:async()=>{},User:{addTags(t){tags=t;},PushSubscription:subscription},Notifications:{permission:true,async requestPermission(){permissions++;}}};
 v.eval(fs.readFileSync('push.js','utf8'));await new Promise(r=>setTimeout(r,10));await v.OneSignalDeferred[0](sdk);assert.equal(permissions,0,'never request permission automatically');
 await v.$('updatePushEnable').onclick();assert.equal(tags.hsk_update_on,'1');assert.equal(tags.hsk_push_on,'0','updates do not enable reminders');await v.$('pushEnable').onclick();await v.$('updatePushDisable').onclick();assert.equal(outs,0,'reminders stay subscribed');assert.equal(tags.hsk_update_on,'0');await v.$('pushDisable').onclick();assert.equal(outs,1);p.window.close();console.log('PASS: global update notice; explicit push consent; independent reminder/update preferences.');
})().catch(e=>{console.error(e);process.exit(1);});
