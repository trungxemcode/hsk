"""Collect human Vietsub from verified local videos; never publish or generate translations."""
import csv,difflib,hashlib,io,json,os,pathlib,re,subprocess,sys
import cv2,imageio_ffmpeg
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/home/ubuntu/hsk-alignment')
output=root/'translation-review/drafts';output.mkdir(parents=True,exist_ok=True)
ocr=root/'translation-ocr/runtime';binary=ocr/'usr/bin/tesseract'
env={**os.environ,'OMP_THREAD_LIMIT':'1','LD_LIBRARY_PATH':str(ocr/'usr/lib/x86_64-linux-gnu')}
def norm(s):return re.sub(r'[\W_]','',s).lower()
def recognize(image,model):
 p=subprocess.run([str(binary),str(image),'stdout','--tessdata-dir',str(model),'-l','vie','--psm','7','tsv'],env=env,capture_output=True,text=True,check=True)
 words=[w for w in csv.DictReader(io.StringIO(p.stdout),delimiter='\t') if w.get('text','').strip() and float(w['conf'])>=0]
 return {'text':' '.join(w['text'] for w in words),'minConfidence':min((float(w['conf']) for w in words),default=0)}
summary=[]
for source in json.loads((root/'translation-review/ocr-matching-input.json').read_text()):
 video=root/'ocr-source'/(source['video']+'.mp4');sha=hashlib.file_digest(video.open('rb'),'sha256').hexdigest()
 if sha!=source.get('videoSha256'):raise RuntimeError('Changed source recording: '+source['video'])
 dest=output/(source['trackId']+'.json')
 if dest.exists() and json.loads(dest.read_text()).get('complete') and any('best' in x for x in json.loads(dest.read_text()).get('rows',[])):continue
 rows=[];groups={}
 for i,c in enumerate(source['cues']):
  if norm(c['text']):groups.setdefault(c['text'],[]).append(i)
 for index,(han,indices) in enumerate(groups.items()):
  options=[(difflib.SequenceMatcher(None,norm(han),norm(o['han'])).ratio(),o) for o in source['observations'] if norm(o['han'])]
  score,o=max(options,key=lambda x:(x[0],min(x[1].get('scores') or [0])),default=(0,{}))
  row={'hanzi':han,'cueIndices':indices,'sourceMatch':round(score,5),'status':'needs-human-review'}
  if score>=.85:
   at=o['at']+min(.35,max(0,o.get('lastSeen',o['at'])-o['at'])/2);full=output/(source['video']+'-'+str(index)+'.frame.png');decoded=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-loglevel','error','-threads','1','-ss',str(at),'-i',str(video),'-frames:v','1','-y',str(full)],capture_output=True);frame=cv2.imread(str(full)) if decoded.returncode==0 else None;ok=frame is not None
   if ok:
    h,w=frame.shape[:2];crop=cv2.resize(frame[int(h*.89):int(h*.99)],None,fx=2,fy=2)
    image=output/(source['video']+'-'+str(index)+'.png');cv2.imwrite(str(image),crop)
    best=recognize(image,root/'translation-ocr/best');fast=recognize(image,ocr/'usr/share/tesseract-ocr/5/tessdata')
    row.update({'sourceAt':at,'frame':str(image),'best':best,'fast':fast,'agreement':best['text']==fast['text']})
  rows.append(row)
  dest.write_text(json.dumps({'trackId':source['trackId'],'sourceUrl':source['sourceUrl'],'videoSha256':sha,'translationOrigin':'existing-human-vietsub','generativeTranslation':False,'reviewed':False,'complete':False,'rows':rows},ensure_ascii=False))
 result=json.loads(dest.read_text());result['complete']=True;dest.write_text(json.dumps(result,ensure_ascii=False));summary.append({'trackId':source['trackId'],'rows':len(rows),'extracted':sum('best' in x for x in rows),'reviewed':False});print(json.dumps(summary[-1]),flush=True)
(output/'summary.json').write_text(json.dumps(summary))
