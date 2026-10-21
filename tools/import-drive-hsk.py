"""Import only answer-key-backed, complete items from locally fetched user Drive PDFs."""
import json,re,hashlib,sys
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[1];SRC=Path(sys.argv[1]);manifest=json.loads((SRC/'manifest.json').read_text());grouped={};audit=[]
HAN=re.compile('[\u3400-\u9fff]');NUM=re.compile(r'^\s*(\d+)[．.、]\s*',re.M)
def code(t):
 m=re.search(r'H[1-6]\d{4}',t);return m[0] if m else None
def cleanup(t):
 lines=[]
 for line in t.splitlines():
  if re.search(r'H[1-6]\d{4}|^\s*-?\s*\d+\s*-?\s*$',line):continue
  if not HAN.search(line) and not re.search(r'^\s*(?:\d+[．.、]|[A-F](?:\s|$)|[√×]|\d+\s*[-－–]\s*\d+[．.、])',line):continue
  lines.append(line.rstrip())
 return '\n'.join(lines)
def compact(t):return re.sub(r'\s+','',t).strip()
for f in manifest:
 p=SRC/(f['id']+'.pdf');t=(SRC/(f['id']+'.txt')).read_text();c=code(t)
 if not c:audit.append({'file':f['title'],'reason':'missing test code'});continue
 row={**f,'code':c,'text':t,'path':p,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()};grouped.setdefault(c,[]).append(row)
