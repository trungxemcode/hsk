"""Owner-run public audio import fallback. Wrangler handles Cloudflare authentication.
Input: {permission: str, tracks: [{videoId, importJobId, title, duration,
referenceKind, referenceLines, url, ...}]}. No cookies or API secrets are read.
After staging, Worker Cron publishes/checksums audio and processes Groq serially.
"""
import argparse, hashlib, json, pathlib, re, subprocess, sys, time

def run(args, cwd=None, timeout=420):
    result = subprocess.run(args, cwd=cwd, capture_output=True, timeout=timeout)
    if result.returncode:
        detail = result.stderr.decode('utf-8', 'replace').lower()
        reason = 'login-required' if 'sign in' in detail else 'source-403' if '403' in detail else 'command-failed'
        raise RuntimeError(reason)
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('manifest');parser.add_argument('--workdir',required=True);parser.add_argument('--repo',required=True);parser.add_argument('--limit',type=int,default=50)
    args=parser.parse_args();manifest=json.loads(pathlib.Path(args.manifest).read_text(encoding='utf-8-sig'))
    if not manifest.get('permission'):raise SystemExit('Owner permission statement required in manifest')
    import imageio_ffmpeg
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();root=pathlib.Path(args.workdir);root.mkdir(parents=True,exist_ok=True);repo=pathlib.Path(args.repo)
    statusfile=root/'staging-status.json';status=json.loads(statusfile.read_text()) if statusfile.exists() else {}
    def save():statusfile.write_text(json.dumps(status,ensure_ascii=False,indent=2),encoding='utf-8')
    def put(key,path,content_type):
        command=['npx.cmd' if sys.platform=='win32' else 'npx','wrangler','r2','object','put','hsk-music-library/'+key,'--file',str(path),'--content-type',content_type,'--remote','--config',str(repo/'server/music/wrangler-cloud.jsonc')]
        if sys.platform=='win32':command=['cmd.exe','/d','/c',*command]
        for attempt in range(2):
            try:return run(command,cwd=repo,timeout=180)
            except (RuntimeError,subprocess.TimeoutExpired):
                if attempt:raise
                time.sleep(5)
    for index,track in enumerate(manifest['tracks'][:args.limit],1):
        video=track['videoId'];jobid=track['importJobId']
        if not re.fullmatch(r'[\w-]{11}',video) or not re.fullmatch(r'[a-f0-9]{32}',jobid):raise SystemExit('Invalid manifest ID')
        if status.get(video,{}).get('state')=='uploaded':continue
        try:
            source=root/(video+'.m4a');ready=root/(jobid+'.m4a')
            run([sys.executable,'-m','yt_dlp','--ignore-config','--no-playlist','--no-progress','--socket-timeout','20','--retries','1','--extractor-retries','1','--js-runtimes','node','--remote-components','ejs:github','--max-filesize','12M','--match-filter','duration <= 480','-f','bestaudio[ext=m4a]','-o',str(source),'https://www.youtube.com/watch?v='+video])
            result=run([ffmpeg,'-hide_banner','-y','-i',str(source),'-map','0:a:0','-c:a','copy','-movflags','+faststart',str(ready)],timeout=90)
            info=result.stderr.decode('utf-8','replace');match=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',info)
            duration=sum(float(n)*factor for n,factor in zip(match.groups(),[3600,60,1])) if match else float(track['duration'])
            if ready.stat().st_size>12*1024*1024 or duration>480:raise RuntimeError('audio-limit')
            kind=track.get('referenceKind');kind=kind if kind in ('hanzi','pinyin') else 'asr'
            title=track['title'];parts=title.split('|');credit=parts[-1] if ' - ' in parts[-1] else parts[0];artist=' - '.join(credit.split(' - ')[1:]).strip() or track.get('channel','Moah')
            job={'id':jobid,'batchId':'moah-popular-2026-10-27','state':'queued','createdAt':int(time.time()*1000),'videoId':video,'url':'https://www.youtube.com/watch?v='+video,'title':title[:120],'artist':artist[:80],'composer':'','duration':duration,'audioSha256':hashlib.sha256(ready.read_bytes()).hexdigest(),'referenceKind':kind,'referenceLines':track.get('referenceLines',[]),'pinyinLines':track.get('originalPinyin',[]),'permission':manifest['permission']}
            jobfile=root/(jobid+'.json');jobfile.write_text(json.dumps(job,ensure_ascii=False),encoding='utf-8')
            put('batch-audio/'+jobid+'.m4a',ready,'audio/mp4');put('batch-staging/'+jobid+'.json',jobfile,'application/json')
            status[video]={'state':'uploaded','jobId':jobid,'duration':duration,'referenceKind':kind};save();print(f'Staged {index}/{len(manifest["tracks"])}: {video}',flush=True)
        except Exception as exc:
            status[video]={'state':'failed','jobId':jobid,'error':str(exc) if isinstance(exc,RuntimeError) else type(exc).__name__};save();print(f'Failed {index}/{len(manifest["tracks"])}: {video} ({status[video]["error"]})',flush=True)
    print(json.dumps({'uploaded':sum(v['state']=='uploaded' for v in status.values()),'failed':sum(v['state']=='failed' for v in status.values())}),flush=True)
if __name__=='__main__':main()
