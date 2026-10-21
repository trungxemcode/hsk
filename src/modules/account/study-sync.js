(()=>{'use strict';const C=window.HSKStudySyncCore,writer=crypto.randomUUID();const parse=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f;}catch{return f;}};const owner=()=>parse('hsk-account-meta-v1',{}).uid||'guest';
function read(){const s=parse(C.KEY,null);return s?.owner===owner()?s:C.empty(owner());}
function legacy(uid=owner()){return C.seed(uid,parse('hsk-study-plan-v1:'+uid,null),parse('hsk-studio-activity-v1:'+uid,null),parse(C.KEY,null));}
function write(s){localStorage.setItem(C.KEY,JSON.stringify(s));return s;}
window.HSKStudyStore={legacy,initialize(){return write(legacy());},get plan(){return C.plan(read());},savePlan(p){const s=write(C.savePlan(read(),p,writer));return C.plan(s);},activity:()=>C.activity(read()),recordActivity(now=Date.now()){return C.activity(write(C.recordActivity(read(),writer,now)));}};
})();
