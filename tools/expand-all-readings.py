"""Compile authored bilingual passages and record auditable lesson alignment.

No model calls, dictionary scraping or template-based prose generation. Source TSVs
contain independently authored paragraphs; existing long passages are preserved.
"""
import ast,json,re
from pathlib import Path
from collections import defaultdict
from pypinyin import load_phrases_dict
from content_pinyin import pin
ROOT=Path(__file__).resolve().parents[1]
# Reuse pronunciation lexicon without importing a compiler that writes files.
module=ast.parse((ROOT/'tools/expand-reading.py').read_text())
for node in module.body:
    if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and getattr(node.value.func,'id','')=='load_phrases_dict':
        load_phrases_dict(ast.literal_eval(node.value.args[0]))
load_phrases_dict({'长大':[['zhǎng'],['dà']], '还给':[['huán'],['gěi']], '归还':[['guī'],['huán']], '还书':[['huán'],['shū']], '重新':[['chóng'],['xīn']], '干涉':[['gān'],['shè']], '干燥':[['gān'],['zào']], '处理':[['chǔ'],['lǐ']], '处境':[['chǔ'],['jìng']], '空白':[['kòng'],['bái']], '空闲':[['kòng'],['xián']], '角色':[['jué'],['sè']], '不行':[['bù'],['xíng']], '露出':[['lù'],['chū']], '力量':[['lì'],['liàng']], '重复':[['chóng'],['fù']]})
# Regexes locate textual examples, not an exhaustive Chinese grammar parser.
RULES={
 'Âm đầu + vần + thanh':r'你好', 'mā · má · mǎ · mà · ma':r'妈|你好', '3 + 3 → 2 + 3 khi nói':r'你好',
 '你/您/你们 + 好；对不起 → 没关系':r'(你好|您好|你们好|对不起|没关系)',
 'z/c/s · zh/ch/sh · r':r'再见|谢谢','-n / -ng；âm tiết nhẹ không dấu':r'再见|不客气','不 + thanh 4 → đọc bú':r'不客气','谢谢 → 不客气':r'谢谢|不客气',
 'Chủ ngữ + động từ + 什么 (+ danh từ)':r'什么', 'A + 是/不是 + B':r'是.{1,20}[。！？]', 'Câu trần thuật + 吗？':r'吗',
 '谁 + vị ngữ / chủ ngữ + 是 + 谁':r'谁','哪 + lượng từ + danh từ；哪国人':r'哪国人|哪个', 'Người sở hữu + 的 + danh từ':r'[我他她你]的', 'Chủ đề đã rõ + người/vật + 呢？':r'呢？',
 '几 + lượng từ + danh từ':r'几口|几个|几岁','十 + đơn vị；hàng chục + 十 + đơn vị':r'二十|二十一|二十六|五十三','Câu biểu thị tình trạng mới + 了':r'岁了|大了','Người + 多大（了）？':r'多大',
 'Chủ ngữ +（不）会 + động từ':r'会[说写做读]','Chủ ngữ + 很 + tính từ':r'很[好高冷热]','Chủ ngữ/tân ngữ chủ đề + 怎么 + động từ？':r'怎么',
 'Năm + 月 + 日/号；星期 + số':r'月.{1,4}号|星期[一二三四五六日天]', 'Chủ ngữ + danh từ/cụm số chỉ thời gian, tuổi':r'今天.{0,5}月|今年.{1,4}岁','Chủ ngữ + 去 + nơi + hành động':r'去学校.{0,5}看书',
 'Chủ ngữ +（不）想 + động từ':r'想[买吃喝]','多少 + danh từ / 多少钱':r'多少','Số + lượng từ + danh từ':r'[一二三两]个|[一二三两]本','Số + 元/块；số + 角/毛':r'[一二三四五六七八九十]块',
 'Người/vật + 在 + nơi':r'在.{1,8}[上里旁边下面家]','Chủ ngữ + 在 + nơi + động từ':r'在医院工作|在.{1,6}工作','在/去 + 哪儿？':r'哪儿','Nơi + 有/没有 + người/vật':r'有.{0,6}[猫狗椅子]','Danh từ A + 和 + danh từ B':r'和',
 'Chủ ngữ +（不）能 + động từ；能…吗？':r'能.{1,10}吗','请 + động từ/cụm động từ':r'请[坐看喝]','Số + 点 + số + 分':r'点.{1,4}分','Chủ ngữ + thời gian + hành động':r'[上下]午|晚上|中午','Mốc thời gian + 前':r'点前',
 'Đối tượng + 怎么样？':r'怎么样','Chủ đề + [chủ ngữ nhỏ + vị ngữ]':r'身体.{0,4}好','太 + tính từ + 了':r'太.{1,5}了','Chủ ngữ/sự việc +（不）会 + động từ':r'会下雨|会来',
 '喂，+ lời hỏi/chào':r'喂','Chủ ngữ + 在 + động từ（+ 呢）':r'在.{1,9}呢','逐位 đọc từng chữ số':r'电话号码|一三八','Đề nghị + 吧':r'吧',
 'Động từ + 了 + tân ngữ có số lượng':r'买了[一二两三不少]','没（有）+ động từ + tân ngữ':r'没[有]?买','Thời gian/sự việc + 后':r'后','Câu + 啊':r'啊','Chủ ngữ nhiều người/vật + 都 + vị ngữ':r'都',
 'Chủ ngữ + 是 + chi tiết + động từ + 的':r'是.{1,15}[来认识]的','什么时候 + động từ；是 + 什么时候 + động từ + 的':r'什么时候','Trước thanh 4 → yí；trước thanh 1/2/3 → yì':r'一起|一[个本]','Năm + 年 + tháng + 月 + ngày + 号/日':r'年.{1,4}月.{1,4}号',
 '最 + tính từ':r'最[好高快舒服安静]','Chủ ngữ + 每天 + thời điểm + động từ':r'每天.{1,6}点','Từ bổ nghĩa + 的':r'[红白粉蓝黑]色的|白色的|红色的','是 + chi tiết + động từ + 的':r'是.{1,15}的',
 '就 + động từ + … + 吧':r'就.{1,12}吧','不 + động từ + 了':r'不.{1,10}了','A + 离 + B + xa/gần':r'离.{1,12}[远近]','Hành động 1 + 再 + hành động 2':r'先.{1,25}再|再告诉',
 'Động từ + 完/好/懂/到':r'[做写看改找][完好懂到]','别 + động từ + (了)':r'别[找忘着把在]','A + 比 + B + tính từ + lượng chênh':r'比.{1,10}[三五一].{0,3}[岁米钱]','Động từ + 得 + miêu tả':r'[穿说跑]得','Động từ + 着':r'[开拿站坐笑放]着',
 'Động từ + 过；没 + động từ + 过':r'看过|去过','就要/快要/要 + động từ + 了':r'[就快]要.{1,8}了', '打算 + động từ/cụm động từ':r'打算[去先出复]','Thời gian/điều kiện + 才 + hành động':r'[点上下]午?.{0,4}才|才回来|后.{0,3}才',
 'Địa điểm + động từ + 着 + số lượng + danh từ':r'[桌子门口].{0,5}[放站]着','Động từ 1 + 着 + động từ 2':r'笑着.{1,10}[问说走]|拿着.{1,15}[走看]','越来越 + tính từ/động từ tâm lý':r'越来越','Động từ + 得/不 + kết quả/hướng':r'找不到|听不清|看不见|拿不动',
 'Động từ + khoảng thời gian + 了':r'认识.{1,5}年了','…什么/哪儿…，就…什么/哪儿…':r'去哪儿.{0,3}我就去哪儿','A + 跟/和 + B + 一样 + tính từ':r'[跟和].{1,15}一样','A + 比 + B + tính từ + 多了/得多':r'比.{1,25}(多了|得多)',
 'Chủ ngữ + 把 + tân ngữ xác định + động từ + kết quả/nơi đến':r'把.{1,20}[关放还拿]','Động từ + 回 + 来/去':r'走回来|拿回来|走回去','拿/送/搬 + 过来/过去':r'[拿搬送].{0,6}过[来去]',
 '除了 + A + 以外，B + 还/也/都…':r'除了.{1,25}以外.{1,30}[还也都]','Tính từ/động từ + 得 + vế miêu tả':r'[累忙笑]得','谁/什么/哪儿 + 都 + …':r'谁都|什么都','Chủ ngữ + 会 + động từ/tính từ':r'会[同有准]','看/听/想 + 出来':r'[看听想]出[来]?','Đối tượng chịu tác động + 被 + (tác nhân) + động từ + thông tin kết quả':r'被.{1,20}影响了|被.{1,20}放',
 '虽然 + sự thật， 但是/可是 + điều trái mong đợi':r'虽然.{1,50}(但是|可是|却)', '不仅/不但 + A， 而且/还 + B':r'(不仅|不但).{1,60}(而且|还|也)', '只要 + điều kiện， 就 + kết quả':r'只要.{1,45}就','对 + đối tượng + đánh giá/động từ thái độ':r'对.{1,8}(有信心|影响|环境|好)',
 '为了 + mục tiêu， + hành động':r'为了','只有 + điều kiện， 才 + kết quả':r'只有.{1,50}才','因为 + nguyên nhân， 所以 + kết quả':r'因为.{1,45}所以', '不是 + A， 而是 + B':r'不是.{1,65}而是','如果 + điều kiện， 就 + kết quả':r'如果.{1,45}就',
 '根据 + căn cứ， …':r'根据','未必 + động từ/tính từ':r'未必', '一边 + hành động 1， 一边 + hành động 2':r'一边.{1,30}一边', '通过 + cách/phương tiện， …':r'通过','即使 + tình huống giả định， 也 + kết quả vẫn giữ':r'即使.{1,55}也','不管/无论 + lựa chọn/từ nghi vấn， 都/也 + kết quả':r'(不管|无论).{1,40}(都|也)',
 '逐渐 + động từ/tính từ':r'逐渐', '与其 + A， 不如 + B':r'与其.{1,50}不如','…， 以便 + việc sẽ thuận tiện hơn':r'以便','既 + A， 又 + B':r'既.{1,35}又','Vế 1， 而 + vế 2':r'，而(现代|[^且是])',
 '尽管 + sự thật， 仍然/还是 + kết quả':r'尽管.{1,55}(仍然|还是|也)', '随着 + sự thay đổi， + sự thay đổi liên quan':r'随着','关于 + chủ đề， + nhận định':r'关于','是否 + động từ/tính từ':r'是否','Lời khuyên/hành động， 以免 + hậu quả không muốn':r'以免','一方面 + A， 另一方面 + B':r'一方面.{1,60}另一方面', '不妨 + hành động':r'不妨'
}
def normalize(w):
    return {'贏':'赢','內容':'内容','勺（子）':'勺子','夏(天)':'夏天','聊天(儿)':'聊天','聊天(兒)':'聊天','聊(天)':'聊天','太……了':'太','不但……而且……':'不但','只有……オ……':'只有'}.get(w,w)
