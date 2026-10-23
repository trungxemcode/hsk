"""Resolver contract without live provider credentials or downloads."""
import importlib.util, pathlib, tempfile, time
from fastapi.testclient import TestClient
path=pathlib.Path(__file__).resolve().parents[1]/'server/music/source_resolver.py'
spec=importlib.util.spec_from_file_location('source_resolver',path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
fixture=path.parents[2]/'tools/fixtures/music-heaacv2-64k.m4a'
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
print('PASS source resolver authentication, provider validation, owner isolation, original bytes and cleanup')
