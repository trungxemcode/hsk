import sys,json,pathlib,time,hashlib,gc,argparse,subprocess
sys.stdout.reconfigure(encoding='utf-8')
import numpy as np,torch,stable_whisper,wave
parser=argparse.ArgumentParser(description='Align authorized canonical music transcripts locally; never publishes results.')
parser.add_argument('--jobs',required=True);parser.add_argument('--output-dir',required=True);parser.add_argument('--model',choices=['small','medium'],required=True);parser.add_argument('--model-cache',required=True);parser.add_argument('--ffmpeg',default='ffmpeg');parser.add_argument('--threads',type=int,default=4);parser.add_argument('--overwrite',action='store_true');a=parser.parse_args();out=pathlib.Path(a.output_dir);out.mkdir(parents=True,exist_ok=True);model_name=a.model;torch.set_num_threads(max(1,min(a.threads,8)))
jobs=json.loads(pathlib.Path(a.jobs).read_text(encoding='utf-8'))['jobs'];print('Loading '+model_name+' CPU alignment model',flush=True);model=stable_whisper.load_model(model_name,device='cpu',download_root=str(pathlib.Path(a.model_cache)));summary=[]
for index,j in enumerate(jobs):
 video=j['videoId'];target=out/(video+'-'+model_name+'.json');meta_file=out/(video+'-'+model_name+'.meta.json');text='\n'.join(j['referenceLines']);text_sha=hashlib.sha256(text.encode()).hexdigest()
 try:
  if hashlib.sha256(pathlib.Path(j['audioPath']).read_bytes()).hexdigest()!=j['audioSha256']:raise ValueError('Audio checksum changed')
  if not a.overwrite and target.exists() and meta_file.exists():
   old=json.loads(meta_file.read_text(encoding='utf-8'))
   if old.get('audioSha256')==j['audioSha256'] and old.get('textSha256')==text_sha:print('Cached '+video+' '+model_name,flush=True);continue
  wav=out/(video+'.wav')
  subprocess.run([a.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',j['audioPath'],'-ar','16000','-ac','1',str(wav)],check=True,timeout=120)
  with wave.open(str(wav),'rb') as f:
   assert f.getframerate()==16000 and f.getnchannels()==1 and f.getsampwidth()==2
   audio=np.frombuffer(f.readframes(f.getnframes()),dtype=np.int16).astype(np.float32)/32768.
  start=time.time();print('Align '+str(index+1)+'/'+str(len(jobs))+' '+video+' '+model_name,flush=True);r=model.align(audio,text,language='zh',original_split=True,token_step=100,verbose=None)
  if r is None:raise ValueError('No alignment result')
  r.save_as_json(str(target));d=r.to_dict();words=[w for s in d['segments'] for w in s.get('words',[])];meta={'audioSha256':j['audioSha256'],'textSha256':text_sha,'model':model_name,'seconds':round(time.time()-start,1),'segments':len(d['segments']),'words':len(words),'zeroDuration':sum(int(w['end']<=w['start']) for w in words),'lowConfidence':sum(int(w.get('probability',0)<.3) for w in words),'meanProbability':float(sum(w.get('probability',0) for w in words)/max(1,len(words)))};meta_file.write_text(json.dumps(meta),encoding='utf-8');summary.append({'video':video,**meta});print(json.dumps({'done':video,**meta}),flush=True);del audio,r,d;gc.collect()
 except Exception as e:summary.append({'video':video,'error':str(e)});print(json.dumps({'held':video,'error':str(e)}),flush=True)
 (out/(model_name+'-batch-summary.json')).write_text(json.dumps(summary),encoding='utf-8')
print('Alignment batch finished: '+model_name,flush=True)
