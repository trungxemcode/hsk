/** Stable logical cohorts and sticky provider keys. Called under the existing script lock. */
var HSK_STABLE_POLICY_='30-verified-sticky-v1';
function hskStableRead_(p,key,fallback){try{return JSON.parse(p.getProperty(key)||'null')||fallback;}catch(e){return fallback;}}
function hskStableDone_(r){return r&&['READY','EXISTING'].indexOf(r[3])>=0;}
function hskStableMember_(rows,j){var r=rows[j.row];return r&&r[1]===j.text&&r[2]===j.pinyin?r:null;}
function hskStableCycleCount_(c,rows){var done=0,review=0,changed=0;c.members.forEach(function(j){var r=hskStableMember_(rows,j);if(!r)changed++;else if(hskStableDone_(r))done++;else if(r[3]==='REVIEW')review++;});return {done:done,total:c.members.length,target:c.target,review:review,changed:changed};}
function hskStableCycleObserve_(p,rows,batches){
 var c=hskStableRead_(p,'HSK_STABLE_CYCLE',null),stage=p.getProperty('HSK_FAST_PHASE_STAGE')||'234';
 var active=batches.find(function(b){return ['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;});
 if(c){var n=hskStableCycleCount_(c,rows);if(!active&&n.done>=c.target){p.setProperty('HSK_STABLE_LAST_CYCLE',JSON.stringify({id:c.id,stage:c.stage,done:n.done,target:c.target,total:n.total}));p.deleteProperty('HSK_STABLE_CYCLE');c=null;}}
 if(c)return c;
 if(active)return hskStableCycleCreate_(p,rows,JSON.parse(active[1]).map(function(j){return {i:j.row,r:rows[j.row]};}),stage,active[0]);
 return null;
}
function hskStableCycleCreate_(p,rows,first,stage,seed){
 var levels=hskFastPhaseLevels_(stage),members=[],seen={};
 function add(x){if(!x.r||seen[x.i]||members.length>=50||levels.indexOf(Number(x.r[0]))<0)return;seen[x.i]=true;members.push({row:x.i,text:x.r[1],pinyin:x.r[2]});}
 first.forEach(add);
 rows.forEach(function(r,i){if(['PENDING','RETRY'].indexOf(r[3])>=0)add({i:i,r:r});});
 if(!members.length)return null;
 var c={id:seed||hskDigest_(stage+':'+Date.now()+':'+JSON.stringify(members)),stage:stage,members:members,target:Math.min(30,members.length),tail:members.length<30,created:hskVNTime_(new Date())};
 p.setProperty('HSK_STABLE_CYCLE',JSON.stringify(c));p.setProperty('HSK_STABLE_POLICY',HSK_STABLE_POLICY_);return c;
}
function hskStableCycleFilter_(p,rows,pending){
 var c=hskStableRead_(p,'HSK_STABLE_CYCLE',null),stage=p.getProperty('HSK_FAST_PHASE_STAGE')||'234';
 if(c&&hskStableCycleCount_(c,rows).done>=c.target){p.deleteProperty('HSK_STABLE_CYCLE');c=null;}
 if(!c)c=hskStableCycleCreate_(p,rows,pending,stage,'');
 if(!c)return pending;
 var allowed={};c.members.forEach(function(j){if(hskStableMember_(rows,j))allowed[j.row]=true;});
 return pending.filter(function(x){return !!allowed[x.i];});
}
function hskStablePreferTts_(p,pairs){
 var pin=hskStableRead_(p,'HSK_STABLE_TTS_PIN',null);if(!pin)return pairs;
 var exact=pairs.find(function(x){return x.model===pin.model&&x.slot===pin.slot;});
 var sameKey=pairs.find(function(x){return x.slot===pin.slot;});
 var chosen=exact||sameKey;if(!chosen)return pairs;
 return [chosen].concat(pairs.filter(function(x){return x!==chosen;}));
}
function hskStableTtsPair_(p,token,now){
 var pin=hskStableRead_(p,'HSK_STABLE_TTS_PIN',null),scan=hskVoiceRoutePairs_(p,token,now,pin?pin.model:'gemini-3.8-flash-lite-tts');
 return scan.pairs[0]||null;
}
function hskStableTtsSuccess_(p,model,slot){p.setProperty('HSK_STABLE_TTS_PIN',JSON.stringify({model:model,slot:Number(slot)}));}
/** Quality/format failures keep the provider identity; quota/unavailability can fail over. */
function hskStableTtsUnavailable_(error){return /tts_rate_limited|tts_daily_limit|tts_quota_unavailable|tts_key_invalid|tts_region_unavailable|tts_model_unavailable|tts_provider_unavailable|tts_permission_denied/.test(String(error||''));}
function hskStableAsrSlot_(p,now){
 var slots=[10,12,1,2,3,4,5,6,7,8,9,11],pin=Number(p.getProperty('HSK_STABLE_ASR_PIN')||10),start=Math.max(0,slots.indexOf(pin)),earliest=Infinity;
 for(var n=0;n<slots.length;n++){var slot=slots[(start+n)%slots.length],after=Number(p.getProperty('HSK_STABLE_ASR_'+slot+'_AFTER')||0);if(after<=now){p.setProperty('HSK_STABLE_ASR_PIN',String(slot));return {slot:slot};}earliest=Math.min(earliest,after);}
 return {slot:0,retryAt:earliest};
}
function hskStableAsrError_(p,slot,detail,reason){
 var status=Number(detail.upstreamStatus||0),name=String(reason||'');
 if(status===429||status===401||status===403||status>=500||/rate_limit|daily_limit|key_invalid|provider_unavailable|region_unavailable/.test(name)){
  p.setProperty('HSK_STABLE_ASR_'+slot+'_AFTER',String(Date.now()+Math.max(60000,Number(detail.retryAfter||60)*1000)));
 }
}
function hskStableProgress_(storage,p,rows,batches){
 if(typeof hskFull50Progress_==='function'&&hskFull50Progress_(storage,p,rows,batches))return;
 var s=storage.sheet.getParent().getSheetByName('Tien_do');if(!s)return;
 var c=hskStableRead_(p,'HSK_STABLE_CYCLE',null),n=c?hskStableCycleCount_(c,rows):null;
 var active=batches.find(function(b){return ['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;});
 var stage=active?(active[3]==='TTS_CHUNKS'?'Đang tạo âm':active[3]==='MASTER'?'Chuẩn bị kiểm âm':'Đang kiểm âm'):n&&n.changed?'Chờ kiểm tra hàng đã đổi nội dung':n&&n.review?'Chờ xử lý từ cần kiểm tra':'Đang sửa từ còn lại trong cùng lô';
 var retry=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0);
 if(p.getProperty('HSK_VOICE_PAUSED')==='true')stage='Tạm dừng';else if(retry>Date.now())stage='Chờ provider đến '+hskVNTime_(new Date(retry));
 var text=n?stage+' — đạt '+n.done+'/'+n.target+(c.tail?' (lô cuối giai đoạn)':'')+'; tổng '+n.total+' từ':stage;
 s.getRange(7,2).setValue(text);
 s.getRange(13,2).setValue('Giữ cùng lô đến 30 từ đã kiểm đạt; lô cuối xử lý hết; hai lượt ASR độc lập');
 s.getRange(14,2,3,1).setValues([[active?active[3]:'CÙNG_LÔ_CHỜ_ĐỦ_ĐẠT'],[active?active[4]||'':n?n.done+'/'+n.target+' đạt; '+n.review+' cần kiểm tra':''],[active?active[7]:'']]);
 var tts=hskStableRead_(p,'HSK_STABLE_TTS_PIN',{});
 s.getRange(35,1,4,2).setValues([['Quy tắc gom lô','Đủ 30 từ đạt mới mở lô mới; lô cuối xử lý hết phần còn lại'],['Key TTS đang giữ',tts.slot?'Key '+tts.slot+' / '+tts.model:'Chọn một key hợp lệ rồi giữ'],['Key ASR đang giữ',p.getProperty('HSK_STABLE_ASR_PIN')||'Chưa gọi'],['Lô đang giữ',c?c.id.slice(0,16)+' — '+n.done+'/'+n.target+' đạt':'Chưa mở lô']]);
}
