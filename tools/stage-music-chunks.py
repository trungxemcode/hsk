"""Upload private ASR clip archives for an already authorized staged batch."""
import argparse,hashlib,json,pathlib,subprocess,sys
from music_audio_chunks import make_chunks
def main():
 p=argparse.ArgumentParser();p.add_argument('manifest');p.add_argument('--workdir',required=True);p.add_argument('--repo',required=True);p.add_argument('--video');p.add_argument('--skip-ready');a=p.parse_args()
 import imageio_ffmpeg
 b=json.loads(pathlib.Path(a.manifest).read_text(encoding='utf-8-sig'));root=pathlib.Path(a.workdir);out=root/'clips';out.mkdir(exist_ok=True);statefile=out/'status.json';state=json.loads(statefile.read_text()) if statefile.exists() else {};ready=set()
 if a.skip_ready:
  ready={x['sourceUrl'].split('v=')[-1] for x in json.loads(pathlib.Path(a.skip_ready).read_text(encoding='utf-8-sig')) if x.get('hasLyrics')}
 selected=[t for t in b['tracks'] if (not a.video or t['videoId']==a.video) and t['videoId'] not in ready]
 for i,t in enumerate(selected,1):
  video=t['videoId']
  if state.get(video,{}).get('state')=='uploaded':continue
  try:
   job=json.loads((root/(t['importJobId']+'.json')).read_text(encoding='utf-8-sig'));source=root/(t['importJobId']+'.m4a');sha=hashlib.sha256(source.read_bytes()).hexdigest()
   if sha!=job['audioSha256']:raise ValueError('Parent audio checksum mismatch')
   audio_id=sha+'.m4a';target=out/(audio_id+'.bin');make_chunks(source,audio_id,job['duration'],target,imageio_ffmpeg.get_ffmpeg_exe())
   command=['npx.cmd' if sys.platform=='win32' else 'npx','wrangler','r2','object','put','hsk-music-library/audio-chunks/'+audio_id+'.bin','--file',str(target),'--content-type','application/octet-stream','--remote','--config',str(pathlib.Path(a.repo)/'server/music/wrangler-cloud.jsonc')]
   if sys.platform=='win32':command=['cmd.exe','/d','/c',*command]
   result=subprocess.run(command,cwd=a.repo,capture_output=True,timeout=180)
   if result.returncode:raise RuntimeError('Private clip upload failed')
   state[video]={'state':'uploaded','trackId':audio_id};print('ASR clips staged '+str(i)+'/'+str(len(selected))+': '+video,flush=True)
  except Exception as e:state[video]={'state':'failed','error':str(e) if isinstance(e,(ValueError,RuntimeError)) else type(e).__name__};print('ASR clips failed: '+video,flush=True)
  statefile.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'uploaded':sum(v['state']=='uploaded' for v in state.values()),'failed':sum(v['state']=='failed' for v in state.values())}),flush=True)
if __name__=='__main__':main()
