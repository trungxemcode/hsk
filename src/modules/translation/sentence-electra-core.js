/* Chinese ELECTRA INT8 detector. The model predicts ERR positions, not replacements. */
(() => {
  'use strict';

  const bytes = 103137607;
  const sha256 = '72a744229e20e7b9b16922aee39e8cd52e08e9e3114bc0203de8d336b9d5634b';
  const han = /^\p{Script=Han}$/u;
  const windowSize = 126; // CLS + SEP fit inside the 128-token inference window.

  async function openPackage(file) {
    if (file?.size !== bytes) throw Error('Gói model phải là HSK ELECTRA INT8 103 MB.');
    const buffer = await file.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)),
      byte => byte.toString(16).padStart(2,'0')).join('');
    if (hash !== sha256) throw Error('Gói model không khớp bản thử nghiệm đã kiểm tra.');
    const header = new DataView(buffer);
    const modelBytes = header.getUint32(8,true), rows = header.getUint32(12,true);
    const width = header.getUint32(16,true), vocabBytes = header.getUint32(20,true);
    const scaleEnd = 24 + rows * 4, embeddingEnd = scaleEnd + rows * width;
    const modelStart = embeddingEnd + vocabBytes;
    if (rows !== 21128 || width !== 768 || modelStart + modelBytes !== buffer.byteLength) throw Error('Gói model lỗi cấu trúc.');
    const vocab = new TextDecoder().decode(new Uint8Array(buffer,embeddingEnd,vocabBytes)).trimEnd().split(/\r?\n/);
    if (vocab.length !== rows) throw Error('Gói model thiếu từ vựng.');
    return {
      width, vocab: new Map(vocab.map((token,id)=>[token,id])),
      scales: new Float32Array(buffer,24,rows).slice(),
      embeddings: new Int8Array(buffer,scaleEnd,rows*width).slice(),
      graph: new Uint8Array(buffer,modelStart,modelBytes)
    };
  }

  function tokenize(text,vocab) {
    const tokens=[];
    for (const match of text.matchAll(/\p{Script=Han}|(?:(?!\p{Script=Han})[\p{L}\p{N}\p{M}])+|[^\s\p{C}]/gu)) {
      const value=match[0], start=match.index;
      // The experiment scores Han characters. Tokenize the surrounding text
      // with the same uncased WordPiece vocabulary to preserve context.
      const normalized=value.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
      const unknown=vocab.get('[UNK]');
      if (han.test(value) || vocab.has(normalized)) {
        tokens.push({id:vocab.get(normalized)??unknown,start,end:start+value.length,han:han.test(value)});
        continue;
      }
      let at=0;
      const pieces=[];
      while (at<normalized.length && normalized.length<=100) {
        let end=normalized.length;
        for (;end>at;end--) {
          const id=vocab.get((at?'##':'')+normalized.slice(at,end));
          if (id!==undefined) { pieces.push(id); break; }
        }
        if (end===at) break;
        at=end;
      }
      for (const id of at===normalized.length&&pieces.length?pieces:[unknown]) {
        tokens.push({id,start,end:start+value.length,han:false});
      }
    }
    return tokens;
  }

  async function detect(text, pack, infer) {
    const tokens=tokenize(text,pack.vocab);
    const candidates=[];
    for(let start=0;start<tokens.length;start+=windowSize-24){
      const end=Math.min(tokens.length,start+windowSize);
      const window=tokens.slice(start,end);
      const ids=[pack.vocab.get('[CLS]'),...window.map(token=>token.id),pack.vocab.get('[SEP]')];
      const input=new Float32Array(ids.length*pack.width);
      ids.forEach((id,index)=>{
        const offset=id*pack.width, target=index*pack.width, scale=pack.scales[id];
        for(let k=0;k<pack.width;k++)input[target+k]=pack.embeddings[offset+k]*scale;
      });
      const logits=await infer(input,ids.length,pack.width);
      const from=start?12:0, until=end<tokens.length?window.length-12:window.length;
      for(let i=from;i<until;i++){
        const token=window[i];
        if(!token.han)continue;
        const position=(i+1)*2;
        const score=1/(1+Math.exp(logits[position]-logits[position+1]));
        if(score<0.9)continue;
        const previous=candidates.at(-1);
        if(previous&&previous.end===token.start){
          previous.end=token.end;
          previous.score=Math.max(previous.score,score);
        }else candidates.push({start:token.start,end:token.end,score});
      }
      if(end===tokens.length)break;
    }
    return candidates.sort((a,b)=>b.score-a.score).slice(0,12).sort((a,b)=>a.start-b.start).map(item=>({
      start:item.start,end:item.end,original:text.slice(item.start,item.end),replacement:'',
      kind:'style',source:'electra',reviewOnly:true,
      reason:'Model đánh dấu chỗ có thể có lỗi. Đọc lại câu hoặc dùng Kiểm tra sâu để lấy phương án sửa.'
    }));
  }

  globalThis.HSKSentenceElectra={bytes,sha256,openPackage,tokenize,detect};
  if(typeof module==='object'&&module.exports)module.exports=globalThis.HSKSentenceElectra;
})();
