"""Authenticated original-audio resolver. Encoding happens in the browser WASM worker."""
import json, os, re, shutil, subprocess, sys, tempfile, threading, time, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, urlencode
from urllib.request import Request, urlopen
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict

MAX_SOURCE=50*1024*1024
TTL=900
class Payload(BaseModel):
    model_config=ConfigDict(extra='forbid', strict=True)
    url:str=Field(min_length=1,max_length=2048)

def canonical_url(value):
    u=urlsplit(value)
    if u.scheme!='https' or u.username or u.password or u.port or u.fragment:
        raise ValueError('Link phải là HTTPS công khai, không chứa thông tin đăng nhập.')
    host=(u.hostname or '').lower()
    if host in ('open.spotify.com','spotify.com'):
        raise ValueError('Spotify không cung cấp file âm thanh cho luồng này. Chọn link YouTube hoặc SoundCloud tương ứng.')
    if host in ('youtube.com','www.youtube.com','music.youtube.com','youtu.be'):
        video=u.path.strip('/') if host=='youtu.be' else parse_qs(u.query).get('v',[''])[0] if u.path=='/watch' else u.path.split('/')[-1] if u.path.startswith(('/shorts/','/embed/','/live/')) else ''
        if not re.fullmatch(r'[a-zA-Z0-9_-]{11}',video): raise ValueError('Chọn link một video YouTube, không phải playlist.')
        return 'https://www.youtube.com/watch?'+urlencode({'v':video})
    if host in ('soundcloud.com','www.soundcloud.com') and re.fullmatch(r'/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+/?',u.path) and u.path.split('/')[2] not in ('sets','tracks','likes','reposts'):
        return 'https://soundcloud.com'+u.path.rstrip('/')
    raise ValueError('Nguồn này chưa hỗ trợ lưu từ link. Chọn link bài YouTube hoặc SoundCloud công khai.')

def verify_token(token):
    key=os.environ.get('FIREBASE_API_KEY','')
    if not key: raise HTTPException(503,'Dịch vụ chuyển nhạc chưa được cấu hình tài khoản.')
    try:
        req=Request('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+key,data=json.dumps({'idToken':token}).encode(),headers={'Content-Type':'application/json'})
        with urlopen(req,timeout=8) as response: user=json.load(response)['users'][0]
        if user.get('disabled') or not user.get('localId'): raise ValueError()
        return user['localId']
    except Exception as error: raise HTTPException(401,'Phiên đăng nhập hết hạn. Đăng nhập lại rồi thử lưu.') from error

def run(args,timeout=120):
    result=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
    if result.returncode: raise RuntimeError(result.stderr[-1600:] or 'Không xử lý được nguồn nhạc.')
    return result.stdout

def downloader_command(url,directory):
    # Fixed provider-only extractors; no config, cookies, arbitrary URLs or playlist runs.
    # EJS scripts are installed by yt-dlp[default]; no runtime script downloads.
    return [sys.executable,'-m','yt_dlp','--ignore-config','--no-playlist','--no-cache-dir','--no-progress','--no-warnings','--no-simulate','--js-runtimes',os.environ.get('YTDLP_JS_RUNTIME','deno'),'--socket-timeout','15','--retries','1','--extractor-retries','1','--fragment-retries','1','--max-filesize',str(MAX_SOURCE),'--match-filter','!is_live & duration <= 900','--use-extractors','youtube,soundcloud','-f','bestaudio/best','--print','after_move:{"id":%(id)j,"webpage_url":%(webpage_url)j}','-o',str(directory/'source.%(ext)s'),'--',url]

def download_source(url,directory):
    requested=canonical_url(url)
    output=run(downloader_command(requested,directory),timeout=120)
    # Check the source reported by the official downloader after the file is
    # written. Search results and a different video ID must never be accepted.
    try:
        records=[json.loads(line) for line in output.splitlines() if line.strip()]
        if len(records)!=1:raise ValueError('Expected one media source')
        media=records[0]
        if canonical_url(media['webpage_url'])!=requested:raise ValueError('Different source URL')
        if urlsplit(requested).hostname=='www.youtube.com' and media['id']!=parse_qs(urlsplit(requested).query)['v'][0]:raise ValueError('Different video ID')
    except (ValueError,TypeError,KeyError) as error:
        raise RuntimeError('Nguồn trả về không khớp đúng link đã chọn; chưa lưu file.') from error
    files=[p for p in directory.glob('source.*') if p.suffix not in ('.part','.ytdl') and p.is_file()]
    if len(files)!=1 or not 0<files[0].stat().st_size<=MAX_SOURCE:
        raise RuntimeError('Nguồn chưa tải đủ hoặc vượt giới hạn của dịch vụ.')
    return files[0]

def resolve_link(url,directory,progress,downloader=download_source):
    progress('downloading')
    source=downloader(url,directory)
    info=json.loads(run(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(source)],timeout=15))
    if not 0<float(info['format']['duration'])<=900: raise RuntimeError('Chọn bài nhạc dài tối đa 15 phút.')
    return source

