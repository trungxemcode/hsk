/* Pure regressions for HSK comparison triples and real sentence tile generation. */
const assert=require('node:assert/strict'),C=require('../practice-games-core.js');
const source=[
 {han:'中国',pin:'Zhōngguó',mean:'Trung Quốc',hsk:3,practice:{examples:[{cn:'我喜欢学习汉语。',pin:'Wǒ xǐhuan xuéxí Hànyǔ.',vi:'Tôi thích học tiếng Trung.'},{cn:'他的位置很高。',pin:'Tā de dìwèi hěn gāo.',vi:'Địa vị của anh ấy rất cao.'}]}},
 {han:'今天',pin:'jīntiān',mean:'hôm nay',hsk:3,practice:{examples:[{cn:'今天天气很好。',pin:'Jīntiān tiānqì hěn hǎo.',vi:'Hôm nay thời tiết rất tốt.'}]}},
 {han:'朋友',pin:'péngyou',mean:'bạn bè',hsk:3,practice:{examples:[{cn:'他是我的好朋友。',pin:'Tā shì wǒ de hǎo péngyou.',vi:'Anh ấy là bạn tốt của tôi.'}]}},
 {han:'同学',pin:'tóngxué',mean:'bạn cùng lớp',hsk:3},
 {han:'女儿',pin:'nǚér',mean:'con gái',hsk:3},
 {han:'水果',pin:'shuǐguǒ',mean:'trái cây',hsk:2},
 {han:'中华人民共和国',pin:'Zhōngguó',mean:'nước Trung Quốc',hsk:3},
 {han:'好友',pin:'hǎoyǒu',mean:'bạn bè',hsk:3}
];
const rng=()=>.37;
const triples=C.triples(source,3,10,rng);
assert.equal(triples.length,5);
assert.equal(new Set(triples.map(x=>x.pin.toLowerCase())).size,triples.length);
assert.equal(new Set(triples.map(x=>x.mean.toLowerCase())).size,triples.length);
assert.equal(C.gradeTriplet(triples,[triples[0].id,triples[0].id,triples[0].id]),true);
assert.equal(C.gradeTriplet(triples,[triples[0].id,triples[1].id,triples[0].id]),false);
const questions=C.sentences(source,3,10,rng);
assert.ok(questions.length>=3,'needs curated examples from existing HSK data');
for(const q of questions){
 const ids=q.tokens.map((_,i)=>i);
 assert.equal(C.gradeSentence(q,ids),true);
 assert.equal(q.answer,q.tokens.join(''));
 const wrong=ids.slice();[wrong[0],wrong[1]]=[wrong[1],wrong[0]];
 if(q.tokens[0]!==q.tokens[1])assert.equal(C.gradeSentence(q,wrong),false);
 assert.equal(C.gradeSentence(q,ids.concat([0])),false);
 assert.ok(q.pin&&q.vi);
}
assert.deepEqual(C.sentences(source,1,10,rng),[]);
console.log('PASS core: unique Hán/pinyin/mean triplets, HSK scope, verified sentence tokens, duplicate-safe grading');
