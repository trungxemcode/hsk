"""Repack the pinned Sherpa runtime without its 380 MB automatic model preload.
Pass the extracted release directory and downloaded HF resource directory.
See vendor/chinese-voices/SOURCES.md for exact upstream inputs and licensing.
"""
import argparse,base64,gzip,hashlib,json,pathlib
p=argparse.ArgumentParser();p.add_argument('runtime',type=pathlib.Path);p.add_argument('resources',type=pathlib.Path);a=p.parse_args();out=pathlib.Path('vendor/chinese-voices');out.mkdir(exist_ok=True)
s=(a.runtime/'sherpa-onnx-wasm-main-tts.js').read_text();start=s.index('if(!Module["expectedDataFileDownloads"])');end=s.index('var arguments_');s=s[:start]+s[end:];assert s.count('FS.staticInit();')==1;s=s.replace('FS.staticInit();','FS.staticInit();Module["FS"]=FS;');(out/'engine.js').write_text(s)
(out/'bindings.js').write_bytes((a.runtime/'sherpa-onnx-tts.js').read_bytes());(out/'engine.wasm.gz').write_bytes(gzip.compress((a.runtime/'sherpa-onnx-wasm-main-tts.wasm').read_bytes(),mtime=0))
names=['lexicon-zh.txt','tokens.txt','date-zh.fst','number-zh.fst','phone-zh.fst']+['espeak-ng-data/'+f for f in ['phontab','phonindex','phondata','intonations','en_dict','cmn_dict','lang/gmw/en','lang/sit/cmn']]
data={'/'+f:base64.b64encode((a.resources/f).read_bytes()).decode() for f in names}
def varint(n):
 b=bytearray()
 while n>127:b.append((n&127)|128);n>>=7
 b.append(n);return bytes(b)
def field(n,b):return varint((n<<3)|2)+varint(len(b))+b
metadata=b''.join(field(14,field(1,k.encode())+field(2,v.encode())) for k,v in dict(model_type='kokoro',language='multi-lang',has_espeak='1',sample_rate='24000',version='2',voice='en-us',style_dim='510,1,256',n_speakers='1').items())
data['/model-metadata.bin']=base64.b64encode(metadata).decode()
(out/'resources.json.gz').write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0))
modelrev='1939ad2a8e416c0acfeecc08a694d14ef25f2231';voicerev='f3ff3571791e39611d31c381e3a41a3af07b4987'
shared=[]
for role,name in [('engine','engine.js'),('bindings','bindings.js'),('wasm','engine.wasm.gz'),('resources','resources.json.gz')]:
 b=(out/name).read_bytes();shared.append(dict(role=role,url='../../../vendor/chinese-voices/'+name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),type='text/javascript' if name.endswith('.js') else 'application/octet-stream'))
b=(a.resources/'model.web-fp16.onnx').read_bytes();shared.append(dict(role='model',url=f'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/{modelrev}/onnx/model_fp16.onnx',bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
voices=[]
for id,size,sha in json.loads((a.resources/'voice-hashes.json').read_text()):
 voices.append(dict(id=id,label='Kokoro · '+('Nữ · ' if id.startswith('zf') else 'Nam · ')+id.split('_')[1].capitalize(),asset=dict(url=f'https://huggingface.co/hexgrad/Kokoro-82M/resolve/{voicerev}/voices/{id}.pt',bytes=size,sha256=sha)))
pathlib.Path('src/modules/speech/voice-catalog.json').write_text(json.dumps(dict(schema=1,engine='sherpa-onnx-1.13.8-kokoro-1.0-fp16',shared=shared,voices=voices),indent=2,ensure_ascii=False)+'\n')
print('Optional download bytes:',sum(x['bytes'] for x in shared)+voices[0]['asset']['bytes'])
