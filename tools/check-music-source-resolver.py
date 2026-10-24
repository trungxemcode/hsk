"""Resolver contract without live provider credentials or downloads."""
import importlib.util, pathlib, tempfile, time
import json
from unittest.mock import patch
import yt_dlp
from fastapi.testclient import TestClient
path=pathlib.Path(__file__).resolve().parents[1]/'server/music/source_resolver.py'
spec=importlib.util.spec_from_file_location('source_resolver',path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
fixture=path.parents[2]/'tools/fixtures/music-heaacv2-64k.m4a'
# Parse our real command with the pinned official yt-dlp, without network.
with tempfile.TemporaryDirectory() as folder:
    directory=pathlib.Path(folder)
    url='https://www.youtube.com/watch?v=abcdefghijk'
    command=module.downloader_command(url,directory)
    options=yt_dlp.parse_options(command[3:]).ydl_opts
    assert options['noplaylist'] and options['simulate'] is False
    assert options['format']=='bestaudio/best' and 'deno' in options['js_runtimes']
    assert options['max_filesize']==module.MAX_SOURCE
    assert all(p['key']=='FFmpegConcat' and p.get('only_multi_video') and p.get('when')=='playlist' for p in options.get('postprocessors',[])),'no audio extraction or re-encoding postprocessor'
    def source_run(args,timeout):
        assert args[-2:]==['--',url]
        (directory/'source.m4a').write_bytes(fixture.read_bytes())
        return json.dumps({'id':'abcdefghijk','webpage_url':url})+'\n'
    with patch.object(module,'run',side_effect=source_run):
        result=module.download_source('https://youtu.be/abcdefghijk',directory)
        assert result.read_bytes()==fixture.read_bytes()
    for bad in [
        {'id':'wrongvideo1','webpage_url':url},
        {'id':'abcdefghijk','webpage_url':'https://www.youtube.com/watch?v=wrongvideo1'},
        {'id':'abcdefghijk','webpage_url':'https://127.0.0.1/source'},
        {},
    ]:
        with patch.object(module,'run',return_value=json.dumps(bad)):
            try:module.download_source(url,directory)
            except RuntimeError as error:assert 'khớp đúng link' in str(error)
            else:raise AssertionError('mismatched source accepted')
    with patch.object(module,'run',return_value='{}\n{}\n'):
        try:module.download_source(url,directory)
        except RuntimeError:pass
        else:raise AssertionError('multiple source records accepted')
def runner(url,directory,progress):
    progress('downloading');target=directory/'source.m4a';target.write_bytes(fixture.read_bytes());return target
app=module.create_app(identity=lambda token: token,runner=runner)
headers={'Authorization':'Bearer one'}
with TestClient(app) as client:
    assert client.post('/v1/jobs',json={'url':'https://youtu.be/abcdefghijk'}).status_code==401
    for url in ['http://localhost/secret','https://127.0.0.1/a','https://open.spotify.com/track/abc']:
        assert client.post('/v1/jobs',headers=headers,json={'url':url}).status_code==422
    response=client.post('/v1/jobs',headers=headers,json={'url':'https://youtu.be/abcdefghijk'});assert response.status_code==202,response.text
    job=response.json()['id']
    assert client.get('/v1/jobs/'+job,headers={'Authorization':'Bearer two'}).status_code==404
    for _ in range(100):
        state=client.get('/v1/jobs/'+job,headers=headers).json()
        if state['status'] in ('ready','error'):break
        time.sleep(.01)
    assert state['status']=='ready',state
    file=client.get('/v1/jobs/'+job+'/file',headers=headers)
    assert file.content==fixture.read_bytes(),'resolver retains original source bytes'
    assert file.headers['x-audio-source']=='original'
    assert client.delete('/v1/jobs/'+job,headers=headers).status_code==200
    assert client.get('/v1/jobs/'+job+'/file',headers=headers).status_code==409
print('PASS source resolver: official yt-dlp command, Deno/EJS configuration, exact source ID, unchanged bytes, authentication, owner isolation and cleanup')
