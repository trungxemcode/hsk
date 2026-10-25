import io,json,os,pathlib,runpy,tempfile,unittest
from unittest.mock import patch
class ImportAudioTest(unittest.TestCase):
 def test_m4a_source_upload_preserves_audio_and_credits(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);(root/'hsk-import-job.json').write_text(json.dumps({'id':'a'*32,'url':'https://www.youtube.com/watch?v=jNQXAC9IVRw','title':'Chosen title','artist':'Artist','composer':'Composer'}))
   uploaded=[]
   def network(req,timeout=None):
    if 'oidc.invalid' in req.full_url:return io.BytesIO(b'{"value":"test-token"}')
    self.assertTrue(req.full_url.endswith('/upload'));self.assertEqual(req.get_header('Content-type'),'audio/mp4');uploaded.append(req.data);return io.BytesIO(b'{"uploaded":true}')
   def download(args,**kwargs):
    self.assertIn('bestaudio[ext=m4a]/bestaudio',args);self.assertEqual(args[args.index('--audio-format')+1],'m4a')
    folder=pathlib.Path(args[args.index('-o')+1]).parent
    (folder/'audio.m4a').write_bytes(b'fake-source-audio')
    (folder/'audio.info.json').write_text('{}')
    return type('Result',(),{'returncode':0})()
   env={'IMPORT_MODE':'download','RUNNER_TEMP':td,'COOKIE_INPUT':'test=value','ACTIONS_ID_TOKEN_REQUEST_URL':'https://oidc.invalid/token?x=1','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'test'}
   with patch.dict(os.environ,env),patch('urllib.request.urlopen',side_effect=network),patch('subprocess.run',side_effect=download):runpy.run_path(str(pathlib.Path(__file__).parent/'music-import-runner.py'),run_name='__main__')
   self.assertEqual(uploaded,[b'fake-source-audio']);self.assertFalse((root/'hsk-import-job.json').exists())
if __name__=='__main__':unittest.main()
