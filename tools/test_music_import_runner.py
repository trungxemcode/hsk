import importlib.util,json,unittest
from unittest.mock import patch
from io import BytesIO
from pathlib import Path
spec=importlib.util.spec_from_file_location('music_import',Path(__file__).with_name('music-import-runner.py'))
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
class Response(BytesIO):
 def __enter__(self):return self
 def __exit__(self,*args):self.close()
class TransportTest(unittest.TestCase):
 def test_worker_request_uses_identified_agent_and_private_authorization(self):
  with patch.object(runner,'token',return_value='test-token'),patch.object(runner.urllib.request,'urlopen',return_value=Response(b'{"job":null}')) as send:
   self.assertEqual(runner.api('/api/runner/claim'),{'job':None})
   request=send.call_args.args[0]
   self.assertEqual(request.get_header('User-agent'),'HSK-Music-Importer/1.0')
   self.assertEqual(request.get_header('Authorization'),'Bearer test-token')
   self.assertEqual(request.method,'POST')
if __name__=='__main__':unittest.main()