items=[];sets=[];seen=set();ids=set();imagepaths=[]
def put(q):
 if q['id'] in ids:return
 signature=hashlib.sha256(json.dumps({k:q.get(k) for k in ['level','type','prompt','passage','options','tokens','answer','accepted','materialImages']},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
 if signature in seen:return
 seen.add(signature);ids.add(q['id']);items.append(q)
def opts(text):
 marks=list(re.finditer(r'(?<![A-Za-z])([A-F])(?=\s|[\u3400-\u9fff])',text));out=[];letters=[]
 for i,m in enumerate(marks):
  value=compact(text[m.end():marks[i+1].start() if i+1<len(marks) else len(text)])
  if not value or not HAN.search(value):return None
  letters.append(m[1]);out.append(value)
 if letters!=list('ABCDEF'[:len(letters)]) or len(out)<2 or len(set(out))!=len(out):return None
 return out
for c,files in sorted(grouped.items()):
 level=int(c[1]);keys={};conflict=False
 for f in files:
  t=f['text'];start=re.search(r'(?:卷\s*答案|参考答案|参\s*考\s*答\s*案)',t)
  if not start:continue
  keytext=t[start.end():]
  for m in re.finditer(r'(\d+)[．.、]\s*([A-F]{1,3}|[√×]|[^\s\d][^\n]*?)(?=\s+\d+[．.、]|\n|$)',keytext):
   n=int(m[1]);a=compact(m[2]);
   if not a:continue
   if n in keys and keys[n]!=a:conflict=True
   keys[n]=a
 if conflict:audit.append({'code':c,'reason':'conflicting keys'});continue
 books=[f for f in files if len(f['text'].split('\f'))>5 and not ('听力材料' in f['title'] or '答案' in f['title'] or '__31572__' in f['title'])]
 if not books or not keys:audit.append({'code':c,'reason':'no book or no verified key'});continue
 f=max(books,key=lambda f:len(f['text']));pages=f['text'].split('\f');doc=fitz.open(f['path']);before=len(items)
 source={'code':c,'fileId':f['id'],'url':f['url'],'sha256':f['sha256'],'folderLevel':f['folderLevel']}
 lo,hi={1:(21,40),2:(36,60),3:(41,70),4:(46,85),5:(46,90),6:(51,100)}[level]
 # Separate key pages and transcript pages from question material, including page-crossing prose.
 end=next((i for i,p in enumerate(pages) if re.search(r'卷\s*答案|参考答案|参\s*考\s*答\s*案|听\s*力\s*材\s*料',p)),len(pages))
 questionpages=pages[:end]
 for pi,p in enumerate(questionpages):
  raw=cleanup(p);marks=list(NUM.finditer(raw))
  if level==1:
   if pi<6:continue
   ns=[int(m[1]) for m in marks if lo<=int(m[1])<=hi]
   if not ns:ns=[int(x) for x in re.findall(r'^\s*(\d{2})(?=\s|[．.、]|$)',p,re.M) if lo<=int(x)<=hi]
   if not ns:continue
   path=f'content/drive-hsk/{c}-{pi+1}.webp';target=ROOT/path;target.parent.mkdir(parents=True,exist_ok=True)
   from PIL import Image
   pix=doc[pi].get_pixmap(matrix=fitz.Matrix(1.65,1.65));Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(target,'WEBP',quality=88);imagepaths.append(path)
   for n in sorted(set(ns)):
    a=keys.get(n)
    if not a or a not in list('ABCDEF')+['√','×']:continue
    options=['√','×'] if a in ['√','×'] else list('ABCDEF')
    put({'id':f'drive-{c}-{n}','type':'driveReadImage','level':level,'prompt':f'{c} · Câu {n}. Đọc tài liệu, chỉ trả lời câu được ghi ở đây.','materialImages':[path],'options':options,'answer':options.index(a),'explanation':f'Đáp án {a}, đối chiếu bảng đáp án của {c}, câu {n}.','sourceRef':{**source,'number':n,'page':pi+1},'imageOnly':True})
   continue
  # Shared passages are carried into every child question, never detached from their stem.
  if level>=5:
   ranges=list(re.finditer(r'^\s*(\d+)\s*[-－–]\s*(\d+)[．.、]',raw,re.M))
   for gi,gm in enumerate(ranges):
    first,last=int(gm[1]),int(gm[2]);region=raw[gm.end():ranges[gi+1].start() if gi+1<len(ranges) else len(raw)]
    qm=list(NUM.finditer(region))
    if not qm or first<lo or last>hi:continue
    passage=compact(region[:qm[0].start()])
    if level==5 and last<=60:
     for blank in range(first,last+1):passage=re.sub(r'(?<!\d)'+str(blank)+r'(?!\d)',f'（{blank}：___）',passage)
    if len(passage)<80:continue
    for ki,km in enumerate(qm):
     n=int(km[1]);a=keys.get(n);body=region[km.end():qm[ki+1].start() if ki+1<len(qm) else len(region)];om=re.search(r'(?<![A-Za-z])[A-F](?=\s|[\u3400-\u9fff])',body)
     if not(first<=n<=last) or not om or a not in list('ABCD'):continue
     options=opts(body[om.start():]);stem=compact(body[:om.start()])
     if not options or len(options)!=4:continue
     isgap=level==5 and n<=60
     if not isgap and not HAN.search(stem):continue
     put({'id':f'drive-{c}-{n}','level':level,'type':'gap' if isgap else 'reading','prompt':f'Chọn từ/cụm từ điền vị trí {n} trong đoạn.' if isgap else stem,'passage':passage,'options':options,'answer':ord(a)-65,'explanation':f'Đáp án {a}: {options[ord(a)-65]}. Đối chiếu bảng đáp án {c}, câu {n}.','sourceRef':{**source,'number':n,'page':pi+1}})
  # Full-text independent choices; matching/gap groups keep their shared option bank.
  for j,m in enumerate(marks):
   n=int(m[1]);a=keys.get(n);block=raw[m.end():marks[j+1].start() if j+1<len(marks) else len(raw)];block=re.split(r'\n\s*(?:第[一二三四五]部分|第\s*\d+.*?题|\d+\s*[-－–]\s*\d+[．.、])',block)[0]
   if not a:continue
   common={'id':f'drive-{c}-{n}','level':level,'sourceRef':{**source,'number':n,'page':pi+1}}
   if lo<=n<=hi:
    optionmarks=list(re.finditer(r'(?<![A-Za-z])([A-F])(?=\s|[\u3400-\u9fff])',block))
    if optionmarks and a in list('ABCD'):
     stem=block[:optionmarks[0].start()];options=opts(block[optionmarks[0].start():])
     if options and len(options) in [3,4] and (HAN.search(stem) or level==6 and n<=60) and '第' not in stem[-5:]:
      if level==6 and n<=60:typ='error';prompt='Chọn câu có lỗi ngữ pháp.';passage=''
      else:typ='reading';prompt=compact(stem);passage=''
      # Reject incompletely extracted blanks and questions whose passage lives outside this block.
      if level==6 and 61<=n<=80:continue
      if level==5 and 46<=n<=60:continue
      if level==6 and n<=60:pass
      elif level>=5 and len(compact(stem))<45:continue
      if options.index(options[ord(a)-65])!=ord(a)-65:continue
      common.update(type=typ,prompt=prompt,passage=passage,options=options,answer=ord(a)-65,explanation=f'Đáp án {a}: {options[ord(a)-65]}. Đối chiếu bảng đáp án {c}, câu {n}.')
      put(common);continue
    if level==2 and 46<=n<=50 and a in ['√','×'] and '★' in block:
     stem=compact(block.split('★')[0]);judge=compact(block.split('★')[1]).replace('（）','');put({**common,'type':'readJudge','prompt':judge,'passage':stem,'options':['Đúng','Sai'],'answer':0 if a=='√' else 1,'explanation':f'Đáp án {a} theo bảng đáp án {c}, câu {n}.'});continue
    if level<=4 and a in list('ABCDEF') and (level==2 and (41<=n<=45 or 51<=n<=60) or level==3 and 41<=n<=60 or level==4 and 46<=n<=55):
     prefix=raw[:marks[0].start()];prefix=prefix.split('例如')[0];startopt=re.search(r'(?<![A-Za-z])A(?=\s|[\u3400-\u9fff])',prefix)
     options=opts(prefix[startopt.start():]) if startopt else None
     if not options or ord(a)-65>=len(options):continue
     stem=compact(block);stem=re.sub(r'（[^）]*）','（___）',stem)
     typ='gap' if level==4 or level==3 and n>=51 or level==2 and n<=45 else 'response'
     if typ=='gap' and '（___）' not in stem:continue
     if not stem or not HAN.search(stem):continue
     put({**common,'type':typ,'prompt':stem,'options':options,'answer':ord(a)-65,'explanation':f'Đáp án {a}: {options[ord(a)-65]}. Đối chiếu bảng đáp án {c}, câu {n}.'})
   if level==6 and 61<=n<=70 and a in list('ABCD'):
    om=re.search(r'(?<![A-Za-z])A(?=\s|[\u3400-\u9fff])',block)
    if om:
     options=opts(block[om.start():]);stem=block[:om.start()]
     stem=re.sub(r'(?<=[\u3400-\u9fff])\s{2,}(?=[\u3400-\u9fff])','（___）',stem)
     if options and len(options)==4 and '（___）' in stem:put({**common,'type':'cloze','prompt':'Chọn nhóm từ điền các chỗ trống theo thứ tự.','passage':compact(stem),'options':options,'answer':ord(a)-65,'explanation':f'Đáp án {a}: {options[ord(a)-65]}. Đối chiếu bảng đáp án {c}, câu {n}.'})
   if level==4 and 56<=n<=65 and len(a)==3 and set(a)==set('ABC'):
    options=opts(block)
    if options and len(options)==3:
     ordered=[options[ord(x)-65] for x in a];put({**common,'type':'paragraph','prompt':'Sắp xếp các câu thành đoạn.','tokens':ordered,'accepted':[''.join(ordered)],'explanation':f'Thứ tự theo đáp án {c}, câu {n}: {a}'})
   # Token order: verify joined tokens exactly equal the published answer after normalization.
   if (level==3 and 71<=n<=75 or level==4 and 86<=n<=95 or level==5 and 91<=n<=98) and HAN.search(a):
    tokens=[compact(x) for x in re.split(r'\s{2,}|\n',block.strip()) if compact(x)]
    norm=lambda x:re.sub(r'[^\u3400-\u9fffA-Za-z0-9]','',x)
    if len(tokens)<3 or len(tokens)>12 or sorted(norm(''.join(tokens)))!=sorted(norm(a)):continue
    # Reorder tokens to the source key, as the existing bank contract requires its canonical order.
    remaining=tokens[:];ordered=[];rest=norm(a)
    while rest:
     match=next((x for x in remaining if rest.startswith(norm(x))),None)
     if not match:break
     ordered.append(match);remaining.remove(match);rest=rest[len(norm(match)):]
    if rest or remaining:continue
    put({**common,'type':'order','prompt':'Sắp xếp các từ/cụm từ thành câu.','tokens':ordered,'accepted':[a],'explanation':f'Câu mẫu theo đáp án {c}, câu {n}: {a}'})
 sets.append({**source,'imported':len(items)-before,'keyQuestions':len(keys),'fileName':f['title']})
# Count and provenance without embedding signed transport URLs or user account metadata.
report={'sourceFolder':'https://drive.google.com/drive/folders/14sqSlPydbPS7VetvbVMxVuLOlyB1sahj','pdfFiles':len(manifest),'tests':sets,'excluded':audit,'imported':len(items),'byLevel':{str(l):sum(q['level']==l for q in items) for l in range(1,7)},'images':list(dict.fromkeys(imagepaths))}
import base64,gzip
def image_uri(path):
 payload=(ROOT/path).read_bytes()
 if len(payload)<12 or payload[:4]!=b'RIFF' or payload[8:12]!=b'WEBP':
  raise ValueError('Invalid or empty rendered Drive image: '+path)
 # Decode before packing; an empty base64 prefix must never become an app asset.
 from io import BytesIO
 from PIL import Image
 with Image.open(BytesIO(payload)) as image:
  image.load()
  if image.width<1 or image.height<1:raise ValueError('Empty Drive image dimensions: '+path)
 return 'data:image/webp;base64,'+base64.b64encode(payload).decode()
packed_images={path:image_uri(path) for path in report['images']}
(ROOT/'drive-exam-data.json').write_text(json.dumps({'version':1,'items':items,'report':report},ensure_ascii=False,separators=(',',':')))
(ROOT/'drive-exam-data.json.gz').write_bytes(gzip.compress((ROOT/'drive-exam-data.json').read_bytes(),mtime=0))
(ROOT/'drive-exam-images.json').write_text(json.dumps(packed_images,separators=(',',':')))
imageGroups={}
for p in report['images']:
 imageGroups.setdefault(p.split('/')[-1].split('-')[0],{})[p]=packed_images[p]
for code,imageGroup in imageGroups.items():(ROOT/f'content/drive-hsk/{code}.json').write_text(json.dumps(imageGroup,separators=(',',':')))
(SRC/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:report[k] for k in ['pdfFiles','imported','byLevel','excluded']},ensure_ascii=False,indent=2))
