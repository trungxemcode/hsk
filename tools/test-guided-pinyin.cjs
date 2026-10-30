const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../src/modules/lessons/lesson-guided-core.js');
test('display pinyin separates syllables while preserving original pronunciation and punctuation',()=>{
 for(const [input,expected,han]of [['duìbuqǐ','duì bu qǐ','对不起'],['běifāng','běi fāng','北方'],['xīān','xī ān','西安'],['xian','xi an','西安'],['wǒmen dōu shì tóngxué.','wǒ men dōu shì tóng xué.',''],['nǐ hǎo','nǐ hǎo','你好'],['ni3hao3','ni3 hao3','你好'],["Xi'an","Xi an",''],['lǜsè','lǜ sè','绿色'],['','', '']])assert.equal(core.formatPinyin(input,han),expected,input);
});
test('formatting does not mutate presentation input or speech text',()=>{
 const word={han:'对不起',pin:'duìbuqǐ',mean:'xin lỗi'},before=JSON.stringify(word),frames=core.presentation({},[word]);core.formatPinyin(frames[0].pin,frames[0].text);assert.equal(JSON.stringify(word),before);assert.equal(frames[0].pin,'duìbuqǐ');assert.equal(frames[0].speak,'对不起');
});
