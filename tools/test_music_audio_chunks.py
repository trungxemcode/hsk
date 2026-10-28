import json,pathlib,struct,tempfile,unittest,hashlib
from music_audio_chunks import pack_chunks
class ChunkArchiveTest(unittest.TestCase):
 def test_index_points_to_exact_independently_playable_file_bytes(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);a=root/'a.m4a';b=root/'b.m4a';a.write_bytes(b'first-chunk-content');b.write_bytes(b'second-chunk-content');out=root/'clips.bin'
   pack_chunks('parent.m4a',[{'start':0,'duration':60,'path':a},{'start':50,'duration':30,'path':b}],out)
   data=out.read_bytes();length=struct.unpack('>I',data[:4])[0];header=json.loads(data[4:4+length]);self.assertEqual(header['audioId'],'parent.m4a')
   for i,path in enumerate([a,b]):
    row=header['chunks'][i];actual=data[4+length+row['offset']:4+length+row['offset']+row['length']];self.assertEqual(actual,path.read_bytes());self.assertEqual(hashlib.sha256(actual).hexdigest(),row['sha256'])
   self.assertEqual(header['chunks'][1]['start'],50)
if __name__=='__main__':unittest.main()
