"""Compile independently authored long readings and conversations into lessons."""
import json, re
from pathlib import Path
from pypinyin import load_phrases_dict
from content_pinyin import pin

ROOT=Path(__file__).resolve().parents[1]
# Keep vocabulary application separate: importing its module would mutate files.
from pypinyin import lazy_pinyin, Style
load_phrases_dict({'一会儿':[['yī'],['huì'],['r']], '一点儿':[['yī'],['diǎn'],['r']], '哪儿':[['nǎ'],['r']], '这儿':[['zhè'],['r']], '那儿':[['nà'],['r']], '小林':[['Xiǎo'],['Lín']], '大卫':[['Dà'],['wèi']], '小丽':[['Xiǎo'],['Lì']], '小刚':[['Xiǎo'],['Gāng']], '小陈':[['Xiǎo'],['Chén']], '周明':[['Zhōu'],['Míng']], '林静':[['Lín'],['Jìng']], '小周':[['Xiǎo'],['Zhōu']], '小雨':[['Xiǎo'],['Yǔ']], '小王':[['Xiǎo'],['Wáng']], '小李':[['Xiǎo'],['Lǐ']], '小安':[['Xiǎo'],['Ān']], '小林':[['Xiǎo'],['Lín']], '林老师':[['Lín'],['lǎo'],['shī']], '王老师':[['Wáng'],['lǎo'],['shī']], '音乐会':[['yīn'],['yuè'],['huì']], '长时间':[['cháng'],['shí'],['jiān']], '觉得':[['jué'],['de']], '暖和':[['nuǎn'],['huo']], '告诉':[['gào'],['su']], '地方':[['dì'],['fang']], '故事':[['gù'],['shi']], '意思':[['yì'],['si']], '东西':[['dōng'],['xi']], '记得':[['jì'],['de']], '起来':[['qǐ'],['lai']], '看看':[['kàn'],['kan']], '试试':[['shì'],['shi']], '看了看':[['kàn'],['le'],['kàn']], '当作':[['dàng'],['zuò']], '不断':[['bù'],['duàn']], '重新':[['chóng'],['xīn']], '还要':[['hái'],['yào']], '还没':[['hái'],['méi']], '还会':[['hái'],['huì']], '还来':[['hái'],['lái']], '还需要':[['hái'],['xū'],['yào']], '种类':[['zhǒng'],['lèi']], '数量':[['shù'],['liàng']], '数了一下':[['shǔ'],['le'],['yī'],['xià']], '转来':[['zhuǎn'],['lái']], '出差':[['chū'],['chāi']], '角度':[['jiǎo'],['dù']], '给':[['gěi']], '只':[['zhǐ']], '两只':[['liǎng'],['zhī']]})

def line(cn,vi,speaker=None):
    x={'cn':cn,'pin':pin(cn),'vi':vi}
    if speaker:x['speaker']=speaker
    return x

sources=[]
for name in ['long-form-source.json','long-form-intermediate.json','long-form-advanced.json']:
    sources+=json.loads((ROOT/'content'/name).read_text())
assert len(sources)==24 and len({s['id'] for s in sources})==24
levels={n:json.loads((ROOT/f'lesson-content-hsk{n}.json').read_text()) for n in range(1,7)}
report={'date':'2026-10-11','originalReadings':24,'originalDialogues':24,'newComprehensionQuestions':72,'scope':'Four expanded lessons per level, lessons 3, 6, 9 and 12. Other lessons retain their earlier short texts.','entries':[]}
for s in sources:
    n=int(s['id'].split('-')[1]); l=next(x for x in levels[n]['lessons'] if x['id']==s['id'])
    if 'warmupReading' not in l:l['warmupReading']=l['reading']
    l['reading']={'title':s['title'],'kind':'long-form-original','lines':[line(*p) for p in s['paragraphs']]}
    l['reading']['characterCount']=sum(len(re.findall(r'[\u3400-\u9fff]',p[0])) for p in s['paragraphs'])
    dialogue={'title':s['dialogueTitle'],'kind':'long-form-original','lines':[line(cn,vi,sp) for sp,cn,vi in s['dialogue']]}
    l['dialogues']=[dialogue]+[d for d in l['dialogues'] if d.get('kind')!='long-form-original']
    questions=[]
    for i,(prompt,options,answer,explanation) in enumerate(s['questions'],1):
        questions.append({'id':f'long-reading-20261011-{i}','prompt':prompt,'options':options,'answer':answer,'explanation':explanation,'source':'reading','contentRevision':'2026-10-11'})
    l['practice']=[q for q in l['practice'] if not q['id'].startswith('long-reading-20261011-')]+questions
    l['reading']['task']='Đọc toàn bài trước, xác định diễn biến/lập luận, rồi trả lời ba câu hỏi đọc hiểu mới ở phần Luyện tập.'
    l['provenance']['longForm']={'kind':'original','date':'2026-10-11','label':'Bài đọc dài và hội thoại nhiều lượt được biên soạn riêng cho app, không sao chép bài khóa hoặc nội dung từ điển. Pinyin được tạo bằng pypinyin với bảng đọc theo ngữ cảnh, cần tiếp tục rà soát biên tập.'}
    report['entries'].append({'id':s['id'],'hsk':n,'readingCharacters':l['reading']['characterCount'],'paragraphs':len(s['paragraphs']),'dialogueTurns':len(s['dialogue']),'comprehensionQuestions':len(questions)})
for n,d in levels.items():(ROOT/f'lesson-content-hsk{n}.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
(ROOT/'content/reading-expansion-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for n in range(1,7):
    xs=[x for x in report['entries'] if x['hsk']==n]
    print(f"HSK {n}: 4 readings, {min(x['readingCharacters'] for x in xs)}–{max(x['readingCharacters'] for x in xs)} Han characters, 4 eight-turn dialogues")
