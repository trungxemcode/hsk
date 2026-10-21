const usageWordMap=new Map();
function usageReading(pin){return String(pin||'').normalize('NFC').toLowerCase().replace(/[\s'’·]/g,'');}
function usageVariant(han,pin){const rows=usageFactsData.words[han]?.variants||[];const match=rows.find(v=>usageReading(v.pin)===usageReading(pin));if(match)return {rows:[match],exact:true};return {rows:pin?[]:rows,exact:false};}
function usageGlosses(rows){return [...new Set(rows.flatMap(v=>v.senses.map(s=>s.mean)).filter(Boolean))];}
function glossTokens(glosses){return [...new Set(glosses.flatMap(x=>String(x).split(/[;,]/)).map(x=>x.trim().toLowerCase()).filter(x=>x.length>1&&!x.includes('(')))];}
function usageLabel(pos){return ({n:'Danh từ',v:'Động từ',adj:'Tính từ',adv:'Phó từ',prep:'Giới từ',conj:'Liên từ',pron:'Đại từ',num:'Số từ',classifier:'Lượng từ',particle:'Trợ từ',interj:'Thán từ',a:'Tính từ',d:'Phó từ',m:'Số từ',q:'Lượng từ',p:'Giới từ',c:'Liên từ',r:'Đại từ',u:'Trợ từ'})[pos]||pos||'Nguồn chưa ghi từ loại';}
function appendUsageWord(box,han,pin,variant,fallback){
 box.append(relationElement('h6',han+' ('+(pin||variant.rows.map(v=>v.pin).join(' / ')||'chưa có phiên âm')+'): nghĩa và vai trò trong câu'));
 if(!variant.rows.length){box.append(relationElement('p',fallback||'Chưa có nghĩa riêng khớp với cách đọc cần đối chiếu.'));box.append(relationElement('small','Chưa đủ dữ liệu cùng cách đọc để kết luận về từ loại hoặc mẫu câu.'));return;}
 for(const v of variant.rows){if(variant.rows.length>1)box.append(relationElement('strong','Cách đọc: '+v.pin));for(const sense of v.senses)box.append(relationElement('p',usageLabel(sense.pos)+' — '+sense.mean));
  const patterns=[...new Set(v.structures||[])];if(patterns.length){box.append(relationElement('strong','Cấu trúc ghi nhận trong Hanzii'));for(const pattern of patterns.slice(0,3))box.append(relationElement('p',pattern));}
 }
 const positions=[...new Set(variant.rows.flatMap(v=>v.senses.map(s=>usageLabel(s.pos))))];
 let guide=[];if(positions.includes('Danh từ'))guide.push('Ở nghĩa danh từ, xem từ đang gọi tên người, vật, sự việc hay khái niệm nào; đối chiếu đối tượng với nghĩa bạn muốn nói.');if(positions.includes('Động từ'))guide.push('Ở nghĩa động từ, xem hành động/trạng thái được nói đến và từ đi cùng phía sau. Cùng dịch gần nhau không bảo đảm mang cùng tân ngữ.');if(positions.includes('Tính từ'))guide.push('Ở nghĩa tính từ, xem đặc điểm đang được đánh giá là gì; kiểm tra cách kết hợp trong câu thay vì chỉ đổi một tính từ có bản dịch giống nhau.');if(positions.includes('Phó từ'))guide.push('Ở nghĩa phó từ, xem từ bổ nghĩa cho hành động hay mức độ, thời gian hoặc tần suất. Vị trí trong câu là một phần của cách dùng.');if(guide.length)box.append(relationElement('p',guide.join(' ')));
}
function pairExamplePool(han,pin){if(!usageWordMap.size){for(const w of words){const xs=usageWordMap.get(w.han)||[];xs.push(w);usageWordMap.set(w.han,xs);}}const ws=usageWordMap.get(han)||[];const exact=ws.filter(w=>usageReading(w.pin)===usageReading(pin));return (exact.length?exact:pin?[]:ws).flatMap(w=>w.practice?.examples||[]).filter(e=>e.cn?.includes(han)&&e.pin&&e.vi);}
function appendPairExamples(box,han,pin,shared){
 const examples=pairExamplePool(han,pin);box.append(relationElement('h6','Ngữ cảnh dùng '+han));
 if(!examples.length){box.append(relationElement('p','Chưa bổ sung câu ví dụ có phiên âm và bản dịch đã đối chiếu riêng cho '+han+' trong bộ dữ liệu hiện tại. Xem các nghĩa và cấu trúc phía trên; không tự tạo câu để lấp dữ liệu.','hint'));return;}
 const scored=examples.map((e,i)=>({e,i,score:glossTokens([e.meaning||e.sense||'']).some(t=>shared.includes(t))?1:0})).sort((a,b)=>b.score-a.score||a.i-b.i);const chosen=[],seen=new Set();for(const {e} of scored){const sense=e.meaning||e.sense||'';if(!seen.has(sense)){chosen.push(e);seen.add(sense);}if(chosen.length===2)break;}if(chosen.length<2)for(const {e} of scored){if(!chosen.includes(e))chosen.push(e);if(chosen.length===2)break;}
 for(const e of chosen){const ex=relationElement('div','','relation-pair-example');ex.append(relationElement('strong',e.cn),pinyinLine(e.pin),relationElement('span',e.vi,'relation-meaning'),relationElement('p','Trong câu này, '+han+' được dùng theo nghĩa: '+(e.meaning||e.sense||'xem bản dịch và nghĩa ở trên')+'. Giữ đúng ý này trước khi cân nhắc dùng từ gần nghĩa.'));const origin=e.origin==='hanzii'?'Ví dụ Hanzii':e.origin==='authored'?'Ví dụ biên soạn; đã đối chiếu':'Ví dụ có sẵn trong bộ học; đã đối chiếu';ex.append(relationElement('small',origin));box.append(ex);}
}
function allPairExplanation(w,item){
 const detailed=detailedPairExplanation(w,item);if(detailed)return detailed;
 const box=relationElement('div','','relation-pair-guide'),r=wordRelationsData.entries[wordKey(w)];const a=usageVariant(w.han,r?.sourcePin||w.pin);const known=item.key&&relationIndex().get(item.key);const bpin=known?.pin||((wordRelationsData.lexicon[item.han]||[]).length===1?wordRelationsData.lexicon[item.han][0].pinyin:'');const b=usageVariant(item.han,bpin);
 const ag=usageGlosses(a.rows),bg=usageGlosses(b.rows),at=glossTokens(ag),bt=glossTokens(bg),shared=at.filter(x=>bt.includes(x)),onlyA=at.filter(x=>!bt.includes(x)),onlyB=bt.filter(x=>!at.includes(x));
 box.append(relationElement('h6','Phân biệt nghĩa và cách dùng'));
 const note=usageFactsData.pairNotes[[w.han,item.han].sort().join('|')];const group=confusableGroups.find(g=>g.category!=='other'&&g.members.some(m=>m.key===wordKey(w))&&g.members.some(m=>m.han===item.han));
 if(note){box.append(relationElement('p','Nghĩa gần nhau: '+note.common),relationElement('p','Khác ở đâu: '+note.difference),relationElement('p','Khi nào dùng: '+note.when));}
 else if(group){box.append(relationElement('p',group.intro));for(const m of group.members.filter(m=>m.key===wordKey(w)||m.han===item.han))box.append(relationElement('p',m.note));box.append(relationElement('p','Lưu ý khi chọn từ: '+group.caution));}
 else{box.append(relationElement('p',shared.length?'Các mục nghĩa có cách dịch trùng nhau: '+shared.slice(0,6).join('; ')+'. Đây là điểm cần đối chiếu trong ngữ cảnh; cách dịch giống nhau chưa chứng minh đổi từ được.':'Hanzii xếp hai từ vào quan hệ gần nghĩa, nhưng các bản dịch không trùng hoàn toàn. Phần dưới đặt từng nghĩa và từ loại cạnh nhau để xác định ý bạn cần diễn đạt.'));}
 appendUsageWord(box,w.han,r?.sourcePin||w.pin,a,w.mean);appendUsageWord(box,item.han,bpin,b,item.mean);
 if(!note&&!group){if(onlyA.length||onlyB.length){box.append(relationElement('h6','Phạm vi nghĩa cần phân biệt'));if(onlyA.length)box.append(relationElement('p','Các cách dịch riêng được ghi nhận cho '+w.han+': '+onlyA.slice(0,8).join('; ')+'.'));if(onlyB.length)box.append(relationElement('p','Các cách dịch riêng được ghi nhận cho '+item.han+': '+onlyB.slice(0,8).join('; ')+'.'));box.append(relationElement('small','“Riêng” ở đây nghĩa là không trùng cách dịch trong hai mục đang đối chiếu; không kết luận từ còn lại tuyệt đối không diễn đạt được ý tương tự.'));}
  const ap=[...new Set(a.rows.flatMap(v=>v.senses.map(s=>usageLabel(s.pos))))],bp=[...new Set(b.rows.flatMap(v=>v.senses.map(s=>usageLabel(s.pos))))];if(ap.length&&bp.length){box.append(relationElement('p',w.han+': '+ap.join(', ')+'. '+item.han+': '+bp.join(', ')+'. '+(ap.some(p=>bp.includes(p))?'Có từ loại giao nhau; vẫn cần chọn đúng nghĩa và cách kết hợp.':'Các mục nguồn ghi nhận vai trò khác nhau. Khi câu cần gọi tên sự vật, miêu tả đặc điểm hoặc nói hành động, hãy chọn đúng vai trò; không giữ nguyên cấu trúc rồi chỉ đổi từ.')));}}
 appendPairExamples(box,w.han,w.pin,shared);appendPairExamples(box,item.han,bpin,shared);
 if(!note&&!group)box.append(relationElement('small','Đã đối chiếu danh sách nghĩa và từ loại. Chưa có nhận định riêng đã kiểm chứng về sắc thái, mức độ hoặc điều kiện thay thế của cặp này; không tự suy ra từ bản dịch.'));
 const links=relationElement('div','','source-links');for(const han of [w.han,item.han]){const link=relationElement('a','Hanzii: '+han);link.href='https://hanzii.net/search/word/'+encodeURIComponent(han)+'?hl=vi';link.target='_blank';link.rel='noopener noreferrer';links.append(link);}box.append(links);return box;
}

const detailedRelationGuides={
 '喜|爱':{
  intro:'Hai chữ chỉ giao nhau ở nghĩa thích/ưa. 喜 còn diễn tả niềm vui, chuyện đáng mừng; 爱 còn diễn tả tình yêu và việc dễ/hay xảy ra. Phải chọn nghĩa trong câu trước khi so sánh.',
  sections:[
   ['喜 (xǐ · Hỉ): vui mừng khi nào?','Ở nghĩa vui, 喜 là cảm xúc trước điều làm mình hài lòng hoặc đáng mừng: nhận tin tốt, đạt kết quả mong muốn, đoàn tụ. Thường gặp trong 喜悦 (niềm vui), 欢喜 (vui mừng), 惊喜 (vui bất ngờ), 喜事 (chuyện vui). Trong lời nói thường ngày, muốn nói “hôm nay tôi rất vui”, dùng 我今天很高兴 / 很开心 tự nhiên hơn việc ghép máy móc 我今天很喜. Đây là xu hướng cách diễn đạt, không phải lệnh cấm 喜 đứng một mình.'],
   ['喜: thích/ưa và những cách dùng khác','喜 cũng có nghĩa thích hoặc ưa, nhưng chữ đơn thường thấy trong cách viết cô đọng, văn viết hoặc cụm quen dùng. 喜光 / 喜阴 nói cây phù hợp hoặc ưa ánh sáng / bóng râm, không phải cây có cảm xúc vui. Trong giao tiếp, muốn nói thích một người, món ăn hay hoạt động, thường dùng 喜欢. 喜事 / 喜酒 liên quan chuyện đáng mừng, thường là cưới hỏi; 有喜 là cách nói có thai. Những nghĩa này không tương đương với 爱.'],
   ['爱 (ài · Ái): yêu khi nào?','Dùng 爱 khi muốn nói tình yêu, sự yêu thương hoặc gắn bó với một đối tượng: người thân, người yêu, quê hương. 爱 không chỉ dùng cho tình yêu nam nữ. 爱 + người có thể bộc lộ tình cảm sâu hoặc sự yêu quý; trong lời tỏ tình, 我爱你 mạnh hơn 我喜欢你. Không có thước đo cố định rằng mọi câu có 爱 đều biểu thị cùng một mức cảm xúc.'],
   ['爱: thích làm gì hoặc dễ/hay xảy ra','爱 + hành động có thể nói sở thích: 爱看书 là thích đọc sách, gần với 喜欢看书 trong ngữ cảnh đó. Nhưng 爱 + hiện tượng cũng có thể nói khuynh hướng: 爱掉色 là dễ phai màu, 爱感冒 là hay bị cảm. Không dịch các câu này thành “thích phai màu” hay “thích bị cảm”. 喜 không tự động thay được vào cách dùng này.'],
   ['Chọn từ theo ý muốn nói','Vui vì một tin tốt → thường dùng 高兴 / 开心, hoặc cụm có 喜 như 惊喜. Thích một món hay hoạt động → thường dùng 喜欢; 爱 cũng dùng được với nhiều sở thích. Yêu thương người thân / tỏ tình → 爱. Nói đặc tính ưa sáng của cây → 喜光. Nói vật dễ hỏng / dễ phai màu → xem nghĩa dễ/hay của 爱.']
  ],
  examples:[
   {cn:'我很爱我的父母。',pin:'Wǒ hěn ài wǒ de fùmǔ.',vi:'Tôi rất yêu bố mẹ mình.',note:'Tình cảm yêu thương gia đình; 爱 không có nghĩa vui ở đây.',origin:'Ví dụ Hanzii'},
   {cn:'收到录取通知后，小林很高兴。',pin:'Shōudào lùqǔ tōngzhī hòu, Xiǎolín hěn gāoxìng.',vi:'Sau khi nhận thông báo trúng tuyển, Tiểu Lâm rất vui.',note:'Vui vì tin tốt: câu giao tiếp dùng 高兴. Có thể nói 这个消息让她感到惊喜 khi nhấn mạnh niềm vui bất ngờ, nhưng sắc thái thay đổi.',origin:'Ví dụ biên soạn; đối chiếu nghĩa và cách dùng'},
   {cn:'我爱看书，也喜欢听音乐。',pin:'Wǒ ài kàn shū, yě xǐhuan tīng yīnyuè.',vi:'Tôi thích đọc sách và cũng thích nghe nhạc.',note:'爱看书 nói sở thích, không cần hiểu thành tình yêu sâu đậm. 喜欢看书 cũng diễn đạt được ý thích đọc trong ngữ cảnh này.',origin:'Ví dụ biên soạn; đối chiếu nghĩa và cách dùng'},
   {cn:'这种植物喜光。',pin:'Zhè zhǒng zhíwù xǐ guāng.',vi:'Loại cây này ưa ánh sáng.',note:'喜光 nói điều kiện sinh trưởng thích hợp; không phải niềm vui của cây. Không thay thành 爱光 để diễn đạt đặc tính này.',origin:'Ví dụ Hanzii; phiên âm trình bày lại'},
   {cn:'这件衣服爱掉色，最好单独洗。',pin:'Zhè jiàn yīfu ài diào sè, zuìhǎo dāndú xǐ.',vi:'Chiếc áo này dễ phai màu, tốt nhất nên giặt riêng.',note:'爱 nghĩa dễ/hay xảy ra; 喜掉色 không mang cùng nghĩa trong câu này.',origin:'Ví dụ biên soạn; đối chiếu nghĩa và cách dùng'},
   {cn:'他们家有喜事，周末要办婚礼。',pin:'Tāmen jiā yǒu xǐshì, zhōumò yào bàn hūnlǐ.',vi:'Nhà họ có chuyện vui, cuối tuần sẽ tổ chức lễ cưới.',note:'喜 trong 喜事 gắn với chuyện đáng mừng. Đây là từ ghép cố định, không đổi thành 爱事.',origin:'Ví dụ biên soạn; đối chiếu nghĩa và cách dùng'}
  ],
  takeaway:'Nhớ theo câu: 喜 có thể là vui, chuyện mừng hoặc thích/ưa; 爱 có thể là yêu thương, thích làm gì hoặc dễ/hay xảy ra. Không đồng nhất 喜 với 喜欢, cũng không đồng nhất mọi nghĩa của 爱 với “yêu”.'
 }
};
function detailedPairExplanation(w,item){
 const guide=detailedRelationGuides[[w.han,item.han].sort().join('|')];if(!guide)return null;
 const box=relationElement('div','','relation-pair-guide');box.append(relationElement('h6','Phân biệt nghĩa và cách dùng'),relationElement('p',guide.intro));
 for(const [heading,body] of guide.sections)box.append(relationElement('h6',heading),relationElement('p',body));
 box.append(relationElement('h6','Tình huống và ví dụ'));
 for(const example of guide.examples){const ex=relationElement('div','','relation-pair-example');ex.append(relationElement('strong',example.cn),pinyinLine(example.pin),relationElement('span',example.vi,'relation-meaning'),relationElement('p',example.note),relationElement('small',example.origin));box.append(ex);}
 box.append(relationElement('p',guide.takeaway));
 const sources=relationElement('div','','source-links');for(const [title,url] of [['Hanzii: 爱','https://hanzii.net/search/word/%E7%88%B1?hl=vi'],['Hanzii: 喜','https://hanzii.net/search/word/%E5%96%9C?hl=vi'],['Đối chiếu thêm: 喜 · Hán Điển','https://zdic.net/hans/%E5%96%9C']]){const a=relationElement('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a);}box.append(sources);return box;
}


