/**
 * Additive auto50 quality profile. New batches only; disable with HSK_AUTO50_QUALITY_MODE=DISABLED.
 */
function hskVoiceQualityEnabled_(p){return p.getProperty('HSK_AUTO50_QUALITY_MODE')!=='DISABLED';}
function hskVoiceQualityCommonPinyin_(job){
 var common={'厉害':'lìhai','麻烦':'máfan','咳嗽':'késou','母亲':'mǔqīn','护士':'hùshi'};
 return hskVoiceRecPinyin_(common[job.text]||hskAuto50ExpectedPinyin_(job.text,job.pinyin));
}
function hskVoiceQualityDetect_(bytes,expected){
 var pcm=hskBatchPcm_(bytes),levels=[],peak=0;
 for(var i=0;i<pcm.length;i+=960){var sum=0,end=Math.min(pcm.length,i+960);for(var j=i;j<end;j+=2){var x=(pcm[j]&255)+(pcm[j+1]&255)*256;if(x>=32768)x-=65536;sum+=x*x;}var rms=Math.sqrt(sum/((end-i)/2))/32768;levels.push(rms);peak=Math.max(peak,rms);}
 if(peak<0.004)return null;
 var candidates=[];
 [0.7,0.6,0.5,0.4,0.3,0.24,0.18,0.12].forEach(function(gap){[0.012,0.02,0.03,0.04,0.05].forEach(function(ratio){
 var ranges=[],start=-1,last=-1,threshold=Math.max(0.002,peak*ratio);
 levels.forEach(function(v,n){if(v>threshold){if(start<0)start=n;last=n;}else if(start>=0&&(n-last)*0.02>=gap){ranges.push([start*480,(last+1)*480]);start=last=-1;}});
 if(start>=0)ranges.push([start*480,Math.min(pcm.length/2,(last+1)*480)]);
 if(ranges.length===expected&&ranges.every(function(r){return r[1]-r[0]>=3600&&r[1]-r[0]<=120000;}))candidates.push({ranges:ranges,gap:gap,ratio:ratio});
 });});
 for(var c=0;c<candidates.length;c++){
  var best=candidates[c],support=candidates.filter(function(other){return other.gap===best.gap&&other.ranges.every(function(r,k){return Math.abs(r[0]-best.ranges[k][0])<=2400&&Math.abs(r[1]-best.ranges[k][1])<=2400;});}).length;
  if(support>=2)return best;
 }
 return null;
}

function hskVoiceQualitySamples_(p){
 try{var s=JSON.parse(p.getProperty('HSK_AUTO50_QUALITY_SAMPLES')||'[]');return Array.isArray(s)?s:[];}catch(e){return [];}
}
function hskVoiceQualityOrderPairs_(p,pairs,avoid){
 if(!hskVoiceQualityEnabled_(p))return pairs;
 var totals={},samples=hskVoiceQualitySamples_(p),fallback=['gemini-3.1-flash-tts-preview','gemini-2.5-flash-preview-tts','gemini-3.8-flash-lite-tts'];
 samples.forEach(function(s){Object.keys(s.models||{}).forEach(function(m){var t=totals[m]||(totals[m]={passed:0,total:0});t.passed+=s.models[m].passed;t.total+=s.models[m].total;});});
 function score(m){var t=totals[m];return t&&t.total>=20?(t.passed+7)/(t.total+10):0.7;}
 return pairs.map(function(pair,i){return {pair:pair,i:i};}).sort(function(a,b){
  var x=a.pair.model,y=b.pair.model;
  return Number(x.indexOf('3.8')>=0)-Number(y.indexOf('3.8')>=0)||
   Number(x===avoid)-Number(y===avoid)||score(y)-score(x)||fallback.indexOf(x)-fallback.indexOf(y)||a.i-b.i;
 }).map(function(x){return x.pair;});
}
function hskVoiceQualityRecord_(p,batch,jobs,clipRows){
 if(!hskVoiceQualityEnabled_(p))return;
 var samples=hskVoiceQualitySamples_(p);if(samples.some(function(s){return s.id===batch[0];}))return;
 var proved=new Set(clipRows.filter(function(r){return r[4]==='READY';}).map(function(r){return Number(r[10]);}));
 var existing=new Set(clipRows.filter(function(r){return r[4]==='EXISTING';}).map(function(r){return Number(r[10]);}));
 var models={};jobs.forEach(function(job){if(existing.has(job.row+2))return;var m=job.model||batch[7],t=models[m]||(models[m]={passed:0,total:0});t.total++;if(proved.has(job.row+2))t.passed++;});
 samples.push({id:batch[0],models:models});p.setProperty('HSK_AUTO50_QUALITY_SAMPLES',JSON.stringify(samples.slice(-12)));
}
function hskVoiceQualityReason_(r){
 var a=hskVoiceRecPinyin_(r[8]),b=hskVoiceRecPinyin_(r[9]);
 return !a||!b?'asr_empty':a!==b?'asr_pinyin_disagreement':r[13]==='duplicate_mapping'?'duplicate_mapping':'pronunciation_or_source_mismatch';
}
