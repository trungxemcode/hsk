"""Prepare the independent Huayan package and tiny, already generated demos.
Usage: python tools/prepare-light-chinese-voices.py RESOURCE_DIR
Required local inputs: huayan.onnx, huayan-config.json (pinned sources in SOURCES.md).
Run after build-chinese-voice-runtime.py if rebuilding the entire runtime.
"""
import argparse,base64,gzip,hashlib,json,pathlib
p=argparse.ArgumentParser();p.add_argument('resources',type=pathlib.Path);a=p.parse_args();out=pathlib.Path('vendor/chinese-voices');catalog=pathlib.Path('src/modules/speech/voice-catalog.json');c=json.loads(catalog.read_text())
original=json.loads(gzip.decompress((out/'resources.json.gz').read_bytes()));reduced={k:v for k,v in original.items() if k.startswith('/espeak-ng-data/')};(out/'piper-resources.json.gz').write_bytes(gzip.compress(json.dumps(reduced,separators=(',',':')).encode(),mtime=0))
cfg=json.loads((a.resources/'huayan-config.json').read_text());assert cfg['phoneme_type']=='espeak' and cfg['espeak']['voice']=='cmn'
tokens=''.join(f'{ph} {ids[0]}\n' for ph,ids in cfg['phoneme_id_map'].items());config={'type':'piper','sampleRate':cfg['audio']['sample_rate'],'tokens':tokens,'metadata':{'model_type':'vits','sample_rate':str(cfg['audio']['sample_rate']),'n_speakers':'1','language':'Chinese','voice':'cmn','comment':'piper','add_blank':'1','blank_id':'0','bos_id':'1','eos_id':'2','pad_id':'0','use_eos_bos':'1'}};(out/'huayan-medium.json').write_text(json.dumps(config,ensure_ascii=False,separators=(',',':'))+'\n')
def spec(file,url,role):
 b=file.read_bytes();return dict(role=role,url=url,bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
c['schema']=2;c['engine']='sherpa-onnx-1.13.8-per-voice';c['shared']=[x for x in c['shared'] if x['role'] not in ['model','resources']];c['shared'].append(spec(out/'piper-resources.json.gz','../../../vendor/chinese-voices/piper-resources.json.gz','resources'));c['voices']=[v for v in c['voices'] if v['id']!='piper_huayan']
for v in c['voices']:v['downloadable']=False;v['unavailableReason']='Giọng này cần mô hình dùng chung khoảng 162 MiB, chưa có gói nhỏ độc lập. Hiện chỉ nghe demo.'
url='https://huggingface.co/IhorShevchuk/piper1-voices-fp16-quantized/resolve/7fb50e46b26367633c599b9da5128fd2883ef3e7/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.int8.onnx'
c['voices'].insert(0,dict(id='piper_huayan',label='Huayan · gói riêng khoảng 18 MiB',assets=[spec(a.resources/'huayan.onnx',url,'model'),spec(out/'huayan-medium.json','../../../vendor/chinese-voices/huayan-medium.json','config')]))
for v in c['voices']:
 f=pathlib.Path('content/voice-demos')/(v['id']+'.mp3');d=spec(f,'../../../'+f.as_posix(),'demo');d.pop('role');v['demo']=d
assert sum(v['demo']['bytes'] for v in c['voices'])<=.1*1048576
catalog.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
print('First download:',sum(v['bytes'] for v in c['shared']+c['voices'][0]['assets']),'bytes')
