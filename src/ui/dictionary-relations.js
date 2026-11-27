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
  const patterns=[...new Set(v.structures||[])];if(patterns.length){box.append(relationElement('strong','Cấu trúc câu thường gặp'));for(const pattern of patterns.slice(0,3))box.append(relationElement('p',pattern));}
 }
 const positions=[...new Set(variant.rows.flatMap(v=>v.senses.map(s=>usageLabel(s.pos))))];
 let guide=[];if(positions.includes('Danh từ'))guide.push('Ở nghĩa danh từ, xem từ đang gọi tên người, vật, sự việc hay khái niệm nào; đối chiếu đối tượng với nghĩa bạn muốn nói.');if(positions.includes('Động từ'))guide.push('Ở nghĩa động từ, xem hành động/trạng thái được nói đến và từ đi cùng phía sau. Cùng dịch gần nhau không bảo đảm mang cùng tân ngữ.');if(positions.includes('Tính từ'))guide.push('Ở nghĩa tính từ, xem đặc điểm đang được đánh giá là gì; kiểm tra cách kết hợp trong câu thay vì chỉ đổi một tính từ có bản dịch giống nhau.');if(positions.includes('Phó từ'))guide.push('Ở nghĩa phó từ, xem từ bổ nghĩa cho hành động hay mức độ, thời gian hoặc tần suất. Vị trí trong câu là một phần của cách dùng.');if(guide.length)box.append(relationElement('p',guide.join(' ')));
}
function pairExamplePool(han,pin){if(!usageWordMap.size){for(const w of words){const xs=usageWordMap.get(w.han)||[];xs.push(w);usageWordMap.set(w.han,xs);}}const ws=usageWordMap.get(han)||[];const exact=ws.filter(w=>usageReading(w.pin)===usageReading(pin));return (exact.length?exact:pin?[]:ws).flatMap(w=>w.practice?.examples||[]).filter(e=>e.cn?.includes(han)&&e.pin&&e.vi);}
function appendPairExamples(box,han,pin,shared){
 const examples=pairExamplePool(han,pin);box.append(relationElement('h6','Ngữ cảnh dùng '+han));
 if(!examples.length){box.append(relationElement('p','Chưa bổ sung câu ví dụ có phiên âm và bản dịch riêng cho '+han+' trong bộ dữ liệu hiện tại. Xem các nghĩa và cấu trúc phía trên để nắm cách dùng.','hint'));return;}
 const scored=examples.map((e,i)=>({e,i,score:glossTokens([e.meaning||e.sense||'']).some(t=>shared.includes(t))?1:0})).sort((a,b)=>b.score-a.score||a.i-b.i);const chosen=[],seen=new Set();for(const {e} of scored){const sense=e.meaning||e.sense||'';if(!seen.has(sense)){chosen.push(e);seen.add(sense);}if(chosen.length===2)break;}if(chosen.length<2)for(const {e} of scored){if(!chosen.includes(e))chosen.push(e);if(chosen.length===2)break;}
 for(const e of chosen){const ex=relationElement('div','','relation-pair-example');ex.append(relationElement('strong',e.cn),pinyinLine(e.pin),relationElement('span',e.vi,'relation-meaning'),relationElement('p','Trong câu này, '+han+' được dùng theo nghĩa: '+(e.meaning||e.sense||'xem bản dịch và nghĩa ở trên')+'. Giữ đúng ý này trước khi cân nhắc dùng từ gần nghĩa.'));const origin=e.origin==='authored'?'Ví dụ tự biên soạn của app':'Ví dụ trong bộ học HSK';ex.append(relationElement('small',origin));box.append(ex);}
}
function allPairExplanation(w,item){
 const detailed=detailedPairExplanation(w,item);if(detailed)return detailed;
 const box=relationElement('div','','relation-pair-guide'),r=wordRelationsData.entries[wordKey(w)];const a=usageVariant(w.han,r?.sourcePin||w.pin);const known=item.key&&relationIndex().get(item.key);const bpin=known?.pin||((wordRelationsData.lexicon[item.han]||[]).length===1?wordRelationsData.lexicon[item.han][0].pinyin:'');const b=usageVariant(item.han,bpin);
 const ag=usageGlosses(a.rows),bg=usageGlosses(b.rows),at=glossTokens(ag),bt=glossTokens(bg),shared=at.filter(x=>bt.includes(x)),onlyA=at.filter(x=>!bt.includes(x)),onlyB=bt.filter(x=>!at.includes(x));
 box.append(relationElement('h6','Phân biệt nghĩa và cách dùng'));
 const note=usageFactsData.pairNotes[[w.han,item.han].sort().join('|')];const group=confusableGroups.find(g=>g.category!=='other'&&g.members.some(m=>m.key===wordKey(w))&&g.members.some(m=>m.han===item.han));
 if(note){box.append(relationElement('p','Nghĩa gần nhau: '+note.common),relationElement('p','Khác ở đâu: '+note.difference),relationElement('p','Khi nào dùng: '+note.when));}
 else if(group){box.append(relationElement('p',group.intro));for(const m of group.members.filter(m=>m.key===wordKey(w)||m.han===item.han))box.append(relationElement('p',m.note));box.append(relationElement('p','Lưu ý khi chọn từ: '+group.caution));}
 else{box.append(relationElement('p',shared.length?'Các mục nghĩa có cách dịch trùng nhau: '+shared.slice(0,6).join('; ')+'. Đây là điểm cần đối chiếu trong ngữ cảnh; cách dịch giống nhau chưa chứng minh đổi từ được.':'Hai từ có liên hệ gần nghĩa trong hệ thống từ vựng, nhưng các bản dịch không trùng hoàn toàn. Phần dưới đặt từng nghĩa và từ loại cạnh nhau để xác định ý bạn cần diễn đạt.'));}
 appendUsageWord(box,w.han,r?.sourcePin||w.pin,a,w.mean);appendUsageWord(box,item.han,bpin,b,item.mean);
 if(!note&&!group){if(onlyA.length||onlyB.length){box.append(relationElement('h6','Phạm vi nghĩa cần phân biệt'));if(onlyA.length)box.append(relationElement('p','Các cách dịch riêng được ghi nhận cho '+w.han+': '+onlyA.slice(0,8).join('; ')+'.'));if(onlyB.length)box.append(relationElement('p','Các cách dịch riêng được ghi nhận cho '+item.han+': '+onlyB.slice(0,8).join('; ')+'.'));box.append(relationElement('small','“Riêng” ở đây nghĩa là không trùng cách dịch trong hai mục đang đối chiếu; không kết luận từ còn lại tuyệt đối không diễn đạt được ý tương tự.'));}
  const ap=[...new Set(a.rows.flatMap(v=>v.senses.map(s=>usageLabel(s.pos))))],bp=[...new Set(b.rows.flatMap(v=>v.senses.map(s=>usageLabel(s.pos))))];if(ap.length&&bp.length){box.append(relationElement('p',w.han+': '+ap.join(', ')+'. '+item.han+': '+bp.join(', ')+'. '+(ap.some(p=>bp.includes(p))?'Có từ loại giao nhau; vẫn cần chọn đúng nghĩa và cách kết hợp.':'Hai từ đảm nhận vai trò từ loại khác nhau. Khi câu cần gọi tên sự vật, miêu tả đặc điểm hoặc nói hành động, hãy chọn đúng vai trò; không giữ nguyên cấu trúc rồi chỉ đổi từ.')));}}
 appendPairExamples(box,w.han,w.pin,shared);appendPairExamples(box,item.han,bpin,shared);
 if(!note&&!group)box.append(relationElement('small','Đã tổng hợp danh sách nghĩa và từ loại trong kho từ vựng của app. Hãy dựa vào câu ví dụ và ngữ cảnh thực tế thay vì đổi từ máy móc theo bản dịch ngắn.'));
 return box;
}

