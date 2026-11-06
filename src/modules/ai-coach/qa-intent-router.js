/* Lightweight intent routing for the AI Q&A tutor. No user text leaves the device here. */
(function(root){'use strict';
 const INTENTS=Object.freeze({MEANING_USAGE:'meaning_usage',WORD_COMPARISON:'word_comparison',FUZZY_RECALL:'fuzzy_recall',RE_EXPLAIN:'re_explain',PROGRESS_ADVICE:'progress_advice'});
 const result=(intent,shouldOfferMicroCheck,directiveVi)=>({intent,shouldOfferMicroCheck,directiveVi});
 function classifyUserQaIntent(text='',explicitAction=null){
  const clean=String(text||'').trim(),lower=clean.toLowerCase();
  if(explicitAction==='not_understood'||explicitAction==='another_example')return result(INTENTS.RE_EXPLAIN,true,'Người học chưa nắm cách giải thích trước. Hãy đổi góc tiếp cận bằng tình huống hoặc cặp câu đúng/sai tối giản, không lặp nguyên văn.');
  if(/(từ gì|chữ gì|đọc giống|phát âm giống|nghe giống|mang máng|quên mất chữ|nghĩa gần giống)/i.test(lower))return result(INTENTS.FUZZY_RECALL,false,'Người học nhớ âm hoặc nghĩa chưa rõ. Đưa 2–3 ứng viên gần nhất kèm chữ Hán, pinyin và nghĩa cốt lõi rồi hỏi xác nhận trước khi dạy sâu.');
  if(/(chưa hiểu|khó hiểu|giải thích lại|nói rõ hơn|vẫn rối|sao lại thế|ví dụ khác)/i.test(lower))return result(INTENTS.RE_EXPLAIN,true,'Đổi sang cách giải thích trực quan hơn, ưu tiên cặp câu đúng/sai và không lặp câu chữ cũ.');
  if(/(lộ trình|học gì tiếp|đánh giá giúp|điểm yếu|tôi đang yếu|nên ôn gì|trình độ của tôi|tiến bộ)/i.test(lower))return result(INTENTS.PROGRESS_ADVICE,false,'Chỉ nhận xét từ bằng chứng học tập trong hồ sơ, nêu giới hạn dữ liệu khi cần và không phán đoán từ một lỗi đơn lẻ.');
  if(/(khác gì|khác nhau|phân biệt|so sánh|hay là dùng|sao câu này dùng|tại sao dùng|dùng .* hay .*)/i.test(lower))return result(INTENTS.WORD_COMPARISON,true,'Nêu ngay khác biệt quyết định nhất kèm một cặp câu đối chiếu ngắn; chỉ tạo một câu kiểm tra nếu nó giúp phân biệt điểm đang hỏi.');
  return result(INTENTS.MEANING_USAGE,false,'Trả lời trực tiếp, ngắn gọn, có ví dụ phù hợp cấp độ HSK; không biến câu tra nhanh thành bài kiểm tra.');
 }
 root.HSKQaIntentRouter={QA_INTENTS:INTENTS,classifyUserQaIntent};
})(typeof window==='object'?window:globalThis);
