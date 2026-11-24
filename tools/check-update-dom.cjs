const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const d=new JSDOM('<span id="offlineStatus"></span><button id="offlineUpdate"></button><button id="offlineCheck"></button><aside id="updateNotice" hidden><p id="updateNoticeText"></p><button id="updateNoticeApply"></button><button id="updateNoticeLater"></button></aside>',{url:'https://example.com/hsk/',runScripts:'outside-only'}),w=d.window;
 const source=fs.readFileSync('offline.js','utf8'),version=source.match(/BUILD='([^']+)'/)[1];
 const activations=[];
 const worker=(workerVersion)=>({
  scriptURL:'https://example.com/hsk/OneSignalSDKWorker.js',
  addEventListener(){},removeEventListener(){},
  postMessage(message,ports){
   if(message.type==='HSK_OFFLINE_STATUS')ports[0].postMessage({ready:true,version:workerVersion});
   if(message.type==='HSK_ACTIVATE_UPDATE')activations.push(workerVersion);
  }
 });
 let published='hsk-offline-next',checks=0,updates=0,clock=100000,checkInterval,finishUpdate;
 const reg={active:worker(version),waiting:worker(published),updateViaCache:'none',addEventListener(){},update(){
  updates++;
  return new Promise(resolve=>{finishUpdate=()=>{reg.waiting=worker(published);resolve();};});
 }};
 Object.defineProperty(w,'isSecureContext',{value:true});w.MessageChannel=MessageChannel;
 Object.defineProperty(w.navigator,'serviceWorker',{value:{addEventListener(){},getRegistration:async()=>reg,ready:Promise.resolve(reg)}});
 Object.defineProperty(w.document,'hidden',{value:false});
 w.Date.now=()=>clock;w.setInterval=callback=>{checkInterval=callback;};
 w.fetch=async()=>{checks++;return {ok:true,json:async()=>({version:published,label:published})};};
 const waitFor=async (condition)=>{
  for(let i=0;i<100&&!condition();i++)await new Promise(resolve=>setTimeout(resolve,10));
  assert.ok(condition(),'update state did not settle');
 };
 w.eval(source);
 const notice=w.document.getElementById('updateNotice'),apply=w.document.getElementById('updateNoticeApply');
 await waitFor(()=>checks===1&&!notice.hidden&&!apply.disabled);
 assert.equal(updates,0,'a matching waiting worker is already up to date');
 w.document.getElementById('updateNoticeLater').click();assert.equal(notice.hidden,true);
 published='hsk-offline-newest';clock+=60000;checkInterval();
 await waitFor(()=>updates===1);
 assert.equal(notice.hidden,false,'a newer release shows a new notice');
 assert.equal(apply.disabled,true,'the older waiting worker cannot be applied');
 assert.equal(w.document.getElementById('offlineUpdate').hidden,true);
 finishUpdate();
 await waitFor(()=>!apply.disabled);
 assert.deepEqual(activations,[],'the app never applies a release on its own');
 apply.click();assert.deepEqual(activations,[published]);d.window.close();
 const p=new JSDOM('<p id="pushStatus"></p><button id="pushEnable"></button><button id="pushDisable"></button><select id="pushHour"></select><p id="updatePushStatus"></p><button id="updatePushEnable"></button><button id="updatePushDisable"></button>',{url:'https://example.com/',runScripts:'outside-only'}),v=p.window;let tags,outs=0,permissions=0;
 v.$=id=>v.document.getElementById(id);v.records={};v.wordByKey=new Map();v.saveRecords=()=>{};v.matchMedia=()=>({matches:false});v.PushManager=class{};Object.defineProperty(v,'isSecureContext',{value:true});Object.defineProperty(v.navigator,'serviceWorker',{value:{}});
 v.fetch=async()=>({ok:true,json:async()=>({appId:'f041b500-da77-4200-8595-179ba2c4a256',schedulerEnabled:true})});
 const subscription={optedIn:false,id:null,addEventListener(){},async optIn(){this.optedIn=true;this.id='test';},async optOut(){outs++;this.optedIn=false;}};
 const sdk={init:async()=>{},User:{addTags(t){tags=t;},PushSubscription:subscription},Notifications:{permission:true,async requestPermission(){permissions++;}}};
 v.eval(fs.readFileSync('push.js','utf8'));await new Promise(r=>setTimeout(r,10));await v.OneSignalDeferred[0](sdk);assert.equal(permissions,0,'never request permission automatically');
 await v.$('updatePushEnable').onclick();assert.equal(tags.hsk_update_on,'1');assert.equal(tags.hsk_push_on,'0','updates do not enable reminders');await v.$('pushEnable').onclick();await v.$('updatePushDisable').onclick();assert.equal(outs,0,'reminders stay subscribed');assert.equal(tags.hsk_update_on,'0');await v.$('pushDisable').onclick();assert.equal(outs,1);p.window.close();console.log('PASS: global update notice; explicit push consent; independent reminder/update preferences.');
})().catch(e=>{console.error(e);process.exit(1);});
