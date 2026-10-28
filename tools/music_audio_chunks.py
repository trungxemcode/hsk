"""Private ASR clips. Public playback audio is never changed."""
import hashlib,json,pathlib,struct,subprocess,tempfile,re
def pack_chunks(audio_id,chunks,target):
    rows=[];offset=0
    for chunk in chunks:
        data=pathlib.Path(chunk['path']).read_bytes()
        rows.append({'start':chunk['start'],'duration':chunk['duration'],'offset':offset,'length':len(data),'sha256':hashlib.sha256(data).hexdigest()});offset+=len(data)
    header=json.dumps({'version':1,'audioId':audio_id,'chunks':rows},separators=(',',':')).encode()
    if len(header)>16000:raise ValueError('Chunk index too large')
    with open(target,'wb') as out:
        out.write(struct.pack('>I',len(header)));out.write(header)
        for chunk in chunks:out.write(pathlib.Path(chunk['path']).read_bytes())
def make_chunks(source,audio_id,duration,target,ffmpeg):
    with tempfile.TemporaryDirectory() as td:
        rows=[]
        for start in range(0,int(duration),50):
            if duration-start<1:continue
            clip=pathlib.Path(td)/(str(start)+'.m4a');length=min(60,duration-start)
            result=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',str(source),'-t',str(length),'-vn','-c:a','aac','-b:a','96k','-ar','44100','-ac','2','-movflags','+faststart',str(clip)],capture_output=True,timeout=90)
            if result.returncode:raise RuntimeError('ASR clip encoding failed')
            rows.append({'start':start,'duration':length,'path':str(clip)})
        pack_chunks(audio_id,rows,target)
