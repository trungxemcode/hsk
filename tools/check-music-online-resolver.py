"""Offline tests for exact-source online resolve, authentication, quotas and HTTP."""
import importlib.util
import json
from pathlib import Path
import threading
import unittest
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
