"""Apply the editorial vocabulary batch without changing existing learning keys.

The level is the first textbook level using the entry, not an official exam-list
classification. Hanzii checks concern lexical readings/senses, not our examples.
"""
import csv, gzip, json, subprocess
from pathlib import Path
from urllib.parse import quote
from pypinyin import lazy_pinyin, Style, load_phrases_dict
from content_pinyin import pin

ROOT = Path(__file__).resolve().parents[1]
load_phrases_dict({'一会儿': [['yī'], ['huì'], ['r']], '一点儿': [['yī'], ['diǎn'], ['r']], '玩儿': [['wán'], ['r']], '哪儿': [['nǎ'], ['r']], '这儿': [['zhè'], ['r']], '那儿': [['nà'], ['r']], '音乐': [['yīn'], ['yuè']], '长时间': [['cháng'], ['shí'], ['jiān']], '增长': [['zēng'], ['zhǎng']], '请假': [['qǐng'], ['jià']], '起来': [['qǐ'], ['lai']], '觉得': [['jué'], ['de']], '暖和': [['nuǎn'], ['huo']]})

def jsdata(name):
    text=(ROOT/('content/data/'+name+'.js')).read_text()
    return json.loads(text.split('=',1)[1].strip().rstrip(';'))

def writejs(name, data):
    raw=('const '+name+'='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n').encode()
    (ROOT/('content/data/'+name+'.js')).write_bytes(raw)
    (ROOT/('content/data/'+name+'.js.gz')).write_bytes(gzip.compress(raw,mtime=0))

rows=list(csv.DictReader((ROOT/'content/vocabulary-expansion.tsv').open(),delimiter='\t'))
names=[('李月','Lǐ Yuè','Lý Nguyệt',1),('王方','Wáng Fāng','Vương Phương',1),('谢朋','Xiè Péng','Tạ Bằng',1),('大卫','Dàwèi','David (Đại Vệ)',1),('花花','Huāhua','Hoa Hoa (tên gọi)',2),('杨笑笑','Yáng Xiàoxiao','Dương Tiếu Tiếu',2)]
for han,pinyin,meaning,level in names:
    rows.append(dict(han=han,pin=pinyin,mean=meaning,hv=meaning,level=str(level),kind='proper-name',cn1=f'他叫{han}。',vi1=f'Anh ấy tên là {meaning}.',cn2=f'{han}是我的朋友。',vi2=f'{meaning} là bạn tôi.',cn3=f'我和{han}一起看书。',vi3=f'Tôi đọc sách cùng {meaning}.'))
rows.append(dict(han='太……了',pin='tài … le',mean='quá ...; ... quá rồi (nhấn mạnh mức độ)',hv='Thái … liễu',level='1',kind='grammar-pattern',cn1='今天太热了。',vi1='Hôm nay nóng quá.',cn2='这个杯子太大了。',vi2='Cốc này to quá.',cn3='这本书太好了。',vi3='Quyển sách này hay quá.'))
words=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('content/data/words.js','utf8').split('\\n// Course vocabulary expansion · 2026-10-11\\n')[0]+';globalThis.result=words',c);process.stdout.write(JSON.stringify(c.result));"],cwd=ROOT))
existing={w['han'] for w in words}
supp=jsdata('dictionarySupplement'); examples=jsdata('checkedPracticeExamples')
added=[]
for row in rows:
    if row['han'] in existing:
        continue
    w={k:row[k] for k in ['han','pin','mean','hv']}
    w.update(hsk=row['level'],exCn=row['cn1'],exVi=row['vi1'],courseSupplement=True,entryKind=row.get('kind','vocabulary'))
    key=f"{w['hsk']}|{w['han']}|{w['pin']}"
    checked=row.get('kind') is None
    url='https://hanzii.net/search/word/'+quote(row['han'],safe='')+'?hl=vi'
    w['vocabularyProvenance']={'kind':'hanzii-lexical-check' if checked else row['kind'],'checkedAt':'2026-10-11','label':'Phiên âm và nghĩa đối chiếu Hanzii; ví dụ tự biên soạn.' if checked else 'Tên riêng/mẫu ngữ pháp trong danh sách giáo trình; ví dụ tự biên soạn, chưa đối chiếu mục từ Hanzii.'}
    if checked:
        w['vocabularyProvenance']['url']=url
        supp['entries'][key]={'meanings':[],'url':url,'checkedAt':'2026-10-11','lexicalOnly':True}
    authored=[{'cn':row['cn'+str(i)],'vi':row['vi'+str(i)],'pin':pin(row['cn'+str(i)]),'meaning':row['mean'],'sense':row['mean'],'origin':'authored'} for i in range(1,4)]
    for e in authored:
        for name,pinyin,_,_ in names:
            e['pin']=e['pin'].replace(pin(name),pinyin)
    examples['entries'][key]={'examples':authored,'meanings':[],'checkedAgainst':url if checked else None,'lexicalOnly':checked,'sourceKind':'hanzii' if checked else row['kind']}
    words.append(w);added.append(w);existing.add(w['han'])
supp['report'].update(total=len(words),lookedUp=len(supp['entries']),matched=len(supp['entries']),notMatched=len(words)-len(supp['entries']),date='2026-10-11',addedCourseWords=len(added))
examples['report'].update(covered=len(examples['entries']),total=len(words),sentences=sum(len(x['examples']) for x in examples['entries'].values()),authored=sum(e['origin']=='authored' for x in examples['entries'].values() for e in x['examples']))
for level in range(1,7):
    ws=[w for w in words if int(w['hsk'])==level]
    examples['report']['levels'][str(level)]={'covered':len(ws),'sentences':sum(len(examples['entries'][f"{w['hsk']}|{w['han']}|{w['pin']}"]['examples']) for w in ws)}
# Preserve all old entries verbatim, append only the editorial batch to the array.
raw=(ROOT/'content/data/words.js').read_text();marker='\n// Course vocabulary expansion · 2026-10-11\n'
raw=raw.split(marker)[0].rstrip()+'\n'
raw+=marker+'words.push(...'+json.dumps(added,ensure_ascii=False,separators=(',',':'))+');\n'
(ROOT/'content/data/words.js').write_text(raw)
(ROOT/'content/data/words.js.gz').write_bytes(gzip.compress(raw.encode(),mtime=0))
writejs('dictionarySupplement',supp);writejs('checkedPracticeExamples',examples)
report={'date':'2026-10-11','added':len(added),'hanziiLexicalChecks':sum(w['entryKind']=='vocabulary' for w in added),'properNames':len(names),'grammarPatterns':1,'examples':len(added)*3,'levelMeaning':'First textbook level using a word; not official HSK exam classification.','remainingScope':'This batch closes HSK1–2 catalogue gaps and adds selected HSK3–6 vocabulary. Other higher-level gaps remain.','entries':[{k:w[k] for k in ['han','pin','hsk','entryKind','vocabularyProvenance']} for w in added]}
(ROOT/'content/vocabulary-expansion-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f"Added {len(added)} entries, {len(added)*3} authored examples; {report['hanziiLexicalChecks']} Hanzii lexical checks")
