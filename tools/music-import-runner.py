"""Private GitHub Actions bridge. Never prints cookies or OIDC tokens."""
import os,json,pathlib,urllib.request,subprocess,tempfile
BASE='https://hsk-music-library.trung-hsk668.workers.dev'
def token():
 req=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience=hsk-music-import',headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN'],'User-Agent':'HSK-Music-Importer/1.0'})
 with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)['value']
def api(path,body=b'',headers=None):
 req=urllib.request.Request(BASE+path,data=body,headers={'Authorization':'Bearer '+token(),'User-Agent':'HSK-Music-Importer/1.0',**(headers or {})})
 with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
def cookies(raw,target):
 raw=raw.strip()
 if not raw:raise ValueError('Missing cookie secret')
 if raw.startswith(('# Netscape','# HTTP Cookie')):text=raw
 else:
  try:d=json.loads(raw)
  except ValueError:d=None
  if isinstance(d,list):rows=[(c.get('domain','.youtube.com'),c.get('path','/'),str(c.get('name','')),str(c.get('value',''))) for c in d if isinstance(c,dict) and c.get('domain','').lstrip('.')=='youtube.com']
  else:
   h=d.get('youtube',[''])[0] if isinstance(d,dict) else raw
   if h.lower().startswith('cookie:'):h=h[7:].strip()
   rows=[('.youtube.com','/',k.strip(),v.strip()) for p in h.split(';') if '=' in p for k,v in [p.strip().split('=',1)]]
  if not rows or any('\n' in x or '\t' in x for row in rows for x in row):raise ValueError('Invalid cookie format')
  text='# Netscape HTTP Cookie File\n'+'\n'.join('\t'.join([domain,'TRUE' if domain.startswith('.') else 'FALSE',path,'TRUE','0',name,value]) for domain,path,name,value in rows)+'\n'
 target.write_text(text);target.chmod(0o600)
if __name__=='__main__':
 mode=os.environ.get('IMPORT_MODE','claim');jobfile=pathlib.Path(os.environ['RUNNER_TEMP'])/'hsk-import-job.json'
 if mode=='claim':
  job=api('/api/runner/claim')['job']
  if job:jobfile.write_text(json.dumps(job))
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('has_job='+('true' if job else 'false')+'\n')
  print('One queued job claimed' if job else 'No pending imports')
 else:
  job=json.loads(jobfile.read_text());root='/api/runner/jobs/'+job['id']
  try:
   with tempfile.TemporaryDirectory() as td:
    folder=pathlib.Path(td);cookie=folder/'cookies.txt';cookies(os.environ.get('COOKIE_INPUT',''),cookie)
    args=['yt-dlp','--ignore-config','--cookies',str(cookie),'--no-playlist','--no-progress','--socket-timeout','20','--retries','1','--extractor-retries','1','--js-runtimes','node','--max-filesize','50M','--match-filter','duration <= 1200','--write-info-json','-f','bestaudio','-x','--audio-format','mp3','--audio-quality','128K','-o',str(folder/'audio.%(ext)s'),job['url']]
    result=subprocess.run(args,capture_output=True,timeout=420)
    if result.returncode:raise RuntimeError('Source refused download')
    audio=(folder/'audio.mp3').read_bytes()
    if not 0<len(audio)<=50*1024*1024:raise ValueError('Invalid audio size')
    meta=json.loads((folder/'audio.info.json').read_text());from urllib.parse import quote
    data=api(root+'/upload',audio,{'Content-Type':'audio/mpeg','X-Music-Title':quote(job['title'] or str(meta.get('title') or 'YouTube audio')[:120],safe=''),'X-Music-Artist':quote(job['artist'] or str(meta.get('uploader') or 'HSK Music')[:80],safe='')})
    print('Import completed; audio published to R2')
  except Exception:
   api(root+'/fail');raise SystemExit('Import failed. Source may require fresh cookies; inspect admin job status.')
  finally:jobfile.unlink(missing_ok=True)