def create_app(identity=verify_token,runner=resolve_link):
    app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None)
    origins=[x.strip() for x in os.environ.get('ALLOWED_ORIGINS','https://trungxemcode.github.io').split(',') if x.strip()]
    app.add_middleware(CORSMiddleware,allow_origins=origins,allow_methods=['GET','POST','DELETE'],allow_headers=['Authorization','Content-Type'],expose_headers=['Content-Length','X-Audio-Source'])
    jobs={};history={};lock=threading.RLock();pool=ThreadPoolExecutor(max_workers=2)
    base=Path(os.environ.get('SOURCE_TEMP',tempfile.gettempdir()))/'hsk-source-resolver';base.mkdir(parents=True,exist_ok=True)
    # Remove only abandoned directories owned by this service after a restart.
    for folder in base.iterdir():
        if folder.is_dir() and re.fullmatch('[a-f0-9]{32}',folder.name) and time.time()-folder.stat().st_mtime>TTL: shutil.rmtree(folder,ignore_errors=True)
    def actor(authorization):
        if not authorization or not authorization.startswith('Bearer ') or len(authorization)>12000: raise HTTPException(401,'Đăng nhập tài khoản HSK để lưu nhạc.')
        return identity(authorization[7:])
    def purge():
        now=time.time()
        for jobid,job in list(jobs.items()):
            if job['status'] in ('ready','error','cancelled') and now-job['updated']>TTL:
                shutil.rmtree(job['directory'],ignore_errors=True);del jobs[jobid]
        for uid in list(history):
            history[uid]=[t for t in history[uid] if now-t<3600]
            if not history[uid]:del history[uid]
    def owned(jobid,uid):
        job=jobs.get(jobid)
        if not job or job['uid']!=uid:raise HTTPException(404,'Không tìm thấy lượt lưu nhạc.')
        return job
    def work(jobid):
        job=jobs[jobid]
        def progress(state):
            with lock:
                if job['status']=='cancelled':raise RuntimeError('Đã hủy lượt lưu.')
                job.update(status=state,updated=time.time())
        try:
            output=runner(job['url'],job['directory'],progress)
            with lock:
                if job['status']=='cancelled':shutil.rmtree(job['directory'],ignore_errors=True);return
                job.update(status='ready',file=output,size=output.stat().st_size,updated=time.time())
        except Exception:
            with lock:
                if job['status']!='cancelled':job.update(status='error',error='Không lấy hoặc chuyển được âm thanh từ nguồn này. Nguồn có thể yêu cầu đăng nhập, chặn tải hoặc tạm lỗi; thử lại sau hoặc chọn link khác.',updated=time.time())
                shutil.rmtree(job['directory'],ignore_errors=True)
    @app.get('/health')
    def health():return {'ok':True,'source':'original','encoding':'client-wasm'}
    @app.post('/v1/jobs',status_code=202)
    def submit(payload:Payload,authorization:str|None=Header(default=None)):
        uid=actor(authorization)
        try:url=canonical_url(payload.url)
        except ValueError as error:raise HTTPException(422,str(error)) from error
        with lock:
            purge()
            for jobid,job in jobs.items():
                if job['uid']==uid and job['url']==url and job['status'] not in ('error','cancelled'):
                    return {'id':jobid,'status':job['status']}
            if sum(j['status'] not in ('ready','error','cancelled') for j in jobs.values())>=4:raise HTTPException(429,'Đang có nhiều lượt lưu. Thử lại sau ít phút.')
            if sum(j['uid']==uid and j['status'] not in ('ready','error','cancelled') for j in jobs.values())>=1:raise HTTPException(429,'Bài trước đang được xử lý. Đợi hoàn tất rồi thêm bài khác.')
            if uid!=os.environ.get('ADMIN_UID') and len(history.get(uid,[]))>=10:raise HTTPException(429,'Đã đủ 10 lượt chuyển nhạc trong giờ này. Thử lại sau.')
            if len(jobs)>=20:raise HTTPException(429,'Kho tạm đang đầy. Thử lại sau ít phút.')
            jobid=uuid.uuid4().hex;directory=base/jobid;directory.mkdir();now=time.time()
            jobs[jobid]={'uid':uid,'url':url,'status':'pending','directory':directory,'updated':now}
            history.setdefault(uid,[]).append(now);pool.submit(work,jobid)
            return {'id':jobid,'status':'pending'}
    @app.get('/v1/jobs/{jobid}')
    def state(jobid:str,authorization:str|None=Header(default=None)):
        uid=actor(authorization)
        with lock:
            purge();job=owned(jobid,uid)
            return {k:job[k] for k in ('status','size','error') if k in job}
    @app.delete('/v1/jobs/{jobid}')
    def cancel(jobid:str,authorization:str|None=Header(default=None)):
        uid=actor(authorization)
        with lock:
            job=owned(jobid,uid);old=job['status'];job.update(status='cancelled',updated=time.time())
            if old in ('ready','error'):shutil.rmtree(job['directory'],ignore_errors=True)
        return {'cancelled':True}
    @app.get('/v1/jobs/{jobid}/file')
    def file(jobid:str,authorization:str|None=Header(default=None)):
        uid=actor(authorization)
        with lock:
            purge();job=owned(jobid,uid)
            if job['status']!='ready' or not job['file'].is_file():raise HTTPException(409,'File chưa sẵn sàng.')
            return FileResponse(job['file'],media_type='application/octet-stream',filename='source'+job['file'].suffix,headers={'Cache-Control':'no-store','X-Audio-Source':'original'})
    app.state.jobs=jobs
    return app
app=create_app()
