"""Offline tests for exact-source online resolve, authentication, quotas and HTTP."""
import importlib.util
from urllib.error import HTTPError
from io import BytesIO
import json
from pathlib import Path
import threading
import unittest
import sys
from types import SimpleNamespace
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError
spec=importlib.util.spec_from_file_location('online',Path(__file__).resolve().parents[1]/'server/music/online_resolver.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
ID='dQw4w9WgXcQ'
class Contracts(unittest.TestCase):
 def setUp(self):
  for d in (m.cache,m.identities,m.sessions,m.rates):d.clear()
 def test_urls(self):
  self.assertEqual(m.video_id('https://youtu.be/'+ID),ID)
  for u in ('http://youtube.com/watch?v='+ID,'https://youtube.com.evil/watch?v='+ID,'https://youtube.com/playlist?list=x','https://youtube.com@127.0.0.1/watch?v='+ID):
   with self.assertRaises(ValueError):m.video_id(u)
  self.assertTrue(m.audio_url('https://rr.example.googlevideo.com/audio'))
  for u in ('https://googlevideo.com.evil/audio','http://x.googlevideo.com/audio','https://x.googlevideo.com:8080/audio'):
   self.assertFalse(m.audio_url(u))
 def test_choose_direct_m4a_formats(self):
  direct='https://rr1.test.googlevideo.com/videoplayback'
  info={'id':ID,'ext':'mp4','url':'https://rr1.test.googlevideo.com/video',
        'formats':[
         {'url':direct+'?fmt=140','protocol':'https','ext':'m4a','vcodec':'none','acodec':'mp4a.40.2','abr':128},
         {'url':direct+'?fmt=139','protocol':'https','ext':'m4a','vcodec':'none','acodec':'mp4a.40.2','abr':48},
         {'url':direct+'?fmt=hls','protocol':'m3u8_native','ext':'m4a','vcodec':'none','abr':256},
         {'url':'https://rr1.test.googlevideo.com/video?fmt=mp4','protocol':'https','ext':'mp4','vcodec':'avc1','abr':200}
        ]}
  chosen=m.choose_direct_audio_formats(info)
  self.assertEqual(len(chosen),2)
  self.assertEqual(chosen[0]['abr'],128)
  self.assertEqual(chosen[1]['abr'],48)
  self.assertEqual(m.choose_direct_audio_formats({'formats':[{'url':'https://evil.test/file','ext':'m4a','protocol':'https','vcodec':'none'}]}),[])
 def test_extract_uses_original_direct_formats_with_recovery(self):
  base='https://rr1.test.googlevideo.com/videoplayback'
  formats=[{'url':base+'?fmt=140','ext':'m4a','protocol':'https','vcodec':'none','acodec':'mp4a.40.2','abr':128},
           {'url':base+'?fmt=139','ext':'m4a','protocol':'https','vcodec':'none','acodec':'mp4a.40.2','abr':48}]
  video={'id':ID,'duration':212,'title':'Source title','uploader':'Test channel','formats':formats}
  class FakeDL:
   def __init__(self,options):self.options=options
   def __enter__(self):return self
   def __exit__(self,*args):return False
   def extract_info(self,uri,download=False):
    self_uri='https://www.youtube.com/watch?v='+ID
    if uri!=self_uri or download:raise AssertionError('wrong source')
    if 'format' in self.options:raise AssertionError('format restricted before inspecting all audio')
    return video
  def probe(f):
   if f['abr']==128:raise HTTPError(f['url'],403,'Forbidden',None,None)
  with patch.dict(sys.modules,{'yt_dlp':SimpleNamespace(YoutubeDL=FakeDL)}),patch.object(m,'source_probe',side_effect=probe) as tester:
   picked=m.extract(ID)
   self.assertEqual(tester.call_count,2)
   self.assertIn('fmt=139',picked['url'])
   self.assertEqual(picked['title'],'Source title')
   self.assertEqual(picked['id'],ID)
 def test_source_probe_and_error_categories(self):
  class MockUpstream:
   status=206
   url='https://rr1.test.googlevideo.com/videoplayback?fmt=140'
   def __enter__(self):return self
   def __exit__(self,*args):return False
   def read(self,count):self.read_count=count;return b'xx'
  with patch.object(m,'urlopen',return_value=MockUpstream()) as opener:
   m.source_probe({'url':MockUpstream.url,'http_headers':{'User-Agent':'test','Authorization':'SECRET'}})
   request=opener.call_args.args[0]
   self.assertEqual(request.get_header('Range'),'bytes=0-1')
   self.assertIsNone(request.get_header('Authorization'))
  for err,expected in [('HTTP Error 403: Forbidden','SOURCE_FORBIDDEN'),
                       ('missing PO Token','SOURCE_FORBIDDEN'),
                       ('Requested format is not available','M4A_UNAVAILABLE'),
                       ('Sign in to confirm you are not a bot','UPSTREAM_SIGNIN')]:
   self.assertEqual(m.classify_source_error(ValueError(err))[0],expected)
 def test_http_codes_for_authenticated_source_failure(self):
  server=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler)
  thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   body=json.dumps({'url':'https://youtu.be/'+ID}).encode()
   req=Request('http://127.0.0.1:'+str(server.server_port)+'/api/online/resolve',
        data=body,headers={'Authorization':'Bearer fake','Origin':m.ORIGIN,'Content-Type':'application/json'})
   with patch.object(m,'authenticate',return_value='valid-user'),patch.object(m,'resolve',
       side_effect=m.ResolverError(502,'Audio source forbidden','SOURCE_FORBIDDEN')):
    with self.assertRaises(HTTPError) as e:urlopen(req)
    self.assertEqual(e.exception.code,502)
    self.assertEqual(json.load(e.exception)['code'],'SOURCE_FORBIDDEN')
  finally:server.shutdown();server.server_close();thread.join()
 def test_auth_and_limits(self):
  with self.assertRaises(m.ResolverError) as r:m.authenticate('')
  self.assertEqual(r.exception.status,401)
  for _ in range(12):m.rate_limit('user')
  with self.assertRaises(m.ResolverError):m.rate_limit('user')
  m.rate_limit('other')
 def test_cache_and_refresh(self):
  with patch.object(m,'extract',return_value={'id':ID}) as ex:
   self.assertEqual(m.resolve(ID),{'id':ID});m.resolve(ID);self.assertEqual(ex.call_count,1)
   m.resolve(ID,True);self.assertEqual(ex.call_count,2)
 def test_http(self):
  server=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler)
  t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
  base='http://127.0.0.1:'+str(server.server_port)
  try:
   self.assertTrue(json.load(urlopen(base+'/api/online/health'))['ok'])
   req=Request(base+'/api/online/resolve',data=json.dumps({'url':'https://youtu.be/'+ID}).encode(),headers={'Origin':m.ORIGIN,'Content-Type':'application/json'})
   with self.assertRaises(HTTPError) as e:urlopen(req)
   self.assertEqual(e.exception.code,401)
   data={'id':ID,'url':'https://rr.example.googlevideo.com/audio','title':'Exact title','artist':'Artist','duration':200,'headers':{}}
   with patch.object(m,'authenticate',return_value='user'),patch.object(m,'resolve',return_value=data):
    with urlopen(req) as r:
     result=json.load(r);self.assertEqual(r.headers['Access-Control-Allow-Origin'],m.ORIGIN)
    self.assertEqual(result['id'],ID);self.assertEqual(result['url'],data['url']);self.assertIn('/stream/',result['relayUrl']);self.assertNotIn('headers',result)
    req.add_header('Origin','https://evil.example')
    with self.assertRaises(HTTPError) as e:urlopen(req)
    self.assertEqual(e.exception.code,403)
   with self.assertRaises(HTTPError) as e:urlopen(base+'/api/online/stream/unknown')
   self.assertEqual(e.exception.code,410)
  finally:server.shutdown();server.server_close();t.join()
if __name__=='__main__':unittest.main()
