/** Third quality check only: same marked pronunciation, never strip tones or guess a clip's position. */
function hskAuto50ThirdPassMatch_(jobs,number,attempt,p1,p2,segmentCount){
 if(Number(attempt)!==3||!p1||p1!==p2)return -1;
 var at=Number(number)-1;
 if(!Number.isInteger(at)||at<0||at>=jobs.length||segmentCount!==jobs.length)return -1;
 // Exact clip order anchors homophones; do not assign an ambiguous segment by sound alone.
 return hskVoiceRecPinyin_(jobs[at].pinyin)===p1?at:-1;
}
