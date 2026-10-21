// Match whole Vietnamese words/phrases; diacritics are optional for search only.
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,' ').trim().replace(/\s+/g,' ');
const exact = s => String(s || '').normalize('NFC').toLocaleLowerCase('vi').trim().replace(/\s+/g,' ');
const phraseIn = (text, phrase) => phrase && (` ${text} `).includes(` ${phrase} `);
const viText = s => String(s || '').normalize('NFC').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const hasAccent = s => /[\u0300-\u036f]/.test(String(s).normalize('NFD')) || /[đĐ]/.test(s);
function typoSimilar(a,b) {
  if(a.length < 5 || b.length < 5 || Math.abs(a.length-b.length)>1) return false;
  let previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++) {
    const row=[i];
    for(let j=1;j<=b.length;j++) row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
    previous=row;
  }
  return previous[b.length]<=1;
}
const randomItem = arr => arr[Math.floor(Math.random()*arr.length)];
function shuffled(arr) { const copy=[...arr]; for(let i=copy.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]];} return copy; }