const detailedRelationGuides={
 '喜|爱':{
  intro:'Điểm chung duy nhất giữa 喜 và 爱 nằm ở nét nghĩa “thích / ưa”. Ngoài phần giao đó, 喜 nghiêng về niềm vui và chuyện đáng mừng, còn 爱 gắn với tình yêu sâu sắc và khuynh hướng “dễ / hay xảy ra”.',
  sections:[
   ['喜 (xǐ · Hỉ) trong ngữ cảnh vui mừng','Ở nghĩa gốc chỉ cảm xúc vui, 喜 thường xuất hiện trong các từ ghép hai chữ như 喜悦 (niềm hân hoan), 惊喜 (bất ngờ thú vị), 喜事 (chuyện cưới hỏi, chuyện mừng). Trong hội thoại đời thường, người bản xứ dùng 很高兴 hoặc 很开心 để nói “rất vui”, hiếm khi nói lẻ 很喜.'],
   ['喜 với nét nghĩa ưa thích hoặc chuyện mừng','Khi mang nghĩa “ưa / thích hợp”, 喜 hay gặp ở cách diễn đạt súc tích kiểu văn viết hoặc thuật ngữ sinh học (như 喜光 – ưa sáng, 喜湿 – ưa ẩm). Ngoài ra cụm 有喜 còn dùng uyển ngữ chỉ việc mang thai; những sắc thái này hoàn toàn tách biệt với 爱.'],
   ['爱 (ài · Ái) khi diễn tả tình cảm sâu','爱 biểu đạt sự yêu thương bền chặt dành cho gia đình, người yêu, quê hương hoặc lý tưởng. So với 喜欢, dùng 爱 hướng tới người thường mang sắc thái gắn bó và trang trọng hơn, ví dụ trong lời bày tỏ tình cảm hay tri ân người thân.'],
   ['爱 + động từ: sở thích hoặc khuynh hướng dễ xảy ra','Khi đứng trước động từ chỉ hoạt động (như 爱喝茶, 爱运动), 爱 mang nghĩa thích làm việc gì, khá gần 喜欢. Nhưng khi đứng trước hiện tượng tự nhiên hay trạng thái ngoài ý muốn (như 爱生锈 – dễ gỉ, 爱下雨 – hay mưa), 爱 biểu thị tần suất/đặc tính dễ xảy ra; tuyệt đối không thay bằng 喜.'],
   ['Tóm tắt cách chọn nhanh','Bày tỏ tình yêu thương người thân → chọn 爱. Diễn tả cảm giác vui trong đời sống → dùng 高兴 / 开心 hoặc từ ghép có 喜 (惊喜). Nói đặc tính ưa sáng/ưa ẩm của cây trồng → dùng 喜光 / 喜湿. Nói đồ vật dễ hỏng, thời tiết hay mưa → dùng 爱 + động từ.']
  ],
  examples:[
   {cn:'无论搬到哪座城市，他始终深爱着家乡。',pin:'Wúlùn bān dào nǎ zuò chéngshì, tā shǐzhōng shēn ài zhe jiāxiāng.',vi:'Dù chuyển tới thành phố nào, anh ấy vẫn luôn yêu sâu sắc quê hương mình.',note:'爱 biểu thị tình cảm gắn bó bền lâu; không mang nghĩa “vui mừng” như 喜.',origin:'Ví dụ tự biên soạn của app'},
   {cn:'听到比赛拿了一等奖，全队都高兴极了。',pin:'Tīngdào bǐsài ná le yīděngjiǎng, quánduì dōu gāoxìng jí le.',vi:'Nghe tin đội giành giải Nhất cuộc thi, cả đội mừng khôn xiết.',note:'Trong khẩu ngữ diễn tả niềm vui, 高兴 tự nhiên hơn 喜 đứng đơn; nếu nhấn mạnh niềm vui bất ngờ có thể dùng từ ghép 惊喜.',origin:'Ví dụ tự biên soạn của app'},
   {cn:'爷爷晚饭后爱下棋，奶奶喜欢听戏。',pin:'Yéye wǎnfàn hòu ài xiàqí, nǎinai xǐhuan tīng xì.',vi:'Ông thích đánh cờ sau bữa tối, còn bà thích nghe kịch cổ.',note:'爱 + động từ hoạt động (下棋) chỉ thói quen yêu thích, tương đương 喜欢 trong ngữ cảnh sở thích.',origin:'Ví dụ tự biên soạn của app'},
   {cn:'多肉植物大多喜阳，放在阳台最合适。',pin:'Duōròu zhíwù dàduō xǐ yáng, fàng zài yángtái zuì héshì.',vi:'Cây sen đá đa phần ưa nắng, đặt ngoài ban công là hợp nhất.',note:'喜阳 mô tả đặc tính sinh trưởng ưa ánh nắng, hoàn toàn không thay bằng 爱阳.',origin:'Ví dụ tự biên soạn của app'},
   {cn:'潮湿季节里，铁锅特别爱生锈。',pin:'Cháoshī jìjié lǐ, tiěguō tèbié ài shēngxiù.',vi:'Vào mùa nồm ẩm, chảo gang đặc biệt dễ bị gỉ.',note:'爱 đi với 生锈 diễn tả đặc tính dễ xảy ra; không dịch là “thích gỉ” và không đổi sang 喜.',origin:'Ví dụ tự biên soạn của app'},
   {cn:'表哥家这个月有喜事，打算请大家吃饭。',pin:'Biǎogē jiā zhège yuè yǒu xǐshì, dǎsuàn qǐng dàjiā chīfàn.',vi:'Nhà anh họ tháng này có tin vui, định mời mọi người dùng bữa.',note:'喜事 là từ ghép cố định chỉ chuyện đáng mừng (thường là cưới hỏi), không thay thế bằng 爱.',origin:'Ví dụ tự biên soạn của app'}
  ],
  takeaway:'Ghi nhớ theo ngữ cảnh: 喜 gắn với chuyện mừng, niềm vui trong từ ghép và đặc tính ưa sáng/ẩm trong văn viết; 爱 gắn với tình yêu thương, sở thích thói quen và khuynh hướng “hay/dễ xảy ra”.'
 }
};
function detailedPairExplanation(w,item){
 const guide=detailedRelationGuides[[w.han,item.han].sort().join('|')];if(!guide)return null;
 const box=relationElement('div','','relation-pair-guide');box.append(relationElement('h6','Phân biệt nghĩa và cách dùng'),relationElement('p',guide.intro));
 for(const [heading,body] of guide.sections)box.append(relationElement('h6',heading),relationElement('p',body));
 box.append(relationElement('h6','Tình huống và ví dụ'));
 for(const example of guide.examples){const ex=relationElement('div','','relation-pair-example');ex.append(relationElement('strong',example.cn),pinyinLine(example.pin),relationElement('span',example.vi,'relation-meaning'),relationElement('p',example.note),relationElement('small',example.origin));box.append(ex);}
 box.append(relationElement('p',guide.takeaway));
 return box;
}
