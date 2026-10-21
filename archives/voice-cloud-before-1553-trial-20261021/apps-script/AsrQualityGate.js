/**
 * Conservative ASR quality gate for HSK 50-word audio batches.
 * No effect on TTS, cache naming, Drive permissions or Worker transport.
 * Pinyin aliases are corrections for dictionary entries with well-known
 * neutral-tone or lexical variants (not a generic tone-stripping rule).
 */
function hskAuto50ExpectedPinyin_(hanzi,sourcePinyin){
 var canonical={
  '便宜':'piányi','收拾':'shōushi','空调':'kōngtiáo',
  '早上':'zǎoshang','地方':'dìfang','记得':'jìde',
  '眼睛':'yǎnjing','关系':'guānxi','故事':'gùshi',
  '数字':'shùzì','态度':'tàidu','钥匙':'yàoshi',
  '笑话':'xiàohua','师傅':'shīfu','大夫':'dàifu',
  '受不了':'shòubuliǎo','呀':'ya','一切':'yíqiè'
 };
 return hskVoiceRecPinyin_(Object.prototype.hasOwnProperty.call(canonical,hanzi)?canonical[hanzi]:sourcePinyin);
}
function hskAuto50PinyinMatches_(hanzi,sourcePinyin,heard){
 var received=hskVoiceRecPinyin_(heard);
 if(!received)return false;
 var corrected=hskAuto50ExpectedPinyin_(hanzi,sourcePinyin);
 if(received===corrected)return true;
 // Keep contextually valid stressed variants, except known dictionary mistakes.
 if(hanzi==='空调'||hanzi==='便宜')return false;
 return received===hskVoiceRecPinyin_(sourcePinyin);
}
function hskAuto50NormalizedHanzi_(text){
 var chars={
  '鑰':'钥','數':'数','記':'记','請':'请','廣':'广',
  '關':'关','係':'系','師':'师','調':'调','書':'书',
  '個':'个','國':'国','這':'这','來':'来','醫':'医',
  '臺':'台','後':'后','媽':'妈','語':'语','學':'学',
  '話':'话','鐘':'钟','裏':'里','裡':'里','體':'体',
  '風':'风','麵':'面','門':'门','機':'机','過':'过',
  '長':'长','發':'发','鳥':'鸟','聽':'听','點':'点'
 };
 return Array.from(hskVoiceRecHanzi_(text)).map(function(c){return chars[c]||c;}).join('');
}
/** Returns {index,method}; a negative index means unverified. */
function hskAuto50QualityMatch_(jobs,segment,segmentCount,checks,hanziA,hanziB,pinyinA,pinyinB){
 if(typeof hskCongestionMatch_==='function')return hskCongestionMatch_(jobs,segment,segmentCount,checks,hanziA,hanziB,pinyinA,pinyinB);
 var failure={index:-1,method:'unverified'};
 var p1=hskVoiceRecPinyin_(pinyinA),p2=hskVoiceRecPinyin_(pinyinB);
 if(!p1||p1!==p2)return failure;
 var h1=hskAuto50NormalizedHanzi_(hanziA),h2=hskAuto50NormalizedHanzi_(hanziB);
 var sameHanzi=!!h1&&h1===h2,around=Number(segment)-1;
 var matching=[];
 if(sameHanzi)jobs.forEach(function(job,j){
  if(Math.abs(j-around)>4)return;
  if(hskAuto50NormalizedHanzi_(job.text)===h1&&hskAuto50PinyinMatches_(job.text,job.pinyin,p1))matching.push(j);
 });
 if(matching.length===1)return {index:matching[0],method:'hanzi_pinyin_double_asr'};
 if(Number(checks)<3||segmentCount!==jobs.length||around<0||around>=jobs.length)return failure;
 // Third check only: two independent ASR pinyin readings must agree
 // with the reference pronunciation at the exact segmented position.
 // Never approve a homophone when another item in this batch shares pinyin.
 var target=jobs[around];
 if(!hskAuto50PinyinMatches_(target.text,target.pinyin,p1))return failure;
 var samePinyin=jobs.filter(function(job){
  return hskAuto50PinyinMatches_(job.text,job.pinyin,p1);
 });
 if(samePinyin.length!==1)return failure;
 return {index:around,method:'pinyin_third_check'};
}
