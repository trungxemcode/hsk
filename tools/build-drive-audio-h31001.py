"""Build the reviewed H31001 11–20 batch; timestamps must be checked before use."""
import json,re,hashlib,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=Path(sys.argv[1]);PDF=Path(sys.argv[2])
text=PDF.read_text();script=text.split('听力材料',1)[1].split('现在开始第 11 题：',1)[1].split('第三部分',1)[0]
script=re.sub(r'H31001\s*-\s*\d+','',script)
blocks={int(m[1]):re.sub(r'\s+','',m[2]) for m in re.finditer(r'^\s*(\d+)．(.*?)(?=^\s*\d+．|\Z)',script,re.M|re.S)}
keytext=text.split('卷答案',1)[1]
keys={int(n):a for n,a in re.findall(r'(\d+)．\s*([√×])',keytext)}
reviewed=json.loads((SRC/'H31001-verified.json').read_text());assert [r['number'] for r in reviewed]==list(range(11,21))
why={11:'以前以为…，才发现不是这样的：người nói đã nhận ra tiếng Bắc Kinh không hoàn toàn giống tiếng phổ thông.',12:'会议室 ở 八楼, phòng 八零三: nhận định phòng họp ở tầng tám đúng.',13:'很快就到 nghĩa là sắp đến, không phải đã đến.',14:'两年前买的: xe đã mua hai năm trước, là xe cũ.',15:'小孩子…认为蛋糕越甜越好吃: trẻ con thích ăn bánh ngọt.',16:'只能住三天，只能选择一两个地方: chỉ tham quan một hoặc hai nơi, chưa phải nhiều nơi.',17:'每次坐火车前…买一些报纸: thông tin cho thấy Chu Minh đọc báo khi đi tàu.',18:'唱歌、画画儿、踢足球、玩儿音乐: sở thích bao gồm âm nhạc và vận động.',19:'先打开电脑，看电子邮件，然后开始别的工作: không có thông tin nói cô ấy không thích công việc.',20:'这种手机…可以照相: đang mua điện thoại, không phải điều hòa.'}
audio_sha=hashlib.sha256((SRC/'H31001.mp3').read_bytes()).hexdigest();items=[]
for row in reviewed:
 n=row['number'];body=blocks[n];claim=body.split('★',1)[1];file=f'content/drive-hsk/audio/H31001-{n}.mp3';target=ROOT/file;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SRC/f'H31001-{n}.mp3',target)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)]))
 assert abs(duration-(row['end']-row['start']))<.25
 items.append({'id':f'drive-audio-H31001-{n}','type':'driveListenJudge','level':3,'prompt':'Nhận định: '+claim,'audio':body,'audioFile':file,'audioDuration':round(duration,3),'options':['Đúng','Sai'],'answer':0 if keys[n]=='√' else 1,'explanation':why[n], 'sourceRef':{'code':'H31001','number':n,'page':next(i+1 for i,p in enumerate(text.split('\f')) if str(n)+'．'+body[:8] in re.sub(r'\s+','',p)),'fileId':'1_yiPNibeCHaKa03YoC5fmPzmuW7ZjzwH','audioFileId':'18byQeMPlduOHb92p1Eb-PxM9xQrqCw8_','audioSha256':audio_sha,'clipStart':round(row['start'],3),'clipEnd':round(row['end'],3),'clipSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'alignment':'silence boundaries plus local ASR content review; official PDF transcript and key'}})
data={'version':1,'items':items,'report':{'code':'H31001','hsk':3,'questionRange':[11,20],'count':10,'originalDuration':2178.0375,'originalSha256':audio_sha,'transcriptIsOriginalPDF':True,'reviewedAt':'2026-10-14'}}
(ROOT/'drive-audio-data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));print(len(items),'reviewed original-audio questions')
