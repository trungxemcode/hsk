(function(root){'use strict';
const type={id:'driveListenJudge',name:'Nghe giọng gốc · Đúng/sai',skill:'Nghe',levels:[3],format:'choice',note:'Audio H31001 đã tách và đối chiếu lời nghe, đáp án gốc.'};
function install(bank,data){if(!bank.types.some(t=>t.id===type.id))bank.types.push(type);const ids=new Set(bank.items.map(q=>q.id));for(const q of data.items)if(!ids.has(q.id)){bank.items.push(q);ids.add(q.id);}bank.driveAudioReport=data.report;return bank;}
if(typeof module==='object'&&module.exports){module.exports=install;return;}
root.HSKDriveAudio={ready:false,error:null};fetch('./drive-audio-data.json').then(r=>{if(!r.ok)throw Error('Không tải được bài nghe gốc.');return r.json();}).then(data=>{install(root.HSKExamBank,data);root.HSKExamCore.validate(root.HSKExamBank);root.HSKDriveAudio.ready=true;root.dispatchEvent(new Event('hsk-exam-ready'));if(root.HSKExam&&!root.HSKExam.question&&!document.getElementById('examPractice').hidden)root.HSKExam.catalogue();}).catch(e=>{root.HSKDriveAudio.error=e.message;root.dispatchEvent(new Event('hsk-exam-ready'));});
})(typeof window==='object'?window:globalThis);