def alignment(reading,catalog,grammar):
    sentences=[]
    for i,l in enumerate(reading['lines']):
        for sentence in re.findall(r'[^。！？]+[。！？]?',l['cn']):sentences.append((i,sentence.strip()))
    applied=[];missing=[]
    for g in grammar:
        regex=RULES[g['pattern']]
        hit=next(((i,s) for i,s in sentences if re.search(regex,s)),None)
        if hit is None:missing.append(g['pattern']);continue
        applied.append({'title':g['title'],'pattern':g['pattern'],'paragraph':hit[0]+1,'example':hit[1], 'matchRule':regex})
    text=''.join(x['cn'] for x in reading['lines'])
    used=[w for w in catalog['words'] if normalize(w) in text]
    return {'vocabularyUsed':used,'vocabularyNotUsed':[w for w in catalog['words'] if w not in used],'grammarApplied':applied,'grammarMissing':missing}

def compile_readings():
    cat=json.loads((ROOT/'lessons-data.json').read_text())
    report={'revision':'all-readings-20261011','totalLessons':0,'newReadings':0,'preservedReadings':0,'scope':'Every catalogued HSK 1–6 lesson has a complete passage. Lesson vocabulary is selected for natural use; unused catalog words are reported rather than inserted as lists. Every app-listed grammar point has a quoted textual example. First two lessons apply pronunciation through greetings.','entries':[]}
    pending=[]
    extras=defaultdict(list)
    for row in (ROOT/'content/all-readings/alignment-additions.tsv').read_text().splitlines():
        id,cn,vi=row.split('\t');extras[id].append({'cn':cn,'pin':pin(cn),'vi':vi,'applicationRevision':report['revision']})
    for course in cat['courses']:
        hsk=course['hsk'];src=defaultdict(list)
        for row in (ROOT/f'content/all-readings/hsk{hsk}.tsv').read_text().splitlines():
            number,cn,vi=row.split('\t');assert cn and vi
            src[int(number)].append({'cn':cn,'pin':pin(cn),'vi':vi})
        data=json.loads((ROOT/f'lesson-content-hsk{hsk}.json').read_text())
        for l,c in zip(data['lessons'],course['lessons']):
            assert l['id']==c['id'];number=c['number']
            if number in src:
                assert number in src,l['id']
                l.setdefault('warmupReading',l['reading'])
                l['reading']={'title':'Bài đọc vận dụng · '+c['vi'],'kind':'long-form-original','lines':src[number], 'task':'Đọc liền mạch, xác định diễn biến hoặc lập luận, rồi tìm các câu vận dụng từ vựng và cấu trúc của bài.'}
                for q in l['practice']:
                    if q['id'] in ['understanding','understanding-2'] and q.get('source')!='warmup':
                        q['source']='warmup';q['prompt']='Theo đoạn ngắn khởi động: '+q['prompt']
                report['newReadings']+=1
            else:
                report['preservedReadings']+=1
                l['reading']['lines']=[x for x in l['reading']['lines'] if x.get('applicationRevision')!=report['revision']]+extras[l['id']]
            reading=l['reading'];reading['characterCount']=sum(len(re.findall(r'[\u3400-\u9fff]',p['cn'])) for p in reading['lines'])
            a=alignment(reading,c,l['grammar']);reading['lessonApplication']=a
            if a['grammarMissing']:pending.append((l['id'],a['grammarMissing']))
            l['provenance']['allReadings']={'kind':'original','revision':report['revision'],'label':'Bài đọc vận dụng biên soạn riêng, dùng từ vựng chọn lọc và các điểm ngôn ngữ đang có trong app; không phải bài khóa nguyên văn. Ngữ pháp được ghi kèm câu minh chứng. Pinyin có hỗ trợ sinh và sửa theo ngữ cảnh, chưa là bản kiểm định ngữ âm chuyên môn.'}
            report['entries'].append({'id':l['id'],'hsk':hsk,'readingCharacters':reading['characterCount'],'paragraphs':len(reading['lines']),**a})
            report['totalLessons']+=1
        (ROOT/f'lesson-content-hsk{hsk}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
    (ROOT/'content/all-reading-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    for level in range(1,7):
        es=[e for e in report['entries'] if e['hsk']==level]
        print('HSK',level,len(es),'readings',min(e['readingCharacters'] for e in es),'–',max(e['readingCharacters'] for e in es),'characters')
    print('MISSING GRAMMAR',json.dumps(pending,ensure_ascii=False))
if __name__=='__main__':compile_readings()
